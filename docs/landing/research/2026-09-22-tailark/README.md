# Tailark как источник блоков витрины — срез 2026-09-22

Неизменный срез. Вопрос владельца: «попробуй собрать набор из вот этой
штуковины — предложи компоненты отсюда на весь лендос». Источники —
tailark.com, oss.tailark.com (реестр и превью), прочитаны 22.09.2026.

## Что это

Реестр блоков для маркетинговых сайтов от Méschac Irung — того же
автора, чьи блоки «проблема», «что внутри» и «призыв» стояли в списке
кандидатов с 21st.dev. Три бесплатных набора (kit) — Mist, Dusk, Veil —
лежат в открытом реестре `@tailark-oss` без ключа и без лимита; платные
наборы (Quartz, иллюстрации, страницы) — разовая покупка $249–499, не
подписка ([pricing](https://tailark.com/pricing)).

## Как ставится

`components.json` завода получает реестр
`"@tailark-oss": "https://oss.tailark.com/r/{name}.json"` (вариант
Base UI — совпадает с пресетом `base-nova` завода; для Radix есть
`/r/radix/{name}.json`), дальше блок ставится
`npx shadcn@latest add @tailark-oss/<name>`. Превью любого блока —
`https://oss.tailark.com/view/<name>?theme=light`.

## Наборы глазами (превью 22.09)

- **Mist** — светлый, без засечек, Inter-подобный, синие кнопки; ближе
  всего к собранному герою завода.
- **Dusk** — по коду живёт на токенах темы, но задуман под тёмный
  экран: превью тёмное, часть блоков несёт жёстко светлые вставки.
- **Veil** — кремовый фон, заголовки с засечками; другой голос.

## Все 96 блоков по коду (разбор claude-opus-5, 22.09)

Строка: имя — раскладка · deps · dark-only · строк кода.

## content

- `dusk-content-1` — одна колонка: широкая картинка 16:9 сверху (grayscale, unsplash), под ней две колонки — заголовок слева, два абзаца + кнопка-ссылка справа; иконок нет · deps: @tailark-oss/dusk-button, lucide-react, next/image, next/link · dark-only: нет · размер: 44
- `dusk-content-2` — две колонки: заголовок слева, справа абзац + сетка 2 пункта с иконками (Zap, Cpu); картинки и кнопки нет · deps: @tailark-oss/dusk-button (Button импортирован, но не используется), lucide-react · dark-only: нет · размер: 35
- `dusk-content-3` — заголовок на всю ширину, ниже 3 колонки: скрин приложения в рамке с тенью на 2 колонки слева, справа абзац + 2 пункта с иконками; кнопки нет · deps: lucide-react, next/image (локальный /mail2.png) · dark-only: нет · размер: 50
- `dusk-content-4` — две колонки: заголовок слева, справа два абзаца + список из 4 пунктов с иконками, разделённых линиями; картинки и кнопки нет · deps: lucide-react · dark-only: нет · размер: 49
- `mist-content-1` — секция на сером фоне (bg-muted/50): заголовок + два ряда по 5 колонок с разделителями, в каждом иллюстрация (список-маска / фейковый тулбар с кнопкой и ToggleGroup) и текстовый блок; чередование сторон · deps: @tailark-oss/mist-button, @tailark-oss/mist-toggle-group, lucide-react · dark-only: нет · размер: 125
- `mist-content-2` — то же, что mist-content-1, но без вертикальных разделителей между колонками и иллюстрация второго ряда слева · deps: @tailark-oss/mist-button, @tailark-oss/mist-toggle-group, lucide-react · dark-only: нет · размер: 126
- `mist-content-3` — одна узкая колонка: эмодзи + заголовок + абзац, под ними скрин приложения в рамке поверх фоновой фото-подложки; кнопки нет · deps: next/image (unsplash + локальный /mist/tailark-3.png) · dark-only: нет · размер: 37
- `mist-content-4` — одна колонка: заголовок + абзац, сетка 3 карточки с эмодзи, ниже список 4 цифр-строк со стрелками; кнопки нет · deps: lucide-react · dark-only: нет · размер: 58
- `veil-content-1` — две колонки: заголовок (serif) слева, справа 3 абзаца с жирным лид-словом; ни иконок, ни картинки, ни кнопки · deps: нет · dark-only: нет · размер: 23
- `veil-content-2` — заголовок сверху, под ним 2 колонки-абзаца с верхней линией; без иконок, картинки и кнопки · deps: нет · dark-only: нет · размер: 19
- `veil-content-3` — заголовок + абзац, ниже сетка 2/3 колонки: 3 пункта с иконкой и верхней линией; кнопки нет · deps: lucide-react · dark-only: нет · размер: 36

## features

- `dusk-features-1` — заголовок + бенто из 2 карточек (узкая 1 кол. + широкая 2 кол., внутри абстрактные плашки-заглушки без фото), ниже строка из 4 пунктов с иконками; кнопки нет · deps: @tailark-oss/dusk-card, lucide-react · dark-only: нет · размер: 74
- `dusk-features-2` — заголовок + бенто из 3 карточек в ряд (в каждой текст и абстрактная плашка-заглушка), ниже строка из 4 пунктов с иконками; кнопки нет · deps: @tailark-oss/dusk-card, lucide-react · dark-only: нет · размер: 97
- `dusk-features-3` — заголовок + 3 колонки: в каждой карточка 9:12 с медиа (фото unsplash / фейковый UI / видео pexels) и подписью-абзацем под ней; кнопка только декоративная внутри иллюстрации · deps: @tailark-oss/dusk-card, @tailark-oss/dusk-button, lucide-react, next/image, внешнее видео · dark-only: нет (но вторая карточка жёстко светлая: bg-zinc-200, white/black внутри) · размер: 176
- `dusk-features-4` — заголовок + 2 карточки (широкая 2 кол. с фоновым фото, узкая 1 кол. на bg-zinc-100 с фейковым UI-виджетом); текст в каждой, кнопок нет · deps: @tailark-oss/dusk-card, next/image · dark-only: нет (правая карточка зафиксирована светлой) · размер: 89
- `dusk-features-5` — интерактив: слева липкое меню из 4 кнопок-вкладок, справа 4 секции подряд, у каждой 2/5 текст + список из 3 пунктов с иконками и 3/5 квадрат с иллюстрацией; IntersectionObserver подсвечивает активный пункт · deps: @tailark-oss/dusk-button, lucide-react, next/image, react hooks ('use client') · dark-only: нет (картинка /payments.png показывается только в dark: hidden…dark:block; последняя иллюстрация светлая bg-zinc-100) · размер: 297
- `dusk-features-6` — заголовок, под ним широкий двухслойный скрин приложения с маской, ниже строка из 4 пунктов с иконками; кнопки нет · deps: lucide-react, next/image (/mail-upper.png, /mail-back.png) · dark-only: нет · размер: 62
- `dusk-features-7` — большая рамка-бенто: слева текст + точечная карта мира с плашкой, справа текст + фейковое окно, во всю ширину строка «99.99% Uptime», внизу area-график recharts с тултипом · deps: @tailark-oss/dusk-chart, dotted-map, recharts ('use client') · dark-only: нет (плашка карты bg-zinc-900/75 жёстко тёмная) · размер: 206
- `mist-features-1` — на сером фоне: заголовок + абзац, широкая таблица в рамке, ниже 2 колонки с текстом и карточками-заглушками 16:9, в конце цитата с автором · deps: @tailark-oss/mist-card, @tailark-oss/mist-features-1-table (таблица отдельным компонентом) · dark-only: нет · размер: 55
- `mist-features-2` — на сером фоне: заголовок + абзац, сетка из 3 колонок, в каждой карточка-заглушка 16:9 и текст под ней; иконок и кнопок нет · deps: @tailark-oss/mist-card · dark-only: нет · размер: 54
- `mist-features-3` — заголовок + абзац, 2 карточки (variant soft) с иллюстрацией 16:9 внутри (список-маска и фейковый тулбар с кнопкой и ToggleGroup) и центрированным текстом · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, @tailark-oss/mist-toggle-group, lucide-react · dark-only: нет · размер: 134
- `mist-features-4` — то же, что mist-features-3, но секция на сером фоне и карточки обычные (не soft), иллюстрация тулбара в варианте mixed · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, @tailark-oss/mist-toggle-group, lucide-react · dark-only: нет · размер: 131
- `mist-features-5` — на сером фоне: 5 колонок — слева (2) заголовок и кнопка-ссылка, справа (3) 2 пункта с иконками; под ними широкий скрин приложения в рамке · deps: @tailark-oss/mist-button, lucide-react, next/image (/mist/tailark-2.png), next/link · dark-only: нет · размер: 60
- `mist-features-6` — заголовок + сетка 3 карточки, в каждой иконка, заголовок, абзац и своя фейковая иллюстрация (карточка встречи с 4 аватарами, карточка ревью, поле AI-ассистента) · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, lucide-react, next/image (аватары GitHub) · dark-only: нет (одна кнопка внутри жёстко bg-black) · размер: 182
- `mist-features-7` — бенто: широкая карточка на всю ширину со скрином приложения + 3 карточки в ряд с иконками и фейковыми иллюстрациями; общего заголовка секции нет · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, lucide-react, next/image · dark-only: нет · размер: 198
- `mist-features-8` — бенто без иллюстраций: широкая карточка со скрином приложения + 3 простые карточки с иконкой, заголовком и абзацем · deps: @tailark-oss/mist-card, lucide-react, next/image (/mist/tailark-3.png) · dark-only: нет · размер: 60
- `mist-features-9` — узкая колонка: центрированный заголовок и 3 ряда по 5 колонок — карточка с иллюстрацией (2) слева, текст (3) справа · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, lucide-react, next/image · dark-only: нет · размер: 191
- `mist-features-10` — заголовок, ниже сетка 2 колонки: широкая карточка с иллюстрацией AI-ассистента на всю ширину и 2 карточки-колонки с иллюстрациями и текстом под ними · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, lucide-react, next/image · dark-only: нет · размер: 194
- `mist-features-11` — заголовок, широкая карточка с фоновым фото и карточкой AI-ассистента (внутри список 3 цифр с эмодзи), ниже сетка 3 текстовых пункта без иконок · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, lucide-react, next/image (unsplash) · dark-only: нет · размер: 110
- `veil-features-1` — заголовок + абзац, бенто 2×2 из 4 карточек (variant outline) с чисто CSS-иллюстрациями: логотипы 6 сервисов на линиях, круги синхронизации, штрихи, щит; кнопок и фото нет · deps: @tailark-oss/veil-card + 6 core-SVG (clerk, firebase, linear, slack, supabase, vercel), lucide-react · dark-only: нет · размер: 146
- `veil-features-2` — полная копия veil-features-1, отличие одно: карточки в варианте mixed вместо outline · deps: те же (@tailark-oss/veil-card + 6 core-SVG, lucide-react) · dark-only: нет · размер: 146
- `veil-features-3` — интерактив на 2 колонки: слева заголовок, абзац, кнопка-ссылка и список из 4 кнопок-переключателей с иконками, справа панель с CSS-иллюстрацией, меняющейся по выбору · deps: @tailark-oss/veil-button + 6 core-SVG, lucide-react, next/link, useState ('use client') · dark-only: нет (панель имеет отдельные not-dark: и dark: варианты) · размер: 203

## stats

- `dusk-stats-1` — две колонки: заголовок слева, справа абзац и ряд из 3 цифр с верхней линией; картинок, иконок и кнопок нет · deps: нет · dark-only: нет · размер: 31
- `dusk-stats-2` — крупный абзац-заголовок на всю ширину, ниже ряд из 3 цифр с верхней линией; без иконок и кнопок · deps: нет · dark-only: нет · размер: 26
- `mist-stats-1` — на сером фоне одна карточка, разделённая на 3 колонки с цифрой и подписью по центру; без заголовка, иконок и кнопок · deps: @tailark-oss/mist-card · dark-only: нет · размер: 24
- `mist-stats-2` — на сером фоне: заголовок + абзац, ниже сетка 4 цифры (2 кол. на мобиле, 4 на десктопе); без иконок и кнопок · deps: нет · dark-only: нет · размер: 32
- `mist-stats-3` — одна колонка: заголовок + абзац, ниже список из 4 строк со стрелкой-иконкой и цифрой; без кнопок · deps: lucide-react · dark-only: нет · размер: 35
- `mist-stats-4` — сетка 4 колонки: 2 цифры с подписями и широкий блок-абзац на 2 колонки справа; заголовок скрыт (sr-only), без иконок и кнопок · deps: нет · dark-only: нет · размер: 24
- `veil-stats-1` — заголовок + абзац, ниже сетка из 3 цифр-фраз с линиями сверху и снизу; без картинок, иконок и кнопок · deps: нет · dark-only: нет · размер: 31
- `veil-stats-2` — как veil-stats-1 (3 цифры-фразы), плюс под ними декоративная CSS-гистограмма из 48 столбиков-линий · deps: нет (только react CSSProperties) · dark-only: нет · размер: 51
- `veil-stats-3` — заголовок + абзац, 3 цифры-фразы с верхней линией, под ними широкая картинка глобуса с маской и blend-подсветкой · deps: next/image (unsplash) · dark-only: нет (у картинки dark:invert и dark:opacity-50) · размер: 43
- `veil-stats-4` — две колонки: слева заголовок, абзац и 3 цифры-фразы столбиком, справа/снизу картинка глобуса с маской; кнопок нет · deps: next/image (unsplash) · dark-only: нет · размер: 48

## pricing

- `dusk-pricing-1` — заголовок слева, ниже общая рамка с 4 тарифами в ряд (разделители-бордеры): название, подпись, цена, кнопка-ссылка, список фич с галочками (3/10/6/4); выделенный тариф — фоном bg-card · deps: @tailark-oss/dusk-button, lucide-react, next/link · dark-only: нет · размер: 138
- `dusk-pricing-2` — то же устройство, но 3 тарифа в общей рамке, у среднего бейдж «Popular» (зелёный) и тень; у каждого кнопка-ссылка и список фич с галочками (3/10/10) · deps: @tailark-oss/dusk-button, lucide-react, next/link · dark-only: нет (бейдж зафиксирован в зелёных тонах text-emerald-200) · размер: 109
- `mist-pricing-1` — на сером фоне: центрированный заголовок + абзац, одна карточка в 2 колонки — слева цена и кнопка, справа список 4 фич с галочками и 3 логотипа компаний · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, core-SVG spotify/supabase/vercel, lucide-react · dark-only: нет · размер: 69
- `mist-pricing-2` — на сером фоне: центрированный заголовок + абзац, одна карточка, внутри 3 колонки-тарифа, средний приподнят рамкой и тенью; у каждого цена, кнопка и список фич с галочками (3/10/3) · deps: @tailark-oss/mist-button, @tailark-oss/mist-card, lucide-react · dark-only: нет · размер: 124
- `veil-pricing-1` — центрированный заголовок + абзац, 3 карточки данными из массива: сетка 2 колонки, третья карточка на всю ширину; в каждой цена, список фич с галочками (4/6/6), кнопка-ссылка; выделенный тариф — кольцом ring-primary · deps: @tailark-oss/veil-button, @tailark-oss/veil-card, lucide-react, next/link · dark-only: нет · размер: 83
- `veil-pricing-2` — центрированный заголовок + абзац, 4 тарифа строками-карточками (название и лимит слева, цена и кнопка со стрелкой справа), внизу серая плашка-врезка; списков фич нет · deps: @tailark-oss/veil-button, @tailark-oss/veil-card, lucide-react, next/link · dark-only: нет · размер: 91
- `veil-pricing-3` — центрированный заголовок + абзац, 2 карточки-тарифа в ряд (месяц/год), в каждой цена, 3 фичи с галочками и кнопка со стрелкой; под сеткой строка-сноска · deps: @tailark-oss/veil-button, @tailark-oss/veil-card, lucide-react, next/link · dark-only: нет · размер: 78

## testimonials

- `dusk-testimonials-1` — заголовок, ниже 2 крупные плитки-отзыва: слева на 3 колонки светлая плитка с фоновым видео, цитатой, логотипом, автором и круглой кнопкой play; справа на 2 колонки плитка на зелёном фоне с цитатой и автором · deps: @tailark-oss/dusk-button, core-SVG openai/gemini, lucide-react, внешнее видео pexels · dark-only: нет (левая плитка жёстко светлая bg-stone-100 + text-black, правая — жёстко зелёная bg-emerald-600) · размер: 63
- `dusk-testimonials-2` — карусель: две кнопки-стрелки сверху, ниже один крупный отзыв с подсвеченной фразой, логотипом компании и автором; переключение через useState + анимация · deps: @tailark-oss/dusk-button, core-SVG claude-ai/gemini/openai, motion/react (импорт есть, в dependencies не объявлен), 'use client' · dark-only: нет · размер: 132
- `mist-testimonials-1` — одна цитата с цветной вертикальной линией слева, под ней имя и роль; ни аватара, ни картинки, ни кнопки · deps: нет · dark-only: нет · размер: 21
- `mist-testimonials-2` — на сером фоне: заголовок + абзац, сетка 3 отзыва-«пузыря» в рамке, под каждым аватар, имя и роль; кнопок нет · deps: next/image (аватары GitHub) · dark-only: нет · размер: 63
- `mist-testimonials-3` — сетка 3 отзыва без заголовка секции: в каждом ряд из 5 звёзд (закрашено по рейтингу), текст, аватар, имя и роль · deps: lucide-react (Star), next/image · dark-only: нет · размер: 70
- `mist-testimonials-4` — одна цитата с цветной линией слева, в подписи аватар, имя и роль; кнопок нет · deps: next/image · dark-only: нет · размер: 32
- `mist-testimonials-5` — на сером фоне одна центрированная цитата: иконка кавычки сверху, текст, квадратный аватар, имя и ник; кнопок нет · deps: lucide-react (Quote), next/image · dark-only: нет · размер: 32
- `veil-testimonials-1` — заголовок + абзац, сетка 2 колонки из 4 карточек-отзывов: сверху маленький аватар с именем и ролью, под ними текст · deps: @tailark-oss/veil-card НЕ указан в registryDependencies, хотя Card импортируется (баг элемента); next/image · dark-only: нет · размер: 68
- `veil-testimonials-2` — то же, но в карточке аватар слева, справа столбиком крупная цитата, имя и роль · deps: @tailark-oss/veil-card, next/image · dark-only: нет · размер: 69
- `veil-testimonials-3` — одна цитата с цветной вертикальной линией слева, под ней круглый аватар, имя и роль; заголовка секции и кнопок нет · deps: next/image · dark-only: нет · размер: 30
- `veil-testimonials-4` — одна центрированная цитата, под ней аватар, имя и роль столбиком; ни заголовка, ни кнопки · deps: next/image · dark-only: нет · размер: 29

## faqs

- `dusk-faqs-1` — две колонки: заголовок слева, справа аккордеон из 5 вопросов (пунктирные разделители) и строка со ссылкой на поддержку · deps: @tailark-oss/dusk-accordion, next/link, 'use client' · dark-only: нет · размер: 71
- `mist-faqs-1` — на сером фоне одна колонка: заголовок + абзац, аккордеон из 5 вопросов внутри белой карточки с тенью, ниже строка со ссылкой · deps: @tailark-oss/mist-accordion, next/link, 'use client' · dark-only: нет · размер: 76
- `mist-faqs-2` — 5 колонок: слева (2) заголовок, подпись и ссылка на поддержку, справа (3) аккордеон из 5 вопросов; на мобиле ссылка уезжает вниз · deps: @tailark-oss/mist-accordion, next/link, 'use client' · dark-only: нет · размер: 85
- `mist-faqs-3` — узкая колонка: центрированный заголовок, аккордеон из 5 вопросов, каждый — плашка с подсветкой фона при раскрытии и линией-разделителем; внизу ссылка · deps: @tailark-oss/mist-accordion, next/link, 'use client' · dark-only: нет · размер: 78
- `veil-faqs-1` — центрированный заголовок + абзац, аккордеон из 5 вопросов внутри карточки outline, под ним строка со ссылкой · deps: @tailark-oss/veil-card, @shadcn/accordion, next/link, 'use client' · dark-only: нет · размер: 74
- `veil-faqs-2` — две колонки: слева липкий блок с заголовком, подписью и ссылкой, справа аккордеон из 5 вопросов с пунктирными разделителями · deps: @shadcn/accordion, next/link, 'use client' · dark-only: нет · размер: 81
- `veil-faqs-3` — узкая колонка: центрированный заголовок, аккордеон из 5 вопросов-плашек с подсветкой при раскрытии, внизу ссылка · deps: @shadcn/accordion, next/link, 'use client' · dark-only: нет · размер: 70
- `veil-faqs-4` — без аккордеона: центрированный заголовок + абзац, сетка 2 колонки из 6 карточек «вопрос-ответ», внизу ссылка · deps: @tailark-oss/veil-card, next/link · dark-only: нет · размер: 63
- `veil-faqs-5` — центрированный заголовок + абзац, 3 карточки-раздела с иконкой и заголовком, внутри каждой аккордеон на 2 вопроса; внизу ссылка · deps: @tailark-oss/veil-card, @shadcn/accordion, lucide-react, next/link, 'use client' · dark-only: нет · размер: 107

## call-to-action

- `dusk-call-to-action-1` — одна центрированная колонка: крупный заголовок и 2 кнопки-ссылки в ряд; ни абзаца, ни картинки, ни иконок · deps: @tailark-oss/dusk-button, next/link · dark-only: нет · размер: 29
- `dusk-call-to-action-2` — строка: крупный заголовок слева, одна кнопка-ссылка справа (на мобиле столбиком по центру) · deps: @tailark-oss/dusk-button, next/link · dark-only: нет · размер: 20
- `mist-call-to-action-1` — центрированный заголовок и 2 кнопки-ссылки в ряд; абзаца и картинки нет · deps: @tailark-oss/mist-button, next/link · dark-only: нет · размер: 29
- `mist-call-to-action-2` — строка: заголовок слева, 2 кнопки-ссылки справа · deps: @tailark-oss/mist-button, next/link · dark-only: нет · размер: 31
- `mist-call-to-action-3` — на сером фоне слева: заголовок в две краски, абзац и 2 кнопки с иконками (стрелка и календарь) · deps: @tailark-oss/mist-button, lucide-react, next/link · dark-only: нет · размер: 47
- `veil-call-to-action-1` — центрированный блок: заголовок (serif), абзац и 2 кнопки-ссылки, у первой иконка-стрелка · deps: @tailark-oss/veil-button, lucide-react, next/link · dark-only: нет · размер: 33
- `veil-call-to-action-2` — одна карточка outline: надпись-бейдж «Limited Time Offer», заголовок, абзац и одна кнопка со стрелкой; текст по левому краю · deps: @tailark-oss/veil-button, @tailark-oss/veil-card, lucide-react, next/link · dark-only: нет · размер: 31
- `veil-call-to-action-3` — подписка: заголовок и абзац, ниже форма — поле email с иконкой конверта и кнопка-ссылка рядом · deps: @tailark-oss/veil-button, lucide-react, next/link · dark-only: нет · размер: 40
- `veil-call-to-action-4` — карточка в 2 колонки: слева заголовок, абзац и список 4 выгод с галочками, справа блок с ценой и кнопкой со стрелкой · deps: @tailark-oss/veil-button, @tailark-oss/veil-card, lucide-react, next/link · dark-only: нет · размер: 52

## footer

- `dusk-footer-1` — сетка 5 колонок: логотип слева, 3 колонки ссылок (по 4-5 пунктов) + колонка «сообщество» (4 ссылки), в последней форма подписки (label + поле email + кнопка Subscribe); внизу копирайт · deps: @tailark-oss/dusk-logo, dusk-button, dusk-input, dusk-label · dark-only: нет · размер: 124
- `dusk-footer-2` — сетка 6 колонок: логотип + 3 группы ссылок, внизу через линию строка с 4 круглыми кнопками-логотипами (gemini, claude, openai) и копирайтом · deps: @tailark-oss/dusk-logo, dusk-button, core-SVG gemini/claude-ai/openai · dark-only: нет · размер: 134
- `mist-footer-1` — на сером фоне всё по центру: логотип, ряд из 6 ссылок, ряд из 6 соцсетевых иконок (инлайновые svg), копирайт · deps: @tailark-oss/mist-logo (иконки соцсетей — инлайн svg) · dark-only: нет · размер: 185
- `mist-footer-2` — сетка 5 колонок: логотип и подпись слева, 3 группы ссылок (Product/Company/Legal, по 4-6 пунктов) справа; внизу через линию 6 соцсетевых иконок и копирайт · deps: @tailark-oss/mist-logo · dark-only: нет · размер: 254
- `mist-footer-3` — сетка 5 колонок: логотип и 2 соцсетевые иконки слева, справа 3 группы ссылок; внизу копирайт · deps: @tailark-oss/mist-logo · dark-only: нет · размер: 125
- `mist-footer-4` — одна строка: логотип и копирайт слева, ряд из 6 ссылок справа; соцсетей и формы нет · deps: @tailark-oss/mist-logo · dark-only: нет · размер: 61
- `veil-footer-1` — сетка 3 колонки: логотип с подписью, 3 списка ссылок (product/company/resources по 4 пункта); внизу через линию ряд из 3 правовых ссылок и копирайт · deps: @tailark-oss/veil-logo · dark-only: нет · размер: 107
- `veil-footer-2` — всё по центру: логотип, ряд из 5 ссылок, ряд из 3 иконок соцсетей (lucide), копирайт · deps: @tailark-oss/veil-logo, lucide-react · dark-only: нет · размер: 58
- `veil-footer-3` — строка: логотип слева, ряд из 6 ссылок справа; ниже через линию правовые ссылки и копирайт; иконок соцсетей нет · deps: @tailark-oss/veil-logo · dark-only: нет · размер: 64
- `veil-footer-4` — две зоны: слева логотип с подписью и 3 иконки соцсетей, справа ряд из 6 ссылок; внизу копирайт · deps: @tailark-oss/veil-logo, lucide-react · dark-only: нет · размер: 65
- `veil-footer-5` — узкий столбик: иконка-логотип, ряд из 5 ссылок, переключатель темы, копирайт через линию · deps: @tailark-oss/veil-logo, @tailark-oss/veil-footer-5-theme-switcher · dark-only: нет (в футере живёт сам переключатель светлой/тёмной темы) · размер: 47
- `veil-footer-6` — узкий столбик: иконка-логотип, 3 ссылки столбиком, внизу строка с переключателем темы и блоком соцсетей отдельным компонентом · deps: @tailark-oss/veil-logo, veil-footer-6-theme-switcher, veil-footer-6-social-medias · dark-only: нет · размер: 49

## integrations

- `dusk-integrations-1` — две колонки: слева заголовок, абзац, кнопка-ссылка и нижняя подпись; справа карточка с сеткой 2×3 из 6 плиток-интеграций (логотип, название, описание) под маской · deps: @tailark-oss/dusk-button + 6 core-SVG (gemini, replit, magic-ui, vs-codium, media-wiki, google-palm), next/link · dark-only: нет · размер: 83
- `mist-integrations-1` — одна строка-полоска: подпись «Integrate with:» и ряд из 6 логотипов с разделителями; ни заголовка, ни кнопки · deps: 6 core-SVG (gemini, google-palm, magic-ui, media-wiki, replit, vs-codium) · dark-only: нет · размер: 38
- `mist-integrations-2` — центрированный блок: заголовок, лента из 6 логотипов в плитках-квадратах и кнопка-ссылка «More Integrations» · deps: @tailark-oss/mist-button + 6 core-SVG, next/link · dark-only: нет · размер: 45
- `mist-integrations-3` — заголовок + абзац слева, ниже сетка 3 колонки из 6 карточек-интеграций (логотип, название, описание); кнопки нет · deps: @tailark-oss/mist-card + 6 core-SVG · dark-only: нет · размер: 85
- `veil-integrations-1` — сверху CSS-схема: 3 горизонтальные линии с 6 логотипами-пилюлями и своим логотипом в центре, под ней центрированный заголовок, абзац и кнопка-ссылка · deps: @tailark-oss/veil-button, veil-logo + 6 core-SVG (clerk, firebase, linear, slack, supabase, vercel), lucide-react, next/link · dark-only: нет · размер: 84
- `veil-integrations-2` — то же, но схема круговая: свой логотип в центре, 6 логотипов на пунктирных орбитах; под ней заголовок, абзац и кнопка-ссылка · deps: те же (@tailark-oss/veil-button, veil-logo, 6 core-SVG, lucide-react, next/link) · dark-only: нет · размер: 80

## Что важно по итогу разбора

- Жёстко тёмных блоков нет: все три набора живут на токенах темы.
  Обратное есть у Dusk: `dusk-features-3/4/5`, `dusk-testimonials-1`
  несут зафиксированные светлые куски.
- Внешние npm-зависимости только у `dusk-features-7` (dotted-map,
  recharts) и `dusk-testimonials-2` (motion, в метаданных не объявлен).
  Остальное — внутренние компоненты реестра, lucide-react, next/image.
- Дефекты метаданных: у `veil-testimonials-1` не указан `veil-card`;
  у `dusk-testimonials-2` не указан motion.
- Локальные картинки в public нужны блокам dusk (`/mail*.png`,
  `/payments.png`) и mist (`/mist/tailark-2.png`, `/mist/tailark-3.png`).

## Не найдено

- Лицензия бесплатных наборов как класса: на странице цен только
  «Lifetime Access» у Free; смотреть LICENSE в реестре при первой
  установке.
- Блока «один абзац без карточек» под полку «проблема» нет ни в одном
  наборе; ближайшие — `veil-content-2` и верх `mist-content-4`.
