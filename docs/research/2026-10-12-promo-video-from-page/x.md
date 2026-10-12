# Промо-ролик из страницы: X · 2026-10-12 · opus

Угол: только X (x.com). Вопрос: как люди делают «вау» промо/лонч-ролики из сайта или лендинга с помощью Claude Code и похожих агентов (Remotion, HyperFrames, Motion Canvas, Claude Motion). Цель — ролик из https://vibecoding.tech/services (тёмная SaaS-страница: герой, карточки сценариев, 3 шага, таблица сравнения, цифры, цены, FAQ).

**Окно и метод.** 2026-10-12, 02:40–04:40 МСК. Поиск fxtwitter `/2/search` в этот день отдавал `{"code":404,"results":[]}` на любой запрос (см. «Не найдено»), поэтому поиск шёл через x.com/search во встроенном браузере (сессия @anusonmars, только чтение; вкладки Top и Latest; операторы `min_faves:`, `since:`, `from:`, `filter:videos`). Точные цифры каждого поста (просмотры, лайки, закладки, подписчики автора, длина видео) — через `api.fxtwitter.com/<handle>/status/<id>`; ветки и ответы — `api.fxtwitter.com/2/conversation/<id>`; две X-статьи прочитаны в браузере. Цифры сняты 2026-10-12 ≈03:30 МСК, даты постов — UTC из fxtwitter. Ссылка поста = провенанс факта. Сырые JSON — только в scratchpad сессии, в репо не лежат.

**Метки масштаба донора:** **топ мира** — официальный аккаунт вендора или пост от 1 млн просмотров · **сильный нишевик** — 100 тыс.–1 млн просмотров или признанный практик ниши · **малыш** — до ~100 тыс., ценен отдельным приёмом.

## Главное (5 строк)

1. Жанр «лонч-ролик кодом» взорвался дважды: 20.01.2026 (Remotion выпустил Agent Skills для Claude Code, 18,9 млн просмотров) и 22–25.09.2026 (Opus 5.5 «решил моушн-дизайн»). 08.10.2026 Anthropic выпустил **Claude Motion** (бета, Team/Enterprise) — «отчёт, график или прогулка по продукту → анимация кодом → MP4».
2. Для «страница → ролик» уже есть прямые рельсы: HyperFrames-скилл `/product-launch-video` с командой `hyperframes capture` (снимает со страницы скриншоты, тексты, цвета, шрифты) и готовый промпт «Read my site at [URL]… 30-second launch video» (RoundtableSpace, 11.10.2026).
3. «Один промпт» — в основном неправда: настоящие сильные ролики — это 1–3 дня режиссуры по сценам (rameerez, timkochjar), либо один огромный промпт-сценарий на 5–9 тыс. знаков (twoclipping).
4. Дорого выглядит то, что повторяется у всех сильных: референс-ролик вместо описания стиля · настоящий UI продукта, а не нарисованный · непрерывный кадр с морфингом вместо склеек · курсор и «камера» зумом · всё на долю такта музыки · раскадровка и стоп-кадры до рендера · отдельный «критик» посекундно.
5. Лучшие образцы под нашу страницу: RoundtableSpace (страница → ролик на HyperFrames), timkochjar (анимация настоящей библиотеки компонентов SaaS), steventey (промо dub.co одним промптом из репозитория продукта, тёмная SaaS-эстетика).

## 1. Топ постов (по просмотрам)

Формат: ссылка · автор (подписчики) · дата · просмотры / лайки / закладки · длина видео · инструмент · что поделились · почему «вау» · метка.

1. **[Remotion · 2013626968386765291](https://x.com/Remotion/status/2013626968386765291)** — @Remotion (58 161) · 2026-01-20 · 18 863 853 / 21 918 / 38 311 · видео 8,0 с (1080×700).
   Инструмент: Remotion Agent Skills + Claude Code. Текст: "Remotion now has Agent Skills - make videos just with Claude Code!" и команда `npx skills add remotion-dev/skills`.
   Как сделано: в ответе — [полная история промптов](https://x.com/Remotion/status/2013628043105890779) (431 тыс. просмотров), gist JonnyBurger: **31 промпт** для 8-секундного ролика. Ключевые: "add a 3d rotation to the temrinal. like 20 degree", "over total length of the composition, slowly rotate Y", "stagger the lines, make one appear every 50ms", "add a scale animation to the text, use an easing". Параметры из gist: spring damping 200 / stiffness 100 (без отскока), perspective 1000px, шрифт GT Planar 60px bold, 1080×700, 30 fps (WebFetch gist, 2026-10-12).
   Почему вау: терминал в 3D, медленный поворот по Y, чистая типографика — и «сделано только промптами». Отсюда начался тренд. Критика в ответах: "Burning thru $40 and 2 hours on claude code just to do what you could do on a free video editor" (@Jeff9James).
   **топ мира**.

2. **[Wakuwakukucx · 2088804332783435958](https://x.com/Wakuwakukucx/status/2088804332783435958)** — @Wakuwakukucx (1 530) · 2026-08-16 · 11 691 971 / 15 927 / 6 239 · 15,4 с.
   Инструмент: Claude Code × Remotion. Текст (япон.): заставка вымышленной ТВ-передачи, «Claude Code×Remotionの組み合わせが最強».
   Почему вау: «телевизионное качество» (сам автор в ответах), сюжет «если бы великие писали резюме», кисть-каллиграфия. Промпт не раскрыт: «プロンプト次第でclaude codeの能力の引き出し方が変わる» (всё решает промпт). Не SaaS — образец «ТВ-заставки».
   **топ мира** (по охвату; автор — малыш).

3. **[claudeai · 2108271552991252810](https://x.com/claudeai/status/2108271552991252810)** — @claudeai (1 895 106) · 2026-10-08 · 10 929 821 / 59 888 / 39 877 · 81,6 с.
   Инструмент: **Claude Motion** (бета). Тред: "[Claude Motion](https://x.com/claudeai/status/2108271558170976743) turns reports, charts, or product walkthroughs into short animations. Claude writes each one as code, with no video model involved… then export an MP4. In beta on Team and Enterprise plans." Финал ветки: анимацию можно открыть в видеоредакторе ([список инструментов](https://claude.com/resources/articles/dashboards-and-motion)).
   Дизайнер Anthropic [nateparrott](https://x.com/nateparrott/status/2108278188808065051): "let claude animate, then point at part to edit. then export!" Гайд — support.claude.com/en/articles/17454997-get-started-with-claude-motion (ссылка из поста [Voxyz_ai](https://x.com/Voxyz_ai/status/2108543002830360775)).
   **топ мира**.

4. **[stephanlivera · 2103315922098470926](https://x.com/stephanlivera/status/2103315922098470926)** — @stephanlivera (194 087) · 2026-09-25 · 2 270 709 / 17 142 / 13 088 · 15 с.
   Инструмент: «just stock claude code», Opus 5.5 на Max effort, без скиллов (ответы автора @jaypatel, @mad0rco). Промпт целиком в посте, фрагмент: "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are… go all out."
   Почему вау: промпт дал модели «право на свой вкус» (ответ @bygregorr: "'like it's YOUR showreel' is doing the work"). Стал мемом: его же с хвостом «launch saas video for https://dub.co» применили для dub.co (п. 25), для Distilbook (п. 10).
   **топ мира**.

5. **[higgsfield · 2108294775644585998](https://x.com/higgsfield/status/2108294775644585998)** — @higgsfield (140 576) · 2026-10-08 · 2 246 473 / 7 648 / 5 427 · 78 с.
   Инструмент: Higgsfield Katana «powered by Claude Motion», через Higgsfield MCP внутри Claude: "Upload a reference and create editable motion graphics, product launch videos…". Пример промпта лонч-фильма от [higgsfield_ai](https://x.com/higgsfield_ai/status/2108370085178138694) (38 тыс.): "Use the attached PHYLLA video as the primary reference. Inspect its compositions, typography, scene changes, motion, and audio before building."
   **топ мира** (вендор).

6. **[HyperFrames_ · 2107149824189698558](https://x.com/HyperFrames_/status/2107149824189698558)** — @HyperFrames_ (19 054) · 2026-10-05 · 1 652 416 / 4 071 / 5 324 · 80,8 с.
   Инструмент: HyperFrames Studio (HeyGen, открытый код; HTML → MP4). "Describe it, your agent builds, then you both work on the same timeline. Draw or comment on a frame, and it makes the edit."
   Советы в ветке: «@ your projects» — переиспользуй прошлые ролики; правка текста и цвета кликом без промпта; обвести кадр и отправить агенту.
   **топ мира** (вендор).

7. **[p4nthera_ · 2107175720086589633](https://x.com/p4nthera_/status/2107175720086589633)** — @p4nthera_ (3 058) · 2026-10-05 · 1 192 646 / 9 948 / 22 847 · 12,8 с.
   Что: галерея prompt-motion.com — 226 роликов Opus 5.5, у каждого рядом промпт или скилл. Ценность — библиотека референсов с рецептами.
   Ответ @bors___: "seems orange/black is the new AI-tell".
   **топ мира** (по охвату; как ресурс).

8. **[twoclipping · 2103273003555402193](https://x.com/twoclipping/status/2103273003555402193)** — @twoclipping (8 447) · 2026-09-24 · 1 157 959 / 12 643 / 20 986 · 14 с.
   Инструмент: Opus 5.5, «this entire video is code, 0 after effects». Открытый шаблон промпта блоками `<inputs>`, `<direction>`, `<structure>`. Фрагменты: "One shape, never cut", "Springs everywhere, a tiny overshoot at most", "The camera zooms so each state fills the frame", "120 BPM, 7 bars, something happens on every beat". Есть список запретов ("Banned: bouncy easing, particle bursts, glows…").
   Почему вау: один элемент UI морфится через 10 состояний (кнопка → лоадер → плеер → слайдер → ⌘K), курсор кликает, всё на долю такта. Ответы: "almost didn't believe but holy shit it works" (@Smrthnrula) против "guarantee this took like 10+ prompts" (@smithndwesson8). Автор: "the prompt was made by claude aswell".
   **топ мира** (по охвату).

9. **[rexan_wong · 2103707054108299437](https://x.com/rexan_wong/status/2103707054108299437)** — @rexan_wong (24 947) · 2026-09-26 · 632 816 / 6 868 / 18 164 · 11 с.
   Разбор «как на самом деле делают» в 6 шагов (подробнее в разделе 2, конвейер D):
   1) референс с whatships.com — "naming a style works way better than describing one";
   2) HyperFrames или Remotion для рендера;
   3) компоненты 21st.dev вместо выдуманного UI;
   4) бренд, скриншоты продукта и референс — в Opus, просить 3 раскадровки;
   5) стоп-кадр на каждую сцену;
   6) заметки режиссёра.
   Диагноз дефолта: "centered text, gradient background, everything fading in".
   **сильный нишевик**.

10. **[ajith_io · 2103449416325890146](https://x.com/ajith_io/status/2103449416325890146)** — @ajith_io (1 745) · 2026-09-25 · 632 648 / 4 102 / 4 752 · 15 с. Повтор промпта Livera.
    Важнее продолжение — [ролик для продукта Distilbook](https://x.com/ajith_io/status/2103469807375208546) (107 777 / 642 / 847 · 40 с): "Research Distilbook. Make a dynamic 40-second motion graphics video on Distilbook that shows what an incredible motion designer you are… Go all out." Это рецепт «изучи продукт → сделай ролик» одной фразой.
    **сильный нишевик**.

11. **[N01ennn · 2108182955671580771](https://x.com/N01ennn/status/2108182955671580771)** — @N01ennn (7 622) · 2026-10-08 · 433 887 / 5 644 / 13 703 · 22,7 с.
    Список 20 репозиториев под Opus 5.5. Для нас важны:
    - claude-motion (whaleyxbt): "checks its own frames, sound written in code";
    - claude-motion-design (howseen-ai): "HTML, Playwright and ffmpeg, no Remotion";
    - motion-graphics-skills (charlie947): "13 skills for launch videos";
    - product-launch-motion (AbubakrChan): "voice-over, camera, color grade".

    Тот же список дал [RoundtableSpace](https://x.com/RoundtableSpace/status/2108456177029845346) (129 868 / 1 101 / 2 652).
    **сильный нишевик** (подборка, репо не проверены).

12. **[rameerez · 2015859121661059569](https://x.com/rameerez/status/2015859121661059569)** — @rameerez (10 456) · 2026-01-26 · 316 499 / 1 717 / 2 095 · 28 с (4K).
    Инструмент: Remotion + Claude Code. Лонч-ролик своего SaaS для лицензионных ключей; "spending my entire weekend on this, 2-3 days of work".
    Разоблачение тренда: "They all claimed 'I made this with just one prompt', but it was just bait". Подробный [туториал](https://x.com/rameerez/status/2016208478843318488) — лучший источник приёмов, разобран в разделе 3. Ответ @gvrizzo: "the best *real* video made with Remotion+AI until now".
    **сильный нишевик**.

13. **[sandraleow · 2013908334693527632](https://x.com/sandraleow/status/2013908334693527632)** — @sandraleow (45 588) · 2026-01-21 · 308 716 / 1 953 / 2 276 · 23,6 с.
    "remotion + claude code almost one-shotted this full promo video ~30 sec video with animations, transitions, product demos, brand colors, and background music".
    Критика в ответах: "This looks like a PowerPoint animation" (@georgegordon). Образец ловушки «почти сразу = почти слайды».
    **сильный нишевик**.

14. **[agibjames · 2014570041602437594](https://x.com/agibjames/status/2014570041602437594)** — @agibjames (771) · 2026-01-23 · 272 014 / 671 / 963 · 25,6 с.
    Ролик для SaaS @postbridge_: Remotion + Claude Code + Antigravity. В ответах: 2–3 дня, лимиты Claude Code кончились «within a couple hours», доделывал в Antigravity. "after I added the remotion skill it was pretty good". Основатель postbridge ответил благодарностью.
    **сильный нишевик**.

15. **[Arcane_Aii · 2069039170451091878](https://x.com/Arcane_Aii/status/2069039170451091878)** — @Arcane_Aii (31 782) · 2026-06-22 · 234 288 / 2 240 / 5 374 · 22,5 с.
    Скилл **/brag** ([github.com/latent-spaces/brag](https://github.com/latent-spaces/brag)): "turns any side project into a fire ~20-second launch video", на HyperFrames, с музыкой, звуками и текстом поста.
    Дополнение [Voxyz_ai](https://x.com/Voxyz_ai/status/2104586932357603600) (33 717): "It reads your code, shows your real product in use". На Opus 5.5 — облегчённый brag-slim; флаг `--tone`. Совет: "Have it go back over the video second by second". Есть порт для Codex (mattivilola/brag-codex, ответ @mvilola).
    **сильный нишевик**.

16. **[timkochjar · 2092278549679886507](https://x.com/timkochjar/status/2092278549679886507)** — @timkochjar (706) · 2026-08-25 · 230 428 / 2 602 / 3 351 · 95,3 с (3840×2160).
    Инструмент: Remotion + Claude Code, **без скиллов**. Демо-ролик SaaS «Tables» (постер — голубое стекло с логотипом).
    Главный приём (ответ автора, 78 лайков): "hook it up to your codebase and allow it to replicate your entire component library with the exact styles and functionality. So you can create 1:1 animations of your actual platform". Всё в одном таймлайне Remotion, переходы тоже. Шли по сценам, параллельными чатами. Референсы — ролики из X. 1–2 дня. Бюджет: «claude code subscription + $50 sound pack + 10$ for background music», звуки добавлены после.
    **сильный нишевик**.

17. **[kimmonismus · 2102844654169575547](https://x.com/kimmonismus/status/2102844654169575547)** — @kimmonismus (150 224) · 2026-09-23 · 202 702 / 2 703 / 1 647 · 180 с.
    3-минутный фильм кодом: "~7,400 lines of React/TypeScript (Remotion)", открытый TTS, музыка синтезирована в Python. "Tookl about 1h and 7% weekly rates". Полный промпт в ответе автора, ключ: "Before building, write STORYBOARD.md…" и "After each scene, render 3–4 stills (npx remotion still) and look at them critically".
    Критика: голос TTS «режет ухо» (@Zjolou). @bcherny ответил: "I am so excited about the potential of using Claude to explain any complicated concept".
    **сильный нишевик**.

18. **[om_patel5 · 2033056646595850498](https://x.com/om_patel5/status/2033056646595850498)** — @om_patel5 (27 228) · 2026-03-15 · 185 761 / 1 153 / 2 715 · 68,5 с.
    Процесс «демо для стартапа»: Remotion + скиллы `remotion-transitions` и `frontend-design`. Сначала SVG-иллюстрации фич прямо в компонентах лендинга, потом ролики: "first reel: 1 hours… now under 10 minutes per reel", "$0 production costs besides claude code subscription".
    Ответ @0xdak_ (8 лайков): сервис landingvideo.com — «paste any URL → scrapes your site, extracts colors, screenshots, copy → generates a remotion video».
    **сильный нишевик**.

19. **[deedydas · 2104957026199900220](https://x.com/deedydas/status/2104957026199900220)** — @deedydas (257 086) · 2026-09-29 · 153 616 / 2 074 / 4 341 · 240 с.
    10 часов отладки конвейера: "Use it with Claude Code, not the app"; "Manim, Hyperframes, Motion Canvas for motion graphics"; скилл раскадровки; скилл субтитров; "a critic skill which takes screenshots". "Explicitly tell it to avoid Claudisms like short punchy sentences and a lot of numbers". В промпте: что, соотношение сторон, длина, стиль.
    **сильный нишевик**.

20. **[twoclipping · 2103835273813496100](https://x.com/twoclipping/status/2103835273813496100)** — @twoclipping (8 447) · 2026-09-26 · 136 279 / 2 156 / 3 761 · 29 с.
    «Apple-keynote launch film» одним промптом с блоками `<build>` и `<gotchas>`. Фрагменты: "one continuous take. Every scene is made out of the previous one: nothing fades, blurs or cuts", "A cursor drives every change with real clicks, drags and long-presses", "The camera zooms screen-studio style".
    Сборка: один HTML 1440×1440; "Every style is computed from time inside an async seek(t)"; рендер Playwright, "4 subframes per frame blended with ffmpeg tmix, 60fps"; звук: "a downloaded SFX for every event (Mixkit), never synthesized", "Loudnorm to -14 LUFS".
    Тот же автор: [шаблон «вставь свой продукт»](https://x.com/twoclipping/status/2104674464868762046) (48 501 / 718 / 1 019 · 22 с) — "Every morph glides for 0.8s on cubic-bezier(.45,0,.15,1) and the camera zoom rides the same curve".
    **сильный нишевик**.

21. **[Voxyz_ai · 2104194355556671987](https://x.com/Voxyz_ai/status/2104194355556671987)** — @Voxyz_ai (23 998) · 2026-09-27 · 129 089 / 709 / 1 439.
    Команда из 4 сабагентов в `~/.claude/agents`:
    - reference-breaker — ffmpeg по кадру в секунду, плитка, разбор темпа, шрифтов, переходов;
    - storyboarder — 3 варианта, потом `npx hyperframes snapshot` по сцене;
    - основная сессия строит, `npx hyperframes render --quality draft`;
    - film-reviewer — посекундно, P0/P1/P2, "Review only; don't edit".

    Референсы — whatships.com, "2,000+ product launch videos".
    **сильный нишевик**.

22. **[LexnLin · 2104148233106723099](https://x.com/LexnLin/status/2104148233106723099)** — @LexnLin (22 893) · 2026-09-27 · 98 537 / 1 357 / 1 403 · 33 с.
    Лонч-ролик вымышленного календаря: "ONE prompt, it cooked for about 8h name, logo, UI, animations, soundtrack, sound effects". Уточнение автора: 8 ч включают ревью и запись (облачный агент). Репо: [Leonxlnx/claude-launchvideo](https://github.com/Leonxlnx/claude-launchvideo).
    Ответы: "by far the best launch video generated by opus 5.5" (@preferedev) и "i dont like the 'music' it creates" (@Wittipreneur).
    **малыш** (на границе).

23. **[RoundtableSpace · 2109203601902174297](https://x.com/RoundtableSpace/status/2109203601902174297)** — @RoundtableSpace (266 659) · 2026-10-11 · 97 701 / 568 / 1 196 · без видео.
    **Прямой рецепт «сайт → ролик»**: "Paste this into Claude Code and your website turns into a 30-second launch video." Промпт: "Read my site at [URL] and pull the headline, 3 key features, brand colors and logo". Таймлайн: 0–3 с — логотип на фирменном цвете; 3–8 с — заголовок кинетической типографикой «one word at a time»; 8–23 с — по сцене на фичу "with real UI screenshots and smooth GSAP transitions"; 23–30 с — CTA и URL. "Show me 3 still frames for approval, then render the MP4."
    Ответы: "the '3 stills for approval' step is where the time goes" (@Sebasti54919704) и открытый вопрос "does it end up faking [screenshots]?" (@Greg_GL_87).
    **сильный нишевик** (аккаунт 267 тыс.).

24. **[everestchris6 · 2104234619025682463](https://x.com/everestchris6/status/2104234619025682463)** — @everestchris6 (25 455) · 2026-09-27 · 69 328 / 326 / 886 · 28,6 с.
    **Motion Video Kit** ([echris6/motion-video-kit](https://github.com/echris6/motion-video-kit)): "it plans every shot, builds the 3d components, handles the editing and sound, and runs every cut past a critic until it's good enough to sell". Статья автора — [x.com/i/article/2104231792211578880](https://x.com/everestchris6/status/2104231799090217078) (244 163 просмотра; тело не прочитано).
    Пересказ [tetumemo](https://x.com/tetumemo/status/2105432531386655147): кит разобрал 28 профессиональных лонч-роликов SaaS. Принцип «Builder ≠ Judge» — критик не знает, как делали ролик.
    **малыш** (ценен приёмом «судья отдельно»).

25. **[steventey · 2103625902211088880](https://x.com/steventey/status/2103625902211088880)** — @steventey (59 360, основатель dub.co, ex-Vercel) · 2026-09-25 · 43 437 / 413 / 295 · 15,1 с.
    "We one-shotted this promo video for @dubdotco using Opus 5.5 High via @cursor_ai". Промпт выложил инженер dub [pedrooladeira](https://x.com/pedrooladeira/status/2103659095559389580) в ответах: промпт Livera + "it should be a launch saas video for https://dub.co… I sent it in the Dub repository."
    Постер ролика: тёмный фон, оранжево-градиентная плашка `dub.sh/launch` (снято глазами в браузере 2026-10-12).
    **сильный нишевик** (SaaS-основатель; охват — малыш).

**Ещё по теме «страница → ролик» (малыши, ценны приёмом):**

- [liu8in · 2104707129101988095](https://x.com/liu8in/status/2104707129101988095) — VP HeyGen (8 463) · 2026-09-28 · 22 833 просмотра. X-статья (прочитана в браузере):
  - скилл HyperFrames `/product-launch-video` "starts by capturing it: hyperframes capture pulls the site's screenshots, copy, assets, colors and fonts into the project", потом дизайн-спека → раскадровка → сцены;
  - сравнение одного промпта со скиллом и без: «make a 30 second product launch video for heygen.com»;
  - замер на 70 «one-shot» промптах из X: ~55% рисуют кадры в Python → FFmpeg, ~треть — HTML в headless-браузере;
  - с CLI HyperFrames — медиана 1 рендер вместо 2 и «about half the token cost».
- [HyperFrames_ · 2070760432609165443](https://x.com/HyperFrames_/status/2070760432609165443) — 13 060 · 40,1 с: "this is one-shot with our /product-launch-video skill".
- [MakerThrive · 2086597834753659234](https://x.com/MakerThrive/status/2086597834753659234) — (57 126) · 2026-08-09 · 11 470 · 30,1 с: "paste any URL → get a launch video… scrapes your site + logo, writes the value prop, records your actual product, adds AI voiceover + music, cuts it all on beat". Связка Firecrawl + Remotion + ElevenLabs; продаётся как сервис. Ответ: "Looks and sounds like shit" (@i2ichardlin).
- [alex_prompter · 2103499977632997524](https://x.com/alex_prompter/status/2103499977632997524) — (282 925) · 41 761 · 34,5 с. 30-секундный эксплейнер бизнеса, 5 сцен: "The customer's problem, what I do, how it works in 3 steps, one proof point, and my name at the end." Дальше «notes one at a time. 'Slower.' 'More energy.' 'Add a scene about pricing.'»
- [Voxyz_ai · 2108543002830360775](https://x.com/Voxyz_ai/status/2108543002830360775) — 63 689 / 733 / 1 331. Промпт по гайду Claude Motion: пройти "README, landing page, onboarding flow, recent release notes", найти «A flow one screenshot can't explain» и «A change that falls flat as a bare number». Для каждого — для кого, где играет, сколько длится; раскадровка в секундах; "all the text, numbers and timings kept in one place"; черновик → кадр в секунду → 1080p.
- [ArchiveExplorer · 2105023417716191488](https://x.com/ArchiveExplorer/status/2105023417716191488) — 41 014. Конвейер:
  - бренд-папка → `DESIGN.md`;
  - референс, рендерер, компоненты 21st.dev;
  - 3 раскадровки → стоп-кадры;
  - команда из 4 агентов;
  - нарезка рекламы 9:16, 1:1, 16:9;
  - герой лендинга — петля из ролика.
- [_tvman_01 · 2109346311959093458](https://x.com/_tvman_01/status/2109346311959093458) — 4 803 · 27 с, вертикаль 720×1280: "Mavin website ad using claud opus 5.5 + hyperframes" — сайт → реклама. Совет в ответах (араб.): загрузить свой шрифт, не давать Claude выбирать.
- [jianxliao, ответ к jasonzhou1993](https://x.com/jasonzhou1993/status/1948355284591956447): "I just asked CC to create an animation from our landing page" (2025).
- [kapish_dima · 2062596204546953688](https://x.com/kapish_dima/status/2062596204546953688) — 30 416: Remocn — реестр shadcn с готовыми анимациями для Remotion. В ответе rexan_wong: "use the ready-made components so you don't burn tokens".

## 2. Повторяющиеся конвейеры

**A. Remotion + Agent Skills в Claude Code, режиссура по сценам** (самый массовый с 20.01.2026).

Шаги:
1. `npx create-video` → `npx skills add remotion-dev/skills` ([Remotion](https://x.com/Remotion/status/2013626968386765291)); Skills 2.0 с подскиллами — [17.08.2026](https://x.com/Remotion/status/2089295038932996194).
2. Открыть Remotion Studio, рядом запустить `claude`.
3. Сцена = компонент: «master composition», `<Sequence>`.
4. Правки фразами по одной.
5. Стоп-кадры `npx remotion still` после каждой сцены ([kimmonismus](https://x.com/kimmonismus/status/2102844654169575547)).
6. `render`.

Время и цена (самоотчёты):
- 31 промпт на 8 с — Remotion;
- 2–3 дня — [rameerez](https://x.com/rameerez/status/2015859121661059569), [agibjames](https://x.com/agibjames/status/2014570041602437594);
- 1–2 дня + $60 на звук — [timkochjar](https://x.com/timkochjar/status/2092278549679886507);
- 3 мин фильма ≈ 1 ч и 7% недельного лимита — kimmonismus;
- первый ролик 1 ч, дальше < 10 мин — [om_patel5](https://x.com/om_patel5/status/2033056646595850498);
- «~5 minutes» на черновое промо — @yrzhe_top в ответах Remotion.

Слабое место — лимиты подписки: agibjames, timkochjar.

**B. HyperFrames (HTML + GSAP → MP4) + скилл** (с июня 2026; после Opus 5.5 — основной).

Шаги:
1. `npx skills add heygen-com/hyperframes`.
2. Скилл `/product-launch-video`: `hyperframes capture` снимает с сайта скриншоты, копирайт, цвета, шрифты → дизайн-спека → раскадровка → сцены ([liu8in](https://x.com/liu8in/status/2104707129101988095)).
3. Стоп-кадры (`npx hyperframes snapshot`) → черновой рендер (`--quality draft`) → посекундный разбор → финал ([Voxyz_ai](https://x.com/Voxyz_ai/status/2104194355556671987)).

Вариант без скилла — промпт [RoundtableSpace](https://x.com/RoundtableSpace/status/2109203601902174297) с URL. Вариант «из кода проекта» — `/brag` ([Arcane_Aii](https://x.com/Arcane_Aii/status/2069039170451091878)).

Оценки (заявления, не проверены): ролик ~20 с «in seconds» у brag; рендер дешевле вдвое с CLI HyperFrames — liu8in. Правка готового — в HyperFrames Studio, обвести кадр ([HyperFrames_](https://x.com/HyperFrames_/status/2107149824189698558)).

**C. Один большой промпт на Opus 5.5 Max, без фреймворка.**
- Короткая форма — промпт Livera «your showreel… go all out» + имя продукта или URL. Запускать в репозитории продукта: [steventey/dub.co](https://x.com/steventey/status/2103625902211088880), [ajith_io/Distilbook](https://x.com/ajith_io/status/2103469807375208546).
- Длинная форма — сценарий 5–9 тыс. знаков блоками `<inputs>/<direction>/<structure>/<build>/<gotchas>/<start>` ([twoclipping](https://x.com/twoclipping/status/2103835273813496100)).
- Модель сама пишет кадр как функцию времени f(t) и склеивает через ffmpeg или Playwright (liu8in: 64 из 74 прогонов).
- Время: «Claude did it all in one go» (Livera); 8 ч без присмотра, вместе с ревью ([LexnLin](https://x.com/LexnLin/status/2104148233106723099)).

**D. «Студия из агентов»: референс → разбор → 3 раскадровки → стоп-кадры → сборка → критик.**
- [rexan_wong](https://x.com/rexan_wong/status/2103707054108299437) (18 тыс. закладок);
- [Voxyz_ai](https://x.com/Voxyz_ai/status/2104194355556671987) — готовый промпт создания 4 сабагентов;
- [ArchiveExplorer](https://x.com/ArchiveExplorer/status/2105023417716191488) — плюс `DESIGN.md` и нарезка 9:16, 1:1, 16:9;
- [Motion Video Kit](https://x.com/everestchris6/status/2104234619025682463) — «Builder ≠ Judge».

Источники референсов: whatships.com (2 000+ лонч-роликов), prompt-motion.com (226 роликов с промптами).

**E. Готовые продукты поверх того же подхода.**
- Claude Motion: бета с 08.10.2026, только Team и Enterprise; «point at part to edit», экспорт MP4 ([claudeai](https://x.com/claudeai/status/2108271558170976743)).
- Higgsfield Katana через MCP внутри Claude ([higgsfield](https://x.com/higgsfield/status/2108294775644585998)).
- URL → видео: [MakerThrive](https://x.com/MakerThrive/status/2086597834753659234) (Firecrawl + Remotion + ElevenLabs), landingvideo.com (ответ @0xdak_ в ветке om_patel5), Creatify «URL-to-Video» ([пост](https://x.com/Creatify_AI/status/2103541337085919592), видеомодель, не код).

## 3. Конкретные советы из веток

**Что ломается**
- **Дефолтный вид.** Без референса Opus делает "centered text, gradient background, everything fading in" ([rexan_wong](https://x.com/rexan_wong/status/2103707054108299437), [ArchiveExplorer](https://x.com/ArchiveExplorer/status/2105023417716191488)). Оранжево-чёрная гамма — новый «признак ИИ» ([@bors___](https://x.com/p4nthera_/status/2107175720086589633)). Почти сразу = «PowerPoint animation» ([sandraleow](https://x.com/sandraleow/status/2013908334693527632)).
- **Рывки.** "Every animation and transition tends to come out janky and jump the first time". Лечение — найти кадр рывка и назвать номер кадра ([rameerez, туториал](https://x.com/rameerez/status/2016208478843318488)).
- **Фальшивый UI.** Нарисованный с нуля продукт "looks off. wrong spacing, placeholder boxes, fake-looking buttons" (rexan_wong). Лечение — подключить библиотеку компонентов из кода ([timkochjar](https://x.com/timkochjar/status/2092278549679886507)), компоненты 21st.dev, настоящие скриншоты.
- **Звук.** Музыка, синтезированная кодом, звучит дёшево ([LexnLin](https://x.com/LexnLin/status/2104148233106723099), ответы). Правило: "Don't synthesize the music or the sound effects in code" ([Voxyz_ai](https://x.com/Voxyz_ai/status/2109358372873183564)). Синхронизация звука — главная трудность ("the challenge is sync up audio & video timestamp accurately" — [jasonzhou1993](https://x.com/jasonzhou1993/status/1948355284591956447)). Открытый TTS режет ухо ([kimmonismus](https://x.com/kimmonismus/status/2102844654169575547)).
- **«Один промпт» — приманка.** "1 prompt = 20+ behind the scenes" (@markfersh у rameerez). У [abdullah4204k](https://x.com/abdullah4204k/status/2045502689447125432) — реклама агентства под видом «7 промптов». Ответы: "Fake...".
- **Лимиты и время.** Лимиты Claude Code кончаются за часы (agibjames, timkochjar). Первые 2–3 секунды у rameerez заняли целый день.
- **Технические ловушки** ([twoclipping](https://x.com/twoclipping/status/2103835273813496100), `<gotchas>`):
  - "backdrop-filter: url() misreads displacement maps in Chromium";
  - заливка экрана должна выходить за углы и длиться ~0,3 с;
  - "python http.server can't range-seek video" — видео через blob URL;
  - видеофон перекодировать all-intra (`ffmpeg -g 1`).

**Что делает «дорого»**
- **Референс, а не описание.** «make it like this» бьёт «make it modern and punchy» (ArchiveExplorer). Разбор референса — кадр в секунду в одну плитку (Voxyz_ai). rameerez смотрел ролики Apple на 0,25x покадрово «целый вечер».
- **Непрерывность.** "one continuous take… nothing fades, blurs or cuts. Objects change shape instead" (twoclipping). У rameerez: «If things are already moving up, the next thing probably wants to move up too». Главный персонаж — одна фигура, которая переживает сцены: у него коробка лицензионного ключа.
- **Кривые.** Пружины «a tiny overshoot at most» или "0.8s on cubic-bezier(.45,0,.15,1) and the camera zoom rides the same curve" ([twoclipping, шаблон](https://x.com/twoclipping/status/2104674464868762046)). У Remotion: spring damping 200 / stiffness 100, лесенка строк 50 мс, 3D-поворот 20° и медленный поворот по Y (gist). Не писать «smooth» — давать кривые, длительности, пружины ([unknownnode404](https://x.com/unknownnode404/status/2108498860586754470)).
- **Курсор и камера.** Курсор делает настоящие клики и перетаскивания. Камера зумом «screen-studio style», «so each moment fills the square» (twoclipping).
- **Ритм.** "120 BPM… something happens on every beat". Нажатие — на дроп музыки.
  Звуковой рецепт [Voxyz_ai](https://x.com/Voxyz_ai/status/2109358372873183564):
  - доли такта — librosa;
  - большие движения — на долю;
  - на каждую склейку готовый SFX: whoosh / pop / click;
  - голос громче музыки;
  - ~−16 LUFS, пики ниже −4 dBFS, мерить готовый MP4 через ebur128.
- **Плавность рендера.** 60 fps, по 4 подкадра на кадр, смешанные `ffmpeg tmix` — даёт размытие движения (twoclipping).
- **Ключевые кадры — константами.** "Ask the AI to parameterize all important keyframes" (rameerez). У гайда Claude Motion: все тексты, числа и тайминги в одном месте, правка «change this number to 18%» трогает одно место ([Voxyz_ai](https://x.com/Voxyz_ai/status/2108543002830360775)).
- **Сценарий до кода.** Одна главная мысль, 3–4 фразы по 3–4 слова — это весь текст ролика. Больше сил в первые секунды — «хук» (rameerez).
- **Раскадровка и стоп-кадры до движения.** "fixing a storyboard is way cheaper than fixing a render" (rexan_wong). STORYBOARD.md и 3–4 стоп-кадра на сцену ([kimmonismus](https://x.com/kimmonismus/status/2102844654169575547)).
- **Критик отдельно.** Ревьюер смотрит посекундно и не правит: P0/P1/P2 (Voxyz_ai, brag). «Builder ≠ Judge» (Motion Video Kit).
- **Заметки режиссёра словами камеры.** "slow every zoom to 0.7x", "hard cut here", "push in on the button" (rexan_wong). «make it better» даёт случайные правки.
- **Против «клодизмов» в закадровом тексте.** "Narrate like a university professor" ([deedydas](https://x.com/deedydas/status/2104957026199900220)).

**Скиллы и наборы промптов, которыми делились** (названия из постов, звёзды и качество не проверены):
- `remotion-dev/skills` и remotion.dev/prompts ([Remotion](https://x.com/Remotion/status/2019732439502053748));
- `heygen-com/hyperframes` + `/product-launch-video`;
- `latent-spaces/brag`;
- `echris6/motion-video-kit`;
- whaleyxbt/claude-motion, howseen-ai/claude-motion-design, charlie947/motion-graphics-skills, AbubakrChan/product-launch-motion ([N01ennn](https://x.com/N01ennn/status/2108182955671580771));
- `diffusionstudio/skills` ([Caseymanos](https://x.com/Caseymanos/status/2093426839008264272));
- Remocn, 21st.dev;
- галереи: prompt-motion.com, whatships.com;
- 8 промптов эксплейнеров ([claudeskills101](https://x.com/claudeskills101/status/2107170117243310471), 440 800 / 8 205 закладок).

## 4. Что ближе всего к нашей SaaS-странице — три образца

1. **[RoundtableSpace — «Paste this into Claude Code and your website turns into a 30-second launch video»](https://x.com/RoundtableSpace/status/2109203601902174297)** вместе со скиллом HyperFrames `/product-launch-video` и `hyperframes capture` ([liu8in](https://x.com/liu8in/status/2104707129101988095)).
   - **Брать:**
     - сам маршрут «агент читает страницу → вынимает заголовок, 3 фичи, цвета, логотип»;
     - таймлайн 30 с: логотип 0–3 → заголовок по слову 3–8 → по сцене на фичу с настоящими скриншотами 8–23 → призыв и адрес 23–30;
     - шаг «3 стоп-кадра на утверждение до рендера»;
     - 1080×1920 для X и Reels.
   - **На нашу страницу:**
     - герой → заголовок кинетической типографикой;
     - карточки сценариев → 3 сцены;
     - «3 шага» → одна сцена-схема;
     - цифры → счётчики;
     - цены → финал с адресом.
   - **Риск:** без референса выйдет «дефолтный вид». Поэтому добавить пункты из образцов 2 и 3.

2. **[timkochjar — демо SaaS «Tables», 95 с в 4K](https://x.com/timkochjar/status/2092278549679886507)**.
   - **Брать:** не скриншоты, а настоящие компоненты продукта из кода ("1:1 animations of your actual platform"). Один таймлайн Remotion. Сцены параллельными чатами. Звуки отдельным проходом, библиотека SFX ~$50.
   - **На нашу страницу:** у vibecoding.tech есть код карточек, таблицы сравнения и цен — оживлять сами элементы. Плюс совет rameerez: «a dashboard… it's just a box with rounded corners, you can reshape it».

3. **[steventey — промо dub.co, 15 с, одним промптом в репозитории продукта](https://x.com/steventey/status/2103625902211088880)**, промпт Livera + "launch saas video for https://dub.co".
   - **Брать:**
     - запуск внутри репозитория сайта — агент видит бренд и компоненты;
     - тёмная SaaS-эстетика с одним акцентом — постер: чёрный фон и оранжевая плашка `dub.sh/launch`;
     - длина 15 с;
     - короткий промпт, который даёт модели «право на вкус».
   - **Поверх** — блок `<direction>` правил twoclipping: непрерывный кадр, курсор, зум камеры, всё на долю такта, список запретов. И отдельный критик посекундно (Voxyz_ai, brag).

Скелет сценария для всех трёх — 5 сцен [alex_prompter](https://x.com/alex_prompter/status/2103499977632997524): «проблема → что делаем → как это работает в 3 шага → одно доказательство → имя». Он почти совпадает с порядком секций нашей страницы. Вопрос «для кого, где играет, сколько длится» — из гайда Claude Motion ([Voxyz_ai](https://x.com/Voxyz_ai/status/2108543002830360775)).

## 5. Не найдено / сомнительно

- **fxtwitter `/2/search` 12.10.2026 лежал.** Ответ `{"code":404,"results":[],"cursor":{"top":null,"bottom":null}}` на `remotion`, `claude code`, `remotion claude` и с операторами — 10+ попыток. `/2/profile/<handle>/statuses` отвечал через раз; `/status/` и `/2/conversation/` работали. Обход — x.com/search во встроенном браузере. Вкладка Top давала 2–19 постов на запрос, Latest уходила вглубь только на 1–2 дня. Значит, срез охватывает самые заметные посты, а не всё подряд.
- **Ролик именно из SaaS-страницы с таблицей сравнения, ценами и FAQ не найден.** Самое близкое — промпт RoundtableSpace (без готового видео), MakerThrive (11 тыс. просмотров), _tvman_01 (4,8 тыс.). Как анимировать таблицу сравнения и FAQ — никто не показал.
- **Motion Canvas + Claude.** Сильных постов нет: Motion Canvas встречается только строкой в подборках ([deedydas](https://x.com/deedydas/status/2104957026199900220), [unknownnode404](https://x.com/unknownnode404/status/2108498860586754470)). В найденных лонч-роликах он не используется.
- **from:bcherny** про видео и промо — ничего: только просьбы «пришлите видео бага» и посты про Claude Code. Его единственная реплика по теме — ответ kimmonismus про объяснение сложных понятий.
- **from:JNYBGR** — только посты продукта Remotion. Ближайшее: [2013650328919405054](https://x.com/JNYBGR/status/2013650328919405054) (247 579) — "Created this video without writing any code" и [скилл Maps](https://x.com/JNYBGR/status/2015059120080977936).
- **Видео глазами не просмотрены.** Панель браузера не рисует кадры X-видео. Видны только постеры: dub.co, Tables, Motion Video Kit, LexnLin. «Почему вау» — по тексту автора и ответам.
- **Тела X-статей не прочитаны** (кроме liu8in и domschats — последняя про дистрибуцию, не по теме). Остались: everestchris6 (244 тыс. просмотров, «как вести ИИ-видеоагентство»), 0xwhrrari (657 тыс., «студия, а не промпт»), RaphaelAubryy (402 тыс., 4,3 тыс. закладок), twoclipping (224 тыс.), DeRonin_ (4,2 млн, тема неизвестна), mvanhorn (307 тыс.), boringmarketer, free_ai_guides. Кандидаты на следующий пасс.
- **Не проверено.** Звёзды и качество репозиториев (brag «11K stars», HyperFrames «30,000 stars in days»), цифры времени и цены — самоотчёты авторов. Claude Motion не тестировали: бета только Team/Enterprise.
- **Сомнительно.** «Один промпт» у twoclipping оспаривают в ответах. abdullah4204k — вероятно, ролик агентства: его ответ — реклама Addxstudio, в ответах "Fake" — в топ не включён. [Mho_23](https://x.com/Mho_23/status/2069838139171250629) (171 тыс.) — генератор рекламы на видеомоделях с воронкой «RT + reply», не код — вне темы.
- **Не искали.** Русскоязычные посты (`lang:ru`) и TikTok, YouTube — вне угла X-only.

**Журнал запросов (x.com/search, 2026-10-12):** `claude code remotion min_faves:200` · `remotion min_faves:500 since:2026-01-01` · `remotion min_faves:300 since:2026-03-01` · `hyperframes min_faves:50` · `hyperframes min_faves:30` [latest] · `hyperframes min_faves:200` [latest] · `"launch video" claude min_faves:50` [latest] · `"claude code" video min_faves:1000 since:2026-01-01` · `"made with claude code" filter:videos min_faves:50` · `"launch video" "claude code" min_faves:100` · `"remotion skill" OR "remotion skills" min_faves:100` · `"landing page" video (claude OR opus OR remotion OR hyperframes) min_faves:100` · `("promo video" OR "product video" OR "demo video") (claude OR remotion OR opus) min_faves:100` · `from:claudeai (motion OR video OR animation)` · `"claude motion" min_faves:300` · `from:JNYBGR min_faves:100` · `from:Remotion min_faves:150` · `(website OR site OR url) ("into a video" OR "to video" OR "launch video" OR "promo video") (claude OR remotion OR hyperframes OR opus) min_faves:50` · `"motion canvas" (claude OR agent OR cursor OR opus)` · `opus 5.5 (motion OR video OR animation) min_faves:2000` · `saas (remotion OR "claude motion" OR hyperframes) min_faves:30` · `from:bcherny (video OR remotion OR motion OR animation)` · `(remotion OR hyperframes OR "claude motion") (screenshot OR screenshots OR "screen recording" OR playwright OR firecrawl) min_faves:20` · `"/brag" (claude OR skill)` · `explainer ("claude code" OR opus OR remotion) video min_faves:300` · `("hyperframes capture" OR "product-launch-video" OR "website-to-video" OR "url to video")` · `remotion "landing page" min_faves:20` · `(remotion OR hyperframes OR opus) ("screen studio" OR "camera zoom" OR "3d tilt" OR "camera moves") min_faves:20` — 28 запросов. Плюс 93 карточки постов (77 + 12 + 4) и 30 веток через fxtwitter.
