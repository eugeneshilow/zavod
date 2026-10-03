// Сцены ролика «Как ChatGPT пишет ответ». Каждая — функция (ctx, s):
// s.t — время сцены, s.m — метки из сценария, s.p — плавный прогресс.
// Набор (палитра, подписи, столбики) — content/explainers/kit.js.

(function () {
  const K = window.K;
  const { C, clamp, lerp, easeOut, easeInOut } = K;

  const at = (s, name, fallback = Infinity) => s.m[name] ?? fallback;
  const tokensOf = (str) => str.match(/\s*\S+/g) || [];

  /** Начало фразы слева и мигающее место под следующее слово. */
  function promptLine(ctx, s, words, o = {}) {
    const size = o.size ?? 66;
    const x = o.x ?? 170;
    const y = o.y ?? 560;
    const a = o.alpha ?? 1;
    const lay = K.layoutWords(ctx, words, x, y, o.maxW ?? 760, size * 1.32, size, "serif", 500);
    lay.forEach((w) => K.text(ctx, w.w, w.x, w.y, { size, font: "serif", weight: 500, alpha: a }));
    const last = lay[lay.length - 1];
    return { lay, endX: last ? last.x + last.width : x, y };
  }

  /** Место под следующее слово: сначала по центру с вопросом, потом встаёт за фразой. */
  function askBox(ctx, s, endX, y, phrase) {
    const k = easeInOut(clamp(phrase));
    const bx = lerp(960 - 75, endX + 22, k);
    const by = lerp(470, y - 70, k);
    const a = s.p(0, 0.4);
    K.cursorBox(ctx, bx, by, 150, 92, s.t, a);
    K.text(ctx, "?", bx + 75, by + 68, {
      size: 60,
      font: "serif",
      weight: 500,
      color: C.gold,
      align: "center",
      alpha: a * (1 - 0.75 * k),
      glow: 0.4,
    });
  }

  /** Слово перелетает из столбиков в текст: из точки A в точку B. */
  function flyWord(ctx, word, from, to, k, size, color = C.gold) {
    const e = easeInOut(clamp(k));
    const x = lerp(from.x, to.x, e);
    const y = lerp(from.y, to.y, e) - Math.sin(e * Math.PI) * 60;
    const sz = lerp(from.size ?? 40, size, e);
    K.text(ctx, word, x, y, { size: sz, font: "serif", weight: 500, color, glow: 0.6 });
  }

  // ── 1. Ответ печатается по слову ───────────────────────────────────────
  const REPLY =
    "Wi-Fi — это радио. Роутер превращает данные в радиоволны, а телефон ловит их и " +
    "превращает обратно в данные. Поэтому за стеной сигнал слабее: бетон гасит волны.";

  function hook(ctx, s) {
    const box = { x: 330, y: 170, w: 1260, h: 780 };
    K.roundRect(ctx, box.x, box.y, box.w, box.h, 28, {
      fill: K.rgba(C.panel, 0.9),
      stroke: C.line,
      lw: 2,
    });
    [0, 1, 2].forEach((i) => K.glowDot(ctx, box.x + 40 + i * 26, box.y + 40, 6, C.dim, 0.9));
    K.text(ctx, "ChatGPT", 960, box.y + 50, { size: 26, color: C.muted, align: "center" });
    K.line(ctx, box.x, box.y + 82, box.x + box.w, box.y + 82, { color: C.line });

    const ask = "Объясни, как работает Wi-Fi";
    const askW = K.measure(ctx, ask, 36);
    const pa = s.p(0.15, 0.5);
    const right = box.x + box.w - 50;
    K.roundRect(ctx, right - askW - 56, 300 + (1 - pa) * 20, askW + 56, 76, 22, {
      fill: "#26304A",
      alpha: pa,
    });
    K.text(ctx, ask, right - 28, 350 + (1 - pa) * 20, {
      size: 36,
      align: "right",
      alpha: pa,
    });

    const words = tokensOf(REPLY);
    const start = 1.1;
    const rate = 3.4;
    const lay = K.layoutWords(ctx, words, 390, 490, 1140, 72, 44);
    const shown = clamp(Math.floor((s.t - start) * rate) + 1, 0, words.length);
    const real = s.p("real", 0.6);
    const spaceW = K.measure(ctx, " ", 44);
    for (let i = 0; i < shown; i += 1) {
      const w = lay[i];
      const born = start + i / rate;
      const fresh = clamp(1 - (s.t - born) / 0.45);
      K.text(ctx, w.w, w.x, w.y, {
        size: 44,
        color: K.mixHex(C.ink, C.gold, fresh),
        alpha: easeOut(clamp((s.t - born) / 0.12)),
        glow: fresh * 0.7,
      });
      if (real > 0) {
        const lead = /^\s/.test(w.w) ? spaceW : 0;
        K.line(ctx, w.x + lead + 2, w.y + 14, w.x + w.width - 4, w.y + 14, {
          color: C.gold,
          alpha: 0.65 * real,
          lw: 3,
        });
      }
    }
    if (shown >= words.length) {
      const w = lay[lay.length - 1];
      const blink = Math.cos(s.t * Math.PI * 2) > 0 ? 1 : 0;
      K.roundRect(ctx, w.x + w.width + 8, w.y - 34, 18, 44, 3, { fill: C.ink, alpha: blink });
    }
    K.captions(ctx, s.t, [
      [at(s, "real"), [{ t: "по одному слову", c: C.gold }, { t: " — по-настоящему" }]],
    ]);
  }

  // ── 2. Текст режется на токены, токены — это номера ────────────────────
  const PIECES = ["Мод", "ель", " пиш", "ет", " по", " кус", "оч", "кам", "."];
  const IDS = [11873, 4521, 90311, 1203, 739, 26044, 8812, 3317, 13];

  function tokens(ctx, s) {
    const size = 80;
    const kind = "serif";
    const pad = 20;
    const gap = 16;
    const y = 580;
    const full = K.measure(ctx, PIECES.join(""), size, kind, 500);
    let jx = 960 - full / 2;
    const bare = PIECES.map((p) => p.trim());
    const joined = [];
    PIECES.forEach((p) => {
      const lead = p.length - p.trimStart().length ? K.measure(ctx, " ", size, kind, 500) : 0;
      joined.push(jx + lead);
      jx += K.measure(ctx, p, size, kind, 500);
    });
    const tw = bare.map((b) => K.measure(ctx, b, size, kind, 500));
    const nw = IDS.map((n) => K.measure(ctx, String(n), 40, "mono"));
    const cw = tw.map((w, i) => Math.max(w, nw[i]) + pad * 2);
    const total = cw.reduce((a, b) => a + b, 0) + gap * (cw.length - 1);
    let cx = 960 - total / 2;
    const chips = cw.map((w) => {
      const x = cx;
      cx += w + gap;
      return x;
    });
    const appear = s.p(0.1, 0.6);
    const cut = at(s, "cut");
    const num = at(s, "num");
    PIECES.forEach((_, i) => {
      const k = s.p(cut + i * 0.06, 0.7);
      const nk = s.p(num + i * 0.08, 0.5);
      const tx = lerp(joined[i], chips[i] + (cw[i] - tw[i]) / 2, k);
      K.roundRect(ctx, chips[i], y - 82, cw[i], 114, 16, {
        fill: K.rgba(C.teal, 0.08 * k),
        stroke: K.rgba(C.teal, 0.8 * k),
        lw: 2.5,
      });
      K.text(ctx, bare[i], tx, y - nk * 8, {
        size,
        font: kind,
        weight: 500,
        alpha: appear * (1 - 0.6 * nk),
      });
      if (nk > 0) {
        K.text(ctx, String(IDS[i]), chips[i] + cw[i] / 2, y + 110 - (1 - nk) * 20, {
          size: 40,
          font: "mono",
          color: C.teal,
          align: "center",
          alpha: nk,
          glow: 0.4 * nk,
          glowColor: C.teal,
        });
      }
    });
    K.captions(ctx, s.t, [
      [cut, [{ t: "токены", c: C.gold }]],
      [num, [{ t: "для модели это просто " }, { t: "номера", c: C.teal }]],
    ]);
  }

  // ── 3. Какой кусочек следующий: кандидаты и шансы ─────────────────────
  const PARIS = [
    { label: "Париж", p: 0.96 },
    { label: "город", p: 0.015 },
    { label: "столица", p: 0.008 },
    { label: "Лион", p: 0.004 },
    { label: "это", p: 0.003 },
  ];
  const CHART = { x: 1100, y: 330, w: 760, rowH: 84 };

  function chartHeader(ctx, alpha) {
    K.text(ctx, "КАНДИДАТЫ", CHART.x + 280, CHART.y - 26, {
      size: 22,
      color: C.muted,
      alpha,
    });
  }

  function predict(ctx, s) {
    const phrase = s.p(at(s, "phrase", 0.2), 0.5);
    const line = promptLine(ctx, s, ["Столица", " Франции", " —"], { alpha: phrase });
    askBox(ctx, s, line.endX, line.y, phrase);
    const list = at(s, "list");
    const grow = clamp((s.t - list) / 1.1);
    if (grow > 0) {
      chartHeader(ctx, clamp(grow * 3));
      K.line(ctx, line.endX + 180, line.y - 24, CHART.x + 40, CHART.y + 40, {
        color: C.dim,
        dash: [6, 10],
        alpha: clamp(grow * 2),
      });
    }
    K.bars(ctx, PARIS, { ...CHART, grow, pick: 0, pickA: s.p("paris", 0.5) });
    K.captions(ctx, s.t, [
      [at(s, "ask"), [{ t: "какой кусочек " }, { t: "следующий?", c: C.gold }]],
    ]);
  }

  // ── 4. Дописать и спросить снова — сотни раз ──────────────────────────
  const BASE = ["Столица", " Франции", " —"];
  const STEPS = [
    [
      " Париж",
      [
        [" Париж", 0.96],
        [" город", 0.015],
        [" столица", 0.008],
        [" Лион", 0.004],
      ],
      0,
    ],
    [
      ".",
      [
        [".", 0.62],
        [",", 0.21],
        [" —", 0.09],
        [" и", 0.04],
      ],
      0,
    ],
    [
      " Это",
      [
        [" Это", 0.34],
        [" Город", 0.18],
        [" Он", 0.15],
        [" Здесь", 0.11],
      ],
      0,
    ],
    [
      " самый",
      [
        [" самый", 0.41],
        [" крупнейший", 0.22],
        [" главный", 0.17],
        [" город", 0.08],
      ],
      0,
    ],
    [
      " большой",
      [
        [" большой", 0.55],
        [" красивый", 0.2],
        [" известный", 0.12],
        [" старый", 0.05],
      ],
      0,
    ],
    [
      " город",
      [
        [" город", 0.83],
        [" и", 0.05],
        [" мегаполис", 0.04],
        [" центр", 0.03],
      ],
      0,
    ],
    [
      " страны",
      [
        [" страны", 0.77],
        [" Франции", 0.12],
        [" Европы", 0.06],
        [" на", 0.02],
      ],
      0,
    ],
    [
      " и",
      [
        [".", 0.48],
        [" и", 0.31],
        [",", 0.12],
        [" с", 0.05],
      ],
      1,
    ],
    [
      " её",
      [
        [" её", 0.38],
        [" главный", 0.25],
        [" центр", 0.2],
        [" место", 0.06],
      ],
      0,
    ],
    [
      " сердце",
      [
        [" сердце", 0.29],
        [" культурный", 0.27],
        [" столица", 0.12],
        [" центр", 0.11],
      ],
      0,
    ],
    [
      ".",
      [
        [".", 0.66],
        [":", 0.18],
        [",", 0.1],
        [" —", 0.03],
      ],
      0,
    ],
    [
      " Здесь",
      [
        [" Здесь", 0.31],
        [" Тут", 0.22],
        [" В", 0.18],
        [" Его", 0.09],
      ],
      0,
    ],
    [
      " стоят",
      [
        [" стоят", 0.27],
        [" находятся", 0.25],
        [" есть", 0.2],
        [" живут", 0.1],
      ],
      0,
    ],
    [
      " Лувр",
      [
        [" Лувр", 0.44],
        [" Эйфелева", 0.32],
        [" музеи", 0.1],
        [" сотни", 0.04],
      ],
      0,
    ],
    [
      ",",
      [
        [",", 0.71],
        [" и", 0.19],
        [" —", 0.05],
        [".", 0.03],
      ],
      0,
    ],
    [
      " Эйфелева",
      [
        [" Эйфелева", 0.68],
        [" Нотр-Дам", 0.17],
        [" собор", 0.06],
        [" мосты", 0.03],
      ],
      0,
    ],
    [
      " башня",
      [
        [" башня", 0.97],
        [" Башня", 0.01],
        [" и", 0.005],
        [",", 0.004],
      ],
      0,
    ],
    [
      " и",
      [
        [" и", 0.52],
        [",", 0.31],
        [".", 0.12],
        [" —", 0.02],
      ],
      0,
    ],
    [
      " тысячи",
      [
        [" тысячи", 0.24],
        [" сотни", 0.21],
        [" Нотр-Дам", 0.19],
        [" множество", 0.12],
      ],
      0,
    ],
    [
      " кафе",
      [
        [" кафе", 0.39],
        [" улочек", 0.2],
        [" музеев", 0.17],
        [" мостов", 0.1],
      ],
      0,
    ],
    [
      ".",
      [
        [".", 0.81],
        [",", 0.11],
        [" —", 0.03],
        [" и", 0.02],
      ],
      0,
    ],
  ];

  function stepTimes(s) {
    const take = at(s, "take", 0.4);
    const again = at(s, "again", take + 1.2);
    const fast = at(s, "fast", again + 3);
    const times = [take];
    let t = Math.max(again, take + 0.9);
    for (let k = 1; k < STEPS.length; k += 1) {
      times.push(t);
      t += t < fast ? 1.0 : 0.26;
    }
    return times;
  }

  function loop(ctx, s) {
    const times = stepTimes(s);
    const words = [...BASE, ...STEPS.map((st) => st[0])];
    // Фраза стоит там же, где в прошлой сцене, и уезжает вверх, пока летит «Париж».
    const lift = lerp(230, 0, easeInOut(clamp((s.t - times[0]) / 0.8)));
    const lay = K.layoutWords(ctx, words, 170, 330, 1580, 86, 66, "serif", 500).map((w) => ({
      ...w,
      y: w.y + lift,
    }));
    const done = times.filter((t) => s.t >= t).length;
    const cur = Math.min(done, STEPS.length - 1);
    const prevT = done === 0 ? -1 : times[done - 1];
    const nextT = times[Math.min(done, times.length - 1)];
    const interval = Math.max(0.2, nextT - prevT);

    lay
      .slice(0, BASE.length)
      .forEach((w) => K.text(ctx, w.w, w.x, w.y, { size: 66, font: "serif", weight: 500 }));
    const chartX = 560;
    const chartY = 560;
    for (let k = 0; k < done; k += 1) {
      const w = lay[BASE.length + k];
      const age = s.t - times[k];
      const fresh = clamp(1 - age / 0.6);
      if (k === 0 && age < 0.7) {
        // Из той же точки, где «Париж» стоял в столбиках прошлой сцены.
        flyWord(
          ctx,
          w.w.trim(),
          { x: CHART.x + 136, y: CHART.y + 56, size: 40 },
          { x: w.x + 16, y: w.y },
          age / 0.7,
          66,
        );
        continue;
      }
      K.text(ctx, w.w, w.x, w.y, {
        size: 66,
        font: "serif",
        weight: 500,
        color: K.mixHex(C.ink, C.gold, fresh),
        glow: fresh * 0.6,
      });
    }

    // До первого шага столбики стоят там же, где их оставила прошлая сцена.
    const handoff = 1 - clamp((s.t - times[0]) / 0.3);
    if (handoff > 0) {
      chartHeader(ctx, handoff);
      K.bars(ctx, PARIS, { ...CHART, pick: 0, pickA: 1, alpha: handoff });
    }
    const allDone = done >= STEPS.length;
    const chartA = done === 0 ? 0 : allDone ? clamp(1 - (s.t - times[times.length - 1]) / 0.4) : 1;
    if (chartA > 0) {
      const step = STEPS[allDone ? STEPS.length - 1 : cur];
      const items = step[1].map(([label, p]) => ({ label: label.trim() || label, p }));
      const first = done === 0;
      // Первые столбики ждут, пока «Париж» долетит до текста.
      const growFrom = done === 1 ? prevT + 0.7 : prevT;
      const grow = first ? 1 : clamp((s.t - growFrom) / (0.45 * interval));
      const pickA = first ? 1 : clamp((s.t - (nextT - 0.4 * interval)) / (0.25 * interval));
      K.text(ctx, "КАНДИДАТЫ", chartX + 260, chartY - 22, {
        size: 22,
        color: C.muted,
        alpha: chartA * clamp(grow * 3),
      });
      K.bars(ctx, items, {
        x: chartX,
        y: chartY,
        w: 800,
        rowH: 66,
        labelW: 260,
        grow,
        pick: allDone ? -1 : step[2],
        pickA: allDone ? 0 : pickA,
        alpha: chartA,
      });
    }
    const fast = at(s, "fast");
    const extra = s.t > fast ? Math.floor((s.t - fast) * 38) : 0;
    const counter = Math.max(done, done + extra);
    K.text(ctx, `шаг ${counter}`, 1750, 1000, {
      size: 30,
      font: "mono",
      color: C.muted,
      align: "right",
    });
    K.captions(ctx, s.t, [
      [
        at(s, "again"),
        [{ t: "дописать " }, { t: "→", c: C.dim }, { t: " спросить снова", c: C.gold }],
      ],
      [fast, [{ t: "сотни", c: C.gold }, { t: " шагов подряд" }]],
    ]);
  }

  // ── 5. Откуда шансы: гора текстов, угадывание, подкрутка ──────────────
  function train(ctx, s) {
    const books = at(s, "books", 0.5);
    const knobs = at(s, "knobs");
    const good = at(s, "good");
    const appear = s.p(0, 0.6);

    // Слева — тексты, бегущие вверх.
    const r = K.rng(7);
    const lines = Array.from({ length: 40 }, () => ({
      w: 180 + r() * 300,
      mark: r() < 0.25,
      mx: r(),
    }));
    K.text(ctx, "ТЕКСТЫ", 370, 238, { size: 22, color: C.muted, align: "center", alpha: appear });
    const scroll = (s.t * 70) % 34;
    lines.forEach((ln, i) => {
      const y = 290 + i * 34 - scroll - Math.floor((s.t * 70) / 34) * 0;
      if (y < 270 || y > 900) return;
      const edge = clamp(Math.min(y - 270, 900 - y) / 80);
      K.roundRect(ctx, 120, y, ln.w, 10, 5, { fill: C.dim, alpha: appear * edge * 0.9 });
      if (ln.mark) {
        K.roundRect(ctx, 120 + ln.mx * (ln.w - 60), y, 56, 10, 5, {
          fill: C.blue,
          alpha: appear * edge,
        });
      }
    });

    // Поток из текстов в модель.
    const flow = clamp((s.t - books) / 0.6);
    for (let i = 0; i < 18; i += 1) {
      const ph = (s.t * 0.9 + i / 18) % 1;
      const y0 = 300 + ((i * 97) % 560);
      const x = lerp(640, 760, ph);
      K.glowDot(ctx, x, lerp(y0, 540, ph * 0.6), 3, C.blue, flow * Math.sin(ph * Math.PI));
    }

    // Модель — коробка с ручками настроек.
    const box = { x: 760, y: 290, w: 400, h: 500 };
    K.text(ctx, "МОДЕЛЬ", 960, 266, { size: 22, color: C.muted, align: "center", alpha: appear });
    K.roundRect(ctx, box.x, box.y, box.w, box.h, 24, {
      fill: K.rgba(C.panel, 0.95),
      stroke: C.line,
      alpha: appear,
    });

    // Справа — попытки угадать: красный промах, бирюзовый попадание.
    const gx = 1290;
    const gy = 290;
    const cols = 12;
    const total = 144;
    const rate = 12;
    const hr = K.rng(42);
    const hits = Array.from({ length: total }, (_, k) => hr() < 0.06 + 0.88 * clamp((k - 24) / 96));
    const shown = clamp(Math.floor((s.t - books) * rate), 0, total);
    let lastMiss = -Infinity;
    K.text(ctx, "УГАДАЛА?", gx + 6 * 34 - 4, 266, {
      size: 22,
      color: C.muted,
      align: "center",
      alpha: appear,
    });
    for (let k = 0; k < shown; k += 1) {
      const born = books + k / rate;
      const pop = K.back(clamp((s.t - born) / 0.25));
      const sz = 26 * pop;
      const x = gx + (k % cols) * 34 + (26 - sz) / 2;
      const y = gy + Math.floor(k / cols) * 34 + (26 - sz) / 2;
      K.roundRect(ctx, x, y, sz, sz, 5, { fill: hits[k] ? C.teal : C.red, alpha: 0.85 });
      if (!hits[k]) lastMiss = born;
    }

    const activity = clamp((s.t - knobs) / 0.6) * (1 - 0.75 * clamp((s.t - good) / 1.2));
    const flash = activity * Math.exp(-(s.t - lastMiss) * 5);
    const kr = K.rng(3);
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const cx = box.x + 60 + col * 56;
        const cy = box.y + 70 + row * 62;
        const base = kr() * Math.PI * 2;
        const ph = kr() * 6;
        const ang = base + activity * 0.8 * Math.sin(s.t * 2.2 + ph);
        K.glowDot(ctx, cx, cy, 2, C.gold, flash * 0.9);
        ctx.save();
        ctx.globalAlpha *= appear;
        ctx.strokeStyle = K.mixHex(C.dim, C.gold, flash);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = K.mixHex(C.muted, C.gold, flash + activity * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14);
        ctx.stroke();
        ctx.restore();
      }
    }
    K.captions(ctx, s.t, [
      [books, [{ t: "миллиарды", c: C.gold }, { t: " попыток угадать" }]],
      [knobs, [{ t: "каждый промах " }, { t: "подкручивает", c: C.gold }, { t: " настройки" }]],
      [good, [{ t: "угадывать " }, { t: "получается", c: C.teal }]],
    ]);
  }

  // ── 6. Температура: лидер или риск ────────────────────────────────────
  const CAT = [
    { label: "подоконник", p: 0.38 },
    { label: "коврик", p: 0.27 },
    { label: "диван", p: 0.18 },
    { label: "крышу", p: 0.09 },
    { label: "луну", p: 0.02 },
  ];

  function temperature(s) {
    const zero = at(s, "zero");
    const high = at(s, "high");
    let T = 1;
    T = lerp(T, 0, easeInOut(clamp((s.t - zero) / 0.9)));
    T = lerp(T, 1.1, easeInOut(clamp((s.t - high) / 0.9)));
    return T;
  }

  function reshape(items, T) {
    if (T < 0.05) return items.map((it, i) => ({ ...it, p: i === 0 ? 1 : 0 }));
    const w = items.map((it) => Math.pow(it.p, 1 / T));
    const sum = w.reduce((a, b) => a + b, 0);
    return items.map((it, i) => ({ ...it, p: w[i] / sum }));
  }

  function temp(ctx, s) {
    const T = temperature(s);
    const zero = at(s, "zero");
    const high = at(s, "high");
    const appear = s.p(0, 0.5);
    K.text(ctx, "Кот сел на", 170, 250, { size: 60, font: "serif", weight: 500, alpha: appear });
    K.cursorBox(
      ctx,
      170 + K.measure(ctx, "Кот сел на", 60, "serif", 500) + 22,
      190,
      130,
      80,
      s.t,
      appear,
    );
    K.bars(ctx, reshape(CAT, T), {
      x: 130,
      y: 340,
      w: 1060,
      rowH: 92,
      labelW: 330,
      grow: clamp(s.t / 1.0),
      pick: s.t > zero + 0.5 && s.t < high ? 0 : -1,
      pickA: clamp((s.t - zero - 0.5) / 0.4) * clamp((high - s.t) / 0.3),
    });

    // Ручка температуры.
    const x1 = 1300;
    const x2 = 1760;
    const sy = 380;
    const knobA = s.p("knob", 0.6);
    K.text(ctx, "температура", x1, sy - 84, { size: 32, color: C.muted, alpha: knobA });
    K.line(ctx, x1, sy, x2, sy, { color: C.line, lw: 4, alpha: knobA });
    ["0", "1", "2"].forEach((lab, i) => {
      const x = lerp(x1, x2, i / 2);
      K.line(ctx, x, sy - 10, x, sy + 10, { color: C.dim, lw: 2, alpha: knobA });
      K.text(ctx, lab, x, sy + 46, {
        size: 24,
        font: "mono",
        color: C.muted,
        align: "center",
        alpha: knobA,
      });
    });
    const kx = lerp(x1, x2, clamp(T / 2));
    K.glowDot(ctx, kx, sy, 14, C.gold, knobA);
    K.text(ctx, T.toFixed(1).replace(".", ","), kx, sy - 30, {
      size: 26,
      font: "mono",
      color: C.gold,
      align: "center",
      alpha: knobA,
    });

    // Три ответа на один вопрос.
    const rowsY = [520, 610, 700];
    const zeroWords = ["подоконник", "подоконник", "подоконник"];
    const highWords = ["коврик", "подоконник", "крышу"];
    const pool = CAT.map((c) => c.label);
    rowsY.forEach((y, i) => {
      const zBorn = zero + 0.9 + i * 0.45;
      const hBorn = high + 0.9 + i * 0.35;
      const rowA = clamp((s.t - zBorn) / 0.25);
      if (rowA <= 0) return;
      K.text(ctx, "Кот сел на", x1, y, { size: 38, font: "serif", color: C.muted, alpha: rowA });
      let word = zeroWords[i];
      let fresh = clamp(1 - (s.t - zBorn) / 0.5);
      if (s.t >= high + 0.9 + i * 0.35 - 0.6) {
        const settle = hBorn;
        if (s.t < settle) {
          word = pool[Math.floor(s.t * 14 + i * 3) % pool.length];
          fresh = 0.4;
        } else {
          word = highWords[i];
          fresh = clamp(1 - (s.t - settle) / 0.5);
        }
      }
      K.text(ctx, word, x1 + K.measure(ctx, "Кот сел на ", 38, "serif", 400), y, {
        size: 38,
        font: "serif",
        weight: 500,
        color: K.mixHex(C.ink, C.gold, fresh),
        alpha: rowA,
        glow: fresh * 0.5,
      });
    });
    const boring = clamp((s.t - zero - 2.3) / 0.4) * clamp((high - s.t) / 0.3);
    K.text(ctx, "скучно", x1, 790, {
      size: 36,
      font: "serif",
      italic: true,
      color: C.muted,
      alpha: boring,
    });

    K.captions(ctx, s.t, [
      [at(s, "knob"), [{ t: "температура", c: C.gold }]],
      [at(s, "diff"), [{ t: "один вопрос — " }, { t: "разные ответы", c: C.gold }]],
    ]);
  }

  // ── 7. Галлюцинация: лидера нет, а слово выбрать надо ─────────────────
  const TARDIN = [
    { label: "Тардин", p: 0.12 },
    { label: "Нова-Тарда", p: 0.1 },
    { label: "Сан-Мирела", p: 0.09 },
    { label: "Брегор", p: 0.08 },
    { label: "Ильмар", p: 0.07 },
  ];
  const TAIL = [" Тардин", ",", " старинный", " порт", " на", " юге", " страны", "."];

  function halluc(ctx, s) {
    const phrase = s.p(at(s, "phrase", 0.2), 0.5);
    const flat = at(s, "flat");
    const pick = at(s, "pick");
    const name = at(s, "name");
    const base = ["Столица", " Тардинии", " —"];
    const words = [...base, ...TAIL];
    const lay = K.layoutWords(ctx, words, 170, 560, 1580, 88, 66, "serif", 500);
    lay
      .slice(0, base.length)
      .forEach((w) =>
        K.text(ctx, w.w, w.x, w.y, { size: 66, font: "serif", weight: 500, alpha: phrase }),
      );
    const endX = lay[base.length - 1].x + lay[base.length - 1].width;
    const fly = clamp((s.t - pick - 0.4) / 0.7);
    if (fly <= 0) askBox(ctx, s, endX, 560, phrase);

    const chartA = 1 - clamp((s.t - pick - 0.9) / 0.5);
    const grow = clamp((s.t - flat) / 1.1);
    if (chartA > 0) {
      chartHeader(ctx, clamp(grow * 3) * chartA);
      K.bars(ctx, TARDIN, { ...CHART, grow, pick: 0, pickA: s.p(pick, 0.4), alpha: chartA });
    }
    // «Тардин» летит из столбиков в текст, следом — уверенное продолжение.
    const t0 = lay[base.length];
    if (fly > 0 && fly < 1) {
      flyWord(
        ctx,
        "Тардин",
        { x: CHART.x + 30, y: CHART.y + 56, size: 40 },
        { x: t0.x + 16, y: t0.y },
        fly,
        66,
      );
    }
    TAIL.forEach((_, k) => {
      const w = lay[base.length + k];
      const born = k === 0 ? pick + 1.1 : pick + 1.1 + k * 0.22;
      if (s.t < born) return;
      const fresh = clamp(1 - (s.t - born) / 0.5);
      K.text(ctx, w.w, w.x, w.y, {
        size: 66,
        font: "serif",
        weight: 500,
        color: K.mixHex(C.ink, C.gold, fresh),
        glow: fresh * 0.5,
      });
    });
    // Волнистая красная черта под выдумкой.
    const wave = clamp((s.t - name) / 0.9);
    if (wave > 0) {
      const tailLay = lay.slice(base.length);
      const rows = new Map();
      tailLay.forEach((w) => {
        const r = rows.get(w.y) || { x1: w.x, x2: w.x + w.width };
        r.x1 = Math.min(r.x1, w.x);
        r.x2 = Math.max(r.x2, w.x + w.width);
        rows.set(w.y, r);
      });
      const segs = [...rows.entries()];
      const totalLen = segs.reduce((a, [, r]) => a + (r.x2 - r.x1), 0);
      let left = totalLen * wave;
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = K.rgba(C.red, 0.6);
      ctx.shadowBlur = 12;
      for (const [y, r] of segs) {
        if (left <= 0) break;
        const len = Math.min(left, r.x2 - r.x1);
        left -= len;
        ctx.beginPath();
        for (let x = r.x1; x <= r.x1 + len; x += 4) {
          const yy = y + 22 + Math.sin((x - r.x1) / 9) * 4;
          if (x === r.x1) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    K.captions(ctx, s.t, [
      [flat, [{ t: "явного лидера " }, { t: "нет", c: C.red }]],
      [pick, [{ t: "звучит " }, { t: "похоже на правду", c: C.gold }]],
      [name, [{ t: "галлюцинация", c: C.red }]],
    ]);
  }

  // ── 8. Не ищет — дописывает ────────────────────────────────────────────
  function outro(ctx, s) {
    ctx.globalAlpha *= clamp((s.d - s.t) / 0.8);
    const not = at(s, "not", 0.3);
    const yes = at(s, "yes");
    const wordsAt = at(s, "words");
    const a1 = s.p(not, 0.5);
    const strike = s.p(yes, 0.5);
    const dimmed = 1 - 0.55 * strike;
    const l1 = "не ищет ответ в базе";
    const w1 = K.measure(ctx, l1, 76, "serif", 400);
    K.text(ctx, l1, 960, 430 - strike * 30, {
      size: 76,
      font: "serif",
      color: C.muted,
      align: "center",
      alpha: a1 * dimmed,
    });
    if (strike > 0) {
      K.line(
        ctx,
        960 - w1 / 2 - 10,
        405 - strike * 30,
        960 - w1 / 2 - 10 + (w1 + 20) * strike,
        405 - strike * 30,
        {
          color: C.red,
          lw: 5,
          alpha: dimmed,
        },
      );
    }
    const a2 = clamp((s.t - yes - 0.3) / 0.6);
    K.text(ctx, "дописывает его", 960, 600 + (1 - easeOut(a2)) * 24, {
      size: 108,
      font: "serif",
      weight: 500,
      color: C.gold,
      align: "center",
      alpha: a2,
      glow: 0.45,
    });
    const triple = ["слово", "за", "словом"];
    const tw = triple.map((w) => K.measure(ctx, w, 44));
    const gap = 54;
    let x = 960 - (tw.reduce((a, b) => a + b, 0) + gap * 2) / 2;
    triple.forEach((w, i) => {
      const born = wordsAt + i * 0.32;
      const k = clamp((s.t - born) / 0.3);
      K.text(ctx, w, x, 740, { size: 44, color: C.ink, alpha: k });
      if (i < 2) K.glowDot(ctx, x + tw[i] + gap / 2, 726, 4, C.gold, k);
      x += tw[i] + gap;
    });
  }

  window.SCENES = { hook, tokens, predict, loop, train, temp, halluc, outro };
})();
