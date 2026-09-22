import { captionLine } from "@/lib/landing";
import { watchThrough, type Reel } from "@/lib/social";

// Блок 5 витрины: примеры. Форма снята с блока gallery-02 автора LN (21st.dev):
// подпись капсом и заголовок слева, под ними сетка плиток с подписью и
// подстрочником. Данные живые — те же таблицы, что экран сети; цифр нет —
// строка цифр не рисуется, выдуманных чисел на витрине не бывает. Канон блоков
// — docs/landing/README.md.

/** Подстрочник плитки: просмотры и досмотр; нет обеих цифр — пустая строка. */
function numbersLine(reel: Reel): string {
  const parts: string[] = [];
  if (reel.views !== null) parts.push(`${reel.views.toLocaleString("ru-RU")} просмотров`);
  const through = watchThrough(reel);
  if (through !== null) parts.push(`досмотр ${Math.round(through)} %`);
  return parts.join(" · ");
}

function Tile({ reel }: { reel: Reel }) {
  const caption = captionLine(reel.caption);
  const numbers = numbersLine(reel);
  const frame = (
    <div className="aspect-[9/16] overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
      <video
        src={`${reel.videoUrl}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
  return (
    <div>
      {reel.permalink ? (
        <a
          href={reel.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-opacity hover:opacity-90"
        >
          {frame}
        </a>
      ) : (
        frame
      )}
      {caption ? <p className="mt-3 text-sm font-medium">{caption}</p> : null}
      {numbers ? <p className="mt-1 text-xs text-foreground/50">{numbers}</p> : null}
    </div>
  );
}

export function ExamplesGallery({ reels }: { reels: Reel[] }) {
  return (
    <section id="examples" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">Примеры</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-balance md:text-5xl">
          Ролики, которые завод уже выпустил
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-foreground/70">
          Живая лента: цифры обновляются раз в шесть часов из эфира.
        </p>

        {reels.length ? (
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3">
            {reels.map((reel) => (
              <Tile key={reel.mediaId} reel={reel} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-foreground/50">
            Примеры подтянутся из эфира, когда страница соединится с машиной.
          </p>
        )}
      </div>
    </section>
  );
}
