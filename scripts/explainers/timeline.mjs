// Объяснялка: сценарий -> текст для голоса -> время каждой сцены и каждой метки.
// Чистые функции без сети и файлов: их держат тесты. Канон — docs/explainers.md.

export const EXPLAINER = {
  width: 1920,
  height: 1080,
  fps: 30,
  // Тишина до первого слова и хвост после последнего, в секундах.
  lead: 0.4,
  tail: 1.6,
  // Сцена начинается чуть раньше своего первого слова: картинка встаёт до голоса.
  sceneLead: 0.25,
  // Перекрёстная смена сцен: половина до шва, половина после.
  crossfade: 0.5,
  // Шов между сценами в тексте для голоса: пустая строка — пауза у eleven_v3.
  sceneGap: "\n\n",
  // Голос по умолчанию — основной голос канала (docs/reels.md, «Голоса канала»).
  voice: "eleven:ogi2DyUAKJb7CEdqqvlU",
  model: "eleven_v3",
  // Объяснялка читается спокойнее истории: движок ровнее, теги почти не слышит.
  stability: 0.5,
  // У v3 нет регулятора скорости — темп правит atempo в этих краях.
  tempo: 1.0,
  tempoMin: 0.85,
  tempoMax: 1.15,
  // Один запрос ElevenLabs берёт до 5000 знаков; сценарий длиннее — ошибка.
  maxChars: 4500,
  // Черновик без голоса: столько знаков в секунду, чтобы прикинуть тайминг.
  draftCharsPerSecond: 14,
};

// Метка в тексте сцены: `{имя}` перед словом. Время метки — начало этого слова.
const MARK = /\{([a-z][a-z0-9-]*)\}/g;
const ID = /^[a-z0-9][a-z0-9-]*$/;

/** Проверка сценария: что нужно рельсе, и понятная ошибка, если чего-то нет. */
export function parseExplainer(raw) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!data || typeof data !== "object") throw new Error("Сценарий — не объект JSON.");
  if (!ID.test(String(data.id || ""))) {
    throw new Error("Сценарий: поле id — латиница, цифры и дефисы.");
  }
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
    throw new Error("Сценарий: нужен непустой список scenes.");
  }
  const seen = new Set();
  const scenes = data.scenes.map((scene, i) => {
    if (!ID.test(String(scene?.id || ""))) {
      throw new Error(`Сцена ${i + 1}: поле id — латиница, цифры и дефисы.`);
    }
    if (seen.has(scene.id)) throw new Error(`Сцена ${scene.id} встречается дважды.`);
    seen.add(scene.id);
    if (typeof scene.say !== "string" || !scene.say.trim()) {
      throw new Error(`Сцена ${scene.id}: пустой текст say.`);
    }
    const names = [...scene.say.matchAll(MARK)].map((m) => m[1]);
    const dupe = names.find((n, k) => names.indexOf(n) !== k);
    if (dupe) throw new Error(`Сцена ${scene.id}: метка {${dupe}} стоит дважды.`);
    return { id: scene.id, say: scene.say };
  });
  const tempo = Number(data.tempo ?? EXPLAINER.tempo);
  if (!(tempo >= EXPLAINER.tempoMin && tempo <= EXPLAINER.tempoMax)) {
    throw new Error(
      `Сценарий: tempo ${data.tempo} вне краёв ${EXPLAINER.tempoMin}–${EXPLAINER.tempoMax}.`,
    );
  }
  const stability = Number(data.stability ?? EXPLAINER.stability);
  if (!(stability >= 0 && stability <= 1)) throw new Error("Сценарий: stability от 0 до 1.");
  return {
    id: data.id,
    title: String(data.title || data.id),
    voice: String(data.voice || EXPLAINER.voice),
    stability,
    tempo,
    music: data.music ? String(data.music) : null,
    scenes,
  };
}

/**
 * Текст для голоса одним куском: сцены через шов, метки вырезаны. Рядом —
 * где в этом тексте начинается каждая сцена и где стоит каждая метка.
 */
export function voiceScript(scenes, gap = EXPLAINER.sceneGap) {
  let text = "";
  const starts = [];
  const marks = [];
  scenes.forEach((scene, i) => {
    if (i > 0) text += gap;
    starts.push(text.length);
    let last = 0;
    for (const m of scene.say.matchAll(MARK)) {
      text += scene.say.slice(last, m.index);
      marks.push({ scene: scene.id, name: m[1], at: text.length });
      last = m.index + m[0].length;
    }
    text += scene.say.slice(last);
  });
  // Двойные пробелы, оставшиеся от вырезанных меток, голосу не нужны —
  // но индексы уже посчитаны по этому тексту, поэтому текст не трогаем.
  return { text, starts, marks };
}

const isLetter = (ch) => /[\p{L}\p{N}]/u.test(ch);

/** Индекс первой буквы или цифры, начиная с позиции `from`; -1, если букв дальше нет. */
export function nextLetter(text, from) {
  for (let i = Math.max(0, from); i < text.length; i += 1) {
    if (isLetter(text[i])) return i;
  }
  return -1;
}

/**
 * Время каждой буквы текста по выравниванию движка. Движок отдаёт символы и
 * их начала; знаки и пробелы он может отдать иначе, чем мы послали, поэтому
 * сверяемся только по буквам и цифрам, в нижнем регистре, с подхватом после
 * расхождения. Ответ — функция: позиция в тексте -> секунды (до темпа).
 */
export function letterClock(text, alignment) {
  const chars = alignment?.characters || [];
  const starts = alignment?.character_start_times_seconds || [];
  const engine = [];
  chars.forEach((ch, k) => {
    if (isLetter(ch)) engine.push({ ch: ch.toLowerCase(), t: Number(starts[k]) || 0 });
  });
  const times = new Map();
  let j = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (!isLetter(text[i])) continue;
    const ch = text[i].toLowerCase();
    let found = -1;
    for (let k = j; k < Math.min(engine.length, j + 12); k += 1) {
      if (engine[k].ch === ch) {
        found = k;
        break;
      }
    }
    if (found >= 0) {
      times.set(i, engine[found].t);
      j = found + 1;
    } else if (j < engine.length) {
      // Буквы у движка нет рядом — берём время его текущей буквы, не двигаясь.
      times.set(i, engine[j].t);
    }
  }
  const lastTime = engine.length ? engine[engine.length - 1].t : 0;
  return (pos) => {
    const at = nextLetter(text, pos);
    if (at < 0) return lastTime;
    return times.get(at) ?? lastTime;
  };
}

/** Черновые часы без голоса: время пропорционально числу знаков. */
export function draftClock(text, cps = EXPLAINER.draftCharsPerSecond) {
  return (pos) => Math.max(0, pos) / cps;
}

const r3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Таймлайн ролика в секундах ВЫХОДА (после темпа, с тишиной в начале).
 * Сцена идёт от своего первого слова (чуть раньше) до начала следующей;
 * последняя — до конца звука плюс хвост. Метки — локальным временем сцены.
 * @param {{ scenes: any[], voice: any, clock: (pos: number) => number,
 *   voiceSeconds: number, tempo?: number, lead?: number, tail?: number }} args
 */
export function buildTimeline({ scenes, voice, clock, voiceSeconds, tempo = 1, lead, tail }) {
  const L = lead ?? EXPLAINER.lead;
  const T = tail ?? EXPLAINER.tail;
  const out = (t) => L + t / tempo;
  const total = r3(L + voiceSeconds / tempo + T);
  const starts = scenes.map((_, i) =>
    i === 0 ? 0 : Math.max(0, out(clock(voice.starts[i])) - EXPLAINER.sceneLead),
  );
  const result = scenes.map((scene, i) => {
    const start = r3(starts[i]);
    const end = r3(i + 1 < scenes.length ? starts[i + 1] : total);
    /** @type {Record<string, number>} */
    const marks = {};
    for (const mark of voice.marks.filter((m) => m.scene === scene.id)) {
      marks[mark.name] = r3(Math.max(0, out(clock(mark.at)) - start));
    }
    return { id: scene.id, start, end, marks };
  });
  for (const s of result) {
    if (s.end <= s.start) throw new Error(`Сцена ${s.id} вышла нулевой длины: проверь текст.`);
  }
  return { total, fps: EXPLAINER.fps, crossfade: EXPLAINER.crossfade, scenes: result };
}

/** Слов в минуту по тексту голоса и длине звука — строка отчёта. */
export function wordsPerMinute(text, seconds) {
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return seconds > 0 ? Math.round((words / seconds) * 60) : 0;
}
