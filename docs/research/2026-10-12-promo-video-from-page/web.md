# Промо-ролик из страницы: интернет · 2026-10-12 · opus

Сырьё разведчика угла «интернет в целом» (блоги, GitHub, доки, HN, Reddit).
Окно сбора: поиск + официальные страницы и репозитории, 2026-10-12 (все
ссылки открыты в этот день, если не сказано иное). X — у соседнего
разведчика (`x.md` в этой же папке), сюда X попадает только попутно.
Метки донора: **топ мира · сильный нишевик · малыш**. Классы источников:
[офиц] — сайт/доки/репо вендора · [пресса] · [практики] — блоги, форумы.

Целевая страница — https://vibecoding.tech/services (снята curl 12.10):
hero «Agentic engineering. AI agents write the code, directed by an
engineer»; 7 карточек-кейсов (очередь задач со статусами Done/In
progress/Queued, два Slack-треда «Slack · marketing» и «Slack · site
outages», дорожная карта «Prototype 48 hours → First version week 2 →
Login and payment week 3 → Launch», «Launch materials · Video voiceover
0:30», мини-админка «Admin · leads by day 34 today», файл «How your code
works.md»); «First prototype in 48 hours» в три шага (Today / Same day /
In 48 hours); таблица In-house · Contractor · Subscription по шести
строкам; блок «86 tasks shipped a week» против «20–60» у команды из
десяти и «13 people» против «1 person»; цены «$2,995 per month» и
«$5,995 per month», «2 spots open»; бегущая лента задач (code · images ·
copy · video · audio); FAQ.

---

## 1. Remotion + Claude Code

### Что есть у Remotion для агентов (офиц)

| факт | источник |
| --- | --- |
| Agent Skills ставятся `npx skills add remotion-dev/skills`; в новом проекте — через `bun create video`. Скиллы: `/remotion-best-practices` («encompasses all other skills»), `/remotion-create`, `/remotion-markup`, `/remotion-studio`, `/remotion-render`, `/remotion-maps`, `/remotion-captions`, `/remotion-saas`, `/remotion-interactivity`, `/remotion-docs`, `/remotion-upgrade`, `/remotion-multimedia` | [remotion.dev/docs/ai/skills](https://www.remotion.dev/docs/ai/skills) [офиц] |
| Плагин Claude Code: `claude plugin marketplace add remotion-dev/claude-code-plugin` → `claude plugin install remotion@remotion`, вызов `/remotion:remotion-create <описание>` (пример в доке — «Make a promo video for a record store») | [remotion.dev/docs/ai/claude-code-plugin](https://remotion.dev/docs/ai/claude-code-plugin) [офиц] |
| Такие же плагины — для Codex, Cursor, Copilot, Kimi Code; плюс MCP, WebMCP, шаблон AI-SaaS, «dynamic compilation» | sitemap remotion.dev, разделы `/docs/ai/*` [офиц] |
| Доки отдаются агенту markdown'ом: `.md` к любому адресу или заголовок `Accept: text/markdown` | [remotion.dev/docs/ai.md](https://www.remotion.dev/docs/ai.md) [офиц] |
| Скиллы вышли в начале января 2026; «28+ modular rule files» | [startuphub.ai](https://www.startuphub.ai/ai-news/general/2026/remotion-ai-video-makes-production-code-from-plain-prompts) [пресса], число файлов — не сверено с репо |
| Галерея промптов `remotion.dev/prompts`: на 12.10 — около 30 записей с полным текстом промпта, инструментом и моделью | [remotion.dev/prompts](https://www.remotion.dev/prompts) [офиц] |

### Живые примеры «промо продукта» из галереи Remotion (промпты дословно, видео на страницах)

- **Product Demo for Presscut** — @Shpigford (Josh Pigford, основатель
  Baremetrics) · Claude Code · Opus 4.5 · «8 months ago» → около
  февраля 2026. Ключ промпта: «Use react componenents to replicate UI
  elements and replicate the UI of the app as closely as possible… take
  guidance from the marketing home page/index for what to highlight…
  Really grill me with questions to nail down exactly how the final video
  should look/feel». То есть интерфейс **перерисован React-компонентами**,
  а не снят экраном; агент сначала допрашивает автора.
  [remotion.dev/prompts/product-demo-for-presscut](https://www.remotion.dev/prompts/product-demo-for-presscut) · **сильный нишевик**.
- **Cursor Agent Skills Announcement** — @edwinarbus (Cursor) · Cursor ·
  ~февраль 2026. Титры «печатной машинкой» по символу на кадр, потом
  **настоящая запись экрана** на весь кадр с плавным наездом «zoom in
  (with easing) to the top-left by about 125%», финальная карточка
  «This video was made entirely in Cursor with Remotion skills» и готовая
  концовка `end.mp4`; бренд-правила лежали в Cursor rule.
  [remotion.dev/prompts/cursor-agent-skills-announcement](https://www.remotion.dev/prompts/cursor-agent-skills-announcement) · **топ мира** (Cursor).
- **Launch Video on X** — @ghumare64 · Claude Code · Opus 4.6 · 1080×700,
  30 fps, ~37 с, 8 сцен, тёмная тема `#0c0a09` + янтарь `#fbbf24`, шрифты
  Inter и SF Mono, «spring animations with fade/scale transitions», музыка
  «Walen – HEADPHONK» на 40 % с затуханиями 1 с / 2 с.
  [remotion.dev/prompts/launch-video-on-x](https://www.remotion.dev/prompts/launch-video-on-x) · **малыш**.
- **Promotion video for VVTerm** — @wiedymi · Claude Code · Opus 4.5:
  весь промпт — «Make a promotion video in Apple presentation style for
  VVTerm. Check its website VVTerm.com for details and assets like logo.
  Use nerd fonts and inter. Make it around 20 seconds.» — агент сам ходит
  на сайт за текстами и логотипом.
  [remotion.dev/prompts/promotion-video-for-vvterm](https://www.remotion.dev/prompts/promotion-video-for-vvterm) · **малыш**.
- **Apple-Style Device Rise Animation** — @gaucho_booleano · Claude Code ·
  Opus 4.5: огромный iPhone поднимается снизу с наклоном 35°→8°, масштаб
  0.8→1.0 за 1.5 с, `Easing.out(Easing.cubic)`, потом уведомления
  выезжают сверху с шагом 0.3 с. Готовый рецепт «приезда устройства».
  [remotion.dev/prompts/apple-style-device-rise-animation](https://www.remotion.dev/prompts/apple-style-device-rise-animation) · **малыш**.
- **The Kinetic Marketing** — кинетическая типографика под 140 BPM,
  «new words crash in and physically push existing text aside», переходы
  «Blue Iris Wipes and Ring Tunnels».
  [remotion.dev/prompts/the-kinetic-marketing](https://www.remotion.dev/prompts/the-kinetic-marketing) · **малыш**.
- **HTML-in-canvas magnifying glass** — Claude Code · Opus 4.7 xhigh,
  «use remotion best practices, especially html in canvas»: у Remotion
  есть режим, где живой HTML рисуется в canvas и к нему применимы
  эффекты (линза, глитч, «винтажный экран» — ещё два промпта в галерее).
  [remotion.dev/prompts/html-in-canvas-magnifying-glass](https://www.remotion.dev/prompts/html-in-canvas-magnifying-glass) · **малыш**.

### Лицензия Remotion (офиц, дословно)

- LICENSE.md в репо: бесплатно, если вы «an individual», «a for-profit
  organization with up to 3 employees», некоммерческая организация или
  на этапе оценки. Коммерческое использование для создания видео
  разрешено. [github.com/remotion-dev/remotion/LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) [офиц]
- FAQ: «Even if you are incorporated, you can operate under the Free
  License, as long as your total headcount is 3 or less.» Агентство,
  отдающее клиенту только MP4, считает лишь свою численность.
  [remotion.dev/docs/license/faq](https://www.remotion.dev/docs/license/faq) [офиц]
- Платно (remotion.pro/license): «Remotion for Creators — $25/mo per
  seat» · «Remotion for Automators — $0.01 per render, $100/mo minimum» ·
  «Enterprise License — Starting at $500 per month».
  [remotion.pro/license](https://www.remotion.pro/license) [офиц]
- Remotion 5.0 (черновик PR #3750, не влит на 12.10): «Contractors also
  count towards team size». [github.com/remotion-dev/remotion/pull/3750](https://github.com/remotion-dev/remotion/pull/3750) [офиц]
- Lambda: рендер Hello World — «$0.001, 7.56sec» тёплый.
  [remotion.dev/docs/lambda/cost-example](https://www.remotion.dev/docs/lambda/cost-example) [офиц]
- **Для нас:** владелец + агенты = 1 человек → бесплатная лицензия; Lambda
  не нужна, рендер 30–60 с локально на Pro.

---

## 2. HTML-нативные движки для агентов

### HyperFrames (HeyGen) — прямое попадание в задачу

| факт | источник |
| --- | --- |
| Репо `heygen-com/hyperframes`: «Write HTML. Render video. Built for agents.»; **60 954 звезды**, Apache-2.0, создан 2026-03-10, последний push 2026-10-11 | [api.github.com/repos/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) [офиц] |
| Лицензия: «Apache 2.0 license, with no per-render fees or commercial-use thresholds» | README репо [офиц] |
| Ролик = обычный HTML с `data-start`/`data-duration`/`data-track-index`; движение — GSAP, CSS, Lottie, Three.js, Anime.js, WAAPI; рендер — headless Chrome по кадрам + FFmpeg, детерминированно; Node ≥ 22 | README [офиц] |
| Плагин Claude Code: `claude plugin marketplace add heygen-com/hyperframes` → `claude plugin install hyperframes@hyperframes`, вход `/hyperframes:hyperframes`; или `npx skills add heygen-com/hyperframes` | README [офиц] |
| 21 скилл. **`/product-launch-video`** — «Any website — marketing / launching / promoting a product (from its URL, a brief, or a script)… featuring the site's own visuals. Up to ~3 min (sweet spot 30-90s)». Рядом: `/motion-graphics` (≤10 с, кинетика, счётчики), `/music-to-video` (монтаж под бит), `/pr-to-video`, `/faceless-explainer`, `/remotion-to-hyperframes`, `/figma` | README [офиц] |
| Команда снятия сайта: `npx hyperframes capture "<URL>" -o ./capture --json` — скриншоты (в т.ч. `full-page.png` для проезда камерой), DOM, токены цветов и шрифтов, ассеты, Lottie, иконки, тексты | [SKILL.md product-launch-video](https://github.com/heygen-com/hyperframes/blob/main/skills/product-launch-video/SKILL.md) [офиц] |
| Конвейер скилла: бриф → снятие сайта → `frame.md` (дизайн-система для камеры, пресет перекрашивается в цвета сайта) → STORYBOARD.md + SCRIPT.md (одобрение) → голос и музыка в фоне → покадровая раскадровка → **по сабагенту на каждую сцену** → сборка → рендер `renders/video.mp4` | SKILL.md [офиц] |
| Голос: HeyGen TTS при входе в аккаунт, офлайн — Kokoro; музыка — библиотека HeyGen; подложка подрезается под голос | SKILL.md [офиц] |
| Готовый промпт из доков: «/product-launch-video Make a 45-second 1920x1080 launch video for https://linear.app. Energetic but minimal, use the site's own palette and screenshots. Structure: hook stating the problem, 3 feature beats with UI captures and one-line captions, end card with logo + "Try it free". Female TTS voice, confident tone, subtle electronic BGM under -18dB.» — видео приложено «Rendered from the prompt above, unedited» | [docs/prompting/product-launch.mdx](https://github.com/heygen-com/hyperframes/blob/main/docs/prompting/product-launch.mdx) [офиц] |
| Образец: ролик-запуск, собранный этим конвейером с живого huly.io: «The screens are captured from huly.io, not mocked» | [docs/guides/product-launch-video.mdx](https://github.com/heygen-com/hyperframes/blob/main/docs/guides/product-launch-video.mdx), видео `static.heygen.ai/…/product-launch-huly-v5.mp4` [офиц] |
| Собственный ролик-запуск HyperFrames сделан целиком в Claude Code на HyperFrames | [themenonlab.blog](https://themenonlab.blog/blog/heygen-hyperframes-video-as-code), [noqta.tn](https://www.noqta.tn/en/blog/heygen-hyperframes-html-to-mp4-ai-agent-video-2026) [пресса] — первоисточник в X не открывали |
| Каталог ~400 готовых блоков: `npx hyperframes add data-chart`, переходы-шейдеры, оверлеи; поиск `npx hyperframes catalog --query "<look>" --json` | README + SKILL.md [офиц] |

**Вкус, зашитый в скилл** (motion-language.md, дословные правила — это
лучший найденный «учебник моушн-дизайна для агента»):
- «Smooth beats bouncy — `power3` is the default… Bouncy is the #1
  instant turn-off in user-made Remotion / HyperFrames videos».
- «Sequential reveal in the back ~50%, timed to the voiceover… Don't dump
  everything on screen in the first ~25%».
- «No lazy breathing, no bad pan/push… I'd rather have NO motion than BAD
  motion»; единственная допустимая «жизнь» в паузе — «subtle jitter».
- Швы — «velocity-matched cuts»: «cut at peak velocity, match direction
  and speed on both sides». Каталог: zoom-through, inverse zoom-through,
  cut-the-curve, waterfall cut; размытие на шве — 10 px для текста,
  18–20 px для целой поверхности (cut-catalog.md).
- Словарь движений: «3D page-scroll reveal» (страница наклонённой 3D-
  карточкой, внутри скролл к нужной секции), «zoom-to-target», «cursor
  click + ripple», «value-scaled counter» (число растёт и увеличивается),
  «split-tilt cards» (сравнение двух карточек с наклоном навстречу),
  «keyword glow» под слово голоса, «depth-of-field blur».
  [motion-language.md](https://github.com/heygen-com/hyperframes/blob/main/skills/product-launch-video/references/motion-language.md) [офиц]

Метка: **топ мира** (HeyGen, 61k звёзд за 7 месяцев).

### Videowright (Kiln) — «как мы сделали ролик-запуск в Claude Code»

- Кейс: Kiln (open-source AI-верстак, 5,2k звёзд) сделал ролик к v1 в
  Claude Code: «HTML, CSS, JavaScript. Animated SVG for motion. A web
  component per beat of the video… Screen-captured the dev server at
  60fps, added a voice-over in post». Первый ролик — «2 days of
  iteration», следующий со своей библиотекой и стайл-доком — «about two
  hours». Пост 2026-05-20, автор Steve Cosman.
  [kiln.tech/blog/we_made_our_launch_video_in_claude_code](https://kiln.tech/blog/we_made_our_launch_video_in_claude_code) [практики] · **сильный нишевик**.
- Пять уроков дословно по смыслу: (1) «You can animate your real app UI…
  Let it read your app code, and it can animate it… Pan to a specific
  button. Highlight a feature. Zoom into a real form. The UI is live, not
  a mock»; (2) «Audio drives the timing, not the video» — первый ролик
  пришлось перерезать под голос; (3) «Without a style guide you get very
  generic motion graphics» — написали отдельный видео-стайлгайд поверх
  бренд-гайда: «type sizes in motion, transition vocabulary, easing
  curves, color usage in motion versus on a static page»; (4) «one web
  component per beat. One file per segment» — иначе агент путается в
  больших диффах; (5) «Iteration is the real work… Generating code is
  cheap. Concept work is the expensive part». Оверлеи для говорящей
  головы — прозрачные PNG 60 fps из браузера + ffmpeg, «under an hour».
- Инструмент `scosman/videowright`: MIT, 168 звёзд, создан 2026-05-09,
  push 2026-10-05. Сегмент = веб-компонент, любая веб-анимация (SVG,
  WAAPI, canvas, Svelte, CSS), рендер — Playwright управляет часами и
  проходит кадр за кадром, «Pixel-perfect, deterministic, 60fps+»;
  голос ElevenLabs → распознавание речи → пословные метки → такты
  ролика подгоняются под голос; музыка и звуки — Openverse или
  ElevenLabs; шесть стилей. Установка — промптом с INSTALL.md.
  [github.com/scosman/videowright](https://github.com/scosman/videowright) [офиц] · **малыш** по звёздам, но лучший разбор практики.

### Остальные движки

| движок | статус на 12.10.2026 | для агента | источник |
| --- | --- | --- | --- |
| **Motion Canvas** | MIT, 19 284 звезды, последний push 2026-07-02; генераторы TypeScript + редактор с живым превью; заточен под ручную работу | есть сторонний скилл `videozero/skills/motion-canvas-agent`; официальных агент-скиллов нет | [github.com/motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) [офиц], [skills.sh](https://skills.sh/videozero/skills/motion-canvas-agent) |
| **Revideo** | репо переехало в `midrender/revideo`: MIT, 4 097 звёзд, push 2026-07-15; команда работает над коммерческим Midrender | headless-рендер функцией, но центр тяжести — чужой продукт | [github.com/midrender/revideo](https://github.com/midrender/revideo) [офиц]; см. также прошлый срез завода |
| **timecut** | BSD-3, 654 звезды, последний push 2023-07-18 — заброшен; подменяет время страницы и снимает плавное видео с JS-анимациями | идея та же, что у HyperFrames/videowright, но без поддержки | [github.com/tungs/timecut](https://github.com/tungs/timecut) [офиц] |
| **puppeteer-screen-recorder** | MIT, 458 звёзд, push 2025-01-20; пишет screencast в реальном времени — кадры теряются | для «живой записи», не для покадрового рендера | [github.com/prasanaworld/puppeteer-screen-recorder](https://github.com/prasanaworld/puppeteer-screen-recorder) [офиц] |
| **WebCodecs в браузере** | Remotion `@remotion/web-renderer` стабилен с v4.0.491: рендер прямо в браузере, кодирует WebCodecs через Mediabunny вместо FFmpeg, поддерживает подмножество HTML | для рендера на клиенте; нам не нужно — рендер на Pro | [remotion.dev/docs/client-side-rendering](https://www.remotion.dev/docs/client-side-rendering) [офиц] |
| **Remotion HTML-in-canvas** | с v4.0.455: живой DOM рисуется в canvas и обрабатывается Canvas 2D/WebGL/WebGPU — размытие, линза, глитч, `zoomBlur()` (v4.0.480); в превью нужен Chrome 149+ с флагом, рендер работает без флага | даёт «дорогие» эффекты поверх настоящей вёрстки | [remotion.dev/docs/html-in-canvas](https://www.remotion.dev/docs/html-in-canvas), [docs/effects/zoom-blur](https://www.remotion.dev/docs/effects/zoom-blur) [офиц] |
| **Montage** (Simplex) | MIT, 27 звёзд, март 2026: форк Next.js-шаблона Remotion с примерами «master sequence», шаг «Import branding: point your coding agent to your frontend» | агентный шаблон поверх Remotion | [github.com/simplexlabs/montage](https://github.com/simplexlabs/montage) · **малыш** |
| **memex-lab/product-launch-video-skill** | MIT, 18 звёзд, июнь 2026: скилл-режиссёр поверх Remotion (концепт, раскадровка, генерация ассетов, голос, ревью рендера); пример на YouTube `oX-KnoRbAM0` | ставится вместе с `remotion-best-practices` | [github.com/memex-lab/product-launch-video-skill](https://github.com/memex-lab/product-launch-video-skill) · **малыш** |

Сравнение «HTML или React» в обзорах сводится к одному: Remotion — когда
ролик живёт внутри React-системы с типами и данными; HyperFrames — когда
источник — обычный HTML/CSS/GSAP «или сайт, который агент должен
оживить без перевода в React» ([moda.app/blog/hyperframes-vs-remotion](https://moda.app/blog/hyperframes-vs-remotion), [yuv.ai](https://yuv.ai/blog/heygen-hyperframes-html-video) [пресса]).
HN: «Show HN: HyperFrames – Render Video from HTML via Chrome's
BeginFrame API», 2026-04-16 — то есть рендер через управление кадрами
Chrome, а не запись экрана ([news.ycombinator.com/item?id=47797513](https://news.ycombinator.com/item?id=47797513)).

---

## 3. «Снять настоящую страницу»: запись, наезды, курсор

### Скриптом (Claude Code делает сам)

- **Playwright `recordVideo`** — штатная запись контекста в `.webm`
  (`recordVideo: { dir, size: {width:1280,height:720} }`), клики
  `page.click`, паузы `waitForTimeout` под длину CSS-переходов, потом
  ffmpeg: обрезка `crop=760:520:260:180`, `libx264`, кадр-постер. Наезд
  — только статичной обрезкой. Пост обновлён 2026-09-17.
  [flaviocopes.com/record-demo-video-playwright](https://flaviocopes.com/record-demo-video-playwright/) [практики] · **сильный нишевик**.
  Слабое место — запись идёт в реальном времени, кадры могут теряться;
  поэтому videowright/HyperFrames управляют часами страницы и снимают
  покадрово.
- **Наезд кодом на живой странице**: `transform: scale()` на странице с
  центром в точке клика + нарисованный курсор поверх — так делает
  скилл `palamut62/promo-video-recorder` (MIT, 0 звёзд, июнь 2026; «animated
  cursor, click-focused zoom, on-screen captions, calm music, ffmpeg
  export»). [github.com/palamut62/promo-video-recorder](https://github.com/palamut62/promo-video-recorder) · **малыш**, но приём верный: наезд CSS-ом чёткий на любом разрешении, в отличие от увеличения готового видео.
- **HyperFrames `3d-page-scroll`** и проезд камерой по `full-page.png`:
  страница снимается целиком одной картинкой, камера едет по ней; для
  наезда больше 1:1 — отдельный снимок участка в 2x (SKILL.md, см. §2).
- **DemoDay** (`mrieck/demoday-claude-plugin`, MIT, 7 звёзд, push
  2026-09-15): плагин Claude Code `/demoday:create-demo-video` — читает
  репо, пишет сценарий, **сам водит приложение на экране** и пишет его,
  голос ElevenLabs, аватар-ведущий через FAL.ai, переходы и вставки в
  Remotion; девять стилей (launch, dynamic — «the screen zoomed into the
  element being explained»…); только macOS; «about the cost of a coffee».
  [github.com/mrieck/demoday-claude-plugin](https://github.com/mrieck/demoday-claude-plugin) · **малыш**.
- **screenstudio-alt** — скилл в коллекции antigravity-awesome-skills:
  постобработка записи из CLI — ускорение простоев, наезды на скопления
  кликов, плашки нажатых клавиш, сглаженный курсор, вертикаль 9:16.
  MIT. [claudskills.com/skills/screenstudio-alt](https://claudskills.com/skills/screenstudio-alt/) [практики] · **малыш**; исходники не открывали.
- **video-use** (browser-use): MIT, **28 632 звезды**, с 2026-04-12 —
  «Edit videos with coding agents»: папка с сырьём → `edit/final.mp4`;
  агент «читает» видео по расшифровке с пословными метками, режет паузы,
  красит, жжёт субтитры, кладёт анимации HyperFrames/Remotion/Manim.
  Для нашей задачи — монтажный слой поверх записи, не генератор.
  [github.com/browser-use/video-use](https://github.com/browser-use/video-use) [офиц] · **топ мира** (browser-use).

### Готовые приложения (руками или полуавтоматом)

| инструмент | что делает | цена | может ли Claude Code водить | источник |
| --- | --- | --- | --- | --- |
| **Screen Studio** | запись с автонаездами по кликам, сглаживание курсора, «optics-based motion blur», рамки устройств; только macOS | $29/мес или $9/мес при оплате за год; вечные лицензии больше не продаются | плохо: есть только deeplink'и `screen-studio://record-window`, `record-display`, `finish-recording`; запрос «agent-friendly» от 17 марта слит в другой, ответа нет | [screen.studio](https://screen.studio/), [hub.screen.studio](https://hub.screen.studio/p/more-automation-and-agent-friendly) [офиц] · **топ мира** |
| **OpenScreen** | открытая замена Screen Studio: автонаезды по кликам, курсор по кривым Безье, motion blur; Electron, Win/Mac/Linux | бесплатно, MIT; **39 925 звёзд**, HN 434 очка (2026-04-01) | GUI, CLI нет | [github.com/siddharthvaddem/openscreen](https://github.com/siddharthvaddem/openscreen), [HN](https://news.ycombinator.com/item?id=47595695) · **топ мира** среди открытых |
| **Cap** | открытый рекордер (аналог Loom) | открытый код, 23 219 звёзд | GUI | [github.com/CapSoftware/Cap](https://github.com/CapSoftware/Cap) · сильный нишевик |
| **Cursorful** | расширение Chrome: наезды и панорамы по кликам, правка глубины и времени наезда | бесплатно; Pro — $79 разово (обычно $119) | GUI в браузере | [cursorful.com](https://cursorful.com/) [офиц, через поиск] · малыш |
| **Tella / Choppity / FocuSee** | запись с автонаездами (у Choppity — «AI-powered reframing», с 2026-01-02) | подписки | GUI | [tella.com/auto-zoom](https://www.tella.com/auto-zoom/llms.txt), [choppity.com/changelog](https://www.choppity.com/changelog/choppity-screen-recorder-with-ai-powered-reframing-zooms) |
| **Arcade** | интерактивные демо из скриншотов, экспорт MP4/GIF, ИИ-голос | Free (водяной знак, без экспорта) · Growth $50/место/мес ($42.50 за год) с MP4 · Enterprise по запросу (нужен для «full HTML capture») | GUI | [trainn.co/blog/arcade-pricing](https://trainn.co/blog/arcade-pricing/) [пресса, 2026-08-25] · сильный нишевик |
| **Rotato** | 3D-макеты устройств, видео 4K 60 fps, ProRes 4444 с альфой | платный (цену не сверяли) | **да**: официальный агент-скилл `rotato-cli` — `rotato inspect <project> --json`, `rotato render <project> --output <path>` с подменой видео на экране устройства и текстов при рендере; CLI отдаёт задачу в приложение macOS | [rotato.app/.well-known/agent-skills/rotato-cli/SKILL.md](https://rotato.app/.well-known/agent-skills/rotato-cli/SKILL.md) [офиц] · сильный нишевик |
| **Palmier Pro** | монтажка macOS «built for AI»: MCP-сервер на `127.0.0.1:19789/mcp`, агент правит таймлайн, внутри генерация Seedance/Kling/Nano Banana | исходники GPL до v0.7.6, дальше закрытые бинарники; 14 555 звёзд, HN 191 очко (2026-07-23) | **да**, через MCP: `claude mcp add --transport http palmier-pro http://127.0.0.1:19789/mcp` | [github.com/palmier-io/palmier-pro](https://github.com/palmier-io/palmier-pro) [офиц] · сильный нишевик |

«URL → видео» как отдельный SaaS в выдаче 2026 почти не живёт: роль
«дай адрес — получи ролик» забрали открытые агент-скиллы (HyperFrames
`/product-launch-video`, VVTerm-промпт Remotion). Подробнее — в «Не найдено».

---

## 4. Свои компоненты страницы, скриншоты или перерисовка

Три способа показать интерфейс в ролике, что про них говорят источники:

| способ | кто так делает | плюсы | минусы | источник |
| --- | --- | --- | --- | --- |
| **Настоящие компоненты сайта, оживлённые в ролике** | Kiln: «Let it read your app code, and it can animate it… The UI is live, not a mock»; Presscut: «Use react componenents to replicate UI elements… as closely as possible» | чёткость на любом наезде, можно двигать каждую деталь (кнопка, счётчик, строка таблицы), шрифты и цвета точные | компоненты надо перевести на «время кадра»: в Remotion нельзя полагаться на `useState`/`useEffect`-анимации, CSS-переходы и Tailwind-анимации — всё движение от `useCurrentFrame()`; в HyperFrames — от GSAP-таймлайна на паузе, «No CSS `transition` / `@keyframes` for motion» | [kiln.tech](https://kiln.tech/blog/we_made_our_launch_video_in_claude_code), [remotion.dev/prompts/product-demo-for-presscut](https://www.remotion.dev/prompts/product-demo-for-presscut), [motion-language.md](https://github.com/heygen-com/hyperframes/blob/main/skills/product-launch-video/references/motion-language.md) [офиц]; ограничения Remotion — [skills.sh/mathews-tom/armory/remotion-video](https://skills.sh/mathews-tom/armory/remotion-video) [практики] |
| **Скриншоты живой страницы + анимация поверх** | HyperFrames `/product-launch-video` по умолчанию: «Use the real screenshot instead of rebuilding the full website in HTML… keep the screenshot as the base and overlay real captured assets at measured positions, or rebuild only the one component that moves» | быстро, правдиво («not mocked»), цвета и вёрстка совпадают с сайтом | наезд глубже 1:1 размывает картинку — нужен отдельный снимок участка в 2x; внутри скриншота ничего не шевелится | [SKILL.md](https://github.com/heygen-com/hyperframes/blob/main/skills/product-launch-video/SKILL.md) [офиц] |
| **Перерисовка «по мотивам»** | VVTerm-промпт («Apple presentation style»), Launch Video on X, большинство роликов из галереи Remotion | полная свобода кинетики | «Without a style guide you get very generic motion graphics» — узнаваемость сайта теряется | [kiln.tech](https://kiln.tech/blog/we_made_our_launch_video_in_claude_code) [практики] |

Что видно по примерам: самое «дорогое» ощущение дают **гибриды** — фон
и общий план со скриншота, а одна живая деталь (кнопка нажимается, число
растёт, строка таблицы подсвечивается) пересобрана кодом и движется.
Remotion `HtmlInCanvas` позволяет наложить на живую вёрстку размытие,
линзу, световые блики ([remotion.dev/docs/html-in-canvas](https://www.remotion.dev/docs/html-in-canvas) [офиц]).

**Факт из нашего репо (12.10, `git ls-files`):** секции /services живут в
`vibecoding-ru/app/services/_components/` — 78 файлов (`services-hero`,
`steps-timeline`, `benefits-compare`, `services-team`, `pricing-cards`,
`services-faq`, эффекты `dither-veil`, `paper-metal`, `border-glow`,
`side-rays`, `specular-button`, `tilt-card`). 18 из 27 файлов `.en.tsx` используют
`useState`/`useEffect`/`IntersectionObserver`, два файла — `motion/react`.
То есть прямой импорт в Remotion потребует обёрток «время кадра → пропсы»;
эффекты на своих часах (WebGL, rAF) при покадровом рендере застынут или
задёргаются, если их не перевести на время кадра.

---

## 5. Слой лоска: музыка, голос, звуки, 3D, вкус

### Музыка

| что | факт | источник |
| --- | --- | --- |
| ElevenLabs Music API | $0.15 за минуту; «Commercial use licensing on Starter+ plans» | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) [офиц] |
| ElevenLabs Music, условия | на Free/Starter/Creator/Pro: «All online and offline commercial use permitted, except film, TV, radio, and Studio Games»; атрибуция — только на Free | [elevenlabs.io/music-terms](https://elevenlabs.io/music-terms) [офиц] |
| Google Lyria 3.5 (Gemini API) | $0.08 за песню; Lyria 3 Clip Preview (30 с) — $0.04 | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) [офиц] |
| Монтаж под бит | HyperFrames `/music-to-video`: «music drives pacing»; анализатор `analyze-beatgrid.py` пишет `audiomap.json` — фазы энергии, онсеты, паузы, жёсткие стопы, фразы, темп и сетка; в чужих скиллах — librosa beat tracking → `beats.json` с «strong beats» для склеек | README HyperFrames [офиц]; [mcpservers.org/…/music-to-video](https://mcpservers.org/ru/agent-skills/heygen-com/music-to-video), [tessl.io detect_beats.py](https://tessl.io/registry/gamussa/reels-producer-skill/files/skills/reel-builder/scripts/detect_beats.py) [практики] |
| Подрезка трека | HyperFrames SKILL.md: трек из библиотеки может начинаться тихим разгоном и «drains the first seconds of a short launch video» — сравнить начало с поздними пятисекундными кусками и начать с сильного места, короткий fade-in, длинный fade-out | [SKILL.md](https://github.com/heygen-com/hyperframes/blob/main/skills/product-launch-video/SKILL.md) [офиц] |
| Уровень музыки | готовый промпт HyperFrames: «subtle electronic BGM under -18dB»; Remotion-пример: музыка на 40 % с затуханием 1 с / 2 с; у нас в объяснялках — 0.07 и −16 LUFS на выходе | [product-launch.mdx](https://github.com/heygen-com/hyperframes/blob/main/docs/prompting/product-launch.mdx), [launch-video-on-x](https://www.remotion.dev/prompts/launch-video-on-x) [офиц]; [explainers.md завода](../../explainers.md) |

### Голос

- ElevenLabs TTS: v3 и Multilingual v2 — $0.08 за 1K знаков, Flash/Turbo
  — $0.04 ([elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) [офиц]).
  30-секундный ролик ≈ 65–70 слов ≈ 400 знаков ≈ $0.03.
- Правило темпа из доков HyperFrames: «roughly 130 spoken words per
  minute, so a 30-second video wants a 65–70 word script»; дословный
  сценарий сам задаёт длину ([product-launch.mdx](https://github.com/heygen-com/hyperframes/blob/main/docs/prompting/product-launch.mdx) [офиц]).
- Remotion-скилл `voiceover.md`: голос по сценам через ElevenLabs, длина
  композиции подгоняется `calculateMetadata` под длину аудио
  ([remotion-dev/skills](https://github.com/remotion-dev/skills) [офиц], 5 033 звезды).
- Kiln и videowright: голос первым, картинка подгоняется под пословные
  метки — «audio leads, video follows». Наш завод уже так делает
  (`with-timestamps` ElevenLabs, метки `{имя}`).

### Звуки (whoosh, клики)

- Remotion-скилл `sfx.md` даёт готовый список: `whoosh.wav`, `whip.wav`,
  `page-turn.wav`, `switch.wav`, `mouse-click.wav`, `shutter-modern.wav`,
  `ding.wav` и др. на `remotion.media` ([sfx.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/remotion-markup/sfx.md) [офиц]; лицензию файлов не нашли — см. «Не найдено»).
- ElevenLabs Sound Effects — $0.12 за минуту ([elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) [офиц]).
- HyperFrames `/hyperframes-audio`: «voiceover carve» — музыка проседает
  только в полосах частот голоса, цепочки EQ/компрессор/лимитер, шины
  ([README](https://github.com/heygen-com/hyperframes) [офиц]).
- videowright: звуки и музыка из Openverse (CC) или ElevenLabs.

### 3D-устройства и «дорогие» эффекты

- **Remotion `@remotion/three`** + шаблон `remotion-dev/template-three`:
  3D-телефон, внутри видео-текстура (`useVideoTexture`,
  `useOffthreadVideoTexture` для точного кадра при рендере), меняются
  цвет, толщина, скругление ([remotion.dev/docs/three](https://www.remotion.dev/docs/three), [github.com/remotion-dev/template-three](https://github.com/remotion-dev/template-three) [офиц]).
- **Rotato CLI** — подмена видео на экране 3D-устройства при рендере,
  4K 60 fps (§3).
- **Apple-style device rise** — готовый промпт с числами (§1).
- Эффекты Remotion: `lightLeak()` поверх склейки (с v4.0.500),
  `zoomBlur()`, motion blur, переходы `TransitionSeries` (fade, slide,
  wipe) ([light-leaks.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/remotion-markup/light-leaks.md), [transitions.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/remotion-markup/transitions.md) [офиц]).
- Каталог HyperFrames, самые устанавливаемые блоки за 30 дней:
  `logo-outro`, `data-chart`, `editorial-flash-overlay`,
  `organic-light-leak-overlay`, `mk-progress-stat`, `flowchart`,
  `mk-specs-list`, `mk-callout-highlight`
  ([hyperframes.heygen.com/showcase](https://hyperframes.heygen.com/showcase) [офиц]).

### Скиллы со вкусом моушн-дизайна

| скилл | что в нём | метка |
| --- | --- | --- |
| HyperFrames `product-launch-video` → `motion-language.md`, `cut-catalog.md`, `story-design.md` | доктрина «smooth > bouncy», раскрытие под голос во второй половине сцены, «no motion over bad motion», склейки по скорости, словарь движений с id рецептов | **топ мира** |
| HyperFrames «Recreating something you saw» | метод снятия чужого ролика: расписать покадрово длительность, путь камеры, что делает каждый элемент с таймкодами, наложения входов, размытые слои, цвета → такой промпт даёт «about 75%» с первого раза; правки только абсолютными числами («dot radius = 25% of row spacing», не «make dots 2x finer»); найденные константы вписать обратно → «~80–90%» на новой сборке. Витрина показывает оригинал и копию «matched frame for frame» | [recreating-references.md](https://hyperframes.heygen.com/prompting/recreating-references.md) [офиц] · **топ мира** |
| `LottieFiles/motion-design-skill` | MIT, 2 117 звёзд (март 2026): тайминг, easing, хореография, диснеевские принципы для UI; четыре «характера движения» (Playful, Premium, Corporate, Energetic) с диапазонами длительностей, кривыми и процентом перелёта | [github.com/LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) · **сильный нишевик** |
| `remotion-dev/skills` (`remotion-best-practices`) | техника Remotion: тайминг, переходы, звуки, голос, 3D, html-in-canvas; вкуса мало | [github.com/remotion-dev/skills](https://github.com/remotion-dev/skills) · **топ мира** по технике |
| videowright style packs | шесть стилей + стиль из бренд-гайда, адреса или описания | малыш |
| memex-lab `product-launch-video` | режиссура поверх Remotion: концепт, раскадровка, ассеты, голос, ревью рендера | малыш |

---

## 6. Генеративное видео (Veo / Kling / Runway) в промо сайтов

- **Sora 2 больше нет в API**: «On March 24th, 2026, we notified
  developers… of their deprecation and removal from the API on September
  24, 2026», замены не указано ([developers.openai.com/api/docs/deprecations](https://developers.openai.com/api/docs/deprecations) [офиц]).
- **Veo 3.1** (Gemini API): Standard — $0.40/с (720p/1080p), $0.60/с
  (4K); Fast — $0.10/$0.12/$0.30; Lite — $0.05 (720p), $0.08 (1080p).
  8-секундная вставка Fast 1080p ≈ $0.96, Standard ≈ $3.20
  ([ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) [офиц]).
- Как их используют в SaaS-промо (практики): структура «AI hook clip.
  Screen recording. AI transition. Screenshot zoom. Screen recording.
  Result frame. CTA.»; ИИ — для сцены-проблемы в начале, переходов,
  абстракций, фона; **не** для «Exact clicks. Navigation. Settings.
  Reports. Exports. Pricing or plan details», потому что «AI video models
  may still alter UI, text, icons, and layouts»
  ([cliprise.app](https://www.cliprise.app/learn/workflows/marketing/ai-saas-product-demo-video-workflow) [практики], дата не указана).
- Скиллы, которые умеют вставлять генерацию: memex-lab (b-roll,
  «generated inserts»), DemoDay (аватар-ведущий через FAL.ai), Palmier Pro
  (Seedance, Kling, Nano Banana внутри монтажки).
- Для нашей страницы: генерация уместна максимум в 2–3-секундном
  «холодном открытии» (хаос бэклога, Slack горит) — цены, таблица,
  цифры 86/13 и Slack-треды должны идти из настоящей вёрстки.

---

## 7. Донор формы: открытые исходники роликов-запусков HeyGen

`heygen-com/hyperframes-launches` — Apache-2.0, 592 звезды, push
2026-10-04: «Open-source HyperFrames compositions behind HeyGen's product
launch videos». 20 папок, у каждой `index.html`, часто `STORYBOARD.md` и
`SCRIPT.md`: `HF-heygen-stripe` (запуск HeyGen × Stripe, 4K),
`heygen-apple-motion` («Re-brandable launch templates (×4)»),
`website-to-hyperframes`, `codex-five-hour-limit-replica`, `k3-promo`,
`texture-launch-video`, `liquid-brand-refraction` и др. Ассеты в Git LFS;
бренд-ассеты при переделке заменить.
[github.com/heygen-com/hyperframes-launches](https://github.com/heygen-com/hyperframes-launches) [офиц] · **топ мира**.

Что видно в `website-to-hyperframes/STORYBOARD.md` (582 строки, ~61 с,
1920×1080, 30 fps): раскадровка по тактам с точностью до сотых секунды;
палитра hex-кодами с ролями; шрифты локально, «no CDN at render»; голос
ElevenLabs Rachel, `eleven_multilingual_v2`, stability 0.35, с режиссурой
интонации на каждую реплику; кредо — «Every second earns a music event.
Every beat self-ducks for voice. The visuals do the explaining —
narration punctuates.» Холодное открытие: тихий мигающий курсор 1.66 с →
на первом ударе музыки панель «Claude Code» печатает запрос 20 знаков в
секунду со звуком клавиш → «whoosh» и панель уезжает назад-вниз (−2°,
0.96) → следующая панель снизу; четыре панели складываются стопкой с
разными поворотами; камера +4 % за 0.34 с; стопка «заряжается» дрожью
±3 px и свечением перед взрывом.
[website-to-hyperframes/STORYBOARD.md](https://github.com/heygen-com/hyperframes-launches/blob/main/website-to-hyperframes/STORYBOARD.md) [офиц].
Ещё одна сборка того же проекта у стороннего хостинга — 41,8 с,
«a cold open, captured clips, animated captions, tool logos, and a
product end card» ([creativeclaw.co](https://creativeclaw.co/examples/hyperframes-launch-website-to-video/) [практики]).

Правило HyperFrames для дизайна (дословно): «Pictures stay pictures.
Anything that has to move or change gets rebuilt as real HTML… Screenshots
are proof. HTML is what changes.»
([guides/claude-design.md](https://hyperframes.heygen.com/guides/claude-design.md) [офиц]).

---

## 8. Конвейеры: что Claude Code делает, что выходит, цена, время, лицензия

Оценки времени — мнение разведчика по кейсам Kiln (первый ролик 2 дня,
следующий 2 часа) и доке HyperFrames («Rendered from the prompt above,
unedited»); официальных замеров скорости рендера не нашли.

### А. HyperFrames `/product-launch-video` по адресу страницы

1. `claude plugin marketplace add heygen-com/hyperframes` →
   `claude plugin install hyperframes@hyperframes` (Node ≥ 22, FFmpeg).
2. Промпт по образцу Linear: «/product-launch-video Make a 45-second
   1920x1080 launch video for https://vibecoding.tech/services… use the
   site's own palette and screenshots. Structure: hook stating the
   problem, 3 feature beats…, end card with logo + "Book a call"…».
3. Агент: `npx hyperframes init` → `npx hyperframes capture <URL>` →
   `build-frame.mjs` (пресет перекрашен в цвета сайта) → STORYBOARD.md +
   SCRIPT.md на одобрение → голос и музыка в фоне → покадровая режиссура
   → сабагент на каждую сцену → `npx hyperframes render`.
4. Голос и музыку можно отдать своими файлами (`"source": "host"`) —
   наш ElevenLabs вместо входа в HeyGen; иначе HeyGen OAuth
   («free subscription credits») или Kokoro офлайн.
- **Выход:** MP4 1920×1080 30 fps; скриншоты сайта как основа + живые
  наложения, кинетика, переходы, подписи, голос, музыка.
- **Цена:** движок бесплатно (Apache-2.0); голос ≈ $0.03–0.10, музыка
  ≈ $0.15/мин (ElevenLabs) или библиотека HeyGen; токены Claude — по
  подписке.
- **Время (мнение):** первый черновик — около часа, доводка — полдня.
- **Примеры:** ролик с huly.io; ролик по linear.app из доков; исходники
  `hyperframes-launches`.

### Б. Remotion + свои компоненты (путь Presscut/Kiln)

1. `npx create-video --yes --blank promo` (или `--tailwind`) →
   `npx remotion skills add` → `claude` в папке; или плагин
   `remotion@remotion`.
2. Промпт: перенести секции /services как React-компоненты, «replicate
   the UI as closely as possible», «grill me with questions».
3. Перевести анимации компонентов на `useCurrentFrame()`, собрать сцены
   в `TransitionSeries`, голос через `voiceover.md` +
   `calculateMetadata`, звуки из `sfx.md`.
4. `npx remotion studio` для превью → `npx remotion render`.
- **Выход:** MP4 любого размера, интерфейс чёткий на любом наезде, все
  числа и статусы двигаются.
- **Цена:** бесплатно для компании до трёх человек (в черновике Remotion 5.0 в счёт идут и
  подрядчики); голос/музыка — как в А.
- **Время (мнение):** 1–2 дня на первый ролик: перенос компонентов —
  главная работа.
- **Примеры:** Presscut (Josh Pigford), Cursor Agent Skills, Launch Video
  on X, VVTerm.

### В. Запись живой страницы + наезды

1. Playwright открывает страницу 1920×1080, водит нарисованный курсор,
   наезжает `transform: scale()` в точку внимания, скроллит по сценарию;
   лучше — управлять часами страницы и снимать покадрово (как
   videowright), а не `recordVideo` в реальном времени.
2. ffmpeg: обрезка, кодирование, музыка; или запись внутрь Remotion/
   HyperFrames как видео-слой с наездом «zoom in (with easing)… by about
   125%» (Cursor).
- **Выход:** честный проезд по сайту; «вау» меньше, чем у А/Б, но
  подходит как b-roll внутри них.
- **Цена:** бесплатно. **Время:** часы.
- **Готовые приложения** (Screen Studio $29/мес, OpenScreen, Cursorful
  $79) агентом почти не водятся — нужен человек.

### Г. Наш заводской конвейер объяснялок (холст + голос + ffmpeg)

Уже умеет голос с метками и покадровый рендер; интерфейс страницы
придётся рисовать на холсте заново — дольше и менее похоже на сайт. Тот
же принцип, что у HyperFrames, но без снятия сайта, без GSAP и без
каталога блоков ([explainers.md завода](../../explainers.md)).

### Д. Генеративное видео

Только 2–3-секундная вставка в начало (Veo 3.1 Fast ≈ $1 за 8 с);
интерфейс и цены — не генерировать.

---

## 9. Рейтинг для vibecoding.tech/services

1. **А — HyperFrames `/product-launch-video` по адресу, с живыми
   вставками.** Больше всего «вау» на единицу усилий: снятие сайта,
   доктрина движения, каталог блоков и сабагенты на сцены уже зашиты;
   лицензия без порогов. Двигающиеся куски пересобрать HTML-ом:
   очередь задач с Done, Slack-тред с ответом, счётчик 86, башня
   «13 → 1», карточки цен. Голос и музыка — своими файлами.
2. **Б — Remotion со своими компонентами**, если А выйдет «шаблонным»:
   максимальная точность и наезды без потери чёткости, но дольше из-за
   перевода компонентов на время кадра.
3. **В — запись страницы** как слой внутри А или Б, не самостоятельный
   ролик.
4. **Г — наш холстовый конвейер** — только если нужно остаться на своём
   стеке.
5. **Д — генерация** — максимум холодное открытие.

---

## 10. Что снимать (конкретные приёмы)

- **Каркас ролика:** крючок-проблема → 3 такта с интерфейсом и подписью
  в одну строку → финальная карточка с логотипом и одним действием
  (HyperFrames, пример Linear). Для 30 с — 65–70 слов голоса.
- **Сначала звук:** голос и музыка до картинки, такты по пословным
  меткам (Kiln, videowright, наш завод).
- **Раскрытие под голос во второй половине сцены**; ничего не вываливать
  в первые 25 %.
- **Плавно, без пружин:** `power3`/`expo.out`, без `back`/`bounce`/
  `elastic`; в паузе — стоп или едва заметное дрожание, без «дыхания» и
  медленных наездов во второй половине.
- **Склейки по скорости:** zoom-through (текст: масштаб 1→1.2, размытие
  до 10 px за 0.2 с, затем новый текст 0.75→1 за 0.5 с `expo.out`),
  inverse zoom-through для развязки, cut-the-curve для серии карточек;
  размытие поверхностей 18–20 px.
- **3D-проезд по странице:** страница наклонённой карточкой, внутри
  скролл к нужной секции; наезд в цель с противосдвигом.
- **Счётчик, растущий в размере** («86 tasks a week» против «20–60»).
- **Две-три карточки с наклоном навстречу** — для таблицы In-house ·
  Contractor · Subscription.
- **Курсор с кликом и кругом-волной** по кнопке «Book a call».
- **Подсветка слова** под голос (keyword glow) и маркерные выделения.
- **Печать запроса со звуком клавиш** (холодное открытие HeyGen; у нас —
  задача владельца «Need a landing page… Launch on Friday» печатается в
  Slack, следом «Done»).
- **Whoosh на каждой смене панели**; музыка проседает под голос;
  музыка ниже −18 дБ; трек начинать с сильного места.
- **Световой блик (`lightLeak`) поверх склейки**, motion blur на быстрых
  влётах, размытие глубины на второстепенном.
- **iPhone, встающий снизу** (наклон 35°→8°, масштаб 0.8→1.0 за 1.5 с) —
  если показываем мобильный вид.
- **Видео-стайлгайд** поверх бренд-гайда: размеры шрифта в движении,
  словарь переходов, кривые, цвет в движении (Kiln).
- **Одна сцена — один файл** (Kiln, HyperFrames frames/NN-*.html).
- **Снятие чужого ролика 1:1:** расписать покадрово длительность, путь
  камеры, тайминги элементов, цвета; правки только абсолютными
  числами; найденные константы вписать обратно (HyperFrames
  «Recreating something you saw»). Донор — `HF-heygen-stripe` или
  `website-to-hyperframes`.
- **Типографика печатной машинкой по знаку на кадр + настоящая запись с
  плавным наездом 125 %** (Cursor Agent Skills).

---

## Не найдено / сомнительно

- **Сами ролики не просмотрены покадрово.** Выводы о «вау» — по описаниям,
  раскадровкам и промптам; видео huly.io, Linear-примера, Presscut,
  Cursor, Kiln не скачивали и не разбирали глазами.
- **Скорость рендера** HyperFrames и Remotion для 30–60 с 1080p на Mac —
  официальных чисел нет (у Remotion есть только цена Lambda). Наш
  конвейер объяснялок: 80 с ≈ 1,5 мин на Pro — ориентир, не замер.
- **«28+ modular rule files»** у скиллов Remotion — из пресс-статьи, с
  репо не сверено (в репо видно больше 80 md-файлов вместе с картами).
- **Первоисточник фразы «HyperFrames launch video made entirely in Claude
  Code»** — только пресса; пост HeyGen в X не открывали.
- **Лицензия звуков `remotion.media/*.wav`** из скилла `sfx.md` — не
  найдена; перед публикацией проверить или заменить своими.
- **Условия коммерческого использования Lyria 3.5** — не проверяли, есть
  только цена.
- **Цена Rotato** — не сверяли.
- **Расход кредитов HeyGen** на голос и музыку при OAuth-входе — сказано
  «free subscription credits», лимитов не нашли.
- **Официальный CLI/API Screen Studio** — нет, только deeplink'и; запрос
  от 17 марта без ответа.
- **Официальные агент-скиллы Motion Canvas и Revideo** — нет, только
  сторонние.
- **Рабочий SaaS «URL → промо-ролик» 2026**, кроме агент-скиллов, — не
  найден: выдача — рекордеры с автонаездами и обзоры. revid.ai (прошлый
  срез завода) — объяснялки по теме, не сайты.
- **Промо сайтов крупных компаний с b-roll из Veo/Kling** — подтверждённых
  примеров не нашли; есть только советы практиков.
- **Обсуждения на HN** — только мелкие Show HN (2–8 очков) про
  HyperFrames, videowright, Montage, DemoDay; содержательных тредов с
  критикой нет. Обзор quickleap.io «Hype vs Reality» — 404.
- **Сколько времени ушло на Presscut-ролик** — не указано.
- Обзор rescroll.ai (2026-10-03) про «час на одну графику» пишет
  продавец альтернативы — учитывать как мнение с интересом.
