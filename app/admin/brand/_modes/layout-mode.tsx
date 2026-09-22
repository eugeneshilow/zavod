import { BAND, COLUMNS, NAVBAR, RHYTHM, columnWidth } from "@/lib/layout";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../../_components/shell";

// Режим «лендинг» бренд-атласа: сетка витрины — схема полосы и колонок для
// экрана 1440, числа из переносчика lib/layout.ts, блоки и их полосы, ссылка
// на живую страницу с накладкой «/?grid». Канон — docs/brand/layout.md, ниже.

/** Схема экрана 1440: полоса героя, полоса шапки, полоса контента с колонками. */
function GridScheme() {
  const viewport = 1440;
  const h = 360;
  const x = (w: number) => (viewport - w) / 2;
  const inner = BAND.width - BAND.edgeDesktop * 2;
  const col = columnWidth();
  const columns = Array.from({ length: COLUMNS.count }, (_, i) => i);
  return (
    <svg
      viewBox={`0 0 ${viewport} ${h}`}
      className="w-full"
      role="img"
      aria-label="Схема сетки витрины"
    >
      <rect x="0" y="0" width={viewport} height={h} fill="#ffffff" />
      {/* шапка: пилюля на полосе */}
      <rect
        x={x(BAND.width) + BAND.edgeDesktop}
        y={NAVBAR.top}
        width={BAND.width - BAND.edgeDesktop * 2}
        height="40"
        rx="20"
        fill="none"
        stroke="#d946ef"
      />
      {/* полоса контента с полями */}
      <rect
        x={x(BAND.width)}
        y="80"
        width={BAND.width}
        height={h - 100}
        fill="none"
        stroke="#f43f5e"
      />
      {columns.map((i) => (
        <rect
          key={i}
          x={x(BAND.width) + BAND.edgeDesktop + i * (col + COLUMNS.gutter)}
          y="96"
          width={col}
          height={h - 132}
          fill="#f43f5e"
          fillOpacity="0.12"
        />
      ))}
      <text x={x(BAND.width) + 8} y="96" fontSize="12" fill="#f43f5e">
        полоса {BAND.width} · поля {BAND.edgeDesktop} · {COLUMNS.count} колонок по {Math.round(col)}{" "}
        · зазор {COLUMNS.gutter} · внутри {inner}
      </text>
      <text x={x(BAND.width) + BAND.edgeDesktop + 8} y="76" fontSize="12" fill="#d946ef">
        шапка на полосе, отступ сверху {NAVBAR.top}
      </text>
    </svg>
  );
}

const BLOCKS: { block: string; band: string; grid: string }[] = [
  {
    block: "Шапка",
    band: `${BAND.width}, пилюля top ${NAVBAR.top}`,
    grid: "три равные зоны",
  },
  { block: "Герой", band: `${BAND.width}, во весь экран`, grid: "три колонки" },
  { block: "Проблема", band: `${BAND.width}`, grid: "12: заголовок 6 + абзац 6" },
  { block: "Как это работает", band: `${BAND.width}`, grid: "три карточки" },
  { block: "Примеры", band: `${BAND.width}`, grid: "три плитки 9:16" },
  { block: "Что внутри ролика", band: `${BAND.width}`, grid: "четыре карточки" },
  { block: "Цена", band: `${BAND.width}`, grid: "карточка до 576, две колонки" },
  { block: "Отзывы", band: `${BAND.width}`, grid: "три карточки" },
  { block: "Вопросы и ответы", band: `${BAND.width}`, grid: "столбик до 672" },
  { block: "Финальный призыв", band: `${BAND.width}`, grid: "плашка до 768" },
  { block: "Футер", band: `${BAND.width}`, grid: "12: 6 + 3 + 3" },
];

export async function LayoutMode() {
  const canon = await resolveDoc(["brand", "layout"]);
  return (
    <>
      <SectionLabel>
        ЖИВАЯ ВИТРИНА — страница «/» с накладкой сетки, как её видит зритель
      </SectionLabel>
      <Box title="Витрина с сеткой" aside="оси: V1 полоса · V2 герой · V3 шапка">
        <iframe
          src="/?grid"
          title="Витрина завода с накладкой сетки"
          className="h-[820px] w-full rounded border border-zinc-200 bg-white"
        />
      </Box>

      <SectionLabel>СЕТКА — полоса, колонки и два исключения на экране 1440</SectionLabel>
      <Box
        title="Схема сетки витрины"
        aside={
          <a className="text-[#ff7a45]" href="/?grid" target="_blank" rel="noreferrer">
            открыть витрину с сеткой
          </a>
        }
      >
        <GridScheme />
      </Box>

      <SectionLabel>ЧИСЛА — из переносчика lib/layout.ts, канон ниже</SectionLabel>
      <Box title="Числа сетки">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-zinc-100">
            {(
              [
                ["Полоса контента, px", BAND.width],
                ["Поля: мобиль / десктоп, px", `${BAND.edgeMobile} / ${BAND.edgeDesktop}`],
                ["Колонок", COLUMNS.count],
                ["Зазор между колонками, px", COLUMNS.gutter],
                ["Ширина колонки на десктопе, px", Math.round(columnWidth())],
                [
                  "Ритм секций: мобиль / десктоп, px",
                  `${RHYTHM.sectionMobile} / ${RHYTHM.sectionDesktop}`,
                ],
                ["Шапка: отступ сверху / высота, px", `${NAVBAR.top} / ${NAVBAR.height}`],
              ] as const
            ).map(([label, value]) => (
              <tr key={label}>
                <td className="py-1.5 pr-3">{label}</td>
                <td className="py-1.5 text-right tabular-nums">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <SectionLabel>БЛОКИ — какой полосой и какой сеткой живёт каждый</SectionLabel>
      <Box title="Блоки витрины" aside="порядок — канон витрины">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="py-1 pr-3 font-medium">блок</th>
              <th className="py-1 pr-3 font-medium">полоса</th>
              <th className="py-1 font-medium">сетка внутри</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {BLOCKS.map((row) => (
              <tr key={row.block}>
                <td className="py-1.5 pr-3">{row.block}</td>
                <td className="py-1.5 pr-3 tabular-nums text-zinc-600">{row.band}</td>
                <td className="py-1.5 text-zinc-600">{row.grid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {canon ? (
        <>
          <SectionLabel>КАНОН — как сетка устроена прямо сейчас</SectionLabel>
          <Box title="Канон сетки" aside={canon.doc}>
            <div
              className="doc"
              dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(canon.md), canon.doc) }}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}
