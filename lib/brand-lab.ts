// Полигон: канон — docs/brand/lab.md. Геометрия и сборка обеих форм
// живут только здесь; экран вставляет готовые SVG, поверка сверяет канон.

export type LabTone = "color" | "mono";

export type LabVariant = {
  id: string;
  title: string;
  idea: string;
  family: string;
  mark: (variant: LabTone) => string;
  lockup: (variant: LabTone) => string;
};

export const LAB_PALETTE = {
  yellow: "#F5B700",
  ink: "#000000",
  paper: "#FFFFFF",
} as const;

export const LAB_MARK_SIZE = 1024;

export const LAB_LOCKUP = {
  fontSize: 128,
  markPerEm: 1.25,
  gapPerEm: 0.25,
  tracking: 0.05,
  weight: 700,
  width: 640,
  height: 160,
  baseline: 116,
} as const;

type Geometry = (solid: string, cut: string) => string;

function defineVariant(meta: Omit<LabVariant, "mark" | "lockup">, geometry: Geometry): LabVariant {
  function drawing(tone: LabTone) {
    return geometry(
      tone === "color" ? LAB_PALETTE.yellow : LAB_PALETTE.ink,
      tone === "color" ? LAB_PALETTE.ink : LAB_PALETTE.paper,
    );
  }

  return {
    ...meta,
    mark: (tone) =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LAB_MARK_SIZE} ${LAB_MARK_SIZE}" role="img" aria-label="${meta.title}: знак">` +
      drawing(tone) +
      `</svg>`,
    lockup: (tone) => {
      const { fontSize, markPerEm, gapPerEm, tracking, weight, width, height, baseline } =
        LAB_LOCKUP;
      const markSide = fontSize * markPerEm;
      const wordX = markSide + fontSize * gapPerEm;
      // Цвет слова на экране задаётся только чёрным или белым. Моно всегда
      // чёрный. CSS-переменная подключает реальное имя Inter из next/font.
      const wordColor = tone === "color" ? "currentColor" : LAB_PALETTE.ink;
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="zavod — ${meta.title}">` +
        `<g transform="translate(0 ${(height - markSide) / 2}) scale(${markSide / LAB_MARK_SIZE})">${drawing(tone)}</g>` +
        `<text x="${wordX}" y="${baseline}" fill="${wordColor}" font-family="Inter, system-ui, sans-serif" style="font-family:var(--font-inter, Inter), system-ui, sans-serif" font-size="${fontSize}" font-weight="${weight}" letter-spacing="${tracking}em">zavod</text>` +
        `</svg>`
      );
    },
  };
}

export const LAB_VARIANTS: readonly LabVariant[] = [
  defineVariant(
    {
      id: "belt-loop",
      title: "Лента выпуска",
      family: "конвейер",
      idea: "Карточка проходит по ленте и становится очередным выпуском.",
    },
    (solid, cut) =>
      `<rect x="256" y="128" width="256" height="256" fill="${solid}"/>` +
      `<rect x="64" y="448" width="896" height="448" rx="224" fill="${solid}"/>` +
      `<circle cx="288" cy="672" r="96" fill="${cut}"/>` +
      `<circle cx="736" cy="672" r="96" fill="${cut}"/>`,
  ),
  defineVariant(
    {
      id: "vertical-frame",
      title: "Вертикальный объект",
      family: "кадр 9:16",
      idea: "Пропорция готового ролика становится самостоятельным знаком.",
    },
    (solid, cut) =>
      `<path d="M296 128H600L728 256V896H296Z" fill="${solid}"/>` +
      `<path d="M600 128V256H728Z" fill="${cut}"/>` +
      `<rect x="376" y="672" width="272" height="96" fill="${cut}"/>`,
  ),
  defineVariant(
    {
      id: "split-play",
      title: "Разрезанный пуск",
      family: "воспроизведение",
      idea: "Разрыв в кнопке пуска обозначает два такта автоматического выпуска.",
    },
    (solid) =>
      `<path d="M192 128L384 243.2V780.8L192 896ZM512 320L832 512L512 704Z" fill="${solid}"/>`,
  ),
  defineVariant(
    {
      id: "clap-board",
      title: "Монтажный такт",
      family: "хлопушка",
      idea: "Открытая хлопушка отмечает начало сборки нового ролика.",
    },
    (solid, cut) =>
      `<path d="M128 256L832 128L864 320L160 448Z" fill="${solid}"/>` +
      `<path d="M288 227L416 204L512 382L384 405ZM576 175L704 151L800 332L672 355Z" fill="${cut}"/>` +
      `<rect x="128" y="512" width="768" height="384" rx="32" fill="${solid}"/>` +
      `<rect x="288" y="640" width="448" height="128" fill="${cut}"/>`,
  ),
  defineVariant(
    {
      id: "six-minute",
      title: "Шесть минут",
      family: "время",
      idea: "Сектор в одну десятую циферблата показывает шесть минут из часа.",
    },
    (solid, cut) =>
      `<circle cx="512" cy="512" r="384" fill="${solid}"/>` +
      `<circle cx="512" cy="512" r="240" fill="${cut}"/>` +
      // 36° = 6/60 оборота, сектор от двенадцати часов по часовой стрелке.
      `<path d="M512 512V128A384 384 0 0 1 737.71 201.34Z" fill="${solid}"/>`,
  ),
  defineVariant(
    {
      id: "quote-window",
      title: "Окно цитаты",
      family: "речь",
      idea: "Два коротких штриха внутри реплики превращают чужие слова в материал ролика.",
    },
    (solid, cut) =>
      `<path d="M128 128H896V704H512L256 896V704H128Z" fill="${solid}"/>` +
      `<path d="M288 320H448V480L288 576V480H352V448H288ZM576 320H736V480L576 576V480H640V448H576Z" fill="${cut}"/>`,
  ),
  defineVariant(
    {
      id: "factory-stack",
      title: "Труба завода",
      family: "производство",
      idea: "Ступенчатый цех и высокая труба говорят о непрерывном производстве.",
    },
    (solid, cut) =>
      `<path d="M128 512L384 320V512L640 320V896H128ZM704 128H896V896H704Z" fill="${solid}"/>` +
      `<path d="M224 640H352V768H224ZM448 640H576V768H448Z" fill="${cut}"/>`,
  ),
  defineVariant(
    {
      id: "vd-joint",
      title: "Стык букв",
      family: "монограмма vd",
      idea: "Наклонная v соединяется с округлой d в одну деталь машины.",
    },
    (solid) =>
      `<path d="M96 128H272L400 640L528 128H704L480 896H320Z" fill="${solid}"/>` +
      `<path d="M576 128H640C848 128 960 272 960 512S848 896 640 896H576V128ZM704 320V704C768 672 800 608 800 512S768 352 704 320Z" fill-rule="evenodd" fill="${solid}"/>`,
  ),
  defineVariant(
    {
      id: "release-dot",
      title: "Точка выпуска",
      family: "круг с вырезом",
      idea: "Вырез открывает цельный круг наружу, как выход готового выпуска.",
    },
    (solid) => `<path d="M883.806 416A384 384 0 1 0 883.806 608H512V416Z" fill="${solid}"/>`,
  ),
  defineVariant(
    {
      id: "card-stack",
      title: "Стопка карточек",
      family: "карточки",
      idea: "Три сдвинутые карточки собираются в последовательность кадров.",
    },
    (solid, cut) =>
      `<path d="M128 128H640V256H256V640H128ZM320 320H832V448H448V832H320Z" fill="${solid}"/>` +
      `<rect x="512" y="512" width="384" height="384" fill="${solid}"/>` +
      `<rect x="608" y="656" width="192" height="96" fill="${cut}"/>`,
  ),
  defineVariant(
    {
      id: "voice-wave",
      title: "Голос машины",
      family: "звук",
      idea: "Пять столбиков разной высоты превращают голос рассказчика в ритм.",
    },
    (solid) =>
      `<path d="M96 384H224V640H96ZM272 256H400V768H272ZM448 128H576V896H448ZM624 224H752V800H624ZM800 416H928V608H800Z" fill="${solid}"/>`,
  ),
  defineVariant(
    {
      id: "news-to-video",
      title: "Новость в кадр",
      family: "переход",
      idea: "Строки новости входят стрелкой в вертикальный экран.",
    },
    (solid, cut) =>
      `<rect x="608" y="128" width="288" height="768" fill="${solid}"/>` +
      `<rect x="704" y="256" width="96" height="512" fill="${cut}"/>` +
      `<path d="M128 224H384V352H128ZM128 672H384V800H128ZM128 448H448V320L800 512L448 704V576H128Z" fill="${solid}"/>`,
  ),
];
