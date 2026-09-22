// Модуль-переносчик канона логотипа (Spec-Driven: эталон — docs/brand/logo.md,
// поверка — tests/brand.test.ts). Логотип завода — набор файлов, который
// принёс владелец 22.09.2026 (лента-стрелка и наклонная надпись «zavod.today»,
// палитра бирюзовая). Единственный дом реестра файлов, палитры и правил:
// компонент Logo, favicon, экран /admin/brand/logo и кнопки скачивания берут
// пути и числа отсюда и своих не знают.

/** Слово завода в надписи логотипа. */
export const WORD = "zavod.today";

/** Палитра набора (sRGB), файл набора — public/brand/logo/brand/palette.json. */
export const PALETTE = {
  /** основной, лента */
  teal: "#00BFA6",
  /** сгиб ленты */
  fold: "#00796F",
  /** надпись и тёмные поверхности */
  ink: "#063B3B",
  /** инверсия на тёмном */
  mint: "#B6F5E7",
  mintFold: "#4BD6BA",
  /** светлая поверхность */
  paper: "#F4FBF9",
  black: "#111111",
  white: "#FFFFFF",
} as const;

/** Корень набора в публичной папке сайта. */
export const LOGO_ROOT = "/brand/logo";

export type LogoKind = "horizontal" | "mark" | "square" | "web";
export type LogoVariant =
  "primary" | "inverse" | "black" | "white" | "dark" | "maskable" | "favicon" | "touch";

export type LogoFile = {
  id: string;
  kind: LogoKind;
  variant: LogoVariant;
  format: "svg" | "png" | "ico";
  /** путь от корня сайта */
  path: string;
  /** размер растра, px; у svg — размер холста */
  size: string;
  /** для чего файл, одной фразой */
  use: string;
};

/** Реестр файлов набора: таблица «Файлы» канона logo.md — то же, по id. */
export const LOGO_FILES: LogoFile[] = [
  {
    id: "horizontal-primary-svg",
    kind: "horizontal",
    variant: "primary",
    format: "svg",
    path: `${LOGO_ROOT}/horizontal/svg/zavod-horizontal-primary.svg`,
    size: "1312×390",
    use: "полный логотип на светлом: шапка и футер сайта, документы",
  },
  {
    id: "horizontal-inverse-svg",
    kind: "horizontal",
    variant: "inverse",
    format: "svg",
    path: `${LOGO_ROOT}/horizontal/svg/zavod-horizontal-inverse.svg`,
    size: "1312×390",
    use: "полный логотип на тёмном: хедер админки, тёмные обложки",
  },
  {
    id: "horizontal-black-svg",
    kind: "horizontal",
    variant: "black",
    format: "svg",
    path: `${LOGO_ROOT}/horizontal/svg/zavod-horizontal-black.svg`,
    size: "1312×390",
    use: "одноцветный чёрный: печать, документы без цвета",
  },
  {
    id: "horizontal-white-svg",
    kind: "horizontal",
    variant: "white",
    format: "svg",
    path: `${LOGO_ROOT}/horizontal/svg/zavod-horizontal-white.svg`,
    size: "1312×390",
    use: "одноцветный белый: поверх фото и видео",
  },
  {
    id: "horizontal-primary-png",
    kind: "horizontal",
    variant: "primary",
    format: "png",
    path: `${LOGO_ROOT}/horizontal/png/zavod-horizontal-primary@2x.png`,
    size: "2624×780",
    use: "полный логотип для сервисов без SVG: обложка канала, презентации",
  },
  {
    id: "horizontal-inverse-png",
    kind: "horizontal",
    variant: "inverse",
    format: "png",
    path: `${LOGO_ROOT}/horizontal/png/zavod-horizontal-inverse@2x.png`,
    size: "2624×780",
    use: "полный логотип на тёмном для сервисов без SVG",
  },
  {
    id: "mark-primary-svg",
    kind: "mark",
    variant: "primary",
    format: "svg",
    path: `${LOGO_ROOT}/mark/svg/zavod-mark-primary.svg`,
    size: "512×512",
    use: "отдельный знак на светлом",
  },
  {
    id: "mark-inverse-svg",
    kind: "mark",
    variant: "inverse",
    format: "svg",
    path: `${LOGO_ROOT}/mark/svg/zavod-mark-inverse.svg`,
    size: "512×512",
    use: "отдельный знак на тёмном",
  },
  {
    id: "mark-primary-png",
    kind: "mark",
    variant: "primary",
    format: "png",
    path: `${LOGO_ROOT}/mark/png/zavod-mark-primary@2x.png`,
    size: "1024×1024",
    use: "знак с прозрачным фоном: водяной знак на роликах",
  },
  {
    id: "square-primary-png",
    kind: "square",
    variant: "primary",
    format: "png",
    path: `${LOGO_ROOT}/square/png/zavod-square-primary-1024.png`,
    size: "1024×1024",
    use: "аватар на бирюзовом со скруглением: площадка коротких видео, Telegram",
  },
  {
    id: "square-dark-png",
    kind: "square",
    variant: "dark",
    format: "png",
    path: `${LOGO_ROOT}/square/png/zavod-square-dark-1024.png`,
    size: "1024×1024",
    use: "аватар на петрольном: YouTube, тёмные профили",
  },
  {
    id: "square-maskable-png",
    kind: "square",
    variant: "maskable",
    format: "png",
    path: `${LOGO_ROOT}/square/png/zavod-square-maskable-1024.png`,
    size: "1024×1024",
    use: "квадрат без скруглений: сервисы, которые режут маску сами",
  },
  {
    id: "square-black-png",
    kind: "square",
    variant: "black",
    format: "png",
    path: `${LOGO_ROOT}/square/png/zavod-square-black-1024.png`,
    size: "1024×1024",
    use: "чёрный квадратный аватар: сервисы без цвета",
  },
  {
    id: "favicon-svg",
    kind: "web",
    variant: "favicon",
    format: "svg",
    path: `${LOGO_ROOT}/web/favicon.svg`,
    size: "512×512",
    use: "закладка браузера: одноцветная лента на петрольном, читается в 16 px",
  },
  {
    id: "favicon-ico",
    kind: "web",
    variant: "favicon",
    format: "ico",
    path: `${LOGO_ROOT}/web/favicon.ico`,
    size: "16 · 32 · 48",
    use: "закладка для старых браузеров",
  },
  {
    id: "touch-icon-png",
    kind: "web",
    variant: "touch",
    format: "png",
    path: `${LOGO_ROOT}/web/app/icon-180.png`,
    size: "180×180",
    use: "иконка на домашнем экране iPhone",
  },
];

export function logoFile(id: string): LogoFile {
  const file = LOGO_FILES.find((f) => f.id === id);
  if (!file) throw new Error(`нет файла логотипа «${id}»`);
  return file;
}

/** Файл полного логотипа по варианту: шапка, футер, хедер берут его отсюда. */
export function horizontalSrc(variant: "primary" | "inverse" | "black" | "white"): string {
  return logoFile(`horizontal-${variant}-svg`).path;
}

/** Кнопки скачивания по площадкам: подпись · что за файл · id из реестра. */
export const DOWNLOADS: { label: string; note: string; fileId: string }[] = [
  {
    label: "Площадка коротких видео",
    note: "аватар профиля, квадрат 1024 со скруглением на бирюзовом",
    fileId: "square-primary-png",
  },
  {
    label: "Telegram",
    note: "аватар канала, квадрат 1024 на бирюзовом",
    fileId: "square-primary-png",
  },
  { label: "YouTube · аватар", note: "квадрат 1024 на петрольном", fileId: "square-dark-png" },
  {
    label: "YouTube · обложка и презентации",
    note: "полный логотип PNG на светлом, 2624×780",
    fileId: "horizontal-primary-png",
  },
  {
    label: "Тёмные обложки",
    note: "полный логотип PNG на тёмном, 2624×780",
    fileId: "horizontal-inverse-png",
  },
  {
    label: "Водяной знак на роликах",
    note: "знак с прозрачным фоном, 1024",
    fileId: "mark-primary-png",
  },
  {
    label: "Сайт и документы",
    note: "полный логотип SVG на светлом",
    fileId: "horizontal-primary-svg",
  },
  { label: "Печать без цвета", note: "чёрный полный логотип SVG", fileId: "horizontal-black-svg" },
  {
    label: "Поверх фото и видео",
    note: "белый полный логотип SVG",
    fileId: "horizontal-white-svg",
  },
  { label: "Закладка браузера", note: "favicon SVG", fileId: "favicon-svg" },
];

/** Правила применения из набора. */
export const RULES = {
  /** минимальная ширина полного логотипа, px */
  minHorizontal: 180,
  /** минимальный размер отдельного цветного знака, px */
  minMark: 32,
  /** свободное поле вокруг знака — доля его высоты */
  clearSpace: 0.25,
} as const;
