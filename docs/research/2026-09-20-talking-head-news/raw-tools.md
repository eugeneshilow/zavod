# Сырьё без редактуры, угол инструменты и право; канон — README пасса. Окно сбора: официальные страницы + пресса + практики, 2026-09-20

Задача среза: как в 2026 машиной, без ежедневной съёмки, делать ролик 45–60 с
«говорящая голова читает 3 новости про ИИ на русском» — цифровой двойник владельца
(лицо + голос по образцу) или синтетический ведущий.

Класс источника у каждого факта: **официоз** (сайт/доки вендора, госпортал) ·
**пресса** (СМИ, отраслевые издания) · **практики** (форумы, отзывы, тесты, блоги).
Дата проверки — дата фетча страницы. Ключевые цены — дословной цитатой.

## Как читать этот файл

- **0** — сквозной край: оплата из РФ, аренда GPU, русский липсинк, цена сценария и склейки
- **1A** — аватар-платформы: HeyGen · Synthesia · Hedra · Captions/Mirage · Argil · D-ID
- **1B** — видеомодели с речью и открытые липсинк-модели
- **1C** — добор: Tavus · Elai · Welder · **sync.so**
- **2** — голос: клон на русском и TTS
- **3** — готовые пайплайны «новости → ролик» и автопостинг
- **4** — правовой и платформенный край
- **4Б** — независимая перепроверка российских законов главной сессией
- **5** — себестоимость одного ролика
- **6** — выводы: два стека, развилки, «не найдено»

---



---

## 0. Сквозной край: как из РФ вообще платить за эти сервисы

Это не отдельный инструмент, а фильтр, через который проходит весь список ниже.
Почти все западные аватар- и голос-сервисы российские карты не принимают.

- **ElevenLabs: российские карты не принимаются.** Дословно: «российские карты
  площадка давно не принимает» — [vc.ru, «Как оплатить ElevenLabs из России»](https://vc.ru/services/2925805-kak-oplatit-elevenlabs-iz-rossii),
  публикация 2026-05-15, проверено 2026-09-20, **практики**.
  Там же про бесплатный уровень: без оплаты сервис из РФ работает, ограничение —
  10 000 символов в месяц (по той же статье и по обзору sostav.ru).
- **Комиссии посредников (ElevenLabs, тот же источник, практики, 2026-09-20):**
  дословно «при сумме до 1299 рублей вы переплатите всего 350 рублей»;
  для годовых планов (5–10 тыс. руб.) — дословно «комиссия составит 20%»;
  для корпоративных платежей от 100 тыс. руб. — дословно «всего 5-7%».
  Практический ориентир: **+10–20 % к цене подписки** на мелких суммах.
- **HeyGen: та же картина** — «Сервис принимает только зарубежные карты, поэтому
  платежи российских банков автоматически отклоняются» (сводка по обзорам
  [sostav.ru](https://www.sostav.ru/blogs/292047/98386) и
  [РБК Компании](https://companies.rbc.ru/news/afiXh0367k/kak-oplatit-podpisku-heygen-iz-rossii-v-2026-godu/),
  проверено 2026-09-20, **пресса/практики**). Целая индустрия посредников
  (oplata.guru, notruble.ru, raketapay.ru, Oplatym, inOplata) существует именно
  потому, что прямой оплаты нет.
- **Вывод по классу риска:** любой западный SaaS из списка = оплата через
  посредника (наценка 10–20 %), зарубежную карту или счёт в банке СНГ. Это не
  блокер, но это (а) лишние деньги, (б) риск блокировки аккаунта за
  несоответствие платёжного региона, (в) невозможность автоматического
  списания «навсегда» — подписку надо продлевать руками.
- **Российские сервисы (Yandex SpeechKit, SaluteSpeech) платятся рублями с
  российской карты/по счёту** — это их главное преимущество в этом сценарии,
  а не качество.
- **Открытые модели на своей/арендованной GPU** — способ полностью обойти
  платёжный край (аренда GPU в РФ платится рублями). Подробности — в 1B и 2.

### 0.1. Аренда GPU в РФ (рублями) — база для «открытого» стека

- **immers.cloud, RTX 4090 (24 ГБ VRAM)** — дословно из таблицы тарифов:
  «rtx4090-1.8.16.40 | 8 | 16384 | 40 | 1 | 82,76 ₽» (за час).
  Диапазон по конфигурациям 1 карты: 82,76–145,97 ₽/час; 8 карт — 670,97 ₽/час.
  [immers.cloud/gpu/4090](https://immers.cloud/gpu/4090/), проверено 2026-09-20, **официоз**.
- **Агрегатор gpuindex.ru** (справочник цен РФ-провайдеров): минимум по рынку
  «18,45 ₽/час» (VPSVille, конфигурация ×6 карт в пересчёте на карту),
  ML Cloud — «34,25 ₽/час» (помечено «★ лучшая цена»), AdminVPS — «39,27 ₽/час».
  [gpuindex.ru/gpus/nvidia-rtx-4090](https://gpuindex.ru/gpus/nvidia-rtx-4090),
  проверено 2026-09-20, **практики** (агрегатор; в подвале: «© 2026. Цены носят
  справочный характер и не являются публичной офертой», даты обновления нет —
  число брать осторожно).
- Другие названные в обзорах провайдеры РФ: Selectel, Intelion Cloud («от 40₽/час»
  по их же заголовку), tvoy.cloud («RTX 4090 48 ГБ — от 75 ₽/час»), CloudCompute.ru.
  [tproger, подборка облачных GPU 2026](https://tproger.ru/articles/podborka-oblachnyh-gpu-dlya-ml-2026),
  проверено 2026-09-20, **пресса**.
- **Почему это важно для расчёта себестоимости:** открытый стек (липсинк + TTS
  на своей GPU) стоит не «ноль», а стоимость часа аренды, делённую на число
  роликов. При ~83 ₽/час и 5 минутах машинного времени на ролик 60 с это
  **≈ 7 ₽ за ролик** — на порядок дешевле любого западного SaaS, но требует
  инженерной сборки и качество липсинка на русском под вопросом (см. 1B).

### 0.2. Сквозной край: русский липсинк труднее английского

- Практическое наблюдение (класс — **практики**, SEO-блог, проверять): русская
  фонетика тяжелее для липсинк-моделей. Дословно: «у нас больше шипящих, мягких
  согласных, нет резких смычных». Там же про рабочую зону HeyGen: «На фронтальных
  кадрах и роликах до 2-3 минут — да, разницы практически нет» (с английским), но
  «На длинных видео больше 3-5 минут — постепенно накапливаются ошибки артикуляции».
  [vc.ru, «HeyGen LipSync на русском»](https://vc.ru/ai/2938956-heygen-lipsync-pereozyvka-video-bez-vpn),
  публикация 2026-05-20, проверено 2026-09-20, **практики**.
  **Вывод для нашего сценария:** ролик 45–60 секунд — ровно та длина, где русский
  липсинк у топ-сервисов работает без накопления ошибок. Это скорее хорошая новость.
- Там же про режимы HeyGen LipSync: Speed (быстро/дёшево) vs Precision — дословно
  «в два раза дороже, но даёт чистую артикуляцию даже на сложных кадрах».
  Проверить у официоза (см. 1A).

### 0.3. Полноценного РФ-аналога «говорящего аватара» нет

- Обзор аналогов HeyGen, доступных из РФ без VPN, называет Kling AI, Hailuo AI
  (MiniMax), Vidu AI — и честно оговаривает: «ближайшего точного замены нет»,
  китайские сервисы делают видео из текста, но не дают функции «говорящего
  аватара» уровня HeyGen.
  [neyrobiznes.ru, «Аналоги HeyGen в России 2026»](https://neyrobiznes.ru/catalog/analogi-heygen.html),
  обновлено 2026-09-12, проверено 2026-09-20, **практики** (коммерческий каталог —
  доверие среднее).
- Из российских вендоров в обзорах фигурируют только речевые контуры
  (SaluteSpeech — Сбер, SpeechKit — Яндекс) и «Наносемантика» с цифровыми
  аватарами для роботов-операторов, не для контент-роликов.
  [vc.ru, «Российские нейросети 2026»](https://vc.ru/ai/2733649-rossiyskie-neuroseti-2026-modeli-i-servisy-dlya-biznesa),
  проверено 2026-09-20, **пресса**.
- **Промежуточный вывод:** развилка честная — либо западный SaaS через посредника
  (деньги + риск аккаунта), либо своя сборка на открытых моделях (инженерия +
  аренда GPU рублями), либо гибрид: русский голос из РФ-сервиса (SpeechKit/
  SaluteSpeech, рубли) + липсинк открытой моделью на арендованной GPU.

### 0.4. Написание сценария LLM — копейки, в расчёте почти не участвует

Сценарий на 45–60 секунд русской речи ≈ 130–160 слов ≈ 300–400 токенов выхода;
вход (3 новости с текстом) ≈ 1 500–3 000 токенов.

- **Anthropic API, прайс на 2026-06-24** (класс — **официоз**, кешированная
  таблица официальных цен): Claude Haiku 4.5 (`claude-haiku-4-5`) — $1,00 за
  1M входных токенов, $5,00 за 1M выходных; Claude Sonnet 5 — $2,00 / $10,00;
  Claude Opus 5 — $5,00 / $25,00.
- **Арифметика на Haiku 4.5:** 0,003M × $1 + 0,0004M × $5 ≈ **$0,005 за сценарий**
  (полкопейки). На Opus 5 — ≈ $0,025. То есть **написание текста стоит в 100–1000
  раз меньше, чем его озвучка и видео**, и в сравнении стеков его можно округлять
  до нуля.
- Вывод: экономить на LLM в этом пайплайне бессмысленно — вся себестоимость
  сидит в видео-минуте и, в меньшей степени, в озвучке.

### 0.5. Склейка, вертикаль и субтитры — тоже почти бесплатно

- Ролик для коротких форматов нужен вертикальный (9:16) и с вшитыми субтитрами
  (большинство смотрит без звука). Склейка, кроп, наложение субтитров — **ffmpeg
  локально, $0**.
- Субтитры **не требуют распознавания речи**: текст сценария уже известен, а
  основные TTS-API (в т. ч. ElevenLabs) умеют отдавать тайминги символов/слов
  вместе с аудио — значит, SRT собирается из ответа синтеза бесплатно.
- Если всё же понадобится распознавание (например, чтобы получить тайминги от
  сервиса, который их не отдаёт): OpenAI Whisper large-v3-turbo — **$0,006 за
  минуту аудио** ($0,36/час); `gpt-4o-mini-transcribe` — $0,003 за минуту;
  Whisper large-v3-turbo на Groq — $0,04/час.
  [tokenmix.ai, «Whisper API Pricing 2026»](https://tokenmix.ai/blog/whisper-api-pricing)
  и [convertaudiototext.com](https://convertaudiototext.com/blog/openai-whisper-api-pricing-2026),
  проверено 2026-09-20, **практики** (агрегаторы прайсов; официоз OpenAI не
  переоткрывал — ⚠️ цену стоит сверить на openai.com/api/pricing).
  Для ролика 60 с это **$0,006** — то есть тоже округляется до нуля.
- **Вывод:** из пяти шагов пайплайна (новости → сценарий → голос → видео →
  публикация) деньги стоят только голос и видео. Остальное — инженерия, не бюджет.

#### Подтверждение официозом (OpenAI), 2026-09-20

Цены выше сверены на официальной странице прайса OpenAI
([developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing),
проверено 2026-09-20, **официоз**; старый адрес platform.openai.com/docs/pricing
даёт 301 на этот). Дословно из таблиц:

- «gpt-4o-transcribe | Transcription | $2.50 | $10.00 | $0.006 / minute»
- «gpt-4o-mini-transcribe | Transcription | $1.25 | $5.00 | $0.003 / minute»
- «Whisper | Transcription | - | - | $0.006 / minute»
- «tts-1 | Text | $15.00 / 1M characters»
- «gpt-4o-mini-tts | Text | $0.60»

Значит, цифры распознавания подтверждены официозом, а не только агрегаторами.
По TTS: tts-1 — $15 за 1M знаков; ролик 60 с ≈ 900–1000 знаков русского текста,
то есть **≈ $0,015 за озвучку** — но это синтетический голос OpenAI, **не клон
голоса владельца** (клонирования OpenAI официально не даёт; детали — раздел 2).



---

## 1A. Аватары SaaS: HeyGen · Synthesia · Hedra · Captions/Mirage · Argil · D-ID

Срез собран 2026-09-20. Класс источника у каждого факта: **официоз** (сайт вендора) / **пресса** / **практики** (форумы, отзывы, обзоры).

### HeyGen

- **Что делает**: SaaS-студия ИИ-аватаров: текст/аудио → видео говорящей головы. Ветки: Avatar IV (фото-аватар и видео-аватар с эмоциональной мимикой), Digital Twin / Instant Avatar (клон своего лица по видео), Video Agent (промпт → готовый ролик), публичный API.
- **Цена (веб-тарифы)**: дословно с pricing-страницы — Free «$0/mo», «Videos up to 1 min», «Up to 1080P», водяной знак есть, 1 custom avatar. Creator — «$29/mo» (годовой «$24/mo»), 600 кредитов, «Videos up to 30 mins», «1080p video export», водяной знак снят, «175+ languages and dialects». Pro — «$49/mo» (годовой «$40.75/mo»), 1 000 кредитов, «4K video export». Business — «$149/mo» плюс «$20/seat/month», 1 500 кредитов, «Videos up to 60 mins», «5 Custom Video Avatars». Enterprise — «Contact Sales», «No video duration max», API с кастомными условиями. — [heygen.com/pricing](https://www.heygen.com/pricing), 2026-09-20, **официоз**
- **Цена (расход кредитов Avatar IV)**: дословно из хелпа — Photo Look «16 credits per minute», Video Look «31 credits per minute», Photo-to-Video с кастомным движением — кредиты по «2:1 ratio». — [help.heygen.com Avatar IV guide](https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide), 2026-09-20, **официоз**
  - Прикидка: Creator 600 кредитов ÷ 31 = ~19 минут Video-Look-аватара в месяц. Ролик 60 с ежедневно = ~31 мин/мес → Creator не хватает, нужен Pro (1 000 кр ≈ 32 мин).
- **Цена (API)**: официальная таблица ставок **не открылась** — хелп [«HeyGen API Pricing Explained»](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained) ссылается на таблицу, но в выдаче её нет; `developers.heygen.com/docs/pricing` отдал 404; `heygen.com/api-pricing` редиректит в кабинет за логином. Дословно из хелпа: «API usage is measured in **US dollar amount**, and is based on the **type** and **length** of what you generate. Pricing varies by avatar engine and feature». — 2026-09-20, **официоз**
  - Ставки по вторичным обзорам (НЕ подтверждено официозом, **пресса/практики**): Avatar III Digital Twin ~$0.0167/сек, Avatar III Photo ~$0.0433/сек, Avatar IV Photo ~$0.05/сек ($3/мин), Avatar IV Digital Twin и Avatar V ~$0.0667/сек (~$4/мин). — [g2.com разбор API-прайса](https://www.g2.com/articles/heygen-api-pricing), [realtimeavatar.ai](https://realtimeavatar.ai/blog/heygen-api-pricing-explained), 2026-09-20
  - Важно (**пресса**): API оплачивается ОТДЕЛЬНЫМ prepaid-кошельком в USD; покупка Creator/Pro/Business **не даёт** доступа к API.
- **API**: есть, публичный. База `https://api.heygen.com`, аутентификация заголовком `X-Api-Key`, ключ в кабинете `app.heygen.com/developers/api`. Эндпоинты: Video Agent (промпт → ролик), Avatar Video (аватар+голос+скрипт), Cinematic Avatar, Text to Speech; схема «POST create → polling статуса → URL готового видео». — [developers.heygen.com/docs/quick-start](https://developers.heygen.com/docs/quick-start), 2026-09-20, **официоз**
- **Русский**: поддерживается, заявлено «175+ languages and dialects» (официоз, pricing). Практики: русскоязычные обзоры пишут, что липсинк считается от аудиодорожки, поэтому русский обрабатывается наравне с английским; голос по умолчанию звучит без акцента, но «иногда проскакивают неестественные интонации»; отмечают, что HeyGen держит русский лучше конкурентов и не разваливается на роликах длиннее 2–3 минут. — [sostav.ru «HeyGen на русском»](https://www.sostav.ru/blogs/291893/94724), [leantech.ai](https://leantech.ai/ai/heygen/heygen-perevod-video-na-russkiy), [vc.ru «HeyGen LipSync на русском»](https://vc.ru/ai/2938956-heygen-lipsync-pereozyvka-video-bez-vpn), 2026-09-20, **практики**
- **Клон лица (Digital Twin / Instant Avatar)**: обязателен consent-video — короткая запись на камеру, где человек подтверждает согласие; «the consent video must feature the same person as the one in the footage»; для чужого лица человек снимает своё согласие сам (можно по QR со своего телефона). Исходник: рекомендуют снять минимум 2 минуты, лучше до 5 минут. Отдельно есть Avatar 5 / instant-ветка, где клон строится из клипа ~15 секунд. Слоты: Free — 1, Creator и Pro — 5, Business — «10 Digital Twin slots by default — however, new Business purchases in certain regions on or after August 6, 2026 receive 5 slots»; «Each slot allows up to 500 looks for a single avatar»; переснять видео-аватар можно «once per billing cycle (month)»; доп. слот — «$29/month or $300/year». Точное время обучения в FAQ **не указано**. — [Digital Twin FAQ](https://help.heygen.com/en/articles/9380615-digital-twin-faq), [Recording your Consent Video](https://help.heygen.com/en/articles/12092609-recording-your-consent-video), [Avatar Consent (docs)](https://developers.heygen.com/docs/avatar-consent), 2026-09-20, **официоз**
- **Лимиты**: длина ролика по тарифам — Free до 1 мин, Creator/Pro до 30 мин, Business до 60 мин, Enterprise без потолка. Разрешение: Free/Creator до 1080p, Pro и выше — 4K. Водяной знак: есть только на Free. — [heygen.com/pricing](https://www.heygen.com/pricing), 2026-09-20, **официоз**. Ролик 45–60 с вписывается в любой платный тариф.
- **Оплата из РФ**: российские карты не проходят — «Мир», а также Visa/Mastercard российских банков отклоняются платёжным шлюзом (с 2022 г.). Рабочие практики из RU-гайдов: зарубежная карта, виртуальная карта нерезидента или посредник с оплатой в рублях через СБП (выдаёт реквизиты виртуальной карты). Сам сайт из РФ открывается, но регистрация/оплата затруднены. — [vc.ru «Оплата HeyGen из России»](https://vc.ru/services/2116352-oplata-heygen-iz-rossii), [dtf.ru гайд 2026](https://dtf.ru/howto/4948815-kak-oplatit-heygen-v-rossii), [РБК Компании](https://companies.rbc.ru/news/afiXh0367k/kak-oplatit-podpisku-heygen-iz-rossii-v-2026-godu/), 2026-09-20, **практики**
- **Качество (практики)**: реалистичные аватары Avatar IV и V «держат мимику и жесты на уровне, пригодном для лендингов и рекламы»; базовый Avatar III заметно проще и годится для внутренних роликов. Претензии из RU-отзывов: неестественные интонации в русской озвучке; бесплатный тариф сильно урезан (~3 ролика/мес, ~1 мин, водяной знак). — [kkts.ai обзор](https://kkts.ai/ai-tools/video-tools/heygen), [heygen.icu отзывы](https://heygen.icu/otzyvy/), [sostav.ru](https://www.sostav.ru/blogs/291893/94724), 2026-09-20, **практики**

### Synthesia

- **Что делает**: корпоративная студия ИИ-видео: текст → аватар-диктор. Ключевое сейчас — движок Express-2 (полноростовые «expressive» аватары с со-речевой жестикуляцией + клонирование голоса) и Personal Avatar (клон своего лица по видео или фото). Есть REST API.
- **Цена**: дословно с pricing-страницы — Basic «$0/mo», «No credit card required», «1,200 credits/mo», «10 mins of video», «9 AI avatars», водяной знак есть, персональных аватаров нет. Starter — «$29/mo» помесячно / «$18/mo» при годовой, «1,200 credits/mo» (годовой — «14,500 credits/y»), «125+ Synthesia AI Avatars», доступно «Remove Synthesia logo». Creator — «$89/mo» / «$64/mo» годовой, «3,600 credits/mo» («44,000 credits/y»), «180+ Synthesia AI Avatars», «5 Personal Avatars», «API access». Enterprise — «Custom pricing», «Unlimited video minutes», «240+ stock AI Avatars», «Unlimited Personal Avatars». — [synthesia.io/pricing](https://www.synthesia.io/pricing), 2026-09-20, **официоз**
- **Цена за минуту**: кредитная арифметика — «one second of standard generated video uses two credits, so one minute uses 120 credits» (120 кредитов/мин). Значит Starter 1 200 кр = ~10 мин/мес, Creator 3 600 кр = ~30 мин/мес. — [eesel AI разбор](https://www.eesel.ai/blog/synthesia-pricing), [creatify.ai](https://creatify.ai/blog/synthesia-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay), 2026-09-20, **пресса** (официальная статья про кредиты по прямой ссылке отдала 404 — см. «Не найдено»)
  - Прикидка: ролик 60 с ежедневно = ~30 мин/мес → ровно потолок Creator ($89/мес, или $64/мес при годовой).
- **API**: есть. База `https://api.synthesia.io/v2`, ключ в заголовке `Authorization`; `POST /v2/videos` — создать, `GET /v2/videos/{video_id}` — статус, `GET /v2/videos` — список. Доки — [docs.synthesia.io/reference/introduction](https://docs.synthesia.io/reference/introduction), машинный индекс `docs.synthesia.io/llms.txt`. Важно: «API access is not available on the Free or Starter plans» — минимум Creator ($89/мес). — 2026-09-20, **официоз** (эндпоинты) + **пресса** (гейт по тарифу; на pricing-странице API-строка стоит у Creator, что сходится)
- **Русский**: официальная страница языков заявляет «160+ languages & accents» и «2,000+ AI voices», но **поимённого списка с русским на странице нет** — подтверждения «Russian» дословно не нашёл. RU-обзоры пишут, что русский поддерживается (в разных формулировках — «120+» или «160+ языков, включая русский»). Специальных разборов качества русского липсинка на Express-2 не нашёл. — [synthesia.io/features/languages](https://www.synthesia.io/features/languages) (официоз, без списка), [genforce.ru обзор](https://genforce.ru/tools/synthesia/), 2026-09-20, **практики**
- **Клон лица (Personal Avatar)**: исходное видео — «Between 1 and 5 minutes in length», «A single, continuous take» (склейки и монтаж запрещены). Согласие: «Consent footage must be recorded live», обязан содержать «the on-screen passcode», загрузить заранее записанное нельзя; «The person in your submitted footage and consent video must be the same person»; при флаге просят подтвердить возраст 18+. Срок: генерация занимает «around 1 business day» (по docs — часто «within minutes» после шага согласия, дольше при ручной модерации). Слоты по хелпу: Starter — 3, Creator — 5, Enterprise — безлимит. Советы: быть выразительным, жестикулировать, не закрывать лицо, делать паузы. — [help.synthesia.io «How do I create my Personal Avatar?»](https://help.synthesia.io/en/articles/9453224-how-do-i-create-my-personal-avatar), 2026-09-20, **официоз**
  - ⚠️ Расхождение источников: pricing-страница показывает Personal Avatars только у Creator и Enterprise, а хелп называет 3 слота у Starter. Перед покупкой проверить в кабинете.
- **Лимиты**: минуты — по кредитам (см. выше), у Enterprise «Unlimited video minutes». Разрешение: на странице тарифов не указано; Express-2 официально выдаёт «1080p at 30fps». Водяной знак — на Basic (бесплатном); снятие логотипа доступно с Starter. Ролик 45–60 с ограничений по длине не задевает. — [synthesia.io/pricing](https://www.synthesia.io/pricing) + [пост про Express-2](https://www.synthesia.io/post/express-2-is-synthesias-next-chapter-for-full-body-expressive-ai-avatars), 2026-09-20, **официоз**
- **Оплата из РФ**: прямая оплата российской картой не проходит с 2022 г.; «Мир» не работает ни на одном тарифе — процессинг определяет страну банка по BIN и отклоняет до проверки баланса. Работают: зарубежная карта (в т.ч. виртуальная нерезидента) либо российские сервисы-посредники с оплатой в рублях. Сам сайт из РФ открывается. — [dtf.ru гайд по оплате Synthesia](https://dtf.ru/bestrate/5178487-kak-oplatit-synthesia-v-rossii), [grinny.io](https://grinny.io/kak-oplatit/synthesia), [genforce.ru](https://genforce.ru/tools/synthesia/), 2026-09-20, **практики**
- **Качество (практики/пресса)**: Express-2 — diffusion-transformer, даёт полноростовые аватары с естественной со-речевой жестикуляцией и клоном голоса; обзоры отмечают заметно более разнообразную жестикуляцию, чем в прошлых версиях, и корректный липсинк на стандартной бизнес-лексике в среднем плане. Общая репутация — «стандарт для обучающих/корпоративных роликов», то есть ровно, но «говорящая голова из презентации», а не живой блогер. — [synthesia.io про Express-2](https://www.synthesia.io/post/express-2-is-synthesias-next-chapter-for-full-body-expressive-ai-avatars) (официоз), [vidpros.com обзор](https://vidpros.com/synthesia-review/), [aiworthit.com](https://www.aiworthit.com/blog/synthesia-review/), 2026-09-20, **пресса**

### Hedra

- **Что делает**: движок image-to-video липсинка: подаёшь кадр (фото лица) + аудиодорожку → говорящее видео. Дословно: «Hedra Character 3 is a video generation model developed by Hedra for image-to-video lip sync and animation. It processes image, text, and audio together to generate speech-driven video for talking avatars, marketing clips, and storytelling». Сейчас это ещё и агрегатор-платформа: «every leading image, video, and audio model behind one API key, one endpoint, and one bill».
- **Цена (подписки)**: дословно с pricing — Basic «$15/month», «1,500 credits/month», медленная очередь, коммерческое использование. Creator (Popular) «$30/month», «5,400 credits/month», быстрая генерация. Professional (Best value) «$75/month», «14,400 credits/month», «Fastest generation» + доступ к Teams. Teams «$75/month», «14,400 credits/month». Enterprise — «Custom», «Fastest inference», приватные деплои, SSO. Заголовок страницы — «Free Plan, No Credit Card». — [hedra.com/pricing](https://www.hedra.com/pricing), 2026-09-20, **официоз**
- **Цена (за секунду, Character 3)**: дословно с карточки модели — 540p «2.5¢/second», 720p «5¢/second», 1080p «6.25¢/second». То есть минута 1080p ≈ **$3.75**, минута 720p ≈ $3.00. — [hedra.com/models/video/hedra/character-3](https://www.hedra.com/models/video/hedra/character-3), 2026-09-20, **официоз**
  - В кредитах (по обзорам, **пресса**): ~3 кр/сек на 540p и ~6 кр/сек на 720p. Прикидка: ролик 60 с на 720p = ~360 кр/день ≈ 11 000 кр/мес → нужен Professional $75/мес (14 400 кр). На 540p — ~5 400 кр/мес, ровно Creator $30/мес.
- **API**: есть, публичный. Новая платформа: ключ в заголовке `Authorization: Key <key_id>:<secret>`, каталог моделей `GET /v3/models`, сабмит джобы + вебхуки. Legacy v2: база `https://api.hedra.com/web-app/public`, заголовок `X-API-Key`, `GET /generations` (в объекте генерации есть `credit_cost`). Доки — [hedra.com/docs](https://www.hedra.com/docs/api-reference/public/list), профиль платформы — [hedra.com/api-profile](https://www.hedra.com/api-profile); есть официальные SDK ([hedra-node](https://github.com/hedra-labs/hedra-node), [api-starter](https://github.com/hedra-labs/hedra-api-starter)). — 2026-09-20, **официоз**
- **Character-4**: **не найдено**. Ни на карточке модели, ни в каталоге, ни в обзорах 2026 года упоминаний Character-4 нет; актуальная линейка — Character 3 плюс отдельные модели Hedra Avatar и Omnia. — 2026-09-20, **официоз + пресса**
- **Русский**: формально язык задаётся аудиодорожкой — Hedra синхронизирует губы под любой звук, поэтому русская дорожка обрабатывается наравне с английской (это же подтверждают RU-обзоры). Своего TTS-качества «под русский» Hedra не гарантирует; на практике голос берут снаружи (ElevenLabs и т.п.) и подают файлом. — [vc.ru обзор Hedra AI](https://vc.ru/services/2960935-hedra-ai-neyroset-vozmozhnosti-tarify-i-oplata-iz-rossii), 2026-09-20, **практики**
- **Клон лица**: **отдельной процедуры клонирования лица с consent-видео у Hedra нет** — вход это просто фотография (start frame) + аудио, никакой съёмки-обучения и очереди модерации, как у HeyGen/Synthesia. Значит: «цифровой двойник» строится из одного своего портрета; и наоборот — порог злоупотребления ниже, юридической рамки consent-видео тут нет. Клон ГОЛОСА платформа умеет отдельно (тип генерации `voice_clone` в API). — [API list endpoint](https://www.hedra.com/docs/api-reference/public/list), 2026-09-20, **официоз**
- **Лимиты**: максимум длины Character 3 — 10 минут; разрешения 540p / 720p / 1080p (дефолт 720p, 1080p дороже). Водяной знак — на бесплатном плане; бесплатный план по обзорам ~100–300 кредитов/мес и «часто отключается в часы пиковой нагрузки». Скорость очереди прямо привязана к тарифу: Basic «slower generations», Creator «faster», Professional «fastest». — [карточка Character 3](https://www.hedra.com/models/video/hedra/character-3) (официоз) + [magichour.ai гайд](https://magichour.ai/blog/guide-to-hedra-ai), [fluxnote.io](https://fluxnote.io/guides/hedra-ai-review), 2026-09-20, **пресса**
- **Оплата из РФ**: российские карты отклоняются по BIN ещё на этапе проверки, «Мир» не принимается в принципе. Рабочие практики: виртуальная карта дружественной страны (Visa/MC), пополняемая с карты «Мир», либо посредник с оплатой рублёвой картой. — [vc.ru «Оплата Hedra AI из России»](https://vc.ru/services/2192694-oplata-hedra-ai-iz-rossii), [dtf.ru разбор](https://dtf.ru/howto/4001837-oplata-hedra-ai-v-rossii), 2026-09-20, **практики**
- **Качество (практики/пресса)**: сильная сторона — именно липсинк говорящей головы; независимые обзоры ставят точность ~9/10, «чистое отслеживание рта, мелкие артефакты только на быстрой речи»; аватары считают выразительнее, чем у Synthesia (там простой phoneme-to-viseme даёт «деревянную» мимику). Минусы: «лотерея липсинка» при перегенерации (результат нестабилен между прогонами), дефолт 720p и апскейл до 1080p за доп. кредиты, слабая кастомизация, бесплатный лимит сгорает мгновенно, сложные задачи приходится переделывать. Жестикуляции рук почти нет — модель заточена на лицо. — [lovart.ai обзор](https://www.lovart.ai/blog/hedra-ai-review), [filmora обзор](https://filmora.wondershare.com/video-editor-review/hedra-ai-review.html), [graficai сравнение липсинк-тулов](https://graficai.co/ai-tools/best-ai-lip-sync-video), 2026-09-20, **пресса/практики**

### Captions.ai + модель Mirage (Avatar X)

- **Что делает**: ИИ-видеоредактор (автомонтаж, субтитры на 100+ языках, коррекция взгляда, перевод) + генерация аватаров на собственной модели. В сентябре 2025 компания переименовалась в Mirage; продукт Captions остался, флагманская модель — **Mirage Avatar X** (анонс 28.07.2026). Отличие от конкурентов — генерирует не «голову с движущимся ртом», а целую сцену с жестами и мимикой одним проходом.
- **Цена (подписки)**: дословно с pricing — Free: без ИИ-кредитов, базовый монтаж, субтитры на «100+ languages». Max — «$24.99/month», «Access 500 credits per month», «Create a fully-produced video with AI», «Create digital twins or custom AI actors». Scale 1x — «$69.99/month», «1,400 credits per month»; Scale 2x — «$139.99/month», «2,800 credits per month»; Scale 4x — «$279.99/month», «5,600 credits per month»; все Scale дают «Access our most sophisticated tier of generative AI models». Enterprise — «Custom pricing», «Bulk credit discounts». Важная сноска страницы: «Features and prices reflect iOS plans only». — [captions.ai/pricing](https://www.captions.ai/pricing), 2026-09-20, **официоз**
- **Цена (API, Mirage API)**: дословно из доков — субтитры «$0.15 per minute» (по длине входного видео, округление вверх до минуты); генерация видео моделью Mirage Avatar X — «$0.15 per second» (округление вверх до 6-секундных шагов). То есть минута аватар-видео = **$9.00** — самый дорогой per-minute прайс в этом срезе. — [captions.ai/help/docs/api/pricing](https://captions.ai/help/docs/api/pricing), 2026-09-20, **официоз**
- **API**: есть, под зонтиком Mirage API. Аутентификация — «Every request to the Mirage API must include an `x-api-key` header containing your API key»; ключ создаётся в дашборде [platform.mirage.app](https://platform.mirage.app/). Доки — [captions.ai/help/docs/api/overview](https://captions.ai/help/docs/api/overview), машинный индекс `captions.ai/llms.txt`. Базовый URL в открытой части доков дословно **не назван**. — 2026-09-20, **официоз**
- **Русский**: субтитры — «100+ languages» официально; про генерацию речи аватара заявлено обтекаемо («создавать контент на нескольких языках с точной озвучкой и переводами»), **поимённого подтверждения русского в озвучке аватара не нашёл**. RU-обзоры прямо отмечают: «не все топовые функции доступны на русском языке». Риск для задачи владельца высокий — проверять живьём. — [captions.ai/blog/mirage-avatar-x](https://captions.ai/blog/mirage-avatar-x) (официоз), [vc.ru обзор](https://vc.ru/future/781504-tvorcheskaya-studiya-na-baze-ii-kotoraya-umeet-vse) (практики), 2026-09-20
- **Клон лица (AI Twin)**: самый низкий порог входа — дословно «Mirage Avatar X only needs 10 seconds of footage to make your twin»; «An AI twin is built from your own recording, with your explicit permission, for your own use». Отдельного consent-видео с паролем на экране, как у Synthesia/HeyGen, в публичной документации **не описано** — есть только политика «AI Twins, voice cloning... require clear consent and should never be used for impersonation». Ожидание: «Generate new videos in minutes». Совет по съёмке — записывать в тихом помещении (по этой же дорожке клонируется голос). Тариф: цифровые двойники входят уже в Max ($24.99). — [captions.ai/features/create-ai-twin](https://captions.ai/features/create-ai-twin), [анонс Avatar X](https://x.com/trymirage/status/2082931073319608510), 2026-09-20, **официоз**
- **Лимиты**: биллинг API — шаг 6 секунд на выходе (ролик 45–60 с укладывается ровно). Максимальная длина ролика, разрешение и политика водяного знака на платных тарифах в открытых источниках **не названы**. Free-тариф ИИ-генерации не даёт вовсе («No AI usage credits»), то есть водяной знак тут не главный барьер — аватара на бесплатном просто нет. Цены на странице — только для iOS-планов (веб/Android могут отличаться). — [captions.ai/pricing](https://www.captions.ai/pricing), 2026-09-20, **официоз**
- **Оплата из РФ**: жёстче, чем у других. Практики сообщают о мгновенной блокировке при вводе номера карты российского банка, а анти-санкционные фильтры Stripe/Braintree режут весь диапазон российских BIN «даже у нерезидентов». Рабочий путь по RU-гайдам — посредник с последующей авторизацией лицензии либо аренда зарубежной карты. Дополнительный край: оплата через App Store (iOS-планы) — своя история с российским Apple ID. — [vc.ru «Оплата Captions AI из России»](https://vc.ru/services/2190246-oplata-captions-ai-iz-rossii), [dtf.ru разбор](https://dtf.ru/howto/3999828-oplata-captions-ai-v-rossii), 2026-09-20, **практики**
- **Качество (официоз/пресса)**: вендор заявляет «industry-leading identity preservation» и «the most expressive AI avatars available», поддержку вертикального и горизонтального кадра; ключевая идея — генерация всего выступления одним проходом (мимика, голос, движение в одной сцене), что убирает «склеечные» артефакты прошлых пайплайнов, дававших «неуклюжий или мультяшный» результат. Независимых разборов качества русского пока не нашёл — оценки в прессе опираются на англоязычные демо. — [captions.ai/blog/mirage-avatar-x](https://captions.ai/blog/mirage-avatar-x) (официоз), [edimakor обзор](https://edimakor.hitpaw.com/ai-video-tools/captions-mirage-review.html) (пресса), 2026-09-20

### Argil

- **Что делает**: генератор коротких видео с «ИИ-клоном» автора: обучаешь аватара по своему видео, дальше из текста/статьи собирается ролик со сменой ракурсов, субтитрами, b-roll и фонами. Позиционирование — «AI short videos with AI clones in 2 minutes», упор на пластику тела и жесты, а не только на рот.
- **Цена (тарифы)**: живая страница [argil.ai/pricing](https://www.argil.ai/pricing) **не отрисовалась** — отдаёт только «Loading plans…» и подпись «Same plans as in the app — pick a credit tier, monthly or yearly» + «2 months free» на годовой (проверено дважды, 2026-09-20, **официоз, но без чисел**).
  Числа — из официальных доков Argil: Classic «$39/month», «1,500 credits per month», «10 avatar styles», «100+ Argil avatars», API включён. Pro «$149/month», «6,000 credits per month», «Unlimited Avatar styles», «Style editing». Scale «$499/month», «18 000 credits per month», «3 workspace seats included», приоритетная поддержка. Enterprise «$1000+/month», «Talk to us for pricing». — [docs.argil.ai/resources/subscription-and-plans](https://docs.argil.ai/resources/subscription-and-plans), 2026-09-20, **официоз**
  - ⚠️ Расхождение: часть обзоров (проверка 29.08.2026) утверждает, что живой прайс теперь другой — Pro «$10/мес за 400 кредитов» и Business «$20/мес за 800 кредитов», а Classic/Pro/Scale сняты. Подтвердить официозом не смог (страница не рендерится). Перед покупкой смотреть цену в самом приложении. — [therundown.ai/tools/argil](https://www.therundown.ai/tools/argil), 2026-09-20, **пресса**
- **Цена за минуту (API/кредиты)**: дословно из доков — «Video | 160 credits/minute», «Voice | 20 credits/minute», «Royalty (Argil's v1 avatars only) | 20 credits/video», «B-roll (AI image) | 10 credit/b-roll», «B-roll (stock video) | 20 credit/b-roll». Роялти не берут, если обучил собственного аватара; плату за голос можно обнулить, подключив свой аккаунт ElevenLabs. Ставки действуют «Classic plan or above»; свыше 60 000 кредитов/мес — в отдел продаж. — [docs.argil.ai/resources/api-pricings](https://docs.argil.ai/resources/api-pricings), 2026-09-20, **официоз**
  - Арифметика по Classic: $39 / 1 500 кр = ~$0.026 за кредит → минута видео (160 кр) ≈ **$4.16**, с голосом (180 кр) ≈ $4.68. Ролик 60 с ежедневно = ~5 400 кр/мес → Classic не хватает, нужен Pro $149 (6 000 кр). Со своим ElevenLabs — 4 800 кр/мес, всё ещё выше Classic.
- **API**: есть, публичный, и он включён уже в младший платный тариф (редкость для этой цены). Доки — [docs.argil.ai](https://docs.argil.ai/pages/get-started/introduction), машинный индекс `docs.argil.ai/llms.txt`, есть вебхуки. Базовый URL и заголовок аутентификации в открытой части введения дословно **не названы** (лежат в разделе Reference APIs). — 2026-09-20, **официоз**
- **Русский**: поддерживается — RU-каталог прямо пишет «мультиязычность (русский — да)» и «аватары Argil могут свободно говорить на любом языке». Официального поимённого списка языков на сайте не нашёл. Отдельных разборов качества русского липсинка нет. — [neiroset.com карточка Argil](https://neiroset.com/catalog/neiroset/5274-argil), 2026-09-20, **практики**
- **Клон лица**: два ролика — обучающий и согласия. Дословно из доков по обучению: «We recommend 2 minutes minimum for optimal results», «Capture 3 minutes of natural speech»; кадрирование — «Place camera at eye level with your head about 20-30% from frame top. Stay centered», руки держать относительно спокойно, посторонних в кадре быть не должно. Consent: отдельное видео ~30 секунд с явным согласием; «Argil needs the training video and consent video of every person that they train the AI avatar of» — без этого клон чужого лица не создадут. Обучение занимает «несколько часов» (в доках точное число **не указано**). — [docs.argil.ai/resources/training-tips](https://docs.argil.ai/resources/training-tips) (официоз по съёмке), [retague обзор](https://www.retague.com/en/tool/argil-ai-review-2026) и [therundown.ai](https://www.therundown.ai/tools/argil) (пресса по consent и срокам), 2026-09-20
- **Лимиты**: потолок — кредиты (160 кр/мин видео). По обзорам: бесплатный режим ~2 видео-минуты с водяным знаком и только базовые аватары; на платных водяного знака нет. Максимальная длина одного ролика и разрешение в официальных доках **не найдены** — Argil заточен под короткие вертикальные ролики (30–60 с), что задаче владельца как раз подходит. — [neiroset.com](https://neiroset.com/catalog/neiroset/5274-argil), 2026-09-20, **практики**
- **Оплата из РФ**: российские карты не принимаются (RU-каталог прямо: «Оплата российскими картами: нет»). Путь тот же — зарубежная/виртуальная карта или посредник; общий разбор способов оплаты ИИ-подписок из РФ в 2026 — на Хабре. — [neiroset.com](https://neiroset.com/catalog/neiroset/5274-argil), [habr.com «Как оплачивать нейросети... в 2026»](https://habr.com/ru/articles/1037638/), 2026-09-20, **практики**
- **Качество (практики)**: сильные стороны по отзывам — внимание к пластике и «body voice» (язык тела), высокое качество липсинка, смена ракурсов камеры внутри ролика; это ближе к «блогер в кадре», чем к корпоративному диктору. Отдельных жалоб на uncanny valley в найденных источниках нет, но и независимых слепых тестов тоже — репутация опирается в основном на обзоры-каталоги. — [neiroset.com](https://neiroset.com/catalog/neiroset/5274-argil), [ru.manyai.app отзывы](https://ru.manyai.app/review/argil.ai), 2026-09-20, **практики**

### D-ID

- **Что делает**: старейший из списка — «оживление» портрета: фото/видео + скрипт → говорящая голова с липсинком и мимикой. Линейка по докам: «Agents» (реалтайм-аватары для диалогов), «V4 Expressive Avatars» (Full-HD, управление эмоцией и сентиментом), «V3 Pro Avatars», «V3 Instant Avatars» («Custom avatars created from short videos without training»), «V2 Avatars» (аватар из фото), «Video Translate» (перевод + клон голоса + липсинк). Веб-продукт — Creative Reality Studio.
- **Цена**: официальные страницы [d-id.com/pricing/studio](https://www.d-id.com/pricing/studio/) и [d-id.com/pricing/api](https://www.d-id.com/pricing/api/) **не отрисовались** — отдают только навигацию, FAQ и отзывы без таблицы тарифов (проверено 2026-09-20; из официоза удалось снять лишь строку FAQ, что водяной знак есть на «Trial and Lite plans»). Числа ниже — **пресса**, и между обзорами есть расхождения, поэтому проверять в кабинете:
  - Наиболее часто повторяемая раскладка: Lite «$5.90/month» помесячно / «$4.70/mo» при годовой, 40 кредитов (~10 минут), водяной знак D-ID на всех экспортах, только личное использование. Pro «$29/month» / «$16/mo» годовой, 60 кредитов (~15 минут), первый тариф без водяного знака и с коммерческой лицензией. Advanced «$196/month» / «$108/mo» годовой, 400 кредитов (~100 минут). Enterprise — по запросу, безлимит. Кредит = «up to 15 seconds of video». — [top50aitools.com разбор](https://top50aitools.com/pricing/d-id), [costbench.com](https://costbench.com/software/ai-video-generators/d-id/), 2026-09-20, **пресса**
  - ⚠️ Конкурирующие цифры в других обзорах: Pro «$29.90/month, 15 min», Advanced «$79.90/month, 40 min», командные места «от $196/seat/mo», API-кредиты «от $18». — [buildmvpfast сравнение](https://www.buildmvpfast.com/alternatives/d-id), 2026-09-20, **пресса**. Единой подтверждённой картины нет.
  - API за минуту: обзоры называют «$5.90/min» для программной генерации. — [heyfish.ai обзор D-ID](https://heyfish.ai/d-id-review) (страница по прямой ссылке не открылась, цифра из поисковой выдачи), 2026-09-20, **пресса, НЕ подтверждено официозом**
  - Важное про кредиты (**пресса**): не переносятся на следующий месяц, минуты сгорают в конце цикла; минуты API списываются с того же баланса, что и веб.
- **API**: есть, публичный и зрелый. Ключ генерируется в настройках аккаунта Studio, передаётся в заголовке `Authorization` (basic auth). Доки — [docs.d-id.com/reference/get-started](https://docs.d-id.com/reference/get-started), машинный индекс `docs.d-id.com/llms.txt`, любой URL доков открывается как markdown добавлением `.md`. Есть отдельная группа эндпоинтов под согласия (create/list/get/delete consent, upload video for consent) и эндпоинт остатка кредитов `getcredits`. — 2026-09-20, **официоз**
- **Русский**: по RU-обзорам — озвучка на 100 языках, включая русский, липсинк «попадает в звук на десятках языков, включая русский»; ИИ подстраивает интонацию и акцент под язык. Официального поимённого списка языков в открытых доках **не нашёл**. — [neiroset.com карточка D-ID](https://neiroset.com/catalog/neiroset/301-d-id), [ledigital.ru обзор](https://ledigital.ru/obzor-did-nejroseti), 2026-09-20, **практики**
- **Клон лица (V3 Instant Avatar)**: дословно из доков — «Record at least 1 minute of footage of the avatar subject speaking naturally»; обучение — «Avatar training typically takes 5-10 minutes» (самый быстрый цикл среди инструментов с полноценным consent). Согласие — трёхшаговый процесс через API: создаётся consent-challenge со сроком жизни 30 минут, субъект записывает и загружает видео, где вслух читает выданный скрипт, затем ждём верификации. — [docs.d-id.com V3 Instant Avatar quickstart](https://docs.d-id.com/docs/v3-instant-avatar-quickstart.md), 2026-09-20, **официоз**
- **Лимиты**: биллинг по кредитам, кредит ≈ 15 секунд видео → ролик 60 с ≈ 4 кредита, ежедневный выпуск ≈ 120 кредитов/мес (по раскладке выше это уже уровень Advanced). Водяной знак — на Trial и Lite (официоз, FAQ страницы прайса). Разрешение: V3 Pro и V4 Expressive заявлены как «Full-HD» (официоз, доки). Максимальная длина скрипта/ролика в открытых доках **не найдена**. — 2026-09-20
- **Оплата из РФ**: прямой платёж российской картой обычно не проходит — процессинг Stripe не поддерживает карты российских банков. RU-практики предлагают посредников (в т.ч. с оплатой через ЮKassa рублёвой картой) и доступ без VPN через российские сервисы-реселлеры. — [vc.ru «Как купить D-ID из России»](https://vc.ru/services/2659340-kak-kupit-d-id-iz-rossii-v-2025-godu), [did-official.ru](https://did-official.ru/tools/d-id/), 2026-09-20, **практики**
- **Качество (практики/пресса)**: репутация «лучший баланс цены и качества для оживления портрета» — лицо остаётся узнаваемым, липсинк рабочий. Но это исторически фото-аниматор: кадр обычно статичный, жестов и движения тела нет, «говорящая голова» в буквальном смысле; на фоне Mirage Avatar X и Synthesia Express-2 выглядит старым поколением. V4 Expressive добавляет мимику и управление эмоцией, но независимых сравнений качества русского не нашёл. — [neiroset.com](https://neiroset.com/catalog/neiroset/301-d-id), [gaga.art обзор](https://gaga.art/blog/d-id/), [toolsforhumans обзор Studio](https://www.toolsforhumans.ai/ai-tools/d-id-creative-reality-studio), 2026-09-20, **пресса/практики**

---

### Сводная таблица (1A)

Прикидка «ролик 60 с каждый день» = ~30 минут готового видео в месяц.

| Инструмент | Вход по подписке | Цена за минуту (подтверждённая) | ~30 мин/мес обойдётся | API | Русский | Карты РФ |
| --- | --- | --- | --- | --- | --- | --- |
| HeyGen | Creator «$29/mo» | API ~$3–4/мин (**пресса**) | Pro «$49/mo» (1 000 кр ≈ 32 мин Video Look) | да, `api.heygen.com` | «175+ languages» (официоз) | нет |
| Synthesia | Starter «$29/mo» | 120 кредитов/мин (**пресса**) | Creator «$89/mo» (3 600 кр = 30 мин) | да, с Creator и выше | 160+ языков, русский поимённо не подтверждён | нет |
| Hedra | Basic «$15/month» | 720p «5¢/second» = $3.00/мин, 1080p «6.25¢/second» = $3.75/мин (**официоз**) | Professional «$75/month» на 720p; Creator «$30/month» на 540p | да, `api.hedra.com` | язык задаёт ваша аудиодорожка | нет |
| Captions / Mirage | Max «$24.99/month» | «$0.15 per second» = $9.00/мин (**официоз**) | API: ~$270/мес; по кредитам — Scale от «$69.99/month» | да, Mirage API | не подтверждён для озвучки аватара | нет (плюс барьер App Store) |
| Argil | Classic «$39/month» | «Video \| 160 credits/minute» ≈ $4.16/мин (**официоз**) | Pro «$149/month» (6 000 кр) | да, уже в младшем тарифе | да (практики) | нет |
| D-ID | Lite ~$5.90/mo (**пресса**) | «$5.90/min» (**пресса**, не подтверждено) | Advanced ~$108–196/mo (400 кр ≈ 100 мин) | да, `docs.d-id.com` | 100 языков, русский есть (практики) | нет |

**Требования к клону лица — сводка**

| Инструмент | Исходник | Consent | Ожидание |
| --- | --- | --- | --- |
| HeyGen | 2–5 мин (Avatar 5 — от 15 с) | обязательное видео-согласие, тот же человек | в FAQ не указано |
| Synthesia | «Between 1 and 5 minutes», один непрерывный дубль | живая запись + пароль на экране, 18+ | «around 1 business day» |
| Hedra | одно фото | процедуры нет | минуты |
| Captions / Mirage | «only 10 seconds of footage» | политика согласия, отдельной процедуры не описано | «in minutes» |
| Argil | «2 minutes minimum», «3 minutes of natural speech» | отдельное видео ~30 с | несколько часов |
| D-ID | «at least 1 minute of footage» | consent-challenge (30 мин), чтение скрипта вслух, верификация | «5-10 minutes» |

---

### Не найдено / сомнительно (1A)

- **HeyGen, официальная таблица API-ставок** — `developers.heygen.com/docs/pricing` отдаёт 404, `heygen.com/api-pricing` редиректит в кабинет за логином, хелп-статья про API-прайс ссылается на таблицу, которой в выдаче нет. Цифры $0.0167–$0.0667/сек взяты из вторичных обзоров и официозом НЕ подтверждены.
- **HeyGen, время обучения Digital Twin** — в официальном FAQ не указано.
- **HeyGen, «Avatar 5»** — упоминается в сторонних обзорах как instant-клон из 15-секундного клипа; официальной страницы модели не проверил.
- **Synthesia, официальная статья про кредиты** (120 кредитов = 1 минута) — прямая ссылка на хелп отдала 404; конверсия взята из обзоров.
- **Synthesia, русский язык поимённо** — на официальной странице языков список не раскрывается, слова «Russian» дословно не нашёл.
- **Synthesia, расхождение по Personal Avatars** — pricing-страница показывает их только у Creator/Enterprise, хелп называет 3 слота у Starter.
- **Synthesia, разрешение по тарифам** — на странице цен не указано; 1080p/30fps назван только в посте про Express-2.
- **Hedra, Character-4** — модели с таким названием не существует в открытых источниках на 2026-09-20; актуальны Character 3, Hedra Avatar, Omnia.
- **Hedra, объём бесплатного плана** — обзоры расходятся (100 vs 300 кредитов/мес); официальная страница цифру не показывает.
- **Captions/Mirage, базовый URL API** — в открытой части доков дословно не назван.
- **Captions/Mirage, поддержка русской озвучки аватара** — официального подтверждения нет; RU-обзоры прямо пишут, что не все топовые функции работают на русском.
- **Captions/Mirage, максимальная длина ролика, разрешение, водяной знак на платных** — не найдено.
- **Captions/Mirage, цены вне iOS** — страница прямо оговаривает «Features and prices reflect iOS plans only»; веб/Android могут отличаться.
- **Argil, живой прайс** — страница цен не рендерится («Loading plans…»). Числа взяты из доков (Classic $39 / Pro $149 / Scale $499); обзоры от 29.08.2026 утверждают, что в приложении теперь Pro $10 за 400 кредитов и Business $20 за 800 — подтвердить не смог.
- **Argil, базовый URL и заголовок аутентификации API** — во введении доков не названы.
- **Argil, максимальная длина ролика и разрешение** — не найдено.
- **Argil, время обучения аватара** — в официальных доках не указано, «несколько часов» — из обзоров.
- **D-ID, все цены** — обе официальные страницы прайса (Studio и API) не отрисовались; G2 отдал 403. Все числа — пресса, и обзоры между собой расходятся (Pro $29 vs $29.90; Advanced $196 vs $79.90). Ставка «$5.90/min» официозом не подтверждена.
- **D-ID, максимальная длина скрипта/ролика** — в открытых доках не найдено.
- **D-ID, официальный список языков** — в доках не найден.
- **Отзывы о качестве именно РУССКОГО липсинка** — содержательные оценки нашлись только по HeyGen. По Synthesia Express-2, Hedra, Mirage Avatar X, Argil и D-ID независимых разборов русского нет — все оценки качества опираются на англоязычные демо.


---

## 1B. Видеомодели с речью и открытые липсинк-модели

Срез: 2026-09-20. Цель применения: ролик 45–60 с, «говорящая голова читает 3 новости про ИИ на русском», лицо и голос владельца по образцу, ежедневная генерация машиной без съёмки.

Классы источников: **официоз** (сайт вендора, docs, model card) · **пресса** · **практики** (Habr, vc.ru, Reddit, Telegram).

---

## БЛОК А — коммерческие видеомодели и липсинк-сервисы

### Kling AI (Kling 2.x / 3.0, Lip Sync, AI Avatar)

- **Что делает**: генератор видео (text-to-video, image-to-video) от Kuaishou. Отдельная функция **Lip Sync** — берёт готовое видео + аудиодорожку (или текст → TTS) и переозвучивает губы персонажа. В 3.0 появился «Omni Audio» — нативная генерация речи со звуком внутри самой модели. Есть «AI Avatar» (фото + аудио → говорящая голова).
- **Длина/разрешение**: дословно «Kling VIDEO 3.0 series supports up to 15 seconds of video generation, with flexible duration from 3 to 15 seconds» — [kling.ai/blog/kling-video-3-omni-native-lip-sync-audio-guide](https://kling.ai/blog/kling-video-3-omni-native-lip-sync-audio-guide), 2026-09-20, **официоз**. Разрешение: Basic — 720p, Standard — «1080p video generation» (там же). Пресса заявляет 4K/60fps для 3.0 — [habr.com/ru/companies/studyai/articles/1009040](https://habr.com/ru/companies/studyai/articles/1009040/), 2026-09-20, **пресса**.
- **Русский — ГЛАВНЫЙ СТОП**: дословно «The current series supports Chinese, English, Japanese, Korean, and Spanish, along with authentic dialects and accents» — [kling.ai/blog/…omni…](https://kling.ai/blog/kling-video-3-omni-native-lip-sync-audio-guide), 2026-09-20, **официоз**. Русского в списке нет. Практики подтверждают: «русский язык пока не входит в список нативно поддерживаемых, и русскоязычная озвучка получается с заметным акцентом и легким рассинхроном артикуляции… для русского сегмента рекомендуется рендерить визуал с интершумом, а голос накладывать на постпродакшене» — [vc.ru/ai/2860092](https://vc.ru/ai/2860092-kling-ai-obzor-generatora-video), 2026-09-20, **практики**.
  - Важно: это про **нативную речь** (Omni Audio / TTS внутри Kling). Отдельная функция **Lip Sync по своему аудиофайлу** языково-агностична технически (модель двигает губы под звуковую волну), но официально качество заявлено только для пяти языков.
- **Цена (подписка)**: Standard — «660 Credits per month» при «$1.33 per 100 Credits»; Pro — «3000 Credits per month», «$1.09 per 100 Credits»; Ultra до «$127.99/month» — [kling.ai/blog/…omni…](https://kling.ai/blog/kling-video-3-omni-native-lip-sync-audio-guide), 2026-09-20, **официоз**.
- **Цена (API через посредников)**:
  - fal.ai, Kling LipSync audio-to-video: «$0.014 per 5-second increment» (биллинг по 5-секундным кускам; 3-секундное видео стоит как 5) — [fal.ai/models/fal-ai/kling-video/lipsync/audio-to-video](https://fal.ai/models/fal-ai/kling-video/lipsync/audio-to-video), 2026-09-20, **официоз (платформы)**.
  - fal.ai, Kling AI Avatar (фото+аудио → говорящая голова): «$0.0562 per second» — [fal.ai/models/fal-ai/kling-video/v1/standard/ai-avatar](https://fal.ai/models/fal-ai/kling-video/v1/standard/ai-avatar), 2026-09-20, **официоз (платформы)**. Для 60 с ≈ $3.37.
  - Официальная dev-страница [kling.ai/dev/pricing](https://kling.ai/dev/pricing) — **страница не открылась** (WebFetch вернул только заголовок, цены не отдались). Агрегаторы называют «$0.14 per unit» для видео и «$0.084/clip» для LipSync ([fairstack.ai/models/kling-lipsync-a2v](https://fairstack.ai/models/kling-lipsync-a2v), 2026-09-20, **пресса/агрегатор** — дословную официальную цитату подтвердить не удалось).
- **Лимиты Lip Sync (по fal, входные)**: видео «2-10 seconds», «720p or 1080p input, width/height 720-1920px», ≤100 МБ, .mp4/.mov; аудио «2-60 seconds», ≤5 МБ, mp3/wav/ogg/m4a/aac. Время обработки «approximately 12 minutes» — [fal.ai](https://fal.ai/models/fal-ai/kling-video/lipsync/audio-to-video), 2026-09-20, **официоз (платформы)**.
  - Практический вывод для 45–60 с: липсинк-вход ограничен 10 с видео → ролик придётся резать на 6–10 кусков и склеивать.
- **API и доки**: `https://kling.ai/document-api/` (официальный dev-портал, редирект с app.klingai.com/global/dev). Через посредников: fal.ai (`fal-ai/kling-video/lipsync/audio-to-video`), Replicate (`kwaivgi/kling-lip-sync`), WaveSpeed.
- **Оплата из РФ**: дословно «Оплатить Kling AI российской картой невозможно ни при какой сумме. Платёж проводит зарубежный процессор, который отклоняет карты российских банков по стране выпуска» — [vc.ru/services/3081018](https://vc.ru/services/3081018-kak-kupit-kling-podpisku-iz-rossii), 2026-09-20, **практики**. Сам сервис из РФ работает («генерация, галерея, мобильные приложения — все доступно»); оплата — через посредников, принимающих рубли, либо зарубежную карту. Habr описывает работу «в России без VPN» — [habr.com/ru/companies/studyai/articles/1009040](https://habr.com/ru/companies/studyai/articles/1009040/), 2026-09-20, **практики**.
- **Качество (практики)**: «Kling генерирует пластику и движение тела лучше большинства конкурентов… один из лучших уровней среди китайских моделей»; липсинк «подстраивает микроартикуляцию губ и мышц лица под загруженную аудиодорожку» — [vc.ru/ai/2860092](https://vc.ru/ai/2860092-kling-ai-obzor-generatora-video), 2026-09-20, **практики**. Для русского — акцент и рассинхрон (см. выше).

### Higgsfield (Higgsfield Speak 2.0 / AI Talking Avatar)

- **Что делает**: дословно «AI Talking Avatar turns text into a lifelike presenter speaking your script in seconds» — функции Script to Avatar, AI Lip Sync, AI Expression & Gesture, AI Multilingual Talking Avatar — [higgsfield.ai/ai-talking-avatar](https://higgsfield.ai/ai-talking-avatar), 2026-09-20, **официоз**. Есть клонирование голоса из загруженного образца и Lipsync Studio. Практики: «Speak 2.0 представляет собой липсинк и озвучку с эмоцией и акцентом» — [vc.ru/ai/2917172](https://vc.ru/ai/2917172-higgsfield-ai-podpiska-v-rossii-kak-oplatit-iz-rf), 2026-09-20, **практики**.
- **Цена**: страница [higgsfield.ai/pricing](https://higgsfield.ai/pricing) — **страница не открылась** (отдаёт только метаданные). Пресса: «Free ($0, no credits), Starter ($19, 270 credits), Plus ($47 annual, 1,200) and Ultra ($99 annual, 3,000)»; Plus $47/год или $59/мес, Ultra $99/год или $129/мес; «Credits convert at $1 = 20 credits on Auto-Refill… refills expiring 90 days after purchase» — [krea.ai/blog/higgsfield-pricing-explained-2026](https://www.krea.ai/blog/higgsfield-pricing-explained-2026-unlimited-credits-and-real-monthly-costs), 2026-09-20, **пресса**. Speak доступен начиная с тарифа Plus (там же).
- **API**: **публичного API нет.** Дословно из обзора: «Higgsfield has no public API; its own comparison page concedes that programmatic access runs through MCP and CLI only» — [aireiter.com/blog/higgsfield-ai-reviews-pricing-vs-api](https://aireiter.com/blog/higgsfield-ai-reviews-pricing-vs-api), 2026-09-20, **пресса**. Официальная страница подчёркивает браузер и мобильное приложение: «Higgsfield runs in your browser, with a mobile app» — [higgsfield.ai/ai-talking-avatar](https://higgsfield.ai/ai-talking-avatar), 2026-09-20, **официоз**.
  - Для задачи «машина генерит каждый день без человека» это **дисквалифицирующий минус**: нет API → нужен клик-цикл или браузерная автоматизация.
- **Русский**: заявлено «74+ languages with native sound, with lip sync re-locked per language» — [higgsfield.ai/ai-talking-avatar](https://higgsfield.ai/ai-talking-avatar), 2026-09-20, **официоз** (поимённого списка с русским на странице нет). Практики: «Higgsfield поддерживает lip-sync на русском языке» — [vc.ru/ai/2917172](https://vc.ru/ai/2917172-higgsfield-ai-podpiska-v-rossii-kak-oplatit-iz-rf), 2026-09-20, **практики**.
- **Лимиты**: «Export MP4 in 9:16, 1:1, and 16:9 up to 4K» — [higgsfield.ai/ai-talking-avatar](https://higgsfield.ai/ai-talking-avatar), 2026-09-20, **официоз**. Максимальная длина клипа на странице **не найдено**.
- **Оплата из РФ**: «Российские карты не принимаются напрямую на сервисе… самый простой вариант для России — оплатить рублями через посредника» — [vc.ru/services/2937793](https://vc.ru/services/2937793-kak-kupit-higgsfield-ai-iz-rossii), 2026-09-20, **практики**.
- **Качество (практики)**: в русских обзорах Higgsfield хвалят за эмоцию и «камерные» пресеты движения; массовых замеров качества русского липсинка с цифрами не найдено.

### OpenAI Sora 2 / Sora 2 Pro — ❌ ЗАКРЫВАЕТСЯ ЧЕРЕЗ 4 ДНЯ

**Главный факт среза: Sora выключают. Приложение уже умерло, API умирает 24.09.2026 — через 4 дня от даты среза.**

- **Официальный статус**: в таблице deprecations OpenAI строка «Sora 2 / Videos API», дата удаления — **September 24, 2026**; перечислены `sora-2`, `sora-2-pro`, `sora-2-2025-10-06`, `sora-2-2025-12-08`, `sora-2-pro-2025-10-06` и сам Videos API; **колонка рекомендованной замены пуста («---»)** — [developers.openai.com/api/docs/deprecations](https://developers.openai.com/api/docs/deprecations), 2026-09-20, **официоз**. Уведомление разработчикам ушло 24.03.2026.
- **Две стадии выключения**: веб и приложение Sora отключены 26.04.2026, API — 24.09.2026 — [help.openai.com/en/articles/20001152](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) (страница отдала **403** на фетч, факт взят из пересказа в поиске и подтверждён таблицей deprecations), 2026-09-20, **официоз/пресса**.
- **Cameo (своё лицо)**: через API — **нет**. Дословно из гайда: «Character uploads that depict human likeness are blocked by default» и «Input images with faces of humans are currently rejected» — [developers.openai.com/api/docs/guides/video-generation](https://developers.openai.com/api/docs/guides/video-generation), 2026-09-20, **официоз**. Cameo было функцией приложения (уже закрытого), не API.
- **Длина**: «Both `sora-2` and `sora-2-pro` support `16`- and `20`-second generations» — там же, 2026-09-20, **официоз**. 45–60 с одним куском не сделать в принципе.
- **Разрешение**: `sora-2-pro` даёт «1080p exports in `1920x1080` or `1080x1920`» — там же, **официоз**.
- **Речь**: Sora генерит «clips with audio from natural language» — звук синтезируется моделью, своя дорожка/свой голос не подставляются. Русская речь официально не заявлена; **не найдено** официальных заявлений о поддержке русского.
- **Цена (пресса, официальной страницы прайса не открыл)**: «Sora 2 Pro costs $0.30/sec (720p), $0.50/sec (1024p), $0.70/sec (1080p) on Standard, or roughly half on Batch ($0.15/$0.25/$0.35)»; «Sora 2 Standard costs $0.10/sec (720p)» — [magichour.ai/blog/sora-2-pricing](https://magichour.ai/blog/sora-2-pricing), 2026-09-20, **пресса**. 60 с на Pro 1080p ≈ $42 за ролик — даже если бы жил, экономика ежедневного ролика плохая.
- **Оплата из РФ**: OpenAI API российские карты не принимает и РФ в списке поддерживаемых стран нет — вопрос снят вместе с самим сервисом.
- **Вывод**: **исключить из рассмотрения полностью.** Замены от OpenAI нет.

### Google Veo 3.1 (Gemini API / Vertex AI)

- **Что делает**: дословно «Veo 3.1 is a model for generating video with native audio. It supports features like video extension, frame-specific generation, and image-based direction through the `generateContent` API» — [ai.google.dev/gemini-api/docs/video](https://ai.google.dev/gemini-api/docs/video), 2026-09-20, **официоз**. Звук (речь, шумы, музыка) генерится ВНУТРИ модели вместе с картинкой — липсинк не приклеивается, а рождается.
- **Цена — ДОСЛОВНО** ([ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing), 2026-09-20, **официоз**), за секунду видео, звук включён:
  - Veo 3.1 Standard: «$0.40 (720p and 1080p)», «$0.60 (4k)»
  - Veo 3.1 Fast: «$0.10 (720p)», «$0.12 (1080p)», «$0.30 (4k)»
  - Veo 3.1 Lite: «$0.05 (720p)», «$0.08 (1080p)», 4K нет
  - Ролик 60 с: Lite 720p ≈ **$3.00**, Fast 1080p ≈ $7.20, Standard 1080p ≈ $24.
- **Модели (ID)**: `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`, `veo-3.1-lite-generate-preview` — [ai.google.dev/gemini-api/docs/veo](https://ai.google.dev/gemini-api/docs/veo), 2026-09-20, **официоз**.
- **Лимиты длины**: «8 seconds, 6 seconds, 4 seconds», причём «8 seconds only if 1080p or 4k or using reference images». Разрешения: «720p, 1080p (8s length only), 4k (8s length only)» — там же, **официоз**.
  - **Расширение до 60 с есть**: «extend videos that you previously generated with Veo by 7 seconds and up to 20 times», результат — «up to 148 seconds of video» — там же, **официоз**. НО расширение работает только в 720p.
- **Русский — честный официальный ответ**: дословно «English (EN) is fully supported, but other languages have not been evaluated, so they may work but results can vary» — [ai.google.dev/gemini-api/docs/veo](https://ai.google.dev/gemini-api/docs/veo), 2026-09-20, **официоз**. То есть русский не гарантирован, но и не запрещён.
- **Русский на практике — лучший результат среди коммерческих**: «Veo 3.1 can generate synchronized dialogues in Russian with natural intonation… диалоги, звуки и музыка синхронизированы с изображением, включая движения губ и паузы речи»; «единственная нейросеть с нативной генерацией диалогов и звука без постобработки» — [sostav.ru/blogs/286497/76391](https://www.sostav.ru/blogs/286497/76391), 2026-09-20, **пресса**. Habr про работу из РФ: [habr.com/ru/companies/studyai/articles/996730](https://habr.com/ru/companies/studyai/articles/996730/), 2026-09-20, **практики**.
- **Известные края русского (важно, практики)** — [vc.ru/ai/2027758](https://vc.ru/ai/2027758-veo-3-sozdanie-video-s-russkoj-ozvuchkoj), 2026-09-20, **практики**:
  - Озвучка «теряется» (видео выходит немым), потому что «фильтры безопасности строже к кириллице» — большие блоки русского текста триггерят блокировку.
  - Рецепты: ограничить русскую реплику 10–12 словами; убрать кавычки и апострофы; писать «NO SUBTITLES» в начале и конце промпта; называть имя говорящего (улучшает синхронизацию губ); минимизировать спецсимволы.
  - Оптимальная длина фразы для липсинка — **2–3 секунды**; длиннее — резать на несколько генераций с разных ракурсов (из [sostav.ru](https://www.sostav.ru/blogs/286497/76391), **пресса**).
  - Вывод для задачи: 3 новости по 15–20 с на русском одним куском — против шерсти. Реально: нарезка на 8-секундные кадры + либо нативный звук, либо свой голос поверх.
- **Своё лицо**: Veo 3.1 поддерживает «up to three reference images to guide your generated video's content» для сохранения внешности персонажа — [ai.google.dev/gemini-api/docs/veo](https://ai.google.dev/gemini-api/docs/veo), 2026-09-20, **официоз**. На Vertex AI действует параметр person generation: «"Allow (Adults only)" setting is the default value and generates adult people or faces only» — [cloud.google.com/vertex-ai/…/use-reference-images-to-guide-video-generation](https://cloud.google.com/vertex-ai/generative-ai/docs/video/use-reference-images-to-guide-video-generation), 2026-09-20, **официоз**. Загрузка фото реального человека формально проходит, но политика Google против имперсонации реальных лиц — риск блокировки; **гарантии идентичности лица владельца нет**.
- **Голос владельца**: Veo синтезирует СВОЙ голос, клонирования голоса по образцу нет. Свой голос — только внешним TTS + отдельный липсинк, что ломает главное преимущество Veo.
- **API и доки**: Gemini API — [ai.google.dev/gemini-api/docs/veo](https://ai.google.dev/gemini-api/docs/veo); Vertex AI — [docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate). Оба — нормальный программный доступ, годится для ежедневной машины.
- **Оплата из РФ**: Google Cloud / Google AI Studio российские карты не принимают, РФ не в списке поддерживаемых платёжных стран; нужна зарубежная карта и зарубежное юрлицо/аккаунт либо посредник-реселлер (в РФ это GPTunneL, chadgpt и подобные шлюзы, принимающие рубли) — [gptunnel.ru/en/guide/veo3](https://www.gptunnel.ru/en/guide/veo3), [blog.chadgpt.ru/veo](https://blog.chadgpt.ru/veo/), 2026-09-20, **практики**. Прямой оплаты российской картой **не найдено**.
- **Качество (практики)**: «флагман с впечатляющим пониманием русского, чистая речь и точное следование промпту»; на февраль 2026 держит лидирующую позицию среди генераторов видео — [sostav.ru](https://www.sostav.ru/blogs/286497/76391), 2026-09-20, **пресса**.

### MiniMax / Hailuo — ⭐ ГЛАВНАЯ НАХОДКА СРЕЗА (H3 + открытые веса + русский)

**Сначала снять путаницу в терминах**: у MiniMax «**S2V**» — это НЕ speech-to-video. Это **Subject-reference-to-video** (`S2V-01`): «Subject reference (S2V) allows you to supply a photo of a person and keep that face consistent across the generated clip» — [atlascloud.ai/blog/tips/hailuo-ai-lip-sync-feature-guide](https://www.atlascloud.ai/blog/tips/hailuo-ai-lip-sync-feature-guide), 2026-09-20, **пресса**. Полезно для «лицо владельца по образцу», но речь оно не даёт.

**Старые Hailuo (video-01, Hailuo 02, 2.3) липсинка не имеют**: «Despite its advanced MiniMax video architecture, Hailuo AI lacks a native lip-sync feature. Creators cannot simply input voice tracks directly inside the generator» — там же, 2026-09-20, **пресса**.
- Цена старых моделей (**официоз**, [platform.minimax.io/docs/guides/pricing-video](https://platform.minimax.io/docs/guides/pricing-video), 2026-09-20), в «video points»: MiniMax-Hailuo-2.3-Fast — «768p, 6s: 0.7 video points», «768p, 10s: 1.1», «1080p, 6s: 1.3»; Hailuo-2.3 / Hailuo-02 — «768p, 6s: 1 video point», «768p, 10s: 2», «1080p, 6s: 2»; Hailuo-02 также «512p, 6s: 0.3», «512p, 10s: 0.5». Та же страница дословно: «Video packages support Hailuo video models. MiniMax H3 is not supported yet.»

**А вот MiniMax H3 (Hailuo 3.0) — это то, что нужно.**

- **Что делает**: омнимодальная модель 33B, «takes text, images, video, and audio as input and produces video with native stereo sound as output». Есть режим lip-sync: «Turns a single image and an audio file into a talking video» с «mouth movement matched to the soundtrack, in any language, at up to 2K» — [fal.ai/h3-max-lip-sync](https://fal.ai/h3-max-lip-sync), 2026-09-20, **официоз (платформы)**.
- **РУССКИЙ — ЯВНО В СПИСКЕ, дословно**: «Stable support for 11 languages: Arabic, Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Russian, and Spanish» — [huggingface.co/MiniMaxAI/MiniMax-H3](https://huggingface.co/MiniMaxAI/MiniMax-H3), 2026-09-20, **официоз (model card)**. Это единственная модель среза, где русский назван поимённо в официальном документе.
- **Цена через fal.ai (H3 Max Lip Sync), дословно**: «480p: $0.05/second», «768p: $0.08/second», «1080p: $0.16/second», «2K: $0.32/second» — [fal.ai/h3-max-lip-sync](https://fal.ai/h3-max-lip-sync), 2026-09-20, **официоз (платформы)**. Ролик 60 с в 1080p ≈ **$9.60**, в 768p ≈ $4.80.
  - Эндпоинт: `minimax/h3-max/lip-sync/image-to-video`.
  - Официальный MiniMax API по H3: «about $0.13 per second at 2K, $0.08 at 768p» — [minimax-ai.chat/models/minimax-h3](https://minimax-ai.chat/models/minimax-h3/), 2026-09-20, **пресса** (дословной официальной цитаты с platform.minimax.io получить не удалось — страница прайса H3 не покрывает).
- **Лимиты**: «5 to 15 seconds per request. Anything over 15 seconds is trimmed to its first 15 seconds» (fal), модель-карта: «4–15 seconds». Разрешения: «480p, 768p, 1080p, 2K»; дефолт весов — «the shorter side is set to 768 pixels».
  - Для 45–60 с: 4–5 кусков по 12–15 с, склейка. Хуже, чем один рендер, но куда лучше 8-секундного Veo и 10-секундного Kling.
- **Открытые веса — ДА**: веса выложены на Hugging Face 03.08.2026, `MiniMaxAI/MiniMax-H3`, 33B параметров — [huggingface.co/MiniMaxAI/MiniMax-H3](https://huggingface.co/MiniMaxAI/MiniMax-H3), 2026-09-20, **официоз**. Разбор: [huggingface.co/blog/ResterChed/minimax-h3-hailuo-3-0](https://huggingface.co/blog/ResterChed/minimax-h3-hailuo-3-0), **пресса**.
- **Лицензия — «MiniMax H3 Community License Agreement»**; на карте модели стоит «Application form (only for USA/EU/UK/South Korea)». То есть права на локальное развёртывание **исключают США, ЕС, Великобританию и Южную Корею** — [explainx.ai/blog/minimax-h3-open-video-model-hailuo-july-2026](https://explainx.ai/blog/minimax-h3-open-video-model-hailuo-july-2026), 2026-09-20, **пресса**. **Россия в исключения не входит** — для владельца это скорее плюс. Коммерческое использование разрешено организациям с выручкой примерно до $20M (там же, **пресса** — сверить с текстом лицензии перед коммерческим запуском).
- **Что НЕ открыли**: «H3-Context-IR (the multimodal instruction-refinement layer) is "hosted, not open-sourced"», и «H3-Regenerate-2K, the piece that lifts output to 2K, is "not yet open-sourced"» — [explainx.ai](https://explainx.ai/blog/minimax-h3-open-video-model-hailuo-july-2026), 2026-09-20, **пресса**. Локально получишь 768p без 2K-апскейла.
- **GPU/VRAM**: модель-карта рекомендует SGLang на «4 GPUs», точные цифры VRAM **не найдено**. 33B омнимодальная видео-модель — это заведомо серверный класс (порядка 4×A100/H100), на маке не запустится.
- **ComfyUI**: открытые веса подхвачены сообществом, есть сборки под ComfyUI — [comfyui-wiki.com/en/news/2026-08-03-minimax-h3-open-weights-comfyui](https://comfyui-wiki.com/en/news/2026-08-03-minimax-h3-open-weights-comfyui), 2026-09-20, **практики**.
- **API и доки**: официальный — [platform.minimax.io/docs](https://platform.minimax.io/docs) (страница `api-reference/video-generation` отдала **404**, актуальная раскладка доков другая); через посредников — fal.ai (`minimax/h3-max/lip-sync/image-to-video`), Replicate (`minimax/video-01`), WaveSpeed, Segmind, Atlas Cloud.
- **Оплата из РФ**: прямой оплаты российской картой у MiniMax **не найдено**; платформа китайская, принимает международные карты. Через fal.ai/Replicate — тоже международные карты. Практический путь — зарубежная карта или рублёвые шлюзы-посредники.
- **Качество**: «H3 ranks #1 in Video Editing (With Audio) on Artificial Analysis and places top-three in text-to-video and image-to-video» — [aiweekly.co/alerts/minimax-posts-h3-a-33b-omni-modal-video-model-to-hugging-face](https://aiweekly.co/alerts/minimax-posts-h3-a-33b-omni-modal-video-model-to-hugging-face), 2026-09-20, **пресса**.

### Runway Act-Two (performance transfer / motion capture)

- **Что делает**: берёт **снятое видео живого человека** (driving performance) и переносит мимику, жесты рук и движения тела на персонажа-картинку. Дословно из обзора: «Act-Two captures face, hands, and full-body gestures from a reference video and maps them onto your character… The driving performance captures the movement, expressions, audio, and gestures that will be transferred» — [help.runwayml.com/…/Performance-Capture-with-Act-Two](https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two) (страница отдала **403** на фетч, текст — из выдачи), 2026-09-20, **официоз/пресса**.
  - **Критично для задачи владельца**: Act-Two требует, чтобы кто-то СНЯЛ исходное выступление. Условие «генерация машиной каждый день без съёмки» этим не выполняется — разве что снять один универсальный «болванчик»-дубль и гонять его, но тогда мимика будет повторяться каждый день.
- **Цена — ДОСЛОВНО из официальных доков API**: «`act_two`: 5 credits per second» при «Credits can be purchased for $0.01 per credit in the developer portal for an organization» — [docs.dev.runwayml.com/guides/pricing/](https://docs.dev.runwayml.com/guides/pricing/), 2026-09-20, **официоз**. Итого **$0.05/с**, ролик 60 с ≈ **$3.00**.
  - Там же для сравнения: «`gen4.5`: 12 credits per second», «`wan3` (480p): 5 credits per second», «`seed_audio`: 0.25 credits per second (5 credit minimum per generation)», «`eleven_v3`: 1 credit per 50 characters», real-time аватары «`gwm1_avatars` … 2 credits upfront, then 2 credits per 6 seconds».
  - Кредиты веб-приложения и API **не переливаются**: «credits bought in the web app never appear in an API balance and that the two are non-transferable in both directions» — [eesel.ai/blog/runway-ai-pricing](https://www.eesel.ai/blog/runway-ai-pricing), 2026-09-20, **пресса**.
- **Лимиты**: выход «up to 10 seconds per generation», driving-видео от 3 с, рабочий предел ~30 с; выход 24 fps, 1080p; соотношения «Landscape 1280:720, 1584:672, 1104:832, Portrait 720:1280, 832:1104, Square 960:960» — [aiwiki.ai/wiki/runway_act_two](https://aiwiki.ai/wiki/runway_act_two) + [docs.dev.runwayml.com/assets/inputs/](https://docs.dev.runwayml.com/assets/inputs/), 2026-09-20, **пресса/официоз**. 60 с = 6+ генераций.
- **Русский**: Act-Two язык вообще не знает — он копирует артикуляцию с исходного видео, поэтому **русский работает «из коробки»**, если русскую речь произнёс человек на driving-видео. Это редкий случай в срезе: язык не ограничение, ограничение — нужна съёмка. Отдельная функция Runway «Lip Sync» работает «up to 45 seconds», Pro-план даёт «custom voice for lip sync and text to speech» — [eesel.ai](https://www.eesel.ai/blog/runway-ai-pricing), 2026-09-20, **пресса**.
- **API и доки**: [docs.dev.runwayml.com](https://docs.dev.runwayml.com/) — полноценный dev-портал, модель `act_two`. Есть и сторонние обёртки (CometAPI, EachLabs).
- **Оплата из РФ**: «Оплатить Runway из России напрямую картой российского банка не получается — платёж отклоняется ещё до списания… Мир или СБП не принимаются зарубежным эквайрингом» — [vc.ru/services/2971734](https://vc.ru/services/2971734-kak-oplatit-podpisku-runway-v-rossii), 2026-09-20, **практики**. Рабочие пути: посредник за рубли, виртуальная зарубежная карта, подарочная карта App Store USA.
- **Качество (практики)**: Act-Two хвалят за живую мимику и жесты — на сегодня это лучший перенос актёрской игры; слабое место — руки на сложных планах и «пластилиновость» при сильном отличии персонажа от исходного лица.

---

## БЛОК Б — открытые модели (self-hosted, GPU)

### LivePortrait (KwaiVGI / Kling Team)

- **Что делает**: «Bring portraits to life» — оживляет портрет, перенося мимику с **видео-драйвера**. Поддерживает человека и животных, video-to-video, image-driven, региональный контроль — [github.com/KwaiVGI/LivePortrait](https://github.com/KwaiVGI/LivePortrait), 2026-09-20, **официоз**.
  - **Ключевое ограничение для задачи**: **звук не обрабатывает вообще.** «No audio-driven lip-sync… The system is video-driven only — it requires a driving video or motion template file (`.pkl` format)» — там же. То есть липсинка по аудио нет; нужен драйвер-видео (и снова съёмка). Годится только как «оживлялка портрета» в паре с отдельным липсинк-модулем.
- **Лицензия**: MIT на код и веса, **но с миной**: «The models of InsightFace are for non-commercial research purposes only» — LivePortrait тянет InsightFace `buffalo_l` для детекции лиц. Для коммерции детектор надо заменить — [github.com/KwaiVGI/LivePortrait/issues/548](https://github.com/KwaiVGI/LivePortrait/issues/548), 2026-09-20, **официоз (issue) / практики**.
- **GPU/VRAM**: точных цифр в README **не найдено**; модель лёгкая (работает на потребительских картах ~8 ГБ). Про мак дословно: Apple Silicon «maybe 20x slower than RTX 4090» — [github.com/KwaiVGI/LivePortrait](https://github.com/KwaiVGI/LivePortrait), 2026-09-20, **официоз**. На маке владельца — непригодно.
- **Скорость**: в репо есть `speed.py`, конкретных мс/кадр в README **не найдено**. Сообщество называет ~10–20 мс/кадр на 4090 (реалтайм-класс) — цифру официально подтвердить не удалось.
- **Русский**: **неприменимо** — модель языконезависима, потому что копирует артикуляцию с видео, а не со звука. Если драйвер-видео на русском, артикуляция русская.
- **Веса**: HuggingFace `KlingTeam/LivePortrait` (бывш. `KwaiVGI/LivePortrait`), также Google Drive и Baidu.
- **Хостинг**: Replicate — [replicate.com/fofr/live-portrait](https://replicate.com/fofr/live-portrait); ComfyUI-нода есть. Цена на Replicate — по времени GPU, фиксированной ставки за секунду видео **не найдено**.

### MuseTalk (TMElyralab, v1.5)

- **Что делает**: дословно «audio-driven lip-syncing model trained in the latent space of `ft-mse-vae`», «modifies an unseen face according to the input audio, with a size of face region of `256 x 256`» — [github.com/TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk), 2026-09-20, **официоз**. Это классический «переклей губы на готовом видео».
- **Лицензия — самая чистая в срезе, дословно**: «The code of MuseTalk is released under the MIT License. There is no limitation for both academic and commercial usage», веса «available for any purpose, even commercially» — там же, 2026-09-20, **официоз**.
- **GPU/VRAM**: дословно «an NVIDIA GeForce RTX 3050 Ti Laptop GPU with 4GB VRAM. In fp16 mode, generating an 8-second video takes approximately 5 minutes» — там же. То есть **4 ГБ VRAM хватает**, это самый скромный порог в блоке.
- **Скорость**: дословно «30fps+ on an NVIDIA Tesla V100» — реальный реалтайм на серверной карте. На слабой карте 8 с видео ≈ 5 минут → 60 с ролика ≈ 37 минут (оценка, линейная экстраполяция). На V100+ 60 с рендерятся быстрее реального времени.
- **Русский — ЧАСТИЧНО ЗАЯВЛЕН**: дословно «supports audio in various languages, such as Chinese, English, and Japanese» — [github.com/TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk), 2026-09-20, **официоз**. Русский поимённо **не назван**. Модель работает на аудио-признаках Whisper, который русский знает, поэтому русский обычно «едет», но качество фонем на русском официально не замерялось — **не найдено**.
- **Лимиты**: область лица **256×256** — главный минус: на кадре 1080p рот получается мыльным. v1.5 (28.03.2025) добавила perceptual loss, GAN loss и sync loss ради «enhanced clarity, identity consistency, and precise lip-speech synchronization», но разрешение осталось узким местом: «it has not yet reached the theoretical resolution bound» — там же, **официоз**.
- **Веса**: [huggingface.co/TMElyralab/MuseTalk](https://huggingface.co/TMElyralab/MuseTalk/tree/main).
- **Хостинг**: есть ComfyUI-ноды и обёртки на Replicate; официальной ставки за секунду **не найдено**.

### LatentSync 1.5 / 1.6 (ByteDance)

- **Что делает**: дословно «an end-to-end lip-sync method based on audio-conditioned latent diffusion models» — переозвучивает губы на готовом видео под аудио — [github.com/bytedance/LatentSync](https://github.com/bytedance/LatentSync), 2026-09-20, **официоз**.
- **Лицензия — дословно**: «Apache-2.0 license» — там же, 2026-09-20, **официоз**. Коммерция разрешена, без подвоха InsightFace-класса.
- **GPU/VRAM — дословно**: инференс «8 GB with LatentSync 1.5», «18 GB with LatentSync 1.6»; обучение 20–55 ГБ — там же, **официоз**.
- **Разрешение**: 1.6 «trained on 512×512 resolution to address blurriness» — вдвое чётче MuseTalk. 1.5 (март 2025) добавила temporal layers и снизила VRAM.
- **Русский**: официально отмечено только, что 1.5 «improves performance on Chinese videos». Русский поимённо **не найдено**. Как и MuseTalk, работает на Whisper-признаках → русский технически проходит, замеров качества нет.
- **Скорость**: метрик в README **не найдено**.
- **Веса**: HuggingFace `ByteDance/LatentSync-1.6`.
- **Хостинг**: есть на Replicate и в ComfyUI; фиксированной цены за секунду **не найдено**.

### SadTalker (OpenTalker)

- **Что делает**: дословно «single portrait image 🙎‍♂️ + audio 🎤 = talking head video 🎞» — [github.com/OpenTalker/SadTalker](https://github.com/OpenTalker/SadTalker), 2026-09-20, **официоз**.
- **Лицензия — дословно**: «The license has been updated to Apache 2.0, and we've removed the non-commercial restriction» — там же, **официоз**. Коммерция разрешена.
- **Разрешение**: две версии весов — `SadTalker_V0.0.2_256.safetensors` и `SadTalker_V0.0.2_512.safetensors` (256 и 512 px по лицу).
- **GPU/VRAM и скорость**: в README **не найдено**. Модель лёгкая, идёт на 8 ГБ.
- **Русский**: **не найдено** — язык в документации не обсуждается.
- **Веса**: Google Drive / GitHub Releases / Baidu, автоскачивание `bash scripts/download_models.sh`.
- **Статус проекта**: последние заметные обновления README — 2023 год. По качеству в 2026-м это **устаревший базлайн**: голова «плавает», артикуляция грубее, чем у LatentSync/MuseTalk. Брать имеет смысл только как эталон «хуже некуда».

### Hallo / Hallo2 / Hallo3 (Fudan Generative Vision)

- **Что делает**: Hallo3 — «Highly Dynamic and Realistic Portrait Image Animation with Video Diffusion Transformer», анимирует портрет по аудио — [github.com/fudan-generative-vision/hallo3](https://github.com/fudan-generative-vision/hallo3), 2026-09-20, **официоз**.
- **Лицензия**: MIT — там же, **официоз**.
- **РУССКИЙ — ПРЯМОЙ ЗАПРЕТ, дословно**: «Audio must be in English since our training datasets are only in this language» — [github.com/fudan-generative-vision/hallo3](https://github.com/fudan-generative-vision/hallo3), 2026-09-20, **официоз**.
  - Это единственная модель среза, где авторы **прямым текстом** говорят «только английский». Для задачи владельца **вычёркивается целиком** — вся линейка Hallo.
- **GPU/VRAM**: «Tested GPUs: H100», цифр VRAM **не найдено** — серверный класс.
- **Лимиты входа**: «Reference image must be 1:1 or 3:2 aspect ratio».
- **Веса**: `fudan-generative-ai/hallo3` на HuggingFace.
- **Скорость**: **не найдено**.

### EchoMimic v3 (Ant Group)

- **Что делает**: дословно «1.3B Parameters are All You Need for Unified Multi-Modal and Multi-Task Human Animation» — анимация человека по аудио и тексту, и говорящая голова, и всё тело — [github.com/antgroup/echomimic_v3](https://github.com/antgroup/echomimic_v3), 2026-09-20, **официоз**.
- **Лицензия — дословно**: «The models in this repository are licensed under the Apache 2.0 License» — там же, **официоз**.
- **GPU/VRAM — самый доступный из «взрослых»**: «12G VRAM Requirement» для Flash-версии, «16G VRAM» через ComfyUI; тестировали на A100 (80G), RTX4090D (24G), V100 (16G) — там же, **официоз**.
- **Разрешение**: «Supports up to 768×768 Resolution» (Flash-Pro).
- **Скорость**: «8-step High-quality Generation» у Flash-Pro; preview — 5 шагов для головы, 15–25 для тела. Минут на 60 с видео **не найдено**.
- **Русский**: **не найдено**. В репо демо «Chinese Driven Audio» и аудиоэнкодер `chinese-wav2vec2-base` — то есть модель заточена под китайский; мультиязычность и русский не документированы. Риск плохих русских фонем высокий.
- **Веса**: HuggingFace и ModelScope, папки `./flash/` и `./preview/`.
- **База**: Wan2.1-Fun-V1.1-1.3B-InP.

### Wan 2.2 S2V-14B (Alibaba) — ⭐ лучший ОТКРЫТЫЙ кандидат по длине

- **Что делает**: настоящая **speech-to-video** — «generates videos from audio input, optionally combined with reference images and text prompts» — [github.com/Wan-Video/Wan2.2](https://github.com/Wan-Video/Wan2.2), 2026-09-20, **официоз**.
- **Лицензия — дословно**: «Apache 2.0 License» — там же, **официоз**. Полностью коммерческая, без географических исключений (в отличие от MiniMax H3).
- **Длина — ключевое преимущество, дословно**: «The generated video length will automatically adjust based on the input audio length» (когда `--num_clip` не задан) — там же, **официоз**. То есть **60-секундный ролик делается одним прогоном по 60-секундной аудиодорожке**, без нарезки на 8–15-секундные куски. Это единственная модель среза с таким свойством.
- **GPU/VRAM — дорого**: S2V-14B на одной карте требует «at least 80GB VRAM» — там же, **официоз**. То есть A100 80G / H100. Младшая TI2V-5B идёт на «at least 24GB VRAM» (RTX 4090), но это не S2V.
- **Разрешение**: «480P & 720P».
- **Скорость**: для S2V цифр **не найдено**. Для соседней TI2V-5B: «can generate a 5-second 720P video in under 9 minutes on a single consumer-grade GPU» — там же, **официоз**. На хостинге fal один пример «took approximately 5 minutes».
- **Русский**: в документации **не найдено** — язык не обсуждается. Модель аудио-управляемая (артикуляция из звуковой волны), поэтому русский технически проходит; официальных замеров нет.
- **Веса**: [huggingface.co/Wan-AI/Wan2.2-S2V-14B](https://huggingface.co/Wan-AI/Wan2.2-S2V-14B), зеркало ModelScope.
- **Хостинг и цена — ДОСЛОВНО** ([fal.ai/models/fal-ai/wan/v2.2-14b/speech-to-video](https://fal.ai/models/fal-ai/wan/v2.2-14b/speech-to-video), 2026-09-20, **официоз (платформы)**): «720p: $0.20 per video second», «580p: $0.15 per video second», «480p: $0.10 per video second»; секунды считаются по 16 fps.
  - Ролик 60 с: 480p ≈ **$6**, 720p ≈ $12.
  - WaveSpeedAI: «$0.15 per 5 seconds (480p)» и «$0.3 per 5 seconds (720p)» — [wavespeed.ai/models/wavespeed-ai/wan-2.2/speech-to-video](https://wavespeed.ai/models/wavespeed-ai/wan-2.2/speech-to-video), 2026-09-20, **официоз (платформы)**. Это **$0.03/с (480p)** и **$0.06/с (720p)** — втрое-вчетверо дешевле fal; 60 с в 720p ≈ **$3.60**. Самая дешёвая рабочая цена в срезе.

### OmniHuman-1 / OmniHuman 1.5 (ByteDance)

- **Что делает**: дословно «Creates videos from a single image and multimodal prompts (audio, image, and text)», «generates expressive character animations that are coherent with the speech's rhythm, prosody and semantic content» — [byteplus.com/en/product/OmniHuman](https://www.byteplus.com/en/product/OmniHuman), 2026-09-20, **официоз**.
- **ВЕСА НЕ ОТКРЫТЫ**: официальных открытых весов OmniHuman **не найдено** — модель отдаётся только через API BytePlus и через продукт Dreamina/Jimeng. В блок «открытых» попала по ошибке ожиданий: это закрытая коммерческая модель. Страница исследования — [omnihuman-lab.github.io/v1_5](https://omnihuman-lab.github.io/v1_5/).
- **Цена — дословно**: «$0.12 per second» — [byteplus.com/en/product/OmniHuman](https://www.byteplus.com/en/product/OmniHuman), 2026-09-20, **официоз**. Ролик 60 с ≈ **$7.20**. Сторонние шлюзы называют «$0.16 per second» для официального API — [runcomfy.com/models/bytedance/omnihuman/api](https://www.runcomfy.com/models/bytedance/omnihuman/api), 2026-09-20, **пресса**.
- **Разрешение**: «Supports native 1080p-resolution video output» — **официоз**.
- **API и доки**: [docs.byteplus.com/en/docs/byteplus-vision/omnihuman-subject_recognition](https://docs.byteplus.com/en/docs/byteplus-vision/omnihuman-subject_recognition). Шлюзы: PiAPI, Kie.ai, RunComfy, OminiGate.
- **Русский**: официально **не найдено**. Модель аудио-управляемая, поэтому шанс есть, но подтверждения нет.
- **Максимальная длина**: **не найдено**.
- **Оплата из РФ**: BytePlus — международный биллинг, российские карты **не найдено** чтобы принимались.

### Hallo2 (отдельно — интересен длиной, но тот же языковой запрет)

- **Что добавляет**: «Long-Duration and High-Resolution Audio-driven Portrait Image Animation» — демо до 4K и ролики «from 4 minutes to over 1 hour» — [github.com/fudan-generative-vision/hallo2](https://github.com/fudan-generative-vision/hallo2), 2026-09-20, **официоз**. По длине — идеально под задачу.
- **Лицензия**: MIT.
- **GPU**: «Tested GPUs: A100».
- **РУССКИЙ — ТОТ ЖЕ ЗАПРЕТ, дословно**: «It must be in English since our training datasets are only in this language» — там же, **официоз**. Вычёркивается.
- **Веса**: [huggingface.co/fudan-generative-ai/hallo2](https://huggingface.co/fudan-generative-ai/hallo2).

### Sync Labs (sync.so) — не открытая, но закрывает дыру по длине и языку

Добавлено сверх брифа: это ровно тот класс сервиса, которого не хватает в списке — липсинк по СВОЕЙ дорожке, без ограничения в 10–15 секунд.

- **Цена — ДОСЛОВНО** ([sync.so/docs/models/lipsync](https://sync.so/docs/models/lipsync), 2026-09-20, **официоз**), за секунду при 25 fps:
  - `lipsync-1.9.0-beta`: «$0.02 -- $0.025/sec» (legacy)
  - `lipsync-2`: «$0.04 -- $0.05/sec»
  - `lipsync-2-pro`: «$0.067 -- $0.083/sec»
  - `sync-3`: «$0.107 -- $0.133/sec»
  - Ролик 60 с на `lipsync-2` ≈ **$2.40–3.00**.
- **Длина — дословно**: «The maximum video duration depends on your subscription plan — ranging from 1 minute on Hobbyist up to 30 minutes on Scale+» — там же, **официоз**. 60 с укладывается даже в минимальный план.
- **Разрешение**: `lipsync-2` / `lipsync-2-pro` — 512×512 по лицу; `sync-3` — «4K native output with built-in super resolution».
- **Русский**: на страницах доков поимённого списка языков **не найдено**. Маркетинг заявляет языконезависимость: «The AI model automatically adapts to any language… without needing language-specific training» — [sync.so/lipsync-2-pro](https://sync.so/lipsync-2-pro), 2026-09-20, **официоз (маркетинг)**.
- **Тарифы**: Hobbyist $5/мес, Creator $19, Growth $49, Scale $249 — [sync.so/pricing](https://sync.so/pricing), 2026-09-20, **официоз**.
- **API**: есть полноценный API и SDK; также на Replicate (`sync/lipsync-2`, `sync/lipsync-2-pro`), fal (`fal-ai/sync-lipsync`, «$0.70 per minute» за версию 1.9), WaveSpeed, Segmind.
- **Оплата из РФ**: международные карты; прямой оплаты российской картой **не найдено**.

---

## Готовые хостинги открытых моделей — цены в одном месте

Все — 2026-09-20, **официоз (платформы)**.

| Модель | Площадка | Цена дословно | 60 с ролика |
| --- | --- | --- | --- |
| LatentSync | fal.ai | «Your request will cost $0.2 for videos up to 40 seconds. For longer videos, you will be charged $0.005 per second of output video» — [fal.ai/models/fal-ai/latentsync](https://fal.ai/models/fal-ai/latentsync) | **≈ $0.30** |
| LatentSync | WaveSpeedAI | «starts at $0.15 per run» — [wavespeed.ai/models/bytedance/latentsync](https://wavespeed.ai/models/bytedance/latentsync) | ≈ $0.15+ |
| Wan 2.2 S2V-14B | WaveSpeedAI | «$0.15 per 5 seconds (480p)», «$0.3 per 5 seconds (720p)» — [wavespeed.ai](https://wavespeed.ai/models/wavespeed-ai/wan-2.2/speech-to-video) | $1.80 / **$3.60** |
| Wan 2.2 S2V-14B | fal.ai | «720p: $0.20 per video second», «580p: $0.15», «480p: $0.10» — [fal.ai](https://fal.ai/models/fal-ai/wan/v2.2-14b/speech-to-video) | $6–12 |
| MiniMax H3 Max Lip Sync | fal.ai | «480p: $0.05/second», «768p: $0.08/second», «1080p: $0.16/second», «2K: $0.32/second» — [fal.ai/h3-max-lip-sync](https://fal.ai/h3-max-lip-sync) | $3–19 |
| Kling LipSync | fal.ai | «$0.014 per 5-second increment» — [fal.ai](https://fal.ai/models/fal-ai/kling-video/lipsync/audio-to-video) | ≈ $0.17, но вход ≤10 с |
| Kling AI Avatar | fal.ai | «$0.0562 per second» — [fal.ai](https://fal.ai/models/fal-ai/kling-video/v1/standard/ai-avatar) | ≈ $3.37 |
| Sync lipsync-2 | sync.so | «$0.04 -- $0.05/sec» — [sync.so/docs/models/lipsync](https://sync.so/docs/models/lipsync) | $2.40–3.00 |
| OmniHuman 1.5 | BytePlus | «$0.12 per second» — [byteplus.com](https://www.byteplus.com/en/product/OmniHuman) | ≈ $7.20 |
| Veo 3.1 Lite | Google | «$0.05 (720p)», «$0.08 (1080p)» — [ai.google.dev](https://ai.google.dev/gemini-api/docs/pricing) | $3.00 / $4.80 |
| Runway act_two | Runway | «5 credits per second» × «$0.01 per credit» — [docs.dev.runwayml.com](https://docs.dev.runwayml.com/guides/pricing/) | $3.00 |

Реестр моделей на Replicate (цен на странице нет): `sync/lipsync-2`, `sync/lipsync-2-pro`, `bytedance/latentsync`, `bytedance/omni-human`, `kwaivgi/kling-lip-sync`, `wan-video/wan-2.2-s2v`, `heygen/lipsync-speed`, `heygen/lipsync-precision`, `pixverse-ai/lipsync`, `veed/fabric-1.0`, `tmappdev/lipsync` (MuseTalk), `cjwbw/sadtalker`, `chenxwh/video-retalking` — [replicate.com/collections/lipsync](https://replicate.com/collections/lipsync), 2026-09-20, **официоз**.

---

## Главный вывод по русскому липсинку

**Два разных вопроса, которые в брифе слиты в один:**

1. **«Модель сама произносит русский текст»** (нативная речь). Здесь почти все отваливаются:
   - Kling 3.0 — 5 языков, русского нет (**официоз**).
   - Sora 2 — выключается 24.09.2026 (**официоз**).
   - Veo 3.1 — «English is fully supported, other languages have not been evaluated» (**официоз**), на практике русский лучший среди коммерческих, но с фокусами против кириллических фильтров.
   - **MiniMax H3 — единственная, где русский назван поимённо в официальной карте модели** (**официоз**).
2. **«Модель двигает губы под МОЮ аудиодорожку»** (липсинк по своему звуку). Здесь язык почти не важен, потому что модели работают на аудио-признаках Whisper, а Whisper русский знает:
   - **LatentSync** — «uses Whisper model to convert speech into audio embeddings» (fal, **официоз платформы**), Apache-2.0, 512×512, 8–18 ГБ VRAM.
   - **MuseTalk** — MIT без ограничений, 4 ГБ VRAM, 30 fps+, но лицо 256×256.
   - **Wan 2.2 S2V** — Apache-2.0, длина по аудио автоматически (единственный, кто сделает 60 с одним прогоном), но 80 ГБ VRAM локально.
   - Hallo / Hallo2 / Hallo3 — **прямой запрет на не-английский в README** (**официоз**), вычёркиваются.
   - EchoMimic v3 — китайский энкодер, русский не документирован.
   - SadTalker — Apache-2.0, но морально устарел.
   - LivePortrait — аудио не умеет вообще.

**Сравнительные оценки качества (пресса, метод не раскрыт, брать как ориентир, не как замер):** визуальное качество MuseTalk 4.26 · LatentSync 3.71 · Wav2Lip 2.19; качество самого липсинка LatentSync 4.07 · MuseTalk 3.77 · Wav2Lip 2.70 — [lipsync.com/compare/wav2lip-vs-latentsync](https://lipsync.com/compare/wav2lip-vs-latentsync), 2026-09-20, **пресса**. Про MuseTalk честная оговорка: «cross-lingual performance has not been as well validated as older models» — [lipsync.com/blog/open-source-lip-sync](https://lipsync.com/blog/open-source-lip-sync), 2026-09-20, **пресса**.

---

### Не найдено / сомнительно (1B)

- **Официальная страница прайса Kling для разработчиков** ([kling.ai/dev/pricing](https://kling.ai/dev/pricing)) — не открылась, отдала только заголовок. Цифры «$0.14 per unit» и «$0.084/clip» взяты у агрегатора FairStack — **не подтверждены официозом**.
- **Официальная страница прайса Higgsfield** ([higgsfield.ai/pricing](https://higgsfield.ai/pricing)) — не открылась. Все цены Higgsfield — только из прессы.
- **Страница справки OpenAI о закрытии Sora** — HTTP 403. Сам факт закрытия подтверждён официальной таблицей deprecations, дата 24.09.2026 надёжна; формулировки про приложение (26.04.2026) — из пересказов.
- **Страница справки Runway про Act-Two** — HTTP 403. Цена `act_two` при этом подтверждена официальными dev-доками.
- **`platform.minimax.io/docs/api-reference/video-generation`** — HTTP 404, раскладка доков MiniMax изменилась. Официальный прайс H3 у MiniMax напрямую получить не удалось (их страница пакетов прямо говорит «MiniMax H3 is not supported yet»). Цены H3 — только через fal и прессу.
- **`tomodahinata.com`** (гайд по выбору липсинк-модели 2026) — домен не резолвится (ENOTFOUND).
- **VRAM для LivePortrait, SadTalker, Hallo3, Hallo2** — точных цифр в README нет.
- **Скорость (минут на 60 с видео)** — официальных замеров нет ни у одной модели, кроме MuseTalk («8-second video takes approximately 5 minutes» на 4 ГБ; «30fps+ on V100») и Wan TI2V-5B («5-second 720P video in under 9 minutes»). Для S2V-14B, LatentSync, EchoMimic, Hallo — **не найдено**.
- **Качество русских фонем — нигде не замерено.** Ни один источник среза не даёт цифр по русскому липсинку. Все утверждения про «русский работает» — либо маркетинг («any language»), либо логический вывод из Whisper-энкодера. **Это надо проверять своим прогоном, а не доверять источникам.**
- **Максимальная длина OmniHuman** — не найдено.
- **Коммерческий порог лицензии MiniMax H3** («до ~$20M выручки») — из прессы, текст самой лицензии не вычитан.
- **Оплата из РФ для MiniMax, fal.ai, Replicate, WaveSpeed, sync.so, BytePlus** — прямого подтверждения приёма российских карт нет нигде; и опровержения в явном виде тоже нет. Практический дефолт периметра: зарубежная карта или рублёвый посредник.


---

## 1C. Аватары, не попавшие в основной список (добор)

### Tavus
- **Что делает**: API-first платформа «цифровых реплик» — клон лица («replica») +
  разговорный видео-аватар реального времени (CVI). Заточена под интерактив
  (видеособеседник), но умеет и обычную генерацию из текста.
- **Цена** (дословно со страницы тарифов): Basic (Free) — «25 minutes of AI
  conversational video» в месяц; Starter — $59/mo, 100 минут; Growth — $397/mo,
  1 250 минут; Enterprise — custom. Переработка: «$0.37/min» (Starter),
  «$0.32/min» (Growth).
  [tavus.io/pricing](https://www.tavus.io/pricing), проверено 2026-09-20, **официоз**.
- **Клон лица**: Starter включает «3 Custom Replica trainings per Month», Growth —
  «7 Custom Replica trainings per Month»; сверх лимита — «$65 per Replica»
  (Starter) / «$40 per Replica» (Growth). Там же, **официоз**.
- **API**: есть, дословно «Full access to our suite of developer APIs, as well as
  no-code portal» — на всех тарифах. Там же, **официоз**.
- **Русский**: страница говорит «Support for 30+ languages» и «42+ Languages
  supported», **русский поимённо не назван** — требует проверки живым тестом.
  ⚠️ не подтверждено.
- **Оплата из РФ**: не проверял отдельно; класс тот же, что у всех западных
  (зарубежная карта). ⚠️ не подтверждено.
- **Замечание по нашему сценарию**: Tavus дороже конкурентов за минуту, потому что
  платишь за интерактив, который нам не нужен. Для «голова читает новости» это
  переплата, если только не нужен разговорный формат.

### Elai.io
- **Что делает**: talking-head видео из текста, библиотека 80+ аватаров, клон
  голоса, свой аватар по селфи-видео. В русскоязычных обзорах регулярно
  всплывает как «сервис с хорошей поддержкой русского».
- **Цена** (дословно со страницы тарифов): Free — «$0 / No commitment»;
  Creator — «$29/Month $23/Month» (при годовой оплате), «15 minutes per month»;
  Team — «$125/Month $100/Month», «50 minutes per month»; Enterprise — «Let's Talk».
  Доп. минуты — «$2» за минуту.
  [elai.io/pricing](https://elai.io/pricing/), проверено 2026-09-20, **официоз**.
- **Клон лица и голоса** (дословно, годовые add-on'ы): Selfie Avatar — «$199/Annually»,
  Studio Avatar — «$500/Annually», Voice Cloning — «$200/Annually». Там же, **официоз**.
- **API**: «Public API» отмечен на Creator и выше. Там же, **официоз**.
- **Русский**: на странице тарифов русский **поимённо не назван** (заявлено
  «75+ Languages» / «100+ languages»); сторонние обзоры говорят о 75+ языках и
  300+ голосах, русский «в числе поддерживаемых» — но это не официоз.
  ⚠️ подтверждения от вендора нет.
- **Оплата из РФ**: не проверял. ⚠️ не подтверждено.
- **Арифметика для нашего сценария**: Creator $29/мес = 15 минут = примерно
  15 роликов по 60 с в месяц ≈ **$1,93 за ролик**, плюс разово $199/год за свой
  аватар и $200/год за клон голоса (≈ $33/мес при равномерном раскладе).
  Итого около $62/мес за 15 роликов ≈ **$4,1 за ролик**. Если нужен ролик
  каждый день (30 шт.), нужны доп. минуты по «$2» — ещё $30.

### Welder (РФ)
- Упоминается в русскоязычных обзорах 2026 как российский AI-аватар-сервис
  наряду с HeyGen/Synthesia/D-ID/Tavus:
  [welderai.ru, «AI-аватары 2026»](https://www.welderai.ru/blog/avatary-ai-2026-heygen-synthesia-d-id-tavus-welder),
  проверено 2026-09-20, **практики** (это блог самого вендора — источник
  заинтересованный, цены и качество ОФИЦИОЗОМ не подтверждены).
- ⚠️ Отдельную проверку цен, API и качества русского не делал — кандидат на
  добор следующим пассом, потому что это единственный найденный российский
  сервис именно «говорящей головы» с оплатой рублями.

### Не найдено / сомнительно (1C)
- Русский язык у Tavus и Elai — **поимённо не подтверждён** официальными
  страницами; обзоры говорят «в числе 75+/30+», но это не доказательство
  качества русской артикуляции.
- Welder: цены, API, наличие клона своего лица — не проверено.
- Оплата из РФ у Tavus и Elai — не проверена отдельно.

### sync.so (sync labs) — выделенный липсинк-API ⭐ ключевая находка пасса
- **Что делает**: не «аватар», а **переозвучка реального видео**: на вход своё
  снятое видео + новый аудиофайл, на выход то же видео с переклеенной
  артикуляцией. Для нашего сценария это отдельный архитектурный путь: владелец
  **один раз** снимает 1–2 минуты себя «в говорящей позе», а дальше каждый день
  машина подставляет новую дорожку. Лицо настоящее, съёмки каждый день нет,
  подписка на аватар-сервис не нужна.
- **Цена, тарифы** (дословно со страницы тарифов): Hobbyist — «$5/month + $0.05 /sec»;
  Creator — «$19/month + $0.05 /sec»; Growth — «$49/month + $0.0475 /sec» плюс
  «5% discount on usage across all models»; Scale — «$249/month + $0.04 /sec»
  плюс «20% discount on usage across all models»; Enterprise — custom.
  [sync.so/pricing](https://sync.so/pricing), проверено 2026-09-20, **официоз**.
- **Цена по моделям** (дословно из доков, при 25 fps):
  lipsync-1.9.0-beta — «$0.02 — $0.025/sec»; lipsync-2 — «$0.04 — $0.05/sec»;
  lipsync-2-pro — «$0.067 — $0.083/sec»; sync-3 — «$0.107 — $0.133/sec».
  [sync.so/docs/models/lipsync](https://sync.so/docs/models/lipsync),
  проверено 2026-09-20, **официоз**.
- **Пересчёт на ролик 60 секунд**: lipsync-1.9 — **$1,2–1,5**; lipsync-2 —
  **$2,4–3,0**; lipsync-2-pro — **$4,0–5,0**; sync-3 — **$6,4–8,0**.
  Плюс абонплата тарифа ($5–19/мес на нижних).
- **Лимиты**: дословно «The maximum video duration depends on your subscription
  plan — ranging from 1 minute on Hobbyist up to 30 minutes on Scale+ plans».
  То есть **на Hobbyist ($5/мес) ролик до 1 минуты — ровно наш формат**.
  Разрешение лица: lipsync-2 и lipsync-2-pro — 512×512 по лицу; sync-3 —
  «4K native output with built-in super resolution». Там же, **официоз**.
- **API**: есть, дословно «RESTful API and SDKs for seamless integration» на всех
  тарифах; на Scale — «Batch API», «Launch 100s of videos with a single API call».
  [sync.so/pricing](https://sync.so/pricing), **официоз**.
- **Русский**: ⚠️ **в документации язык не оговорён вообще** — ни поддержки, ни
  ограничений; упомянут только дубляж «Dub your audio into 29 different languages
  with ease» (страница тарифов), список языков не раскрыт. Липсинк-модели
  работают от аудиосигнала, а не от текста, поэтому формально язык им безразличен —
  но **качество русской артикуляции официозом не подтверждено и требует живого
  теста**. Это главный открытый вопрос по этому пути.
- **Доступ через агрегаторы** (полезно, если прямая оплата не идёт): те же модели
  есть на fal.ai — по данным обзоров, Sync Lipsync 2.0 ≈ «$3 per minute», pro ≈
  «$5 per minute»; также WaveSpeedAI и Segmind.
  [fal.ai/models/fal-ai/sync-lipsync/v2](https://fal.ai/models/fal-ai/sync-lipsync/v2),
  [wavespeed.ai/models/sync/lipsync-2](https://wavespeed.ai/models/sync/lipsync-2),
  проверено 2026-09-20, **практики** (цены агрегаторов из поисковой выдачи,
  официозом fal не переоткрывал — ⚠️ сверить).
- **Оплата из РФ**: не проверял отдельно; класс западный. ⚠️ не подтверждено.
- **Почему это важно для среза**: это самый дешёвый честный «цифровой двойник» —
  $1,2–3,0 за ролик против $2–4 у аватар-сервисов, и при этом лицо **настоящее,
  своё**, без загрузки биометрии в аватар-платформу и без её модерации.


---

## 2. Голос: клон на русском и TTS

Срез на 2026-09-20. Цель применения: ежедневный ролик 45–60 сек, «говорящая голова читает 3 новости про ИИ», клон голоса владельца, русский язык, машинный пайплайн через API.

---

## Западные / глобальные

### ElevenLabs

- **Что делает**: TTS + клонирование голоса, два режима — Instant Voice Clone (IVC, мгновенный, из короткого сэмпла) и Professional Voice Clone (PVC, файн-тюн на длинной записи). Модели: Eleven v3 (максимум качества, 70+ языков), Multilingual v2 (29 языков), Flash v2.5 (низкая задержка ~75 мс, 32 языка). Русский поддержан во всех трёх.
- **Цена (подписки)**: дословно — «Free — $0per month · 10k creditsper month»; «Starter — $6per month · 30k creditsper month … Commercial License, Instant Voice Cloning»; «Creator — $22 First month 50% off … $11per month · 121k creditsper month … Professional Voice Cloning»; «Pro — $99per month · 600k creditsper month»; «Scale — $299per month · 1.8M creditsper month … 3 Professional Voice Clones»; «Business — $990per month · 6M creditsper month … Low-latency TTS as low as 5c/minute, 10 Professional Voice Clones» — [elevenlabs.io/pricing](https://elevenlabs.io/pricing), 2026-09-20, **официоз**
- **Цена (API, за символы)**: дословно — «v3 & v2 Multilingual … Price per 1K characters … $0.10»; «v3 Conversational & Flash/Turbo … Price per 1K characters … $0.05». Включённые символы по тарифам: «Starter ($6/mo): 10,000 characters · Creator ($22/mo): 220,000 · Pro ($99/mo): 990,000 · Scale ($299/mo): 2,990,000 · Business ($990/mo): 9,900,000». Примечание страницы: «API usage is billed in US dollars, not credits» — [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api), 2026-09-20, **официоз**
- **API**: REST + WebSocket streaming, официальные SDK Python/Node. Док — [elevenlabs.io/docs](https://elevenlabs.io/docs/models) (модели), [capabilities/voices](https://elevenlabs.io/docs/capabilities/voices). Лимит символов на запрос: v3 — 5 000, Multilingual v2 — 10 000, Flash v2.5 — 40 000, 2026-09-20, **официоз**
- **Качество русского**: лучший из коммерческих по совокупности отзывов. Практики: «Eleven v3 поддерживает 70+ языков, включая русский, и звучит очень естественно с интонацией и эмоциями»; при этом «русский язык звучит заметно хуже английского, хотя последние обновления модели v3 значительно улучшили ситуацию» — [dtf.ru гайд 2026](https://dtf.ru/howto/5167296-kak-polzovatsya-elevenlabs-dlya-ozvuchki-i-klonirovaniya-golosa-iz-rossii), [vc.ru — «7 настроек чтобы убрать эффект робота»](https://vc.ru/ai/2955875-klonirovanie-golosa-v-elevenlabs-ubrat-effekt-robota), 2026-09-20, **практики**. Важный край для клона: акцент и эхо комнаты копируются в клон 1:1 — «Voice Changer не исправляет акцент, а лишь переносит тембр».
- **Клон: требования к образцу**:
  - **IVC** — «less than two minutes of audio», доступен со Starter ($6), верификации нет — [docs/capabilities/voices](https://elevenlabs.io/docs/capabilities/voices), 2026-09-20, **официоз**
  - **PVC** — «at least 30 minutes of high-quality audio», рекомендация «closer to 2-3 hours of audio» / «ideally as close to three hours as possible»; обучение «Usually fine-tuning will take 3-6 hours»; PVC работает на 38 языках (набор Flash v2.5, русский входит) — [docs/…/professional-voice-cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning), 2026-09-20, **официоз**
- **Лимиты**: слоты PVC — «Free и Starter: 0 · Creator, Pro, Scale: 1 · Business: 10 · Enterprise: custom». Символы сверх пакета тарифицируются по API-ставке.
- **Оплата из РФ**: **напрямую нельзя**. «Standard Russian cards don't work through ElevenLabs' payment processor: Stripe checks the BIN code and automatically rejects Russian payment details»; карты «Мир» не принимаются. Рабочие пути — посредник (оплата рублями/СБП), своя зарубежная карта, помощь из-за границы. После активации «platform access is not limited by country» — синтез и API работают из российских сетей напрямую — [vc.ru](https://vc.ru/services/2971690-oplata-elevenlabs-v-rossii), [РБК Компании](https://companies.rbc.ru/news/6NjTrg73Lo/podpiska-elevenlabs-v-rossii-2026-kak-oplatit-i-nachat-polzovatsya/), 2026-09-20, **пресса/практики**. Отдельный край: регистрация из РФ обычно требует VPN («Россия в списке стран с ограниченным доступом»).
- **Правовой край**: коммерческая лицензия — со Starter и выше («Commercial License» в составе тарифа); на Free коммерческого использования нет. Для PVC обязательна голосовая верификация: «Voice-captcha technology is used to verify that Professional Voice Clones are created from your own voice samples» и «For now, we only allow you to clone your own voice» — то есть свой голос клонировать можно и нужно подтвердить записью, чужой — нельзя.

### Fish Audio (OpenAudio S1 / S2 Pro)

- **Что делает**: TTS + мгновенный клон голоса из короткого сэмпла, 80+ языков (русский входит), задержка до ~200 мс. Есть открытая линия fish-speech и коммерческое облако. Модель S1 — #1 на TTS-Arena2 по отзывам обзорщиков; в API сейчас предлагаются S2 Pro и S2.1 Pro.
- **Цена**: дословно — «$0.015/ K UTF-8 bytes» для S2.1 Pro и S2 Pro — [fish.audio/text-to-speech-api](https://fish.audio/text-to-speech-api/), 2026-09-20, **официоз**. То есть **$15 за 1 млн UTF-8 байт**. **Критичный край для русского**: кириллица в UTF-8 — 2 байта на символ, значит по-русски выходит **≈$30 за 1 млн символов**, а не $15. Обзорщики этот край не учитывают: «Fish Audio charges $15 per million UTF-8 bytes … roughly $15 per million English characters» — [texttolab.com](https://texttolab.com/blog/fish-audio-pricing), 2026-09-20, **пресса**
- **Цена (подписки)**: по обзорам — Free (8 000 кредитов, ~7 минут), Plus $11/мес (открывает коммерческие права), Pro $75/мес, Max $749/мес (25 млн кредитов) — [texttolab.com](https://texttolab.com/blog/fish-audio-pricing), 2026-09-20, **пресса** (официальную страницу тарифов открыть не удалось: `fish.audio/pricing/` → 404)
- **API**: REST + WebSocket, OpenAPI-док на [docs.fish.audio](https://docs.fish.audio), обзор — [fish.audio/developers](https://fish.audio/developers/). Есть on-premise с отдельной коммерческой лицензией («Commercial license available … Contact Sales»), 2026-09-20, **официоз**
- **Качество русского**: хорошее, но ниже английского. Практики: «русский язык поддерживается хорошо, но пока уступает английскому по количеству готовых голосовых моделей и точности передачи сложных интонационных конструкций» — [neurotoday.ru](https://neurotoday.ru/articles/fish-audio), [vc.ru](https://vc.ru/id1753922/2082956-fish-audio-sintez-rechi-i-klonirovanie-golosa), 2026-09-20, **практики**
- **Клон: требования к образцу**: мгновенный клон — «captures timbre and speaking style from a short reference clip» и «works across all 80+ languages with no extra training»; обзоры называют 15 секунд («Cloned My Voice Free in 15 Seconds»), русские практики — «по минутной записи» — [fish.audio](https://fish.audio/text-to-speech-api/) **официоз** + [bitdoze](https://www.bitdoze.com/fish-audio-review/), [neurotoday](https://neurotoday.ru/articles/fish-audio) **практики**, 2026-09-20
- **Лимиты**: не найдено официальных RPS/конкурентности (страница тарифов не открылась).
- **Оплата из РФ**: напрямую не проходит (Stripe), нужны посредники — существуют профильные сервисы оплаты Fish Audio за рубли — [oplata.guru/fish-audio](https://oplata.guru/fish-audio), 2026-09-20, **практики**
- **Правовой край**: коммерческое использование открывается платным тарифом (Plus и выше по обзорам); клонирование своего голоса разрешено, явной обязательной верификации согласия, как у ElevenLabs PVC, не найдено — это минус по юридической гигиене, но не блокер для своего голоса.

### Cartesia (Sonic)

- **Что делает**: real-time TTS с очень низкой задержкой, мгновенный и профессиональный клон голоса. Актуальная модель — Sonic 3.6, 44 языка, русский входит.
- **Цена**: дословно по тарифам — «Free — $0/mo · 20K credits/month»; «Pro — $5/mo · 100K credits/month … commercial use license and instant voice cloning»; «Startup — $49/mo · 1.25M credits/month … pro voice cloning and organizations»; «Scale — $299/mo · 8M credits/month»; «Enterprise — Custom credits & agent usage» — [cartesia.ai/pricing](https://cartesia.ai/pricing), 2026-09-20, **официоз**. Кредит у Cartesia ≈ 1 символ, то есть Pro за $5 даёт ~100k символов/мес.
- **API**: REST + WebSocket streaming, SDK Python/Node; док — [docs.cartesia.ai](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest). Часть справки за логином (редирект на `play.cartesia.ai/docs-auth-login`), 2026-09-20
- **Качество русского**: официально поддержан («Sonic 3.6 speaks 44 languages … Russian»), но содержательных русских отзывов о качестве **не найдено** — Cartesia в RU-комьюнити почти не обсуждают. Репутация модели — скорость для голосовых агентов, не художественная озвучка, 2026-09-20, **пресса**
- **Клон: требования к образцу**: «Get started with 10 seconds of one speaker's audio. Sonic 3.6 and newer can use up to 60 seconds to better retain the speaker's accent»; профессиональный клон — «train on at least 30 minutes of clean audio from one speaker» — [cartesia.ai/product/voice-cloning](https://www.cartesia.ai/product/voice-cloning), 2026-09-20, **официоз**
- **Лимиты**: конкурентность растёт по тарифам («high concurrency limits» на Scale); точные числа за логином.
- **Оплата из РФ**: Stripe, российские карты не проходят; профильных посредников под Cartesia не найдено (ниша мелкая) — практически хуже ElevenLabs по доступности.
- **Правовой край**: коммерческая лицензия с Pro ($5); pro-клон — с Startup ($49). Явного механизма voice-captcha согласия в открытой части документации не найдено.

### OpenAI TTS

- **Что делает**: синтез речи готовыми голосами (alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse, marin, cedar). **Клонирования голоса в публичном API НЕТ** — это главный вывод по пункту.
- **Цена**: дословно — «gpt-4o-mini-tts … Text input: $0.60 per 1M characters … Audio output: $12.00 per 1M characters»; «tts-1 … $15.00 / 1M characters»; «tts-1-hd … $30.00 / 1M characters»; «gpt-realtime … Audio input: $32.00 / Text input: $4.00 / Audio output: $16.00» (за 1M токенов) — [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing), 2026-09-20, **официоз**
- **API**: `POST /v1/audio/speech`, стриминг, форматы mp3/opus/aac/flac/wav/pcm; параметр `instructions` задаёт тон и манеру словами. Док — [Text to speech guide](https://developers.openai.com/api/docs/guides/text-to-speech), 2026-09-20, **официоз**
- **Качество русского**: русский читается корректно, но с лёгким «нерусским» просодическим акцентом у части голосов; отдельных сильных RU-отзывов не найдено. Для «говорящей головы владельца» неприменимо в принципе — голос чужой.
- **Клон: требования к образцу**: **не найдено — клонирования нет**. «GPT-4o-mini TTS only offers 13 preset synthetic voices; for custom cloning, you must wait for Voice Engine access or use alternative services like ElevenLabs» — [MindStudio](https://www.mindstudio.ai/models/gpt-4o-mini-tts), 2026-09-20, **пресса**. Voice Engine (анонс 2024) в публичный доступ так и не вышел. В API-справке есть поле кастомного голосового объекта с `id`, но это не пользовательское клонирование.
- **Лимиты**: стандартные rate limits аккаунта по тарифным уровням; лимит длины текста на запрос ~4096 символов.
- **Оплата из РФ**: напрямую нет — OpenAI не принимает российские карты и блокирует доступ из РФ; нужна зарубежная карта/посредник или прокси.
- **Правовой край**: голоса OpenAI коммерчески использовать можно (по условиям API), но обязательна пометка, что речь синтетическая (usage policies). Клонировать свой голос нечем.

---

## Российские

### Yandex SpeechKit (синтез) + Brand Voice (клон)

- **Что делает**: облачный синтез речи с готовыми русскими голосами (Алёна, Филипп и др.), API v1 (посимвольно) и API v3 (по запросам, стриминг). Отдельный продукт **Brand Voice** — фирменный голос по записи диктора, три варианта: Premium, Lite, Call Center.
- **Цена (обычный синтез)**: дословно — «Синтез с использованием API v1, за 1 млн символов: 1 342 ₽»; «Синтез с использованием API v3, за запрос: 0,1626 ₽» — [aistudio.yandex.ru/docs/ru/speechkit/pricing](https://aistudio.yandex.ru/docs/ru/speechkit/pricing), 2026-09-20, **официоз**. Цены с НДС. 1 342 ₽ ≈ $16 за 1 млн символов — дороже ElevenLabs Flash ($50/1M) не в разы, но дешевле v3 ($100/1M).
- **Цена (Brand Voice)**: дословно — Lite: «Разовый платеж за создание одного голоса: 9 150 ₽», «Хостинг, один голос, за месяц: 101 666 ₽» (второй голос 91 500 ₽, шестой и далее 50 833 ₽), «Хостинг, первые семь дней: Не тарифицируется». Premium: «Хостинг, за месяц: По запросу». Call Center: «Запрос: 0,1626 ₽» — [та же страница](https://aistudio.yandex.ru/docs/ru/speechkit/pricing), 2026-09-20, **официоз**. **Порог входа убийственный**: ~102 тыс ₽/мес только за хостинг одного клонированного голоса. Пресса подтверждает уровень: «стоимость решения начинается от 150 000 рублей в месяц» — [cloud.yandex.ru/blog](https://cloud.yandex.ru/blog/posts/2021/07/speechkit-brand-voice), **пресса**
- **API**: gRPC и REST, SDK для Python/Go/Java; синтез — `tts:synthesize` (v1) и `TtsService/UtteranceSynthesis` (v3). Док — [SpeechKit TTS](https://aistudio.yandex.ru/docs/ru/speechkit/tts/brand-voice/), 2026-09-20, **официоз**
- **Качество русского**: эталон по произношению, ударениям и числительным среди всех вариантов среза — модель нативно русская, нет «иностранного акцента» и путаницы с ё/е. Слабое место — эмоциональный диапазон: голоса ровные, для «говорящей головы» с живой подачей звучат дикторски-нейтрально.
- **Клон: требования к образцу**: Lite — «Create your own unique voice by uploading a minimum of marked audio recordings (from 30 minutes)», разметку готовите сами, качество клона зависит от качества записи. Premium — 48 кГц исходник, «managed by Yandex Cloud specialists who handle studio selection, voice actor recruitment, and data preparation» (то есть студия и менеджер обязательны). Call Center — 8 кГц, фразы до 250 символов, переменная часть не более 25% текста — [brand-voice](https://aistudio.yandex.ru/docs/ru/speechkit/tts/brand-voice/), 2026-09-20, **официоз**
- **Лимиты**: квоты на RPS и длину текста по [лимитам SpeechKit](https://cloud.yandex.ru/docs/speechkit/concepts/limits); v1 — до 5 000 символов на запрос.
- **Оплата из РФ**: **лучший в срезе** — рублями, российская карта или расчётный счёт, закрывающие документы, НДС. Никаких посредников и VPN.
- **Правовой край**: Brand Voice — B2B-продукт: подключение через заявку/менеджера Yandex Cloud, требуется согласие диктора на использование голоса (для своего голоса это формальность — подписываете сами). Это самый юридически чистый путь для РФ, но экономически несоразмерный одному ролику в день.

### SaluteSpeech (Сбер / SberDevices)

- **Что делает**: синтез и распознавание речи, русские голоса (Наталья, Борис, Марфа, Тарас и др.), SSML. Отдельный продукт **SaluteSpeech YourVoice** — создание голоса бренда/персонального голоса.
- **Цена (синтез, юрлица)**: дословно — «0,000186 рубля / символ», единица тарификации «1 символ, включая пробелы и символы SSML-разметки», то есть **186 ₽ за 1 млн символов**. Важный порог: «Минимальная стоимость использования сервиса — 15 000 рублей в месяц» — [developers.sber.ru/docs/ru/salutespeech/tariffs/legal-tariffs](https://developers.sber.ru/docs/ru/salutespeech/tariffs/legal-tariffs), 2026-09-20, **официоз**
- **Цена (физлица)**: дословно — «С 15 июля 2026 года прекращена продажа новых пакетов и продление Freemium тариф». Пока работал: Freemium — синтез 200 000 символов/мес бесплатно, распознавание 100 минут/мес; платные пакеты — «Синтез: 1 млн символов за 1 000 рублей/месяц» — [individual-tariffs](https://developers.sber.ru/docs/ru/salutespeech/tariffs/individual-tariffs), 2026-09-20, **официоз**. **Для физлица вход закрыт с 15.07.2026** — остаётся только юрлицо с минималкой 15 000 ₽/мес.
- **API**: REST + gRPC, OAuth-токен по Client ID/Secret; док — [developers.sber.ru/docs/ru/salutespeech](https://developers.sber.ru/docs/ru/salutespeech/tariff), 2026-09-20, **официоз**
- **Качество русского**: нативно русское, произношение и ударения корректны; по отзывам уступает Яндексу в естественности интонации, но разрыв небольшой. Эмоциональный диапазон ограничен — дикторская ровность.
- **Клон: требования к образцу**: YourVoice — «для обучения нейросети нужно четыре часа записи голоса», голос бренда создаётся «в течение месяца»; подключение — «нужно отправить заявку на странице решения, специалисты Сбера свяжутся и согласуют время записи голоса для синтеза». Есть также бета-режим «создание голосовых моделей из нескольких секунд звука» — [developers.sber.ru/portal/products/smartspeech-yourvoice](https://developers.sber.ru/portal/products/smartspeech-yourvoice), 2026-09-20, **официоз/пресса**
- **Цена YourVoice**: **не найдено публично** — «цена рассчитывается индивидуально, нужно оставить заявку на сайте решения». Это чистый B2B с менеджером, как Brand Voice у Яндекса.
- **Лимиты**: RPS по договору; длина текста на запрос ограничена (SSML-документ).
- **Оплата из РФ**: рублями, российская карта / расчётный счёт, закрывающие документы. Минус — с 15.07.2026 физлицам новые пакеты не продают.
- **Правовой край**: YourVoice требует согласия владельца голоса и договора; для своего голоса — формальность, но нужен статус юрлица/ИП.

### Silero TTS

- **Что делает**: открытая русская нейросеть синтеза речи, работает локально на CPU, десятки русских голосов (aidar, baya, kseniya, xenia, eugene), поддержка SSML, ударений и цифр. Запускается одной строкой через torch.hub / PyPI, без интернета и без API-ключей.
- **Цена**: бесплатно (веса публичные, инференс локальный, железо своё). Коммерческие условия — по запросу, публичной цены **не найдено**. Репозиторий — [github.com/snakers4/silero-models](https://github.com/snakers4/silero-models), 2026-09-20, **официоз**
- **Лицензия**: дословно — «All of the models are published under the main repo license (i.e. CC-NC-BY) except for the `base` cis-tts models, which are under MIT» — [github.com/snakers4/silero-models](https://github.com/snakers4/silero-models), 2026-09-20, **официоз**. То есть русские TTS-голоса — **некоммерческая лицензия CC-NC-BY**. **Это блокер для монетизируемого канала на публичных весах**; коммерческие условия — только письмом на hello@silero.ai (публичного прайса нет, отдельной enterprise-страницы в репо нет).
- **API**: локальная библиотека (Python, PyTorch), не облачный сервис. Есть готовые обёртки (Home Assistant, Telegram-боты).
- **Качество русского**: лучшее среди полностью локальных русских TTS по произношению и ударениям — модель тренирована именно на русском, знает словарь ударений. Но это **не клон**: голос чужой, дикторский, эмоций почти нет; для «говорящей головы владельца» не подходит.
- **Клон: требования к образцу**: **клонирования нет** — «no mention of voice cloning support … The system uses pre-trained speakers only». Русские голоса фиксированы: `aidar`, `baya`, `kseniya`, `xenia`, `eugene` (v5_5_ru). Кастомный голос — только коммерческим заказом у Silero.
- **Оплата из РФ**: не требуется (бесплатно/локально); enterprise — договор напрямую, компания российского происхождения.
- **Правовой край**: NC-лицензия. Использовать в коммерческом канале нельзя без покупки лицензии.

### VK / T-Bank VoiceKit / MTS Exolve (коротко)

- **VK Cloud (VK Tech) Speech**: синтез и распознавание в российском облаке, русские голоса, оплата рублями. Клонирование голоса в публичном самообслуживании не заявлено — «голос бренда» обсуждается только в корпоративных внедрениях. Цена публикуется в калькуляторе VK Cloud, **точный тариф за 1 млн символов не найден**.
- **T-Bank VoiceKit** (бывш. Tinkoff VoiceKit): сильный русский ASR/TTS, ориентирован на колл-центры, оплата рублями. Персональный голос — корпоративный проект через менеджера, публичной цены нет. **Не найдено** публичной цены за 1 млн символов на 2026-09-20.
- **MTS Exolve**: телеком-платформа с TTS для голосовых роботов; синтез — вспомогательная функция к звонкам, клонирования голоса нет. Для озвучки роликов не профильный.
- Общий вывод по тройке: все три — рублёвые, доступные и юридически чистые, но **ни один не даёт самообслуживаемого клона голоса** — везде менеджер и корпоративный договор. Класс: **пресса/практики**, 2026-09-20.

---

## Открытые (self-hosted)

### XTTS v2 (Coqui)

- **Что делает**: zero-shot клон голоса + многоязычный синтез, запускается локально на GPU. Исторически самый популярный открытый клон-TTS с русским.
- **Цена**: бесплатно (веса открыты), стоимость — своё железо/аренда GPU.
- **Лицензия**: **Coqui Public Model License (CPML)** — модель отдельно от кода (код репозитория MPL-2.0). CPML запрещает коммерческое использование без отдельного разрешения; страница лицензии `coqui.ai/cpml` **не открылась (404)** — сама компания Coqui закрылась в начале 2024, поэтому получить коммерческое разрешение фактически не у кого. Карточка модели — [huggingface.co/coqui/XTTS-v2](https://huggingface.co/coqui/XTTS-v2), 2026-09-20, **официоз**. **Вывод: для монетизируемого канала — юридически грязный путь.**
- **API**: локальная Python-библиотека `TTS` (`from TTS.api import TTS`), можно обернуть в свой HTTP-сервис. Репозиторий — [github.com/coqui-ai/TTS](https://github.com/coqui-ai/TTS) (архивный).
- **Качество русского**: дословно у практиков — «Качество речи на русском отличное, но модель путается в ударениях»; «в интонациях и ударениях она ошибается, также обрезает звуки в конце предложения»; «Главная проблема … аудиоартефакты: локальные искажения, клиппинг» — [Хабр, обзор open source TTS (RAFT)](https://habr.com/ru/companies/raft/articles/991844/), [Хабр NtechLab](https://habr.com/ru/companies/ntechlab/articles/854724/), 2026-09-20, **практики**. Русский заявлен официально: «XTTS-v2 supports 17 languages: … Russian (ru) …»
- **Клон: требования к образцу**: официально «Voice cloning with just a 6-second audio clip»; практики уточняют — «Референс должен быть длиной 4-6 секунд и не иметь посторонних шумов … специфические интонации речи не всегда реализуются в выходном аудио», 2026-09-20
- **Лимиты**: длинные тексты нужно резать на чанки — «Большие тексты надо пилить на чанки, иначе будет проглатывать часть текста»; модель тяжёлая по VRAM.
- **Оплата из РФ**: не нужна (локально). Аренда GPU — российские провайдеры за рубли.
- **Правовой край**: CPML non-commercial — **блокер** для ежедневного монетизируемого ролика.

### F5-TTS

- **Что делает**: flow-matching TTS с zero-shot клоном по референсу. Сильная сторона — есть зрелые **русские дообученные чекпойнты сообщества** со словарём ударений.
- **Цена**: бесплатно, только своё железо.
- **Лицензия**: дословно — «Our code is released under MIT License»; «The pre-trained models are licensed under the CC-BY-NC license due to the training data Emilia» — [github.com/SWivid/F5-TTS](https://github.com/SWivid/F5-TTS), 2026-09-20, **официоз**. Русский чекпойнт Misha24-10 — «cc-by-nc-4.0», «The cc-by-nc-4.0 license restricts commercial applications without explicit permission» — [huggingface.co/Misha24-10/F5-TTS_RUSSIAN](https://huggingface.co/Misha24-10/F5-TTS_RUSSIAN), 2026-09-20, **официоз**. **Код MIT, но веса NC — тот же блокер, что у XTTS.**
- **API**: локальный CLI/Python (`f5-tts_infer-cli`), есть Gradio-UI; можно обернуть в свой сервис.
- **Качество русского**: лучший из открытых по русскому — есть специально дообученные модели. `Misha24-10/F5-TTS_RUSSIAN` — «5 000 часов» русской и английской речи, датасет с полной разметкой ударений, фильтрация артефактов (~5% записей убрано); `hotstone228/F5-TTS-Russian` — 813 000 шагов обучения. Ударения ставятся символом `+` перед гласной или автоматически моделью **RUAccent** — [HF Misha24-10](https://huggingface.co/Misha24-10/F5-TTS_RUSSIAN), [HF hotstone228](https://huggingface.co/hotstone228/F5-TTS-Russian), 2026-09-20, **официоз/практики**
- **Клон: требования к образцу**: короткий референс (единицы секунд) + его текстовая расшифровка; без `--ref_text` транскрипт снимает ASR автоматически.
- **Лимиты**: длинные тексты режутся на куски; нужна GPU.
- **Оплата из РФ**: не нужна.
- **Правовой край**: веса CC-BY-NC — коммерческое использование без разрешения запрещено. Для ежедневного ролика на монетизируемом канале — риск.

### Chatterbox (Resemble AI)

- **Что делает**: открытый zero-shot клон-TTS, версия Multilingual V3 — 23+ языка, **русский в списке официально**. Единственный из открытых с **полноценной MIT** и на код, и на веса.
- **Цена**: бесплатно, только железо. У Resemble есть платное облако, но модель можно крутить у себя.
- **Лицензия**: **MIT** — [github.com/resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox), 2026-09-20, **официоз**. **Это единственный вариант среза, где открытые веса можно использовать коммерчески без оговорок.**
- **API**: локальная Python-библиотека, есть Turbo/Nano варианты для скорости.
- **Качество русского**: официально поддержан — «Arabic (ar) • … • Russian (ru) • …» в Multilingual V3. Специализированных русских отзывов мало; по общим обзорам качество близко к XTTS, ударения слабее, чем у русских файнтюнов F5. Отдельного русского чекпойнта со словарём ударений **не найдено** — это главный минус против F5.
- **Клон: требования к образцу**: «requires a reference clip for voice cloning», документация ориентирует на ~10-секундный референс.
- **Лимиты**: **вотермарка обязательна** — «All generated audio includes built-in protection via Perth Watermarking … imperceptible neural watermarks that survive MP3 compression, audio editing … nearly 100% detection accuracy». То есть любой ваш ролик помечен как синтез. Для честного канала это плюс, для «неотличимо от живого голоса» — край.
- **Оплата из РФ**: не нужна.
- **Правовой край**: MIT — чисто. Вотермарка встроена по умолчанию; снимать её — нарушать дух лицензии и политику Resemble.

### GPT-SoVITS

- **Что делает**: few-shot клонирование с файн-тюном на маленьком объёме. Самый «ручной» из открытых, но при хорошем файн-тюне даёт лучшую похожесть на конкретного диктора.
- **Цена**: бесплатно, своё железо.
- **Лицензия**: **MIT** — [github.com/RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS), 2026-09-20, **официоз**. Коммерчески чисто (но стоит проверять лицензии конкретных предобученных весов, которые тянутся при установке).
- **API**: локальный WebUI + `api.py` (HTTP-сервер для инференса) — можно встроить в пайплайн.
- **Качество русского**: **русский официально не поддержан** — «Supported Languages: English, Japanese, Korean, Cantonese, and Chinese. Russian is not listed». Русская речь получается только через сторонние форки/файн-тюны сообщества с русским G2P; качество ударений без словаря плавает. Это главный минус для нашей задачи, 2026-09-20, **официоз**
- **Клон: требования к образцу**: zero-shot — «Input a 5-second vocal sample and experience instant text-to-speech conversion»; файн-тюн — «1 min voice data can also be used to train a good TTS model! (few shot voice cloning)». То есть **1 минуты вашего голоса хватает для обучения**, это минимум среди всех вариантов среза.
- **Лимиты**: нужен GPU, обучение занимает десятки минут; пайплайн ручной (разметка, сегментация).
- **Оплата из РФ**: не нужна.
- **Правовой край**: MIT на код. Русский — «на свой страх», официальной поддержки нет.

---

### Не найдено / сомнительно

- **Fish Audio, официальная страница тарифов** — `fish.audio/pricing/` отдаёт 404; подписочные уровни (Free / Plus $11 / Pro $75 / Max $749) взяты из обзора texttolab, класс **пресса**, не официоз. Проверить перед оплатой.
- **Fish Audio: лимиты RPS и конкурентности** — не найдено.
- **Cartesia: русские отзывы о качестве** — не найдено ни одного содержательного разбора русской речи Sonic. Поддержка языка заявлена, реальное звучание непроверено. Часть документации за логином (`play.cartesia.ai/docs-auth-login`) — «страница не открылась».
- **SaluteSpeech YourVoice: цена** — публично не опубликована, «рассчитывается индивидуально», только заявка. Расхождение в прессе: «минимальная цена 600 рублей в месяц» (обзоры) против официального «Минимальная стоимость использования сервиса — 15 000 рублей в месяц» для юрлиц — **верить официозу**, 600 ₽ относилось к старым физлицевым пакетам.
- **OpenAI gpt-4o-mini-tts: единица тарификации** — страница цен даёт «Audio output: $12.00 per 1M characters», но у OpenAI аудиовыход обычно считается в токенах, не символах. Цифра верна, единица **сомнительна** — перед расчётом бюджета перепроверить в биллинге.
- **VK Cloud / T-Bank VoiceKit: цена за 1 млн символов** — не найдено в открытом доступе, только калькуляторы и «по запросу».
- **Coqui CPML: текст лицензии** — `coqui.ai/cpml` отдаёт 404 (компания закрыта). Лицензия названа на карточке модели, но её полный текст на исходном домене недоступен — юридический риск использования XTTS v2 вырос, а не снизился.
- **XTTS v2: жив ли проект** — репозиторий Coqui архивный, развитие идёт форками (idiap/coqui-ai-TTS). Официальных обновлений модели не ожидается.
- **Silero: коммерческий прайс** — публичной цены нет, только `hello@silero.ai`.

---

### Стоимость минуты озвучки

**База расчёта.** Ролик 45–60 секунд, темп диктора ~150 слов в минуту, средняя русская словоформа с пробелом ~6,3 знака → **~950 знаков на ролик**. Ежедневный выпуск = **~28 500 знаков в месяц** (30 роликов). Это очень мало: любой пакетный тариф покрывает объём с запасом, поэтому решает **абонентка**, а не цена символа.

| Вариант | Цена символа | За ролик (950 зн.) | За месяц (30 роликов) | Что реально платим в месяц |
| --- | --- | --- | --- | --- |
| **ElevenLabs v3** (клон PVC) | $0.10 / 1K | $0.095 | $2.85 | **$22** — Creator, без него нет PVC; 220k знаков включены, объём съедает 13% |
| **ElevenLabs Flash v2.5** (клон PVC) | $0.05 / 1K | $0.048 | $1.43 | те же **$22** (тариф диктует доступ к PVC) |
| **Fish Audio S2.1 Pro** (мгновенный клон) | $15 / 1M UTF-8 байт → по-русски **$30 / 1M знаков** | $0.029 | $0.86 | **~$11** (Plus, ради коммерческих прав) + копейки за символы |
| **Cartesia Sonic 3.6** (мгновенный клон) | ~$5 / 100k кредитов | $0.048 | $1.43 | **$5** (Pro) — instant clone и коммерческая лицензия внутри; pro-клон потребует $49 |
| **Yandex SpeechKit**, готовый голос (клона нет) | 1 342 ₽ / 1M | 1,27 ₽ | **38 ₽** | **38 ₽** — самый дешёвый рублёвый вариант, но голос чужой |
| **Yandex Brand Voice Lite** (клон) | + хостинг | — | — | **9 150 ₽ разово + 101 666 ₽/мес** → ~3 390 ₽ за ролик. Неприменимо |
| **SaluteSpeech**, готовый голос (клона нет) | 186 ₽ / 1M | 0,18 ₽ | **5 ₽** | но минималка юрлица **15 000 ₽/мес** — фактическая цена ролика 500 ₽ |
| **F5-TTS RU / Chatterbox** (self-hosted клон) | 0 | 0 | 0 | **0** — только электричество/аренда GPU; минутный ролик генерится за секунды |

**Что видно из таблицы.** Посимвольная цена в нашей задаче не значит ничего — 950 знаков в день стоят центы у всех. Платим мы за **право иметь клон**: у ElevenLabs это $22/мес, у Cartesia $5/мес, у Fish ~$11/мес, у Яндекса 102 тыс ₽/мес, у открытых — ноль деньгами и цена настройки временем.

**Ключевой край для Fish Audio**: тарификация в UTF-8 **байтах**, а кириллица занимает 2 байта на символ — русский текст стоит вдвое дороже английского той же длины. При сравнении прайсов это легко пропустить.

---

### Вывод по зоне

**Лучший клон русского голоса за деньги — ElevenLabs, тариф Creator $22/мес, Professional Voice Clone.** Причины: единственный, у кого русский клон доведён до «не отличить» в отзывах практиков; PVC требует 30 минут вашей записи (реально — 2–3 часа для максимума), обучение 3–6 часов, дальше API работает годами. Цена символов в нашем объёме ничтожна. Два края: оплата только через посредника или зарубежную карту, и регистрация обычно требует VPN — но после активации API ходит из российских сетей напрямую.

**Лучший дешёвый путь — Fish Audio или Cartesia Pro ($5–11/мес) на мгновенном клоне**, если 15–60 секунд образца дают приемлемую похожесть; проверяется за один вечер на бесплатном тарифе. **Лучший бесплатный — F5-TTS с русским чекпойнтом сообщества** (5 000 часов русской речи, словарь ударений RUAccent) — качество русского лучшее среди открытых, но веса под CC-BY-NC, то есть для монетизируемого канала юридически грязно. **Единственный открытый вариант, чистый по лицензии, — Chatterbox Multilingual (MIT, русский в списке)**, но со встроенной неудаляемой вотермаркой и без русского словаря ударений.

**Российские сервисы для этой задачи не подходят**: Яндекс и Сбер дают отличный русский синтез за рубли (38 ₽ и 5 ₽ в месяц на наш объём), но клон голоса у обоих — корпоративный продукт с менеджером, заявкой и ценой от 100 тыс ₽/мес. Для ежедневного ролика одного человека это несоразмерно.



---

## 3. Готовые пайплайны «новости → ролик» и автопостинг

Цель применения: каждый день без человека собирать ролик 45–60 сек «говорящая голова читает 3 новости про ИИ на русском» и публиковать.
Дата проверки всех фактов ниже: **2026-09-20**. Класс источника помечен у каждого факта: официоз / пресса / практики.

---

### 3.1 HeyGen (Video Agent + API + Templates)

**Что это.** Платформа ИИ-аватаров №1 по узнаваемости. Три разных продукта внутри: (а) классический аватар-видео «текст → говорящая голова», (б) Video Agent «промпт → готовый ролик с бродлом и графикой», (в) API + Template API для автоматизации.

**Вход.**
- Video Agent: текстовый промпт, лимит 500 символов — «Enter your prompt and we will generate a video for you» ([heygen.com/video-agent](https://www.heygen.com/video-agent), 2026-09-20, официоз). RSS-фид напрямую НЕ ест; про URL новости на странице ничего не сказано — **не найдено**.
- API `POST /v3/videos`: скрипт текстом + выбор аватара и голоса; либо **свой аудиофайл** — «You can provide either an `audio_url` or an `audio_asset_id` when creating avatar videos… You can bring your own audio — a voice memo, a podcast segment, a dubbed track — and lip-sync it onto your avatar, digital twin, or any image» ([docs.heygen.com/docs/using-audio-source-as-voice](https://docs.heygen.com/docs/using-audio-source-as-voice) + [developers.heygen.com/audio-to-video](https://developers.heygen.com/audio-to-video), 2026-09-20, официоз). Длина видео = длине аудио, до 30 минут.
- Template API: шаблон с переменными, заполняется через API (эндпоинты в developers.heygen.com; конкретная страница `docs/create-video-from-template` вернула 404 — **страница не открылась**).

**Выход.** 1080p / 4K, вертикаль и горизонталь (в Video Agent дефолт Landscape, макс. длительность «60s»), субтитры генерируются, говорящая голова-аватар — ядро продукта.

**Русский.** Озвучка: движок перевода заявлен «175+ языков» с липсинком, русский в их числе (официоз общего плана, точная страница списка голосов не проверена — **сомнительно на уровне «какой конкретно русский голос»**). **Главное: свой аудиофайл подсунуть МОЖНО** (`audio_url`) — значит русская озвучка решается отдельно (ElevenLabs / Yandex SpeechKit / Silero) и HeyGen остаётся только липсинком. Это снимает риск «кривой русский TTS».

**Цена (дословно).**
- «Free — $0/month… 3 videos per month… up to 1 min», «Creator — $29/month ($24/month annual)… 600 credits/month… Videos up to 30 mins», «Pro — $49/month… 1,000 credits/month», «Business — $149/month… $20/seat/month… 1,500 credits/month… Integrations with n8n, Make, Hubspot & Zapier», «Enterprise — Contact Sales… No video duration max» ([heygen.com/pricing](https://www.heygen.com/pricing), 2026-09-20, официоз).
- API отдельно, pay-as-you-go: «API usage is measured in **US dollar amount**, and is based on the **type** and **length** of what you generate»; «pay-as-you-go credits expire after 12 months»; с февраля 2026 «HeyGen does **not** offer free API credits» ([help.heygen.com/en/articles/10060327](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained), 2026-09-20, официоз). Таблицу ставок официальная страница в текст не отдала — **страница отдала только текст без таблицы**.
- Ставки по обзорам (класс — пресса/практики, не официоз, проверять перед бюджетом): «1 US dollar = 1 minute of generated avatar video in 720p or 1080p», Avatar IV ≈ $6/мин, Avatar V $0.05/сек = $3/мин, Video Agent $2 за «prompted minute» ([g2.com/articles/heygen-api-pricing](https://www.g2.com/articles/heygen-api-pricing), 2026-09-20, пресса).

**API.** Да, полноценный: [developers.heygen.com](https://developers.heygen.com/) — видео из скрипта, Video Agent, Audio-to-Video, Voice cloning, перевод, HyperFrames (HTML/CSS/JS → моушн-графика), MCP-сервер для агентов (Claude, Cursor) и CLI. API-тариф отдельный от UI-подписки (pay-as-you-go).

**Автопостинг.** Своего постинга в соцсети нет — только интеграции «Integrations with n8n, Make, Hubspot & Zapier» на тарифе Business и выше. Публикация делается снаружи (n8n / Make / Blotato).

**Оплата из РФ.** Российскими картами НЕ принимает: «Платежный шлюз HeyGen отклоняет карты с российским BIN-кодом на этапе авторизации независимо от баланса счета» ([vc.ru/services/3003023](https://vc.ru/services/3003023-oplata-heygen-iz-rossii-sposoby-i-sovety), 2026-09-20, практики). Обходы, которые описывают в RU-гайдах: посредники (Oplatym и аналоги), зарубежная карта, виртуальная карта, доверенный плательщик ([dtf.ru/howto/5051877](https://dtf.ru/howto/5051877-kak-oplatit-heygen-v-rossii), 2026-09-20, практики).

**Качество/отзывы.** Референс рынка по липсинку; «платформой пользуются более 100 000 компаний» (RU-пресса, 2026-09-20). Для нашей задачи главный плюс — `audio_url`: качество русского не зависит от них.

---

### 3.2 Argil

**Что это.** Французский конкурент HeyGen, заточенный под короткие соцсетевые ролики с ИИ-клоном. За 2026 год явно двигался: главная сейчас говорит «Anyone can tell a story / Make your film, series, or social video» ([argil.ai](https://www.argil.ai/), 2026-09-20, официоз) — то есть уходит в сторону сторителлинга, а не только «говорящая голова».

**Вход.** Скрипт текстом; **статья**: «Argil helps you turn scripts and **articles** into ready-to-post videos using either your AI clone or high-performing generic avatars — complete with captions, b-roll, transitions, and presets» ([make-influencer.ai/tools/argil](https://make-influencer.ai/tools/argil), 2026-09-20, пресса). RSS-фида на входе нет — **не найдено**.

**Выход.** Вертикаль под шортсы, типовая длина 30–90 сек, авто-субтитры, авто-B-roll, аватар-говорящая голова с жестами и мимикой.

**Русский.** В маркетинге называют испанский, французский, немецкий; общий тезис — «localization across 50+ languages». **Русский прямо не подтверждён — не найдено** (2026-09-20). Голос — на технологии ElevenLabs (у ElevenLabs русский есть, значит шанс высокий, но это вывод, не факт). Возможность подсунуть свой аудиофайл в API: в доках упоминается «Voice customization and audio integration» ([docs.argil.ai](https://docs.argil.ai/), 2026-09-20, официоз) — но явного параметра «свой audio_url» я не подтвердил, **сомнительно**.

**Цена (дословно).** Официальная страница [argil.ai/pricing](https://www.argil.ai/pricing) отдала только каркас: «Same plans as in the app», выбор кредитного тира, месяц/год, «2 months free» при годовой оплате — **конкретные цифры страница не отдала**. По обзорам цифры расходятся, класс — пресса, доверять нельзя без проверки в аккаунте:
- «Classic plan at $39/month… up to 25 minutes of video», «Pro plan is $149/month… up to 100 minutes» ([therundown.ai/tools/argil](https://www.therundown.ai/tools/argil), 2026-09-20, пресса);
- «Starter (~$29/mo for 10 mins video), Creator (~$79/mo for 40 mins), Agency (custom)» ([traksource.com/argil-ai-review](https://traksource.com/argil-ai-review/), 2026-09-20, пресса).
Расхождение между обзорами — сигнал, что тарифы меняли за год. **Цену считать «не найдено официально».**

**API.** Есть: [docs.argil.ai](https://docs.argil.ai/) — создание видео из текста, управление ассетами (видео, картинки), динамические улучшения (субтитры, музыка, B-roll). Цена API: «For high-volume API licenses, please pick a call slot here… otherwise check the API pricings here» — то есть высокий объём только через звонок с продажами. Страница `docs.argil.ai/pricing` — 404, **страница не открылась**.

**Автопостинг.** Нативного «автопилота» с публикацией в соцсети **не найдено**. Практика: «you can use Make's HTTP module or webhook support to pull the finished video file from Argil and upload it directly to TikTok via a scheduling tool like Buffer or Hootsuite» ([postiz.com/blog](https://postiz.com/blog/how-to-automate-tiktok-instagram-and-youtube-short-form-content-with-ai-a-complete-workflow), 2026-09-20, практики). Интеграции — n8n, Zapier, Make.

**Оплата из РФ.** Специфики по Argil **не найдено**; стандартный зарубежный Stripe-биллинг, значит те же обходы, что у HeyGen.

**Качество/отзывы.** «the best 'Social Media' style generator» — 9.4/10 у traksource; замечен «a slight blur around the mouth during fast speech» и эффект зловещей долины на 95% точности, рекомендация — перекрывать B-roll каждые 5–7 сек ([traksource.com](https://traksource.com/argil-ai-review/), 2026-09-20, пресса). Обучение клона — 2 минуты исходника (быстрее HeyGen).

---

### 3.3 Captions.ai (теперь под брендом Mirage)

**Что это.** Было приложение для авто-субтитров, выросло в полный ИИ-видеоредактор. API вынесен под отдельный бренд **Mirage** (`platform.mirage.app`, доки на `captions.ai/help/docs/api/*`).

**Вход.** Скрипт текстом (AI Creator / AI Ads), исходное видео (для субтитров и дубляжа) и — ключевое для нас — **«Mirage Avatar X | Expressive human video generation model (video/image + audio → video)»** ([captions.ai/help/docs/api/pricing](https://captions.ai/help/docs/api/pricing), 2026-09-20, официоз). То есть на вход можно дать **картинку/видео + СВОЙ аудиофайл**. RSS не ест.

**Выход.** Вертикаль под шортсы (родной формат приложения), субтитры — их коренная компетенция (стилизованные, авто), говорящая голова — да (AI Twin, AI Creator, Avatar X).

**Русский.** Да. Русский поддерживается на всех этапах, есть отдельная функция авто-дубляжа ([help.mirage.app/docs/ru/captings/dubbing](https://help.mirage.app/docs/ru/captions/dubbing) — у них есть русская локализация справки, 2026-09-20, официоз; сводка — [itsnew.ru/services/captions-ai.html](https://itsnew.ru/services/captions-ai.html), 2026-09-20, пресса). Плюс через Avatar X можно подсунуть свой русский аудиофайл — русский решается отдельно.

**Цена (дословно).**
- UI-подписка: «Max — **$24.99/month**… 500 credits per month», «Scale 1x: **$69.99/month** – 1,400 credits», «Scale 2x: **$139.99/month** – 2,800 credits», «Scale 4x: **$279.99/month** – 5,600 credits»; кредиты переносятся, потолок 3× месячной нормы ([captions.ai/pricing](https://www.captions.ai/pricing), 2026-09-20, официоз). «AI Creator, AI Ads and AI Skits consume 1 credit per second» — то есть 500 кредитов Max ≈ 8 минут видео в месяц.
- **API отдельно, без кредитов**: «Add Captions | Apply styled captions to a video | **$0.15 per minute**» и «Mirage Avatar X | Expressive human video generation model (video/image + audio → video) | **$0.15 per second** (6-second increments)» ([captions.ai/help/docs/api/pricing](https://captions.ai/help/docs/api/pricing), 2026-09-20, официоз).
- **Пересчёт для нашей задачи**: $0.15/сек × 60 сек = **$9 за ролик**, ≈ **$270/мес** при ежедневном выпуске. Это дорого — дороже HeyGen примерно в 9 раз при тех же минутах.

**API.** Да: [captions.ai/help/docs/api/overview](https://captions.ai/help/docs/api/overview) — авторизация заголовком `x-api-key`, ключ в дашборде `platform.mirage.app`. Возможности: авто-субтитры, AI Creator (аватар-ролики), AI Ads (UGC-реклама), Avatar X, bulk-управление видео. API-тариф не зависит от UI-подписки.

**Автопостинг.** Своего постинга в соцсети **не найдено**. Только экспорт.

**Оплата из РФ.** Прямой оплаты российской картой нет, есть RU-гайды про обходы ([dtf.ru/howto/3858677](https://dtf.ru/howto/3858677-kak-oplatit-captions-v-rossii), 2026-09-20, практики). Тонкость: часть тарифов продаётся как iOS-подписка («Prices shown are USD for iOS plans») — это дополнительная боль с App Store-аккаунтом.

**Качество/отзывы.** Независимая оценка 8.9/10; из живого фидбека: «It's brilliant for speed, but AI styles can sometimes feel a bit generic. I'd like more detailed control over final edits without needing to use chat prompts for everything» (фрилансер-монтажёр, май 2026, практики). Субтитры — лучшие на рынке, аватары — не лучшие.

---

### 3.4 Revid.ai — ⭐ самый близкий к «из коробки» под нашу задачу

**Что это.** Комбайн «сгенерировать короткое видео + опубликовать», с публичным REST API, MCP-сервером и CLI. Единственный из списка, у кого в ОДНОМ продукте есть и `article-to-video`, и `avatar-to-video`, и `audio-to-video`, и публикация в соцсети через API.

**Вход.** Один эндпоинт `POST https://www.revid.ai/api/public/v3/render` и десять воркфлоу ([revid.ai/llm/revid-ai-api-guide.md](https://www.revid.ai/llm/revid-ai-api-guide.md), 2026-09-20, официоз):

| Воркфлоу | Обязательный вход |
|---|---|
| `script-to-video` | `source.text` |
| `prompt-to-video` | `source.prompt` |
| `article-to-video` | `source.url` — «an article/blog/post URL» |
| `music-to-video` | `source.url` |
| `audio-to-video` | `source.url` ← **свой аудиофайл по ссылке** |
| `avatar-to-video` | `source.text` + `avatar.url` ← **говорящая голова** |
| `static-background-video` | `source.text` или `source.url` |
| `motion-transfer` | `source.url` + `media.provided[]` |
| `caption-video` | `source.url` |
| `ad-generator` | `source.prompt` или `media.provided[]` |

Плюс на уровне продукта: «Turn your YouTube channel, social media posts, **news articles**, and blogs into scroll-stopping videos automatically» ([revid.ai/features](https://www.revid.ai/features), 2026-09-20, официоз). Прямого RSS-коннектора в API **не найдено** — но `article-to-video` по URL закрывает то же самое: RSS парсится своим скриптом, URL-ы подаются в API.

**Auto-Mode workers.** Готовый автопилот внутри сервиса: «Auto-Mode workers are always-on pipelines: configure a tool and content source once and get a fresh video generated (and optionally auto-published) **every day**» (2026-09-20, официоз). На Growth — 3 воркера, на Ultra — 10.

**Выход.** Вертикаль под TikTok/Reels/Shorts, субтитры, музыка, закадровый голос; аватар-говорящая голова — через `avatar-to-video`.

**Русский.** Да, заявлен прямо: «70+ language voiceover support» на движке ElevenLabs; RU-обзор: «Сервис поддерживает русскоязычные сценарии, субтитры и голосовое сопровождение. Озвучка использует движок ElevenLabs с поддержкой 70+ языков» ([sborka.ai/products/revid](https://sborka.ai/products/revid), 2026-09-20, пресса). Русский в списке ElevenLabs есть. **Плюс `audio-to-video`** — можно принести свой русский аудиофайл. В самих доках поле `language` есть, но перечня языков с русским я в тексте доков **не нашёл** (официоз — не подтверждён поимённо).

**Цена (дословно).** ([revid.ai/pricing](https://www.revid.ai/pricing), 2026-09-20, официоз)
- «**Hobby Plan – $39/month**» — генерация из текста или ссылки, ремикс вирусных видео.
- «**Growth Plan – $39/month** (Regular: $99/month)» — «2,000 AI credits monthly», «Publishing to TikTok, Instagram, and YouTube», «70+ language voiceover support», «3 Auto-Mode workers», «**Full API, MCP, and CLI access**».
- «**Ultra Plan – $199/month**» — «12,000 AI credits monthly», «10 Auto-Mode workers», клонирование голоса.
- Кредиты ([revid.ai/llm/revid-ai-credit-costs.md](https://www.revid.ai/llm/revid-ai-credit-costs.md), 2026-09-20, официоз): рендер за 5 сек — Low 15 / Pro 50 / Ultra 100 / «Sora 2 (OpenAI)» 130 кредитов; за 500 символов — «Voice generation» 10, «Avatar — Standard» 40, «Avatar — Good (Pro)» 100, «Avatar — Ultra» 200. Бустер-пак «1,000 ($49)» ⇒ ≈ **$0.049 за кредит**.
- **Пересчёт под нашу задачу.** 60-секундный ролик = 12 отрезков по 5 сек. На «Low» это 12 × 15 = 180 кредитов; плюс аватар Standard на ~900 символов ≈ 72 кредита; итого ~250 кредитов на ролик. Growth (2 000 кредитов) — примерно **8 роликов в месяц**, то есть на ежедневный выпуск не хватает. Ultra (12 000) — **~48 роликов**, хватает с запасом. Значит реалистичный тариф под «каждый день» — **Ultra $199/мес**. Если аватар Pro/Ultra — дороже кратно.

**API.** Да, и лучший в подборке по полноте: `POST /api/public/v3/render` → возвращает `pid`, статус через `GET /api/public/v3/status?pid=...` или `webhookUrl`; ключ на `revid.ai/account`. «Every render call costs 10 credits plus generation costs, and you can estimate any payload for free before running it». Есть MCP-сервер и npm CLI ([revid.ai/mcp](https://www.revid.ai/mcp), 2026-09-20, официоз). API идёт внутри UI-тарифа (Growth и выше), отдельного API-прайса нет.

**Автопостинг — ЕСТЬ, и через API.** «`POST /api/public/v3/publish-now` — Publish to connected social channels» и «`POST /api/public/v3/add-to-queue`» для расписания (2026-09-20, официоз). Площадки: **YouTube, TikTok, Instagram** — «Schedule and auto-publish your videos to YouTube, TikTok, and Instagram from one dashboard with optimal timing built in». **VK и Telegram — не найдено** (это важный минус под RU-задачу).

**Оплата из РФ.** «Revid AI не принимает российские карты, заявки на подписку моментально отклоняются или попросту не принимаются системой» ([vc.ru/services/2200538](https://vc.ru/services/2200538-oplata-revid-ai-iz-rossii), 2026-09-20, практики). Обходы — посредники (Payholder, Dolphin Pay, Hi Store Pay, «Плати Легко»), таких сервисов под Revid заметно много, что косвенно говорит о живом RU-спросе.

**Качество/отзывы.** «Creators publish 30,000+ videos a month with Revid» (их собственная цифра, официоз). Слабое место всех таких комбайнов — сток-видеоряд выглядит однотипно; для «говорящей головы» это менее критично.

---

### 3.5 Creatify (Creatify AI)

**Что это.** Заточен под **рекламу**, а не под новости: «The AI Ad Generator». Сильная сторона — URL-to-Video (товарная страница → видеореклама) и большая библиотека «актёров».

**Вход.** Product URL, текстовый скрипт, картинка, **аудиотрек**. Из доков: Boreal генерирует видео «from a text prompt, a start image, or **an audio track**»; «the page confirms support for product URLs, text scripts, and **audio files** as generation sources» ([docs.creatify.ai](https://docs.creatify.ai/), 2026-09-20, официоз). RSS — **не найдено**. Новостной URL формально пройдёт как URL, но модель заточена на товарные страницы — под новости это натяжка.

**Выход.** Вертикальные рекламные ролики, субтитры, аватар-говорящая голова (Aurora Avatar, Stock AI Avatar — «from scripts with 1500+ realistic personas»). Batch Mode: «Batch Mode can generate dozens of variations simultaneously for creative testing» (2026-09-20, пресса) — это про A/B-варианты одной рекламы, не про «3 новости каждый день».

**Русский.** Заявлено: «perfect 24fps lip-sync in **75+ languages**, with 140+ voices»; русский виден в списке языков интерфейса ([fast.io/resources/creatify-ai-review-2026](https://fast.io/resources/creatify-ai-review-2026/), 2026-09-20, пресса; официальный поимённый список — **не найдено**). Свой аудиофайл подсунуть можно (Boreal), значит русский закрывается отдельно.

**Цена (дословно).**
- UI-тарифы ([creatify.ai/pricing](https://creatify.ai/pricing), 2026-09-20, официоз): «Starter — $39/month… 100 monthly credits… Watermark on exports», «Pro — $99/month… 300 monthly credits… Up to 5 parallel generations», «Enterprise — Custom pricing… 1,200 annual credits».
- **API — отдельные тарифы** ([docs.creatify.ai/billing](https://docs.creatify.ai/billing), 2026-09-20, официоз): «**API Starter**: 500 credits/month at **$99/month**», «**API Pro**: 2,000 credits/month at **$299/month**», «API Enterprise: Custom». Расход: «URL to Video API charges **5 credits per 30 seconds**», «Aurora costs **1 credit per second**», «Text-to-Speech runs **1 credit per 30 seconds**».
- **Пересчёт**: ролик 60 сек через URL-to-Video = 10 кредитов ⇒ 30 роликов/мес = 300 кредитов ⇒ влезает в **API Starter $99/мес**. Но если через Aurora Avatar (1 кредит/сек) — 60 кредитов на ролик ⇒ 1 800/мес ⇒ нужен **API Pro $299/мес**.

**API.** Да: [docs.creatify.ai](https://docs.creatify.ai/), база `https://api.creatify.ai/api`, авторизация парой `X-API-ID` / `X-API-KEY`. Эндпоинты: URL-to-Video, Boreal, Aurora Avatar, Stock AI Avatar, Asset Generator, Ad Clone, Image Ad, Custom Avatar. API-тариф строго отдельный от UI-подписки.

**Автопостинг.** **Не найдено** — публикации в соцсети в доках нет, есть «Ad Launcher» для запуска рекламных кампаний (Meta/TikTok Ads), а это не органический постинг. Под нашу задачу не годится.

**Оплата из РФ.** Специфики **не найдено**; обычный зарубежный биллинг.

**Качество/отзывы.** Хорош в рекламной нише, «700+ / 1500+ аватаров». Под новостной формат — мимо жанра: продукт всё время тянет в рекламный сценарий (hook → benefit → CTA).

---

### 3.6 Pictory

**Что это.** Ветеран жанра «текст/статья → видео со стоком и субтитрами». Аватары — приставка, а не ядро. Сильная сторона для нас — зрелый API с явным прайсом и вход «блог/статья».

**Вход.** Скрипт текстом, **статья в блоге** («Blog to Video»), краткий бриф/идея (ИИ сам пишет нарратив), PowerPoint ([docs.pictory.ai](https://docs.pictory.ai/), 2026-09-20, официоз). Аудиофайл на входе в доках **не упомянут — не найдено**. RSS — нет.

**Выход.** Видео со стоком (Getty/Storyblocks), авто-субтитры, закадровый голос. Соотношение сторон настраивается, в примерах доков «16:9» (значит вертикаль тоже задаётся, но примером идёт горизонталь). **Аватар-говорящая голова в API не упомянут — не найдено**; в UI custom avatars есть на старших тарифах. Для задачи «говорящая голова» Pictory — слабое звено.

**Русский.** Да, но с оговоркой по тарифу: «Pictory currently supports Russian among its available languages», при этом «the Starter plan only supports AI voiceover in English, French, Spanish, German, Dutch, Italian, and Portuguese, **requiring an upgrade to the Professional plan to access Russian**» ([aipricing.guru/blog/pictory-pricing-2026](https://www.aipricing.guru/blog/pictory-pricing-2026/), 2026-09-20, пресса). Голоса — ElevenLabs: «Custom ElevenLab's AI voices in 29 languages» (официоз). Подсунуть свой аудиофайл — **не найдено**.

**Цена (дословно).**
- UI ([pictory.ai/pricing](https://pictory.ai/pricing/), 2026-09-20, официоз): «Starter: **$29/month** – 200 video minutes», «Professional: **$59/month** – 600 video minutes», «Team: **$199/month** – 1,800 video minutes»; при годовой оплате «Starter: $25/month… 2,400 minutes/year», «Professional: $35/month… 7,200 minutes/year», «Team: $119/month… 21,600 minutes/year».
- **API отдельно** ([pictory.ai/pictory-api-pricing](https://pictory.ai/pictory-api-pricing), 2026-09-20, официоз): «API Self-Serve — **$79/month** billed yearly — 7,200 video minutes/year (includes **1,440 ElevenLabs voiceover minutes/year**)»; помесячно «**$99/month** — 600 video minutes/month (includes **120 ElevenLabs voiceover minutes/month**)». Докупка: «The self serve plan is **120 credits for $49**». Enterprise — кастом + разовый setup fee.
- **Пересчёт**: 30 роликов по 1 мин = 30 минут озвучки ElevenLabs в месяц — влезает в 120 минут даже месячного тарифа с большим запасом. То есть **$79–99/мес и всё**. Самый предсказуемый прайс в подборке.

**API.** Да, зрелый: [docs.pictory.ai](https://docs.pictory.ai/) — асинхронный (job ID → статус → URL готового файла), «AI Storyboard» сам раскладывает сцены. Есть интеграции выгрузки: «Auto-upload to AWS S3, Vimeo, and more».

**Автопостинг.** В соцсети — **нет**. Только выгрузка в S3/Vimeo. Публикация делается снаружи.

**Оплата из РФ.** Специфики **не найдено**; обычный зарубежный биллинг.

**Качество/отзывы.** Надёжный рабочий инструмент для «статья → ролик со стоком», но визуально узнаваемо-шаблонный. Под «говорящую голову» — не его жанр.

---

### 3.7 invideo AI

**Что это.** Массовый генератор «промпт → видео» с редактором на таймлайне. В 2026-м переехал в сторону агентов («frontier agents: Lite, Pro, Ultra») и моделей Seedance / Sora 2 / VEO 3.1.

**Вход.** Текстовый промпт («сделай ролик про…»), скрипт, статья/URL (в UI есть режим «article to video»). Правки — текстовой командой в чате поверх готового ролика. RSS — **не найдено**.

**Выход.** Вертикаль и горизонталь, субтитры, закадровый голос, сток. Говорящая голова-аватар — **не основной жанр**; в 2026-м заявлена модель «GlobalVoice» с липсинком на 140 языков (пресса), но это про дубляж, а не про генерацию аватара с нуля.

**Русский.** Да: «InVideo supports over 50 different languages, including English, Japanese, German, French, **Russian**…» ([creatify.ai/review/invideo-ai](https://creatify.ai/review/invideo-ai), 2026-09-20, пресса). Есть клонирование голоса — загрузка 30-секундного образца. Подсунуть свой готовый аудиофайл в UI можно (это видеоредактор), через API — **не подтверждено**.

**Цена (дословно).** ([invideo.io/pricing](https://invideo.io/pricing/), 2026-09-20, официоз; годовая оплата)
- «**Basic – $9/month per seat**… 190 credits monthly… Limited to Agent Two Lite… 10 GB storage»
- «**Pro – $25/month per seat**… 1,000 credits monthly… Full access to frontier agents (Lite, Pro, Ultra)… Access to all Seedance models… 30 GB storage»
- «**Ultra – $60/month per seat**… 3,000 credits monthly… Lowest cost per credit (60% cheaper)… 80 GB storage»
- «Credits work like currency on our platform» и **неиспользованные кредиты не переносятся** на следующий месяц.
Обзоры называют другие цифры («Plus is $17/month ($200/year, 750 credits), Max $85/month») — это старая сетка, **расхождение, верить официальной странице**.

**API.** **Сомнительно.** Официальной developer-документации я не нашёл; упоминания «API Key в Settings → Developers» идут только из SEO-FAQ третьих лиц ([linkgo.dev/faq](https://linkgo.dev/faq/invideo-provide-api-integration-options), 2026-09-20, практики низкого доверия). На Apify висит «идея» сделать неофициальный InVideo AI API — косвенный признак, что публичного официального API нет. **Считать: полноценного публичного API нет.**

**Автопостинг.** **Не найдено.**

**Оплата из РФ.** Специфики **не найдено**.

**Качество/отзывы.** Хвалят за скорость и правку голосом/текстом, ругают за шаблонность стока. **Для автоматизации без человека не подходит — нет подтверждённого API.**

---

### 3.8 Opus Clip (Opus Pro / ClipAnything) — ЧЕСТНО: не наш жанр, но полезен сбоку

**Что это и чего НЕ делает.** Это **нарезка длинного в короткое**, а не генерация ролика. Прямо из их доков: API «accepts a long-form video to create a new clipping project» и «is strictly for **clipping existing videos, not creating content from scratch**» ([opus.pro/api](https://www.opus.pro/api), 2026-09-20, официоз). **Ролик «говорящая голова читает 3 новости» Opus Clip НЕ сделает** — ему нечего резать. Он полезен только как второй этаж: если вы сами сняли/сгенерировали длинное видео, Opus нарежет и опубликует.

**Вход.** URL длинного видео (YouTube, Google Drive, Vimeo, Zoom, Rumble, StreamYard). ClipAnything — «multimodal AI clipping that lets you clip any moment from ANY video using visual, audio, and sentiment cues, including videos with little to no dialogue».

**Выход.** Короткие клипы, соотношения «9:16, 1:1, 16:9» (на Pro), анимированные субтитры, авто-рефрейминг лица.

**Русский.** Да, явно: «OpusClip supports English, German, Spanish, French, Portuguese, Italian, Dutch, **Russian**, Polish, Indonesian, **Ukrainian**…» — и русский есть среди языков мультиязычных субтитров ([opus.pro/blog/multi-language-captions-api](https://www.opus.pro/blog/multi-language-captions-api), 2026-09-20, официоз). Есть дубляж (Pro). Свой аудиофайл — нерелевантно, он работает с готовым видео.

**Цена (дословно).** ([opus.pro/pricing](https://www.opus.pro/pricing), 2026-09-20, официоз)
- «**Free ($0)**» — базовая нарезка, водяной знак на субтитрах, импорт только с YouTube.
- «**Starter ($15/month)**» — «20 per day» AI voiceover, экспорт без водяного знака, **«Social posting to YouTube Shorts, TikTok, Instagram»**.
- «**Pro ($29/month)**» — «100GB fixed storage», «Multiple aspect ratios (9:16, 1:1, 16:9)», «AI video B-Roll (powered by Agent Opus)», дубляж, **«APIs included (Video Editing, Scheduler, MCP connector)»**, Zapier.
- «**Business (Custom pricing)**».
Отдельного API-прайса нет: **API входит в Pro $29/мес** — это самый дешёвый вход в «API + планировщик» во всей подборке.

**API.** Да: [opus.pro/api](https://www.opus.pro/api), справочник — `help.opus.pro/api-reference/overview`. Три API: Video Editing, **Scheduler** и MCP-коннектор. Есть `conclusionActions` (вебхуки/уведомления по готовности).

**Автопостинг — ЕСТЬ, и самый широкий в подборке.** «OpusClip's social media scheduling software supports auto-posting to **YouTube, YouTube Shorts, Instagram Reels, TikTok, Facebook Page, LinkedIn Business, and X**» ([opus.pro/calendar](https://www.opus.pro/calendar), 2026-09-20, официоз). Есть календарь и расписание, доступен через Scheduler API. **VK и Telegram — не найдено.**

**Оплата из РФ.** Специфики **не найдено**.

**Качество/отзывы.** Лидер сегмента нарезки, вирусность-скоринг клипов. **Вывод для нашей задачи: как генератор — нет; как «планировщик + публикатор + субтитры» за $29 — вполне достойный кандидат в связке с чем-то, что делает само видео.**

---

### 3.9 Blotato — автопостинг (не генератор видео)

**Что это.** Прослойка «один API → много соцсетей». Видео не делает (точнее, делает, но это не его сила) — его работа принять готовый файл по URL и разложить по площадкам с расписанием.

**Вход.** Готовый медиафайл: «Pass any publicly accessible image/video URL into the `mediaUrls` parameter. **No upload step required**» ([help.blotato.com/api/start](https://help.blotato.com/api/start), 2026-09-20, официоз). Для локальных файлов — presigned upload, S3/Drive не нужен.

**Площадки (официально, дословно).** «Instagram, TikTok, LinkedIn, Facebook, X (Twitter), Threads, Bluesky, Pinterest, and YouTube» — и справка прямо называет этот список исчерпывающим для веб-приложения, API, MCP и Cowork ([help.blotato.com/support/faqs](https://help.blotato.com/support/faqs), 2026-09-20, официоз). **Telegram — нет. VK — нет.** (Сторонние обзоры и SourceForge утверждают, что Telegram есть — **расхождение; верить официальной справке**, а Telegram всё равно закрывается Bot API в две строки кода, см. блок «Сборка своими руками».)

**Расписание.** Да — публикация и планирование постов, календарь.

**Цена (дословно).** ([blotato.com/pricing](https://blotato.com/pricing), 2026-09-20, официоз)
- «**Starter – $29/month**» — «20 social media accounts», «1,250 AI credits per month», «1,000 active contacts per month».
- «**Creator – $97/month**» — «40 social media accounts», «5,000 AI credits per month», быстрее обработка видео.
- «**Agency – $499/month**» — «28,000 AI credits per month», «15,000 active contacts per month».
- «7-day free trial on every plan», «Cancel anytime. **No per-post fees, no seat fees**», «Writing is unlimited on every plan», годовая — ≈17% экономии.

**API.** Да, и **входит во все платные тарифы без доплаты**: таблица доступа — Free Trial: нет API; Starter / Creator / Agency: да ([help.blotato.com/api/start](https://help.blotato.com/api/start), 2026-09-20, официоз). Важная ловушка: «Generating an API key from Settings > API **immediately ends a free trial and activates your paid Starter subscription**». SDK: TypeScript, Python, Ruby, Go, Java, .NET, PHP; вебхуки; MCP-сервер; ноды для n8n, Zapier, Make.

**Оплата из РФ.** Специфики **не найдено**; обычный зарубежный биллинг.

**Качество/отзывы.** Стал де-факто стандартом «последней мили» в n8n-пайплайнах: в каталоге n8n есть готовые шаблоны вида «Auto-create and publish AI social videos with Telegram, GPT-4 and Blotato» ([n8n.io/workflows/3654](https://n8n.io/workflows/3654-auto-create-and-publish-ai-social-videos-with-telegram-gpt-4-and-blotato/), 2026-09-20, официоз n8n). Главная ценность — не возиться с OAuth девяти площадок самому.

---

### 3.10 Оркестраторы: n8n / Make / Zapier — и ГОТОВЫЕ шаблоны «RSS → HeyGen → соцсети»

**Главная находка раздела.** Ровно наш сценарий уже разложен по шагам и лежит бесплатными шаблонами в каталоге n8n. Не надо ничего изобретать — надо выбрать шаблон и заменить ленты на русские. Все ссылки проверены 2026-09-20, класс — **официоз (каталог n8n)**:

| Шаблон | Что делает |
|---|---|
| [«Generate news videos from RSS feeds with HeyGen avatar» (#6229)](https://n8n.io/workflows/6229-generate-news-videos-from-rss-feeds-with-heygen-avatar/) | читает свежие summary из RSS, каждый шлёт в HeyGen API → видео с реалистичным аватаром и озвучкой, пригодное для YouTube / Instagram / TikTok |
| [«Generate & publish AI news avatar videos with HeyGen and Blotato» (#8050)](https://n8n.io/workflows/8050-generate-and-publish-ai-news-avatar-videos-with-heygen-and-blotato/) | **самый близкий к задаче**, см. разбор ниже |
| [«Convert RSS News to AI Avatar Videos with HeyGen & GPT-4o» (#4288)](https://n8n.io/workflows/4288-convert-rss-news-to-ai-avatar-videos-with-heygen-and-gpt-4o/) | RSS (напр. CNN) → лог заголовков в Google Sheets → GPT-4o/Gemini пишет сценарий на **30–60 сек** → HeyGen → опрос готовности → забор файла |
| [«Turn RSS feed content into AI avatar videos with HeyGen, Claude, and PostPulse» (#15750)](https://n8n.io/workflows/15750-turn-rss-feed-content-into-ai-avatar-videos-with-heygen-claude-and-postpulse/) | то же, сценарий пишет Claude, публикация через PostPulse |
| [«Viral video generator: HeyGen to TikTok & Instagram auto-post» (#6084)](https://n8n.io/workflows/6084-viral-video-generator-heygen-to-tiktok-and-instagram-auto-post-any-content/) | **запускается ежедневно в 6:00**, ищет вирусную новость, пишет сценарий, делает аватар-видео, сам публикует |
| [«Automate AI news videos to social media with GPT-4o & HeyGen and Postiz» (#6524)](https://n8n.io/workflows/6524-automate-ai-news-videos-to-social-media-with-gpt-4o-and-heygen-and-postiz/) | то же с Postiz вместо Blotato |
| [«Automated news video generation with HeyGen AI, Apify, and GPT-4.1 Mini» (#10158)](https://n8n.io/workflows/10158-automated-news-video-generation-with-heygen-ai-apify-and-gpt-41-mini/) | источник — скрейпинг через Apify, если RSS нет |
| [GitHub: `Awaisali36/ai-avatar-video-generation-system`](https://github.com/Awaisali36/ai-avatar-video-generation-system) | открытый код той же схемы: RSS → Gemini → HeyGen |

**Разбор шаблона #8050 (эталон).** Узлы: Schedule Trigger → RSS Feed Read → AI Agent → OpenAI → HeyGen API → Wait → Blotato API. Логика: «collects fresh AI/LLM news from **multiple feeds**», агент анализирует новости, выбирает самую вирусную и пишет «**a 30-second script**»; HeyGen вызывается так, чтобы «generate a **vertical avatar video (9:16)** using your selected `avatar_id`, `voice_id`, and optional background video»; публикация — узлы, «preconfigured for TikTok, Instagram, YouTube, Facebook, etc. (disabled by default)». Нужны: API-ключ HeyGen (+ `avatar_id`, `voice_id`), API-ключ Blotato (+ ID площадок), n8n версии 1.105.4+. Сам шаблон — «Use for free».
**Под нашу задачу правятся три вещи:** ленты на русские, промпт агента — «3 новости, 45–60 секунд, по-русски», `voice_id` — русский голос (или ветка «свой аудиофайл → `audio_url`»).

**Цена n8n (дословно).** ([n8n.io/pricing](https://n8n.io/pricing/), 2026-09-20, официоз)
- «**Starter – €20/month** (billed annually)» — «2,500 executions/month», 5 параллельных, «Unlimited users» и все интеграции.
- «**Pro – €50/month**» — «10,000 executions/month», 20 параллельных.
- «**Business – €667/month**» — «40,000 executions/month», self-hosted опция, «SSO, SAML and LDAP», Git.
- «**Enterprise** – Custom».
- **Ключевое: «A Community Edition is available on GitHub at no cost for self-hosted deployment»** — на своём сервере n8n **бесплатен и без лимита прогонов**. Для одного ролика в день это правильный выбор: 30 прогонов в месяц, хостинг — любой VPS.
- Тарификация идёт за **полный прогон воркфлоу**, а не за шаг — то есть ролик в день = 30 executions, влезает даже в Starter с диким запасом.

**Make.com.** Официальная интеграция с HeyGen есть: [heygen.com/integrations/make](https://www.heygen.com/integrations/make) и [make.com/en/integrations/make/heygen](https://www.make.com/en/integrations/make/heygen) (2026-09-20, официоз) — модули «create new video from template» и «create new avatar video». Готового шаблона именно «RSS → HeyGen → соцсети» в каталоге Make я **не нашёл**; зато есть подробный разбор «Auto-Generate News Summary Videos using AI and Make.com» от Creatomate ([creatomate.com/blog](https://creatomate.com/blog/auto-generate-news-summary-videos-using-ai-and-make.com), 2026-09-20, пресса/практики) — RSS-модуль + шаблон Creatomate.

**Zapier.** HeyGen называет Zapier среди интеграций тарифа Business, но готового шаблона нашего сценария **не найдено**. Zapier дороже n8n на объёме и беднее по ветвлениям — под эту задачу смысла нет.

**Вывод по оркестраторам.** **n8n Community Edition на своём VPS — ноль рублей и полный контроль.** Это и есть «скелет» любого варианта ниже, готовый и проверенный чужими руками.

---

### 3.11 Планировщики-публикаторы: Postiz · Buffer · Later · SocialBee

Ни один из них видео не генерирует — это «последняя миля». Выбираем по двум признакам: **есть ли API** и **есть ли VK/Telegram**.

#### Postiz — ⭐ единственный с VK и Telegram, и он open source

- **Лицензия и самохост.** «This repository's source code is available under the **AGPL-3.0** license», проект «open-source and self-hosted», быстрый старт — docs.postiz.com/quickstart ([github.com/gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app), 2026-09-20, официоз). **Self-hosted — бесплатно.**
- **Площадки.** README перечисляет: «Instagram, Youtube, Dribbble, Linkedin, Reddit, TikTok, Facebook, Pinterest, Threads, X, Slack, Discord, Mastodon, Bluesky» — **VK и Telegram в README НЕ названы**. Но в кодовой базе VK-провайдер существует: файл `apps/frontend/src/components/launches/providers/vk/vk.provider.tsx`, есть issue #804 про кастомный превью VK и, что важнее, **issue #887 «VK Provider didnt work - BadBody»** ([github.com/gitroomhq/postiz-app/issues/887](https://github.com/gitroomhq/postiz-app/issues/887), 2026-09-20, официоз-репозиторий). Сторонние обзоры пишут про «30+ платформ включая VK, Telegram, Kick, Twitch» ([postiz.com/blog/open-source-social-media-scheduler](https://postiz.com/blog/open-source-social-media-scheduler), 2026-09-20, официоз-блог вендора). **Итог честно: VK поддерживается, но качество поддержки под вопросом — есть открытый баг.**
- **API.** Есть, «ships an API and webhooks on every plan»; автоматизация через N8N, Make.com, Zapier (официоз README).
- **Цена.** Страницу `postiz.com/pricing` **открыть не удалось** (сетевое ограничение на стороне фетчера) — **цена облака не найдена**. Self-hosted — бесплатно, это главное.

#### Buffer

- **API на всех тарифах, включая бесплатный**: «API access is included on every Buffer plan, including Free»; API в бете без доплаты; квоты — «3,000 requests per month on Free, 7,500 on Essentials and 15,000 on Team» ([buffer.com/resources/social-media-api-multi-platform-posting](https://buffer.com/resources/social-media-api-multi-platform-posting/), 2026-09-20, официоз-блог вендора).
- **Цена**: «$5 per channel per month on Essentials and $10 on Team», выше 10 каналов — $4, выше 25 — $3, выше 50 — $1–2 (там же).
- **Площадки (11)**: Instagram, Facebook Pages, X, LinkedIn, TikTok, Pinterest, **YouTube Shorts**, Google Business Profile, Threads, Bluesky, Mastodon. **VK — нет.**

#### Later

- **Цена**: «Starter now **$18.75 per month** (billed annually)», Growth «$45/month annually ($540/year)» (2026-09-20, пресса). Бесплатный тариф закрыт.
- **Площадки (9)**: Instagram, Facebook, TikTok, Threads, YouTube, Pinterest, LinkedIn, Snapchat. **VK — нет.** Авто-публикация Reels/TikTok/Shorts — штатная.
- **API**: по обзорам включён во все тарифы; официального developer-портала я **не проверил — сомнительно**.

#### SocialBee

- **Цена**: «SocialBee pricing starts at **$29/month**», до $99/мес (2026-09-20, пресса; [socialbee.com/pricing](https://socialbee.com/pricing/)).
- **API**: по обзорам — **платный аддон**, не входит в базовый тариф: «SocialBee is $29/month with category limits and **no API**» (2026-09-20, пресса). Под автоматизацию — худший выбор из четвёрки.
- **Площадки**: 9, VK — **не найдено**.

**Вывод по планировщикам.** Для RU-задачи VK и Telegram решают. **VK умеет только Postiz** (и то с открытым багом), **Telegram проще и надёжнее делать напрямую Bot API** (см. ниже). Для YouTube / TikTok / Instagram — Blotato ($29) или Buffer (API даже на Free), либо напрямую по официальным API площадок.

---

## Сборка своими руками

Короткий ответ: **да, собирается, и ни один кубик не является узким местом.** Схема:

```
RSS-парсер  →  LLM пишет сценарий  →  TTS (русский)  →  липсинк-API  →  ffmpeg (субтитры, кроп 9:16, музыка)  →  публикация
```

Ниже — по кубикам, с ценами и квотами. Всё проверено 2026-09-20.

### Кубик 1. RSS → сценарий

Тривиально: любой RSS-парсер (feedparser в Python, узел RSS Feed Read в n8n) + вызов LLM. В n8n это два узла из готовых шаблонов (§3.10). Стоимость — копейки: 3 новости × 30 дней ≈ пара сотен тысяч токенов в месяц.

### Кубик 2. TTS — русская озвучка. **Здесь главное преимущество своей сборки**

| Движок | Цена | Оплата из РФ | Примечание |
|---|---|---|---|
| **Yandex SpeechKit** | «Standard voices cost **0.6 rubles for 1,000 characters**, premium voices **1.2 rubles for 1,000 characters**»; бесплатно 5 000 символов/мес ([aistudio.yandex.ru/docs/ru/speechkit/pricing](https://aistudio.yandex.ru/docs/ru/speechkit/pricing.html), 2026-09-20, официоз) | **ДА, рублями, российской картой** через Yandex Cloud | Ролик 60 сек ≈ 900 символов ⇒ **~0.5–1 ₽ за ролик**, **~30 ₽ в месяц**. Голос «Алиса» и др. |
| ElevenLabs | подписка от $5/мес | нет, через посредников | Лучшее качество эмоций; русский есть |
| Silero / открытые модели | 0 ₽ | — | На своём железе, качество ниже, но приличное |

**Вывод по кубику: русская озвучка стоит ~30 рублей в месяц и оплачивается российской картой.** Это ровно тот кусок, ради которого стоит не брать SaaS-комбайн: внутри комбайна русский голос — чужой ElevenLabs по их цене и их оплате.

### Кубик 3. Липсинк — «говорящая голова» из фото + аудио

Два пути: **чужое API** или **своё железо**.

| Вариант | Цена (дословно) | Источник |
|---|---|---|
| VEED Lipsync (через fal.ai) | «**$0.40 per minute** of processed video» | [lipsync.com/pricing](https://lipsync.com/pricing), 2026-09-20, пресса |
| sync.so `lipsync-1.9.0-beta` (fal.ai) | «**$0.70 per minute** of video processed» | там же |
| sync.so `lipsync-2.0` (fal.ai) | «**$3 per minute**» | [fal.ai/models/fal-ai/sync-lipsync/v2](https://fal.ai/models/fal-ai/sync-lipsync/v2), 2026-09-20, официоз |
| sync.so напрямую | подписки «$5 per month (Hobbyist)» и «$19 per month (Creator)», расход посекундно: lipsync-2 ≈ «$0.05 per second», lipsync-2-pro ≈ «$0.083 per second», sync-3 ≈ «$0.133 per second» | [lipsync.com/pricing](https://lipsync.com/pricing), 2026-09-20, пресса |
| HeyGen API, режим audio-to-video | ~$1/мин (см. §3.1) | официоз/пресса |
| Wav2Lip (open source) | «no per-minute cost but requires GPU infrastructure ($50-200/mo for cloud GPUs)» | там же |

**Дешёвый рабочий вариант: VEED через fal.ai — $0.40/мин ⇒ $0.40 за ролик ⇒ ~$12/мес.** Важно: липсинк-API **не знают языка** — им всё равно, русская речь или нет, они гонят губы под waveform. Значит **русский полностью решён кубиком 2**, и качество не зависит от того, есть ли у вендора «русская поддержка».

### Кубик 4. ffmpeg — склейка

Ноль рублей. Кроп в 9:16, вшивание субтитров (`subtitles=` фильтр из SRT, который отдаёт Whisper или сам сценарий), подложка, музыка, титры «Новость 1 / 2 / 3». Считается на любом VPS за секунды для 60-секундного ролика.

### Кубик 5. Публикация — официальные API площадок

| Площадка | API | Цена | Квота / ограничения |
|---|---|---|---|
| **YouTube (Shorts)** | YouTube Data API v3, метод `videos.insert` | **бесплатно** | **Изменилось в 2026!** Официально: «**100 quota per day. Each call costs 1 quota**», и дефолт проекта — «100 `search.list` calls, **100 `videos.insert` calls**, and 10,000 units per day combined for all other endpoints» ([developers.google.com/youtube/v3/determine_quota_cost](https://developers.google.com/youtube/v3/determine_quota_cost), 2026-09-20, **официоз**). То есть **до 100 загрузок в сутки**, и загрузки больше не едят общий пул. Старая цифра «1 600 юнитов = 6 роликов в день» устарела: «Videos.insert first dropped from about 1,600 units to about 100 in the December 4, 2025 change, and since the June 1, 2026 update it bills to its own dedicated bucket at 1 unit per call» ([getphyllo.com](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota), 2026-09-20, пресса). Для 1 ролика в день — запас 100×. |
| **TikTok** | Content Posting API, режим **Direct Post** (видео файлом или по URL) | **бесплатно** | **Главная ловушка**: «All content posted by **unaudited clients will be restricted to private viewing mode**». Чтобы ролики были публичными, «your API client must undergo an **audit** to verify compliance with our Terms of Service» ([developers.tiktok.com/doc/content-posting-api-get-started](https://developers.tiktok.com/doc/content-posting-api-get-started/), 2026-09-20, **официоз**). То есть без ревью TikTok всё уедет «в приват». Рейт-лимиты в этом доке **не названы**. |
| **Instagram Reels** | Instagram Graph API (Content Publishing) | бесплатно | Требует Business/Creator-аккаунт, привязанный к Facebook Page, и ревью приложения. Детально **не проверял в этом заходе**. |
| **VK Клипы** | `shortVideo.create` → возвращает `owner_id`, `video_id` и `upload_url`, файл заливается на этот URL | бесплатно | Официальная страница `dev.vk.com/ru/method/shortVideo.create` **не открылась** (фетчер заблокирован на домене) — метод подтверждён только практиками: [qna.habr.com/q/864545](https://qna.habr.com/q/864545), 2026-09-20, практики. Там же известный край: «при загрузке клипов через `shortVideo.create` комментарии отключены по умолчанию, и официального параметра включить их в `shortVideo.edit` нет» (2025–2026, практики). Метод `video.save` грузит **обычное видео, не клип**. **Официального дока найти не удалось — это риск.** |
| **Telegram** | Bot API, `sendVideo` | **бесплатно** — «The Bot API itself is free to use» ([core.telegram.org/bots/api](https://core.telegram.org/bots/api), 2026-09-20, официоз) | Лимит загрузки ботом — **50 МБ** через публичные серверы Bot API. Обход официальный: «a **local bot API server** supports uploading files up to **2000 MB**» (там же). 60-секундный ролик в 1080p спокойно влезает в 50 МБ. Самый простой и надёжный канал из всех. |

### Итоговая стоимость своей сборки (1 ролик в день, 30 в месяц)

| Статья | В месяц |
|---|---|
| n8n Community на VPS (самохост) | **0 ₽** (VPS ~300–600 ₽) |
| LLM для сценариев | ~100–300 ₽ |
| Yandex SpeechKit (русский голос) | **~30 ₽** |
| Липсинк VEED через fal.ai ($0.40 × 30 = $12) | ~1 100 ₽ |
| ffmpeg, публикация (YouTube/TikTok/VK/Telegram API) | **0 ₽** |
| **Итого** | **≈ 1 500–2 000 ₽/мес (~$17–22)** |

Для сравнения: готовый SaaS под ту же ежедневную частоту — **Revid Ultra $199/мес (~17 000 ₽)**, Creatify API Pro $299/мес, Captions API ~$270/мес, HeyGen API ~$30–60/мес за минуты + $149 тариф Business ради интеграций. Плюс у всех — боль с оплатой из РФ и отсутствие VK/Telegram.

### Чем своя сборка ХУЖЕ

1. **Надо один раз построить** — 1–3 дня работы, плюс ключи и OAuth четырёх площадок.
2. **Аудит TikTok** — без него публичных постов не будет; это внешняя зависимость, которую деньгами не решить.
3. **VK Клипы без официального дока** — метод живёт «по практикам», может поменяться молча.
4. **Сопровождение**: каждая площадка ломает API раз в год; у SaaS это чужая головная боль.
5. **Качество аватара**: HeyGen/Argil визуально лучше дешёвых липсинк-моделей. Компромисс — HeyGen API в режиме `audio_url` (свой русский голос + их картинка), ~$1/мин.

### Рекомендуемая гибридная схема

**n8n (самохост) → LLM → Yandex SpeechKit (русский, рубли) → HeyGen API `audio_url` (лучший липсинк) → ffmpeg → Telegram Bot API + YouTube Data API + VK `shortVideo.create` + (TikTok после аудита).**
Русский решён своим TTS, качество — чужим липсинком, публикация — бесплатными официальными API, VK и Telegram — без посредников. Стоимость ≈ $1.5–2 за ролик, ~$45–60/мес.

---

## Сводная таблица

| Инструмент | RSS/статья на входе | Свой аудиофайл | Русский | Аватар | Автопостинг сам | API | Цена под 1 ролик/день |
|---|---|---|---|---|---|---|---|
| **Revid.ai** | ✅ `article-to-video` по URL | ✅ `audio-to-video` | ✅ 70+ языков (ElevenLabs) | ✅ | ✅ YouTube/TikTok/Instagram | ✅ REST+MCP+CLI | **$199/мес (Ultra)** |
| **HeyGen** | ❌ (но n8n-шаблоны решают) | ✅ `audio_url` | ✅ (свой TTS снимает риск) | ✅ лучший | ❌ только интеграции | ✅ pay-as-you-go | ~$30–60/мес API |
| **Captions/Mirage** | ❌ | ✅ Avatar X | ✅ | ✅ | ❌ | ✅ $0.15/сек | **~$270/мес** |
| **Creatify** | ⚠️ URL товара | ✅ Boreal | ✅ 75+ | ✅ | ❌ (только Ads Launcher) | ✅ отдельные тарифы | $99–299/мес |
| **Pictory** | ✅ blog-to-video | ❌ | ✅ (от Professional) | ⚠️ слабо | ❌ (S3/Vimeo) | ✅ | **$79–99/мес** |
| **Argil** | ✅ статьи | ⚠️ неясно | ❌ не подтверждён | ✅ | ❌ | ✅ | цена не подтверждена |
| **invideo AI** | ⚠️ в UI | ⚠️ в UI | ✅ | ⚠️ | ❌ | ❌ нет публичного | $9–60/мес |
| **Opus Clip** | ❌ только нарезка | — | ✅ субтитры | — | ✅ 7 площадок | ✅ (в Pro $29) | $29/мес |
| **Blotato** | — | принимает готовый URL | — | — | ✅ 9 площадок | ✅ во всех тарифах | $29/мес |
| **Postiz** | — | принимает готовый файл | — | — | ✅ **+VK +Telegram** | ✅ | **0 ₽ самохост** |
| **Своя сборка** | ✅ любой | ✅ | ✅ Яндекс, рубли | ✅ | ✅ **+VK +Telegram** | ✅ | **~$17–22/мес** |

---

### Не найдено / сомнительно (3)

1. **Цены Argil — не найдено официально.** Страница [argil.ai/pricing](https://www.argil.ai/pricing) отдала только каркас («Same plans as in the app», «2 months free»), а обзоры дают три взаимоисключающие сетки: $39/$149, $29/$79, и даже «$10 за 400 кредитов». Страница `docs.argil.ai/pricing` — 404. Поддержка русского у Argil тоже **не подтверждена** (в маркетинге называют только испанский, французский, немецкий). Вывод: Argil нельзя закладывать в бюджет без захода в их аккаунт руками.
2. **VK Клипы через API — официального дока найти не удалось.** `dev.vk.com/ru/method/shortVideo.create` фетчером не открывается («Claude Code is unable to fetch from dev.vk.com»), в поиске официальной страницы метода нет, пользователи прямо пишут, что не нашли его на vk.com/dev. Всё, что известно (`shortVideo.create` → `upload_url` → POST файла), — из практик на Хабр Q&A. Плюс известный край: комментарии у клипа отключены по умолчанию и не включаются через `shortVideo.edit`. **Это самый хрупкий кубик всей схемы — проверять руками до того, как на него закладываться.**
3. **Расхождение по Telegram у Blotato.** Официальная справка называет исчерпывающий список из 9 площадок без Telegram и без VK; сторонние обзоры (SourceForge и др.) утверждают, что Telegram есть. Верю официальной справке, но расхождение отмечаю. Аналогично у **Postiz**: README не называет VK и Telegram, но VK-провайдер в коде есть — и на него открыт баг #887 «VK Provider didnt work - BadBody». **Считать поддержку VK в Postiz нестабильной.**

Дополнительно отмечено как «страница не открылась»: `developers.heygen.com/docs/create-video-from-template` (404), `docs.argil.ai/pricing` (404), `postiz.com/pricing` (заблокирован фетчером), `www.blotato.com/integrations` (заблокирован фетчером), `dev.vk.com/ru/method/shortVideo.create` (заблокирован фетчером), таблица ставок на официальной странице HeyGen API pricing (страница открылась, но таблицу в текст не отдала).


---

## 4. Правовой и платформенный край

Сценарий: житель РФ ежедневно публикует ролик 45–60 сек, где его собственный
цифровой двойник (его лицо + его голос, синтез ИИ) читает новости про ИИ.
Площадки: YouTube, TikTok, Instagram/Meta, VK, Telegram.

Дата проверки всех фактов ниже: **2026-09-20**.
Класс источника у каждого факта: **официоз** / **пресса** / **практики**.

---

## БЛОК А — правила площадок (маркировка синтетики)

### А1. YouTube — «altered or synthetic content»

**Источник (официоз):** [Disclosing use of altered or synthetic content — YouTube Help](https://support.google.com/youtube/answer/14328491?hl=en) · дата документа на странице не проставлена (Google справку не датирует) · проверено 2026-09-20.

**Когда раскрытие ОБЯЗАТЕЛЬНО.** Правило привязано к слову «realistic»:
раскрывать нужно, если зритель может принять сгенерированное за реальное.
Дословные формулировки из справки:

> «Makes a real person appear to say or do something they didn't do.»
> «Alters footage of a real event or place.»
> «Generates a realistic scene that didn't actually occur.»

Сводная формула справки:

> «Realistic AI content and meaningful changes require disclosure, while non-realistic or minor edits don't.»

**Примеры, ТРЕБУЮЩИЕ раскрытия** (из той же справки): реалистичное видео с
реальными людьми в выдуманных сценах; дипфейк, где человек даёт совет,
которого не давал; сгенерированные кадры реальных мест; фальшивые кадры
реальных событий; AI-generated music.

**Примеры, НЕ требующие раскрытия** — две корзины: «нереалистичное»
(фантастика, анимация, green screen) и «minor edits» (бьюти-фильтры,
цветокоррекция, генерация субтитров, апскейл, генерация сценария и
превью). В корзине minor edits прямо стоит строка:

> «Cloning one's own voice to create voice overs or dubs»

**Что это значит для нашего сценария (разбор, не цитата).** Голос —
клон СВОЕГО голоса — по букве справки раскрытия не требует. Лицо —
другое дело: синтезированный реалистичный видеоаватар человека,
произносящий текст, который человек на камеру не произносил, попадает
под первую строку «makes a real person appear to say ... something
they didn't do» и под «generates a realistic scene that didn't actually
occur». Исключения «для себя самого» в строке про лицо в справке нет —
в отличие от строки про голос. **Практический вывод: галочку
«Altered content» на YouTube ставить.**

**Как ставится.** В YouTube Studio → Details → «Altered content» → Yes.
YouTube после этого сам добавляет ярлык. Ярлык живёт в двух местах
(официоз, [How this content was made](https://support.google.com/youtube/answer/15447836?hl=en),
проверено 2026-09-20): в блоке «How this content was made» в раскрытом
описании и — для чувствительных тем — прямо на плеере.

**Санкция за нераскрытие** (официоз, та же страница):

> «content is undisclosed, in some cases, YouTube may take action to reduce the risk of harm to viewers by proactively applying a label that creators will not have the option to remove»

То есть YouTube ставит НЕСНИМАЕМЫЙ ярлык сам. Плюс блог-анонс площадки
(пресса/официоз, [blog.youtube](https://blog.youtube/news-and-events/disclosing-ai-generated-content/),
март 2024) говорит о мерах к тем, кто системно не раскрывает:
«enforcement measures for creators who consistently choose not to disclose».

**Likeness detection** (официоз, [Likeness detection on YouTube](https://support.google.com/youtube/answer/16440338?hl=en), проверено 2026-09-20):

> «Likeness detection helps creators find content on YouTube where their face appears to be altered or generated by AI.»

Условия: 18+, владелец или менеджер канала, верификация госудостоверением
и селфи-видео, согласие на биометрию; проверка до 5 дней. Работает как
«a one-time search of newly uploaded videos» — разовый прогон по свежим
загрузкам. Пока только лицо; аудио заявлено «in the near future».
Хронология охвата (пресса, TechCrunch 2026-04-21 и отраслевые сводки,
проверено 2026-09-20): 2025 — участники YPP; весна 2026 — политики,
чиновники, журналисты; далее — партнёрство с CAA для артистов;
май 2026 — все создатели 18+.

⚠️ **Важный край для нашего сценария:** likeness detection ищет чужие
дипфейки с вашим лицом, но он же может подсветить ВАШИ СОБСТВЕННЫЕ
ролики с аватаром. Это не нарушение — инструмент даёт список находок,
решение о жалобе принимает сам человек; свои ролики просто игнорируются.
Статус этого факта: **вывод из устройства инструмента, прямой цитаты в
справке нет** — см. блок «Не найдено».

### А2. Meta (Instagram / Facebook / Threads) — ярлык «AI info»

**Базовая норма (официоз).** Анонс Meta [«Labeling AI-Generated Images
on Facebook, Instagram and Threads»](https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/),
дата публикации **2024-02-06**, проверено 2026-09-20. Ключевая
дословная формулировка — именно она накрывает наш сценарий:

> «We'll require people to use this disclosure and label tool when they post organic content with a photorealistic video or realistic-sounding audio that was digitally created or altered, and we may apply penalties if they fail to do so.»

Это прямое требование к автору: фотореалистичное видео или
реалистично звучащее аудио, созданные/изменённые цифровыми средствами,
раскрываются вручную, и за нераскрытие возможны «penalties» (санкции
конкретно не перечислены — см. блок «Не найдено»).

**Автоматическая маркировка по метаданным (официоз).** Та же страница:

> «The invisible markers we use for Meta AI images – IPTC metadata and invisible watermarks – are in line with PAI's best practices.»

и далее — про распознавание «the 'AI generated' information in the C2PA
and IPTC technical standards» у контента Google, OpenAI, Microsoft,
Adobe, Midjourney, Shutterstock.

**Эволюция ярлыка (официоз).** Страница [Meta Transparency Center —
Labeling AI content](https://transparency.meta.com/governance/tracking-impact/labeling-ai-content/),
дата последнего обновления на странице **2025-02-19**, проверено
2026-09-20: Meta начала ставить ярлыки в **мае 2024**,
> «when we detected industry standard AI image indicators or when people disclosed that they were uploading AI-generated content»

Вводился ярлык как «Made with AI», затем переименован в «AI info» —
переименование прошло летом 2024 после жалоб фотографов на ложные
срабатывания (класс: **пресса**, широко освещалось; отдельной
официозной страницы про переименование не найдено).

**Позиция по удалению vs маркировке (официоз).** Блог [«Our Approach to
Labeling AI-Generated Content and Manipulated Media»](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/),
дата публикации **2024-04-05**, обновление **2025-10-23**, проверено
2026-09-20:

> «We will keep this content on our platforms so we can add informational labels and context, unless the content otherwise violates our policies.»

То есть Meta по умолчанию не удаляет синтетику, а маркирует.

**Свежий контекст (официоз).** Meta [подписала EU AI Act Code of
Practice on Transparency of AI-Generated Content](https://about.fb.com/news/2026/07/meta-is-signing-the-eu-ai-act-code-of-practice-on-transparency-of-ai-generated-content/),
июль **2026** — вектор на ужесточение и машиночитаемую маркировку
сохраняется.

⚠️ **Российский край Meta.** Деятельность Meta Platforms признана в РФ
экстремистской, Instagram и Facebook заблокированы. Это отдельный риск
не про ИИ-маркировку, а про сам факт ведения канала — см. блок «Не
найдено / сомнительно», пункт про Meta и РФ.

---

### А3. TikTok — AIGC label

**Базовая норма (официоз).** Ньюсрум TikTok, [«New labels for disclosing
AI-generated content»](https://newsroom.tiktok.com/en-us/new-labels-for-disclosing-ai-generated-content),
дата публикации **2023-09-19**, проверено 2026-09-20. Требование:

> «label AI-generated content that contains realistic images, audio or video, in order to help viewers contextualize the video and prevent the potential spread of misleading content»

**C2PA Content Credentials (официоз).** Ньюсрум TikTok,
[«Partnering with our industry to advance AI transparency and literacy»](https://newsroom.tiktok.com/en-us/partnering-with-our-industry-to-advance-ai-transparency-and-literacy)
и [«More ways to spot, shape and understand AI-generated content»](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en),
проверено 2026-09-20. Факты: TikTok — первая видеоплатформа,
внедрившая Content Credentials C2PA; входящий контент с Content
Credentials маркируется **автоматически**; TikTok сам прикрепляет
Content Credentials к своему контенту, и они переживают скачивание
(проверяется через C2PA Verify); добавлены невидимые водяные знаки;
суммарно площадка промаркировала **более 3 млрд роликов** как AIGC.

**Изображение реальных людей (класс: пресса/сводки, дословный текст
Community Guidelines открыть не удалось — см. «Не найдено»).**
Гайдлайны TikTok запрещают AIGC с подобием реального человека,
если это: несовершеннолетний; взрослый частный человек; взрослая
публичная фигура в политическом или коммерческом эндорсменте.
**Наш сценарий сюда не попадает: автор — взрослый публичный автор
собственного канала, использует СВОЁ подобие, и это не эндорсмент
от чужого имени.** Но как только в ролике появляется синтезированный
голос/лицо ЧУЖОГО спикера новости — это прямое нарушение.

**Санкция за отсутствие ярлыка (класс: пресса/практики):** авто-ярлык,
понижение в выдаче, либо удаление. Промаркированный AIGC остаётся
монетизируемым и допустимым для брендовых сделок.

---

## БЛОК Б (часть) — закон РФ о маркировке ИИ-контента: ПОДТВЕРЖДЁННЫЙ статус

### Б6. Маркировка ИИ-контента — принято, но ДОБРОВОЛЬНО

**Действующий акт (официоз).** Федеральный закон от **26.07.2026
№ 243-ФЗ** «О поддержке развития технологий искусственного интеллекта
в Российской Федерации». Официальное опубликование —
[publication.pravo.gov.ru, номер опубликования 0001202607260003](http://publication.pravo.gov.ru/document/0001202607260003)
(страница через WebFetch не открылась — карточка подтверждена
по КонсультантПлюс и ГАРАНТ). Карточка:
[КонсультантПлюс](https://www.consultant.ru/document/cons_doc_LAW_540336/) ·
[ГАРАНТ](https://base.garant.ru/414652934/). Проверено 2026-09-20.

**Хронология (официоз + пресса, проверено 2026-09-20):**
- законопроект № **1271570-8**, внесён Правительством РФ;
- **08.07.2026** — принят Госдумой во втором и третьем чтениях
  ([РИА Новости](https://ria.ru/20260708/gosduma-2103531705.html),
  [Коммерсантъ](https://www.kommersant.ru/doc/8798988), 08.07.2026 14:42,
  [Ведомости](https://www.vedomosti.ru/technology/news/2026/07/08/1212168-zakon-o-razvitii-ii));
- **26.07.2026** — подписан Президентом, № 243-ФЗ;
- **01.09.2026** — вступил в силу, кроме отдельных положений;
- **01.03.2027** — вступает в силу статья 9 (маркировка).

**Содержание статьи 9 — ключевое.** Название статьи (официоз, оглавление
КонсультантПлюс): «Статья 9. Маркировка информационного материала,
созданного с применением больших фундаментальных моделей искусственного
интеллекта». Текст части 1 (класс: **пресса/юр-аналитика**,
[ppt.ru, 30.07.2026](https://ppt.ru/obzory/zakon-ob-ii-243-fz);
дословный официальный текст с pravo.gov.ru открыть не удалось):

> «Лицу, применяющему большую фундаментальную модель для создания информационного материала в аудио- и (или) визуальной форме, обеспечивается возможность разместить информационное предупреждение о применении ИИ.»

**Читаем юридически.** Это сформулировано как ПРАВО пользователя, не
обязанность. Обязанность лежит на площадке — дать техническую
возможность маркировки; порог по аналитике — суточная аудитория свыше
**500 тыс.** пользователей из РФ. Отсюда заголовок отраслевого разбора
(пресса, [sostav.ru](https://www.sostav.ru/blogs/289407/99420)):
«Закон о маркировке ИИ-контента приняли, но помечать он никого не
обязывает».

**Охват:** только аудио- и (или) визуальная форма. Тексты статьёй 9
не охвачены. Регулирование в целом распространяется на «большие
фундаментальные модели» с числом параметров **не менее 1 млрд**.
Вводятся понятия «суверенных» и «национальных» моделей.

**Попытка сделать маркировку обязательной — ВНЕСЕНА, НЕ ПРИНЯТА.**
Законопроект № **1317978-8**, внесён в Госдуму **17.08.2026** группой
депутатов — поправки в тот же 243-ФЗ: обязать «лицо, предоставляющее
возможность применения больших фундаментальных моделей ИИ» маркировать
материалы; формат и порядок установит Правительство; предполагаемое
вступление — 01.03.2027. Источники: [klerk.ru, 17.08.2026 16:05](https://www.klerk.ru/buh/news/704942/),
[Ведомости, 18.08.2026](https://www.vedomosti.ru/technology/articles/2026/08/18/1221812-polzovatelei-ii-predlozhili-obyazat-markirovat-sozdannie-neirosetyami-materiali),
[ComNews, 19.08.2026](https://www.comnews.ru/content/246954/2026-08-19/2026-w34/1008/gosduma-rf-pometit-kontent).
Ведомости: проект готовила рабочая группа при Совете при Президенте РФ
под руководством **П. Крашенинникова**; ответственность за отсутствие
маркировки в проекте **не определена**, кто именно маркирует —
не ясно, минимальная доля ИИ-контента не установлена, контролёр не назван.

> ⚠️ **Статус на 2026-09-20: внесён, до принятия не дошёл.**
> Карточка sozd.duma.gov.ru не открылась (ECONNREFUSED с нашего
> хоста) — стадия рассмотрения по официозу НЕ подтверждена.
> Последнее найденное подтверждение: внесение 17.08.2026.

**Что это значит для владельца сегодня.** На 2026-09-20 обязанности
ставить ИИ-метку на свой ролик по российскому закону **нет**. С
01.03.2027 появится право и площадкам придётся дать кнопку. Если
1317978-8 пройдёт — появится обязанность, но пока её нет.

---

### А4. VK (VK Видео / VK Клипы) — требования маркировки ИИ НЕ НАЙДЕНО

**Вывод: на 2026-09-20 отдельного правила VK об обязательной маркировке
ИИ-контента найти не удалось.** Ни в Правилах пользования сайтом, ни в
[Правилах сообществ VK](https://vk.ru/@authors-pravila-soobschestv)
пункта «маркируйте синтетику» не обнаружено. Правила VK построены по
другой логике: запрещено то, что запрещено законом РФ, плюс список
категорий (насилие, экстремизм, порно, обман). Класс: **практики**
(вывод по отсутствию нормы, а не по её тексту) — полноценно
подтвердить негативный факт нельзя, см. «Не найдено».

**Что VK при этом делает (официоз/пресса).** VK сам публично **предложил**
маркировать сгенерированный нейросетями контент — выступление на
правовом форуме, [РАПСИ, 04.06.2026](https://rapsinews.ru/digital_law_news/20260604/311907415.html),
проверено 2026-09-20. То есть площадка выступает инициатором нормы,
а не её носителем.

**Что будет дальше по закону.** Статья 9 ФЗ № 243-ФЗ с **01.03.2027**
обяжет площадки с суточной аудиторией из РФ свыше 500 тыс. дать
пользователю техническую возможность поставить предупреждение. VK
под этот порог попадает заведомо — значит, кнопка «сделано с ИИ» в
VK Видео/Клипах появится к марту 2027. Обязанности автора ею
пользоваться закон (в нынешней редакции) не вводит.

**Практический вывод по VK:** маркировать нечем и необязательно;
ставим текстовый дисклеймер в описании ролика руками.

---

### А5. Telegram · Дзен · Rutube — коротко

- **Telegram.** Требования маркировать ИИ-контент в Terms of Service
  и в правилах каналов **не найдено**. Telegram модерирует по узкому
  списку (спам, порнография с детьми, призывы к насилию, пиратство в
  публичных каналах). Отдельного AI-лейбла нет. Класс: **практики**,
  негативный факт — см. «Не найдено».
- **Дзен.** Собственного обязательного ИИ-ярлыка не найдено. У Дзена
  действуют правила качества контента и антифрод-алгоритмы, которые
  штрафуют «неоригинальный/шаблонный» контент понижением показов —
  это не про маркировку, а про ранжирование. Класс: **практики**,
  официозной цитаты не добыто.
- **Rutube.** Отдельного требования маркировки ИИ не найдено. Rutube
  как российская площадка попадёт под ту же ст. 9 ФЗ 243-ФЗ
  с 01.03.2027. Класс: **практики**.

> Общий смысл раздела: **жёсткая маркировка синтетики сегодня — это
> требование трёх западных площадок (YouTube, Meta, TikTok).
> Российские площадки пока ничего не требуют; их обяжут дать кнопку
> с марта 2027, и то кнопку, а не обязанность автора.**

---

## БЛОК Б — законодательство РФ (продолжение)

### Б7. Дипфейки в УК РФ — внесено, НЕ принято

**Что подтверждено (пресса, проверено 2026-09-20).** Законопроект
№ **1288702-8**, внесён **12.08.2026** — поправка в **статью 63 УК РФ**
(перечень отягчающих обстоятельств): совершение преступления с
использованием дипфейка предлагается считать отягчающим.
**Статус: внесён, не принят.** Карточка sozd.duma.gov.ru не
открывалась с нашего хоста — стадия по официозу не подтверждена.

**Более ранняя ветка (пресса).** С 2024 года обсуждались поправки,
вводящие дипфейк как квалифицирующий признак в ст. **159** (мошенничество),
**128.1** (клевета), **137** (неприкосновенность частной жизни),
**163** (вымогательство) УК РФ. **Подтверждения принятия ни одной из
этих поправок не найдено.** Отдельной статьи УК «неправомерное
использование голоса/изображения» на 2026-09-20 **не найдено**.

**Инфраструктурный факт (пресса).** В январе 2026 Минцифры подписало
приказ о создании межведомственной рабочей группы по борьбе с
незаконным использованием дипфейков. Единого закона о дипфейках в РФ
на дату проверки нет.

> ⚠️ Всё в этом пункте — **пресса**, не официоз. Формулировка честного
> статуса: «статус не подтверждён; последнее найденное — внесение
> 12.08.2026». Не подавать как действующую норму.

---

### Б8. Голос как объект охраны в ГК РФ — внесено 2024, НЕ принято

**Законопроект № 718834-8** — дополнить часть первую ГК РФ новой
**статьёй 152.3 «Охрана голоса гражданина»** по аналогии со ст. 152.1
(охрана изображения). Внесён **в сентябре 2024**. Авторы — группа
сенаторов во главе с **А. Клишасом** и депутат ГД **Д. Бессарабов**.

**Что защищает (пресса/официоз-анонсы,
[КонсультантПлюс hotdocs](https://www.consultant.ru/law/hotdocs/86379.html),
[ГАРАНТ.РУ](https://www.garant.ru/news/1754845/),
[Адвокатская газета](https://www.advgazeta.ru/novosti/v-grazhdanskom-kodekse-planiruetsya-predusmotret-okhranu-golosa-grazhdan/),
проверено 2026-09-20):** обнародование и дальнейшее использование
записи голоса гражданина — **только с его согласия**; согласие нужно
и когда голос воссоздан специальными технологиями, включая синтез
речи ИИ и имитацию голоса в реальном времени.

**Статус — отрицательный.** Правительство РФ законопроект **не
поддержало** ([Интерфакс](https://www.interfax.ru/russia/1003742)):
в отзыве сказано, что вопросы уже урегулированы действующим
законодательством. Совет при Президенте по кодификации и
совершенствованию гражданского законодательства — **тоже не
поддержал** ([РАПСИ, 25.10.2024](https://www.rapsinews.ru/legislation_news/20241025/310359491.html)).

> ⚠️ **Статус на 2026-09-20: не подтверждено принятие.** Последнее
> найденное: внесён 09.2024, отрицательные отзывы Правительства и
> Совета по кодификации, сведений о прохождении первого чтения нет.
> Отдельной охраны голоса в ГК РФ **сейчас нет**.

**Что это значит практически.** Голос гражданина сегодня защищается не
специальной нормой, а через общие институты: персональные данные
(биометрия — 152-ФЗ и ФЗ-572 о ЕБС), нематериальные блага (ст. 150 ГК),
деловая репутация (ст. 152 ГК), смежные права исполнителя, если голос
записан в исполнении. Для НАШЕГО сценария это неважно (свой голос —
своё согласие), но важно для обратной стороны — защиты от чужих
клонов его голоса: специального инструмента нет.

---

### Б9. Статья 152.1 ГК РФ — своё лицо vs чужие лица и логотипы

**Норма (официоз).** Ст. 152.1 ГК РФ «Охрана изображения гражданина»:
обнародование и дальнейшее использование изображения гражданина
допускается **только с согласия этого гражданина**. Три исключения:
(1) использование в государственных, общественных или **иных публичных
интересах**; (2) изображение получено при съёмке в местах, открытых
для свободного посещения, или на публичных мероприятиях, и не является
основным объектом использования; (3) гражданин **позировал за плату**.

**Своё лицо — риска нет.** Согласие самого себя предполагается; владелец
сам является правообладателем согласия. Вендорские платформы отдельно
требуют consent-видео (см. Блок В).

**Где риск реален — ЧУЖИЕ лица в ролике про новости ИИ:**
1. **Кадры с Альтманом, Маском, Дуровым и т. п.** Как правило
   подпадают под исключение «публичный интерес» + «публичное
   мероприятие», если лицо не основной объект использования и
   изображение взято из открытого публичного источника. Но
   исключение **отпадает**, если кадр используется для рекламы или
   если его подают так, будто человек рекламирует ваш канал/курс.
2. **Синтезировать чужое лицо или голос нельзя.** Сгенерированный
   Альтман, «комментирующий» новость, — это одновременно нарушение
   ст. 152.1 ГК, правил YouTube (deepfake «makes a real person appear
   to say something they didn't»), правил TikTok (запрет AIGC с
   подобием взрослой публичной фигуры в коммерческом контексте) и
   потенциально ст. 128.1 УК (клевета), если слова порочащие.
   **Это красная линия сценария.**
3. **Логотипы компаний (OpenAI, Яндекс, Сбер).** Товарный знак
   используется законно в **информационных целях** — назвать компанию,
   про которую новость. Нарушение начинается, когда знак создаёт
   впечатление, что канал связан с брендом или им одобрен (ст. 1484 ГК,
   ст. 1515 ГК). Практический рубеж: лого в кадре как иллюстрация
   новости — ок; лого в аватарке/шапке канала или в оформлении
   платного продукта — не ок.
4. **Чужие видеокадры и музыка.** Ст. 1274 ГК (цитирование) допускает
   использование правомерно обнародованного произведения в
   информационных целях в объёме, оправданном целью, с указанием автора
   и источника. Короткая врезка из чужого ролика с подписью откуда —
   защитимая позиция; 30 секунд чужого видеоряда фоном — нет.
   На YouTube отдельно работает Content ID, которому ст. 1274 ГК
   безразлична.

Класс всего пункта: **официоз** (тексты ГК) + **практики**
(правоприменительный вывод, не цитата суда).

---

### Б10. Реклама в ролике — маркировка ЕРИР/ОРД и запрет на заблокированных площадках

**Норма (официоз).** Ст. **18.1** ФЗ от 13.03.2006 № 38-ФЗ «О рекламе»
(введена ФЗ от 02.07.2021 № 347-ФЗ, требования работают
с **01.09.2022**): интернет-реклама, направленная на потребителей в РФ,
должна содержать пометку «реклама», указание на рекламодателя и
**идентификатор erid**, а данные передаются в **ЕРИР** через
аккредитованного оператора рекламных данных (**ОРД**) — Яндекс ОРД,
VK ОРД, МТС Маркетолог и др.

**Ответственность (официоз, КоАП РФ ст. 14.3).** Штрафы за отсутствие
маркировки и непередачу статистики: гражданам — от 10 до 30 тыс. ₽,
должностным лицам — от 30 до 100 тыс. ₽, юрлицам — от 200 до 500 тыс. ₽
(ч. 15 ст. 14.3 КоАП). Отвечают оба: рекламодатель — за непередачу
данных в ЕРИР, рекламораспространитель (блогер) — за публикацию без
токена. Один ролик = один эпизод. Источники (класс: **пресса/практики**,
сводки юрфирм, проверено 2026-09-20):
[elama](https://elama.ru/blog/oshtrafah-iotvetstvennosti-zanesoblyudenie-zakona-omarkirovke-reklamy/) ·
[Ветров и партнёры](https://vitvet.com/articles/koap/otrasli/reklama-v-internete-narusheniya-shtraf-2026/) ·
[РИА Новости, 16.03.2025](https://ria.ru/20250316/markirovka-1896148209.html).

**Самореклама.** Собственный продукт на собственном канале оформляется
через ОРД в режиме «самореклама» — вы одновременно рекламодатель и
распространитель. Класс: **практики**. Отдельная строка отраслевой
дискуссии — считается ли рекламой пост о своём продукте на своём
ресурсе; позиция ФАС менялась. **Безопасная тактика: получить erid
на любой ролик, где есть призыв купить.**

**Отдельный, более острый край — запрет рекламы на заблокированных
ресурсах.** С **01.09.2025** запрещено размещать рекламу на ресурсах
организаций, признанных в РФ экстремистскими или нежелательными,
включая **Instagram**. Штрафовать могут и рекламодателя, и владельца
аккаунта. Диапазоны по ст. 14.3 КоАП (класс: **пресса**, сводки):
физлицам до 2 500 ₽, должностным до 20 000 ₽, юрлицам до 500 000 ₽.
Источники: [Forbes](https://www.forbes.ru/svoi-biznes/544859-zapret-reklamy-v-instagram-s-1-sentabra-cto-mozno-i-nel-za-publikovat) ·
[Setters Media](https://www.setters.media/post/instagram-zapret-reklamy-1-sentyabrya-2025) ·
[elama](https://elama.ru/blog/zapret-reklamy-v-instagram-s-1-sentyabrya-2025-chto-izmenitsya-i-kak-rabotat-po-novomu-zakonu/).
Проверено 2026-09-20.

> **Для нашего сценария это главный «денежный» риск, а вовсе не ИИ:**
> один и тот же ролик, разлитый на пять площадок, в Instagram
> превращается в нарушение, как только в нём звучит призыв купить курс.
> **Правило: рекламный слой из инстаграм-версии вырезать.**

---

### Б11. Авторское право на сгенерированный ИИ контент в РФ

**Базовый принцип (официоз, ГК РФ).** Автором может быть только
**гражданин, творческим трудом которого создано произведение**
(ст. 1257 ГК). Нейросеть — программа для ЭВМ, самостоятельным автором
быть не может. Результат, созданный без творческого вклада человека,
объектом авторского права не является.

**Как это работает на практике (класс: практики / юр-аналитика,
проверено 2026-09-20).** Суды рассматривают нейросеть **как
инструмент**. Охрана возникает, когда доказан творческий вклад
человека: сценарий, отбор и доработка вариантов, монтаж, режиссура.
Показательный ориентир из обзоров практики — дело о ролике с
дипфейк-технологией, где суд защитил права автора, признав
**сценарий, режиссуру и монтаж** творческим трудом человека;
компенсация — **500 000 ₽**. ⚠️ Реквизиты этого дела (номер, суд,
дата) из вторичных обзоров **не подтверждены** — см. «Не найдено».
Обзоры: [РБК Компании](https://companies.rbc.ru/news/sZfxks5HSp/ii-i-avtorskoe-pravo-komu-prinadlezhat-prava-na-nejrokontent/) ·
[Forbes](https://www.forbes.ru/tekhnologii/537685-iiskusstvo-komu-prinadlezat-avtorskie-prava-na-tvorcestvo-nejrosetej).

**Что это значит для нашего сценария — хорошая новость.** Ролик с
двойником — это не «чистая генерация»: есть отбор новостей, написанный
сценарий, режиссура, монтаж, оформление. Творческий вклад человека
налицо → **ролик охраняется как аудиовизуальное произведение, права у
владельца**. Чистый выхлоп генератора без обработки — серая зона.

**Обратная сторона (официоз, 243-ФЗ).** ФЗ № 243-ФЗ содержит норму,
что обработка информации для обучения суверенных и национальных
моделей **не считается нарушением авторских прав**, если произведения
получены правомерно или были общедоступны (цитата из разбора
Коммерсанта, 08.07.2026: «Обработка информации для обучения суверенных
и национальных моделей нарушением авторских прав считаться не будет»).
То есть контент владельца может законно уезжать в обучающие выборки
российских моделей.

**Дело Reface / «Бизнес-Аналитика» — НЕ ПОДТВЕРЖДЕНО.** Поиском
решения найти не удалось, см. «Не найдено».

---

## БЛОК В — риски использования СВОЕГО клона

### В12. Условия вендоров: согласие, права на выход, блокировка аккаунта

Общая картина по трём основным вендорам (все проверено 2026-09-20):
**клонировать себя — штатный, поощряемый сценарий; клонировать чужого —
запрет либо техническая невозможность.**

**HeyGen** (официоз: [Terms](https://www.heygen.com/terms) ·
[Moderation Policy](https://www.heygen.com/moderation-policy) ·
[Avatar Consent, developers docs](https://developers.heygen.com/docs/avatar-consent) ·
[Ethics](https://www.heygen.com/ethics)). Прямые URL
`/policy/terms-of-service` и `/policy/terms-of-use` дали 404 — рабочий
адрес `/terms`.
- **Согласие.** Для кастомного аватара требуется явное согласие
  изображаемого лица («Actor»): записывается consent-видео, где
  человек произносит заданную фразу. Создание аватаров реальных людей,
  включая знаменитостей и публичных фигур, **без их явного согласия
  запрещено**.
- **Права на выход.** Пользователь владеет правами на фото и кастомные
  аватары, которые создал. НО: загружая и генерируя контент, он выдаёт
  HeyGen «royalty-free, transferable, sublicensable, worldwide and
  irrevocable license» на использование, хостинг, воспроизведение,
  показ, публикацию, распространение и изменение контента — для работы
  и улучшения сервиса. Лицензия **безотзывная**.
- **Запрещено:** насилие, ненависть, обман, откровенный секс, нарушение
  чужих прав, **политика (включая агитацию)**, вред несовершеннолетним,
  мошенничество, **дезинформация**, запрещённые товары.

> ⚠️ **Узкое место нашего сценария: «новости про ИИ» ходят рядом с
> запретом на misinformation и с политическим запретом.** Регуляторная
> новость («Госдума приняла закон об ИИ») формально политическая тема.
> Модерация HeyGen работает по содержанию скрипта. Риск не
> теоретический — рекомендую держать в ролике нейтральный
> информационный тон без оценок политиков.

**Synthesia** (официоз: [Terms and Conditions](https://www.synthesia.io/terms-and-conditions) ·
[Acceptable Use Policy](https://www.synthesia.io/legal/acceptable-use-policy)).
- **Права на выход:** «Customer will own all Customer Data, but
  excluding the components of the Services and Synthesia Content».
  То есть свой ролик — ваш; **сток-аватары после прекращения договора
  экспортировать нельзя**.
- **Согласие:** заказчик гарантирует, что при создании Custom Avatar
  с голосом или подобием человека «such individual is over the
  applicable statutory legal age and has provided free and informed
  consent».
- **Расторжение:** «terminate the Contract immediately on notice to
  Customer if we reasonably believe that the Services are being used
  by Customer or its Users in violation of applicable law»; плюс право
  вмешаться самим — «may directly step in and take what we determine
  to be appropriate action».

**ElevenLabs** (официоз: [Terms of Use](https://elevenlabs.io/terms-of-use) ·
[Professional Voice Cloning docs](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning)).
- **Права на выход:** «Except as expressly set forth herein, as between
  you and ElevenLabs, you retain all rights in and to your Output.»
  Но тут же — широкая лицензия площадке: «you hereby grant to
  ElevenLabs a license to use, reproduce, modify, adapt, publish,
  translate, create derivative works from, distribute, publicly or
  otherwise perform and display ... your Output.»
- **Права на вход:** «You may not provide Input or create Output for
  which you do not have all the rights necessary to grant us the
  license described above.»
- **Клонировать можно только себя.** По документации PVC: создать
  Professional Voice Clone чужого голоса нельзя **даже с его
  согласия** — техническое ограничение, не только правило.
- **Блокировка аккаунта = потеря денег:** «If your account is closed
  or terminated, you will forfeit all unused credits»; «any unused
  Prepaid Credits remaining in your Account will be forfeited without
  refund».

**Сводка «что реально грозит владельцу».** Если двойник — он сам, и
раскрытие честное:
1. Юридического риска по РФ **нет**: своё изображение (ст. 152.1 ГК) и
   свой голос — своё согласие; обязанности маркировать по закону пока нет.
2. Платформенного риска почти нет при поставленной галочке; без галочки —
   принудительный ярлык YouTube, понижение в TikTok, «penalties» у Meta.
3. Главный риск — **вендорский**: блокировка аккаунта по модерации
   (тема новостей рядом с «misinformation»/политикой), потеря
   непотраченных кредитов без возврата, потеря доступа к самому аватару.
   **Митигация: держать локальный архив исходников аватара
   (consent-видео, записи голоса, готовые mp4) и второго вендора
   про запас.**
4. Права на готовый ролик остаются у владельца у всех трёх вендоров, но
   у каждого вендор получает широкую, у HeyGen — прямо **безотзывную**,
   лицензию на ваш контент. Совсем «только моё» не бывает.

---

### В13. Обратная сторона: чужие дипфейки с лицом и голосом владельца

Механизмы защиты, существующие на 2026-09-20:

1. **YouTube likeness detection** (официоз,
   [справка](https://support.google.com/youtube/answer/16440338?hl=en)) —
   ищет ролики, где лицо участника «appears to be altered or generated
   by AI». Доступно всем создателям 18+ с мая 2026. Требует
   верификации госдокументом и селфи-видео, до 5 дней проверки. Пока
   **только лицо**; аудио заявлено «in the near future».
   **Рекомендация: зарегистрироваться сразу — инструмент бесплатный,
   а лицо владельца после ежедневных роликов станет удобной мишенью.**
2. **ElevenLabs Voice Captcha** (официоз, документация PVC) — при
   создании Professional Voice Clone пользователь должен вслух
   прочитать текстовую капчу за 10 секунд. Это защищает не от чужого
   дипфейка вообще, а от клонирования вашего голоса **внутри
   ElevenLabs** по украденным записям.
3. **C2PA Content Credentials** — TikTok прикрепляет их к своему
   контенту, и они переживают скачивание; проверяются публичным
   инструментом C2PA Verify. Это доказательная база «откуда ролик»,
   а не блокировка.
4. **Российские средства — слабые.** Специальной статьи УК про
   дипфейк нет (законопроект 1288702-8 внесён 12.08.2026, не принят);
   охраны голоса в ГК нет (законопроект 718834-8 без движения).
   Работающие инструменты: ст. 152.1 ГК (изображение), ст. 152 ГК
   (деловая репутация), ст. 128.1 УК (клевета), ст. 159 УК
   (мошенничество), внесудебная блокировка через РКН по
   ст. 15.1 ФЗ-149 при наличии оснований.
5. **Практическая защита, которая работает лучше права:** чем чаще
   владелец сам публикует ролики с двойником **с честной пометкой**,
   тем дешевле ему потом доказать «а вот это не я» — у него есть
   собственный публичный эталон и дата.

---

### Не найдено / сомнительно (4)

Всё, чей статус я НЕ подтвердил официозом. Сюда же — страницы, которые
не открылись.

**Страницы, которые не открылись (2026-09-20):**
- `sozd.duma.gov.ru` — **ECONNREFUSED** с нашего хоста на всех
  карточках (1271570-8, 1317978-8, 718834-8). Стадии рассмотрения и
  даты событий по официозу подтвердить не удалось — везде опирался на
  прессу и правовые базы.
- `publication.pravo.gov.ru/document/0001202607260003` — WebFetch
  вернул пустой ответ. Номер опубликования 243-ФЗ подтверждён косвенно
  (по ссылке из выдачи и карточкам КонсультантПлюс/ГАРАНТ).
- Полный текст **ст. 9 ФЗ № 243-ФЗ** из официального источника не
  добыт: КонсультантПлюс отдал только оглавление. Цитата части 1
  взята из юр-аналитики ppt.ru (30.07.2026) — **класс «пресса», не
  официоз**. Перед любым публичным заявлением цитату надо сверить с
  pravo.gov.ru.
- Дословный текст **Community Guidelines TikTok**, раздел «Edited
  Media and AI-Generated Content (AIGC)» — страница отдавалась
  усечённой, дословные запреты по подобию реальных людей взяты из
  вторичных сводок. **Класс: пресса.**
- `transparency.meta.com/features/how-ai-content-is-labeled-on-our-apps/`
  — 404. `help.instagram.com/586856974553827` — пустая. Требование
  Meta к автору цитируется по блогу от 2024-02-06.
- Раздел про **санкции Meta за нераскрытие**: формулировка «we may
  apply penalties» есть, **конкретный перечень санкций нигде не
  найден**.

**Статусы, которые НЕ подтверждены:**
1. **Законопроект № 1317978-8** (обязательная маркировка ИИ-контента).
   Статус не подтверждён; последнее найденное — **внесён 17.08.2026**.
   Принят ли в первом чтении на 2026-09-20 — неизвестно.
2. **Законопроект № 1288702-8** (дипфейк как отягчающее, ст. 63 УК).
   Статус не подтверждён; последнее найденное — **внесён 12.08.2026**.
   Поправки в ст. 159/128.1/137/163 УК про дипфейк: **подтверждения
   принятия нет ни по одной**.
3. **Законопроект № 718834-8** (охрана голоса, новая ст. 152.3 ГК).
   Статус не подтверждён; последнее найденное — **внесён 09.2024**,
   отрицательные отзывы Правительства РФ и Совета при Президенте по
   кодификации (10.2024). Данных о первом чтении нет.
   **Охраны голоса в ГК РФ сегодня нет.**
4. **Дело «Reface» / «Бизнес-Аналитика»** — из брифа. Решения найти
   не удалось; считать несуществующим до подтверждения.
5. **Дело о ролике с дипфейком, компенсация 500 000 ₽** — фигурирует
   в обзорах юрфирм без реквизитов (суд, номер, дата). **Не цитировать
   публично** до проверки по kad.arbitr.ru / СудАкт.
6. **Отсутствие требования маркировки ИИ у VK, Telegram, Дзена,
   Rutube** — негативный факт: искал, не нашёл; доказать отсутствие
   нормы поиском нельзя. Перед публичным утверждением перечитать
   актуальные правила площадки руками.
7. **Переименование Meta «Made with AI» → «AI info»** — широко
   описано прессой, отдельной официозной страницы не найдено.
8. **Порог 500 тыс. суточной аудитории РФ** для обязанности площадки
   дать кнопку маркировки — взят из юр-аналитики (ppt.ru),
   в официозном тексте не сверен.
9. **Практика YouTube по likeness detection в отношении СОБСТВЕННЫХ
   роликов автора** — вывод из устройства инструмента, цитаты в
   справке нет.
10. **Статус Meta в РФ** (признание экстремистской, блокировка
    Instagram и Facebook) — общеизвестный факт, но в рамках этого
    прогона официозом не сверялся; на решение по рекламному слою
    влияет прямо, значит требует отдельной проверки.

---

### Практический вывод: что делать владельцу

1. **YouTube — галочку «Altered content» ставить, каждый раз.** Голос
   свой клонированный формально исключён из раскрытия («Cloning one's
   own voice»), но синтезированное реалистичное ЛИЦО, говорящее то,
   чего человек на камеру не говорил, под правило попадает. Цена
   галочки — строка в описании; цена отказа — неснимаемый ярлык
   от площадки и накопление «consistently choose not to disclose».
2. **TikTok — включать AIGC label в самом редакторе.** Это дешевле,
   чем авто-ярлык: промаркированный AIGC остаётся монетизируемым.
3. **Instagram — ставить «AI info» вручную** (требование Meta прямое:
   photorealistic video → disclosure tool). **И вырезать из
   инстаграм-версии любую рекламу и призывы купить** — с 01.09.2025
   реклама на заблокированных ресурсах в РФ запрещена и штрафуется,
   и это единственный настоящий денежный риск всего сценария.
4. **VK, Telegram, Дзен, Rutube — обязанности нет ни по правилам
   площадок, ни по закону РФ.** Пишем дисклеймер руками одной строкой
   в описании. К **01.03.2027** VK и Rutube обязаны будут дать кнопку
   (ст. 9 ФЗ № 243-ФЗ) — тогда переключимся на неё.
5. **Дисклеймер писать один и тот же на все площадки** — короткая
   строка в описании плюс подпись в первых секундах ролика: «Ведущий —
   мой ИИ-двойник: моё лицо и мой голос, синтезированы нейросетью.
   Новости настоящие». Это закрывает сразу платформы, будущий закон и
   репутацию.
6. **Красная линия — чужие лица и голоса.** Синтезировать Альтмана,
   Дурова или любого спикера новости **нельзя**: это ст. 152.1 ГК,
   прямой запрет YouTube и TikTok, потенциально клевета. Чужие люди в
   ролике — только настоящими кадрами из публичных источников, с
   указанием источника, не основным объектом.
7. **Где реальный риск, а не бумажный.** Не закон РФ (его пока нет) и
   не маркировка (она дешёвая), а: (а) реклама в Instagram; (б)
   блокировка вендорского аккаунта по модерации, если скрипт новостей
   заденет политику или будет прочитан как дезинформация — держать
   локальный архив аватара и запасного вендора; (в) чужие дипфейки с
   его лицом — записаться в YouTube likeness detection сразу, пока
   канал маленький.



---

## 4Б. Право РФ — независимая перепроверка главной сессией (2026-09-20)

Эти же вопросы проверялись вторым проходом, потому что выдуманный статус закона —
худший брак среза. Ниже только то, что подтверждено конкретной публикацией.

### Закон о маркировке ИИ-контента — ПРИНЯТ, но маркировка ДОБРОВОЛЬНАЯ
- **Госдума приняла закон 8 июля 2026.** Маркировка — **право, а не обязанность**
  автора. Дословно по изложению: «любой, кто использует большую фундаментальную
  модель ИИ… **сможет разместить на них предупреждение**»; обязанность лежит на
  платформах, не на авторе.
  [РИА Новости, 08.07.2026](https://ria.ru/20260708/gosduma-2103531705.html),
  проверено 2026-09-20, **пресса**.
- **Номер и детали: законопроект № 1271570-8.** Распространяется на
  «Информационные материалы в аудио- и/или визуальной форме. Это могут быть,
  например, изображения, видео или аудиозаписи». **Текстовые материалы в
  регулирование не включены.** Формат: «Закон не устанавливает жестких требований
  к формату и содержанию предупреждения». Обязанность дать техническую возможность
  маркировки — у владельцев ресурсов с суточной российской аудиторией **свыше
  500 тысяч пользователей**. Сроки: основные положения — **1 сентября 2026**,
  отдельные нормы — **1 марта 2027**.
  [ppt.ru, «Законопроект о добровольной маркировке ИИ-контента принят в третьем
  чтении»](https://ppt.ru/columns/jurist-v-it/zakonoproekt-o-dobrovolnoy-markirovke-ii-kontenta-prinyat-v-tretem-chtenii),
  публикация 2026-07-21, проверено 2026-09-20, **пресса** (юридическое издание).
- **Практический смысл для владельца:** на сентябрь 2026 обязанности помечать
  свой ролик «сделано ИИ» по российскому закону **нет**. Платформы обязаны дать
  ему кнопку — он вправе ею воспользоваться.

### Законопроект об ОБЯЗАТЕЛЬНОЙ маркировке — внесён, НЕ принят
- Внесён в Госдуму **17 августа 2026**. Обязанность предлагается возложить не на
  автора, а на провайдера модели: дословно «Обязанность по маркировке предлагается
  возложить на лицо, которое предоставляет возможность использовать большие
  фундаментальные модели ИИ». Охват — и полностью сгенерированный, и
  отредактированный контент (изображения, аудио, видео); формат определит
  правительство; предполагаемое вступление — 1 марта 2027.
  **Статус: внесён, дальнейшего движения в источнике нет.** Номер законопроекта
  в статье не назван. ⚠️ номер не подтверждён.
  [vc.ru, «В Госдуму внесли законопроект об обязательной маркировке
  ИИ-контента»](https://vc.ru/ai/3090020-obyazatelnaya-markirovka-ii-kontenta-v-gosdume),
  публикация ~2026-08-21, проверено 2026-09-20, **пресса**.
- Ранее, **15 апреля 2026**, комитет Госдумы по информполитике **отклонил**
  отдельный законопроект о маркировке ИИ-контента (по сводке поисковой выдачи).
  ⚠️ первоисточник не открывал — факт отклонения требует подтверждения.

### Дипфейки в УК — законопроект № 1288702-8, внесён, НЕ принят
- **Внесён 12 августа 2026.** Предлагает поправку в **статью 63 УК РФ**
  (обстоятельства, отягчающие наказание). Отягчающим предлагается считать
  дословно: «применение ИИ для создания видеозаписей, аудиозаписей, изображений и
  других материалов, имитирующих действия, внешность или высказывания конкретного
  человека»; охватываются и «образы несуществующих лиц с использованием технологий
  искусственного интеллекта». **Статус на 12.08.2026 — опубликован в СОЗД**, то
  есть внесён, не принят.
  [Ведомости, 12.08.2026](https://www.vedomosti.ru/technology/news/2026/08/12/1220651-nakazaniya-za-dipfeiki),
  проверено 2026-09-20, **пресса**.
- По сводке выдачи также обсуждаются поправки в статьи «Клевета», «Мошенничество»,
  «Кража», «Вымогательство», «Мошенничество в сфере компьютерной информации» —
  с санкциями до 400 тыс. руб. штрафа / до 5 лет принудительных работ за
  мошенничество с использованием изображения или голоса потерпевшего, в том числе
  синтезированного. ⚠️ первоисточник не открывал, номер этих поправок не
  подтверждён — **в выводы не берётся**.
- Верховный суд РФ, по сводке, считает более уместным делать дипфейк
  квалифицирующим признаком отдельных составов (мошенничество), а не общим
  отягчающим обстоятельством. ⚠️ первоисточник не открывал.

### Что из этого следует для нашего сценария
1. **Ключевое различие, которое снимает почти весь риск:** все дипфейк-нормы,
   и принятые, и предлагаемые, бьют по **имитации ДРУГОГО человека** и по
   **обману** (мошенничество, клевета, вымогательство). Владелец синтезирует
   **себя**, с собственного согласия, и ничего не выдаёт за чужое. Состава нет
   ни по одной из обсуждаемых конструкций.
2. **Обязанности маркировать по закону РФ на 2026-09 нет** — принятая норма
   добровольная. Но добровольная пометка ничего не стоит и снимает будущий риск,
   если обязательная версия пройдёт к 1 марта 2027.
3. **Реальный юридический край лежит не в дипфейк-праве, а в чужом контенте
   внутри новостей:** чужие лица (ст. 152.1 ГК — охрана изображения гражданина),
   чужие логотипы, чужие кадры. Это обычное авторско-правовое поле, и оно
   не связано с тем, что ведущий синтетический.
4. **Отдельный риск — не закон, а ToS вендоров**: HeyGen/Synthesia/ElevenLabs
   требуют consent-видео/аудио и верификацию; нарушение их правил бьёт по
   аккаунту быстрее любого закона. Детали — в основной секции 4.

### Не найдено / сомнительно (4Б)
- Номер законопроекта об обязательной маркировке (внесён 17.08.2026) — не найден.
- Факт отклонения комитетом 15.04.2026 — только из поисковой сводки, первоисточник
  не открыт.
- Санкции по поправкам в «Мошенничество»/«Клевету» (400 тыс. руб., 5 лет) — только
  из поисковой сводки, номер и статус не подтверждены.
- Позиция Верховного суда — только из поисковой сводки.
- Правовой статус голоса как охраняемого объекта в ГК РФ (аналог ст. 152.1) — в
  этом проходе не проверял, см. основную секцию 4.

### Сверка двух проходов (дополнено после завершения раздела 4)

Оба прохода сошлись; раздел 4 добрал то, чего у меня не было:
- **Номер закона: ФЗ от 26.07.2026 № 243-ФЗ** (публикация 0001202607260003),
  принят Госдумой 08.07.2026, проект № 1271570-8. Вступление — 01.09.2026,
  **статья 9 (маркировка) — с 01.03.2027**. Добровольность подтверждена
  формулировкой статьи: пользователю «обеспечивается возможность разместить
  информационное предупреждение» — обязанность лежит на площадках.
- **Номер законопроекта об обязательной маркировке: № 1317978-8**, внесён
  17.08.2026, дальнейшего статуса нет. (У меня в первом проходе номер был
  не найден — закрыто.)
- **Голос в ГК: законопроект № 718834-8** (ст. 152.3 ГК, внесён 09.2024) получил
  отрицательные отзывы Правительства и Совета по кодификации — **охраны голоса
  как самостоятельного объекта в ГК РФ нет**. (У меня было «не проверял» — закрыто.)
- **Дело Reface — не существует**: поиском решения найти не удалось, считать
  выдумкой брифа.
- **Важная оговорка обоих проходов:** `sozd.duma.gov.ru` не открывался весь
  прогон (ECONNREFUSED). Значит, **все статусы законопроектов идут классом
  «пресса», не «официоз»** — кроме самого ФЗ № 243-ФЗ, у которого есть номер
  публикации на pravo.gov.ru.

**Расхождений между проходами не обнаружено.**


---

## 5. Себестоимость одного ролика 45–60 секунд

Считаем на ежедневном режиме: **30 роликов в месяц по 60 секунд** (месячная
норма — 30 минут готового видео). Все цены ниже — из официальных прайсов,
процитированных в разделах выше; класс источника указан у каждой строки.
Курс не пересчитываю: где вендор считает в долларах, оставляю доллары.

### 5.0. Что вообще стоит денег

| Шаг | Чем делается | Доля в счёте |
| --- | --- | --- |
| 3 новости → сценарий | LLM | ~$0,005 — **ноль** |
| Сценарий → голос | TTS с клоном | центы за ролик + абонплата за право иметь клон |
| Голос → говорящая голова | аватар / липсинк | **почти весь счёт** |
| Склейка, вертикаль, субтитры | ffmpeg локально | **ноль** |
| Публикация | API площадок | **ноль** |

Вывод, который держит весь расчёт: **платим за видео-минуту**. Всё остальное —
шум. Поэтому стеки ниже различаются почти исключительно тем, чем делается лицо.

### 5.1. Самый дешёвый рабочий стек — расчёт

**Вариант «одна подписка»: HeyGen Creator.**
- Дословно с прайса: Creator — «$29/mo» (годовой «$24/mo»), 600 кредитов,
  «Videos up to 30 mins», «1080p video export», водяной знак снят,
  «175+ languages and dialects». [heygen.com/pricing](https://www.heygen.com/pricing),
  2026-09-20, **официоз**.
- Расход Avatar IV, дословно из хелпа: Photo Look — «16 credits per minute»,
  Video Look — «31 credits per minute».
  [help.heygen.com, Avatar IV guide](https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide),
  2026-09-20, **официоз**.
- **Арифметика:** 30 роликов × 1 мин × 16 кредитов = **480 кредитов** из 600.
  Влезает. Голос — встроенный TTS HeyGen (клон голоса на Creator официозом
  **не подтверждён** — ⚠️ проверить до покупки).
- **Итого: $29/мес ÷ 30 = $0,97 за ролик.** С наценкой посредника 10–20 % —
  **$32–35/мес, то есть $1,07–1,17 за ролик**.

**Вариант «модульный»: Hedra + Cartesia.**
- Hedra, дословно с прайса: Creator — «$30/month», «5,400 credits/month»,
  быстрая генерация. [hedra.com/pricing](https://www.hedra.com/pricing), **официоз**.
  Цена за секунду Character 3, дословно: 540p — «2.5¢/second», 720p —
  «5¢/second», 1080p — «6.25¢/second».
  [hedra.com/models/video/hedra/character-3](https://www.hedra.com/models/video/hedra/character-3), **официоз**.
- **Арифметика:** 60 с в 540p = $1,50 по секундной ставке; в кредитах (~3 кр/сек,
  **пресса**) 180 кр/ролик × 30 = 5 400 кр — ровно месячный лимит Creator.
  То есть **$30/мес = 30 роликов = $1,00 за ролик** в 540p. Для 720p кредитов не
  хватит — нужен Professional «$75/month» (14 400 кр).
- Голос: Cartesia, дословно — «Pro — $5/mo · 100K credits … instant voice cloning»
  (**официоз**, раздел 2). **+$5/мес = $0,17 за ролик.**
- **Итого: $35/мес ÷ 30 = $1,17 за ролик.** С посредником — **$39–42/мес**.
- Важное преимущество: Hedra не требует ни съёмки, ни consent-видео — вход это
  **одна фотография** владельца плюс аудиодорожка. Порог входа минимальный.

**Вариант «почти бесплатно»: открытые модели на арендованной GPU.**
- Аренда RTX 4090 в РФ, дословно: «rtx4090-1.8.16.40 | 8 | 16384 | 40 | 1 | 82,76 ₽»
  за час. [immers.cloud/gpu/4090](https://immers.cloud/gpu/4090/), **официоз**.
- При ~5 минутах машинного времени на ролик: **≈ 7 ₽ за ролик**, ≈ 210 ₽/мес
  за тридцать. Плюс TTS открытой моделью — 0 ₽.
- **Но:** лицензии. F5-TTS (лучший открытый русский) — веса «CC-BY-NC»,
  XTTS v2 — CPML, обе **некоммерческие**; чистый по лицензии только Chatterbox
  (MIT), и у него нет русского словаря ударений плюс неудаляемая вотермарка.
  Качество русского липсинка у открытых моделей официозом не подтверждено нигде.
- **Итого: ~$3/мес за 30 роликов**, но это инженерный проект, а не покупка.

### 5.2. Премиум-стек — расчёт

**Вариант «настоящий двойник на аватар-платформе»: HeyGen Pro + ElevenLabs.**
- HeyGen Pro, дословно: «$49/mo» (годовой «$40.75/mo»), 1 000 кредитов,
  «4K video export». Avatar IV **Video Look** — «31 credits per minute», то есть
  1 000 кр ≈ 32 минуты в месяц: ровно тридцать роликов. Это настоящий Digital
  Twin по consent-видео, а не фото-аватар. **Официоз**.
- ElevenLabs Creator, дословно со страницы тарифов — «Creator — $22 First month
  50% off … $11per month · 121k creditsper month … Professional Voice Cloning»
  ([elevenlabs.io/pricing](https://elevenlabs.io/pricing), **официоз**). Это
  минимальный тариф, на котором вообще доступен Professional Voice Clone;
  включённых символов на API — «Creator ($22/mo): 220,000», при нашем расходе
  ~28 500 знаков в месяц объём съедает ~13 % лимита.
  PVC требует минимум 30 минут записи (рекомендуют 2–3 часа), обучение 3–6 часов,
  обязательная голосовая верификация — клонировать разрешено только свой голос.
- **Итого: $49 + $22 = $71/мес ÷ 30 = $2,37 за ролик.** С посредником 10–20 % —
  **$78–85/мес, то есть $2,60–2,84 за ролик**.

**Вариант «максимум правдоподобия»: своё снятое видео + sync.so lipsync-2-pro.**
- Владелец один раз снимает 1–2 минуты себя в кадре. Дальше каждый день машина
  переклеивает артикуляцию под новую дорожку. Лицо **настоящее**, несгенерированное.
- sync.so, дословно: Creator — «$19/month + $0.05 /sec»; по моделям при 25 fps —
  lipsync-2-pro «$0.067 — $0.083/sec». [sync.so/pricing](https://sync.so/pricing),
  [sync.so/docs/models/lipsync](https://sync.so/docs/models/lipsync), **официоз**.
- **Арифметика:** 60 с × $0,067–0,083 = **$4,02–4,98 за ролик**; ×30 =
  $120–149; + $19 тариф + $22 ElevenLabs = **$161–190/мес = $5,37–6,33 за ролик**.
- Дешевле той же дорогой: модель lipsync-2 «$0.04 — $0.05/sec» → $2,40–3,00 за
  ролик; с тарифом Hobbyist «$5/month + $0.05 /sec» (там ролик до 1 минуты —
  ровно наш формат) и ElevenLabs выходит **$99–117/мес ≈ $3,3–3,9 за ролик**.

**Вариант «единственный с официально названным русским»: MiniMax H3.**
- Дословно из карточки модели: «Stable support for 11 languages: Arabic, Chinese,
  English, French, German, Italian, Japanese, Korean, Portuguese, **Russian**, and
  Spanish». [huggingface.co/MiniMaxAI/MiniMax-H3](https://huggingface.co/MiniMaxAI/MiniMax-H3),
  **официоз**. Это единственное место во всём срезе, где русский назван поимённо
  в официальном документе вендора.
- Цена через fal.ai, дословно: «480p: $0.05/second», «768p: $0.08/second»,
  «1080p: $0.16/second», «2K: $0.32/second». [fal.ai/h3-max-lip-sync](https://fal.ai/h3-max-lip-sync), **официоз платформы**.
- **Арифметика:** 60 с в 768p = **$4,80 за ролик**, в 1080p = **$9,60**.
  ×30 = $144 или $288/мес, плюс голос.
- **Край:** один запрос — «5 to 15 seconds», всё сверх обрезается. Ролик 60 с
  собирается из 4–5 кусков со склейкой. Это инженерия, а не кнопка.

### 5.3. Сводная таблица себестоимости

| Стек | Видео за ролик | Голос за ролик | Абонплаты | Итого/мес (30 шт.) | Итого за ролик |
| --- | --- | --- | --- | --- | --- |
| Открытые модели на аренде GPU | ~7 ₽ | 0 | 0 | **~210 ₽ (~$3)** | **~7 ₽** |
| HeyGen Creator (фото-аватар, всё внутри) | в подписке | в подписке | $29 | **$29** | **$0,97** |
| Hedra Creator 540p + Cartesia Pro | в подписке | в подписке | $35 | **$35** | **$1,17** |
| sync.so Hobbyist lipsync-2 + ElevenLabs | $2,40–3,00 | в подписке | $27 | **$99–117** | **$3,3–3,9** |
| HeyGen Pro (Digital Twin 4K) + ElevenLabs | в подписке | в подписке | $71 | **$71** | **$2,37** |
| sync.so lipsync-2-pro + ElevenLabs | $4,02–4,98 | в подписке | $41 | **$161–190** | **$5,4–6,3** |
| MiniMax H3 через fal, 768p + ElevenLabs | $4,80 | в подписке | $22 | **$166** | **$5,5** |
| Captions / Mirage API | $9,00 | — | — | **$270+** | **$9,0+** |

Ко всем западным строкам прибавляется **10–20 % наценки посредника** за платёж
из РФ (раздел 0) — и это не разовая, а ежемесячная надбавка.

### 5.4. Чего в этих цифрах нет
- **Разовые вложения**: консент-видео и обучение аватара (HeyGen — бесплатно в
  рамках слотов тарифа), Professional Voice Clone у ElevenLabs (30 мин — 3 часа
  записи владельца, разово), съёмка базового видео для sync.so (1–2 минуты).
  У Elai это прямые деньги: Selfie Avatar «$199/Annually», Voice Cloning
  «$200/Annually» — при ежедневном режиме это +$33/мес.
- **Перегенерации**: у Hedra в обзорах прямо отмечена «лотерея липсинка» —
  нестабильность между прогонами. Закладывать 20–30 % брака на первых неделях.
- **Стоимость инженерного времени** — в открытом стеке она и есть главная цена.

### 5.5. Добор после раздела 1B: Wan 2.2 S2V — дешевле и без подписки

Найден уже после первого расчёта, меняет картину «открытого» пути.

- **Wan 2.2 S2V-14B (Alibaba)** — настоящая speech-to-video, лицензия дословно
  «Apache 2.0 License», и — ключевое — «The generated video length will
  automatically adjust based on the input audio length»: **ролик 60 секунд
  делается ОДНИМ прогоном**, без нарезки на куски.
  [github.com/Wan-Video/Wan2.2](https://github.com/Wan-Video/Wan2.2), **официоз**.
- **Цена на хостинге, дословно:** fal.ai — «720p: $0.20 per video second»,
  «580p: $0.15 per video second», «480p: $0.10 per video second»
  ([fal.ai](https://fal.ai/models/fal-ai/wan/v2.2-14b/speech-to-video), **официоз
  платформы**). WaveSpeedAI — «$0.15 per 5 seconds (480p)» и «$0.3 per 5 seconds
  (720p)» ([wavespeed.ai](https://wavespeed.ai/models/wavespeed-ai/wan-2.2/speech-to-video),
  **официоз платформы**), то есть $0,03/с и $0,06/с.
- **Арифметика на WaveSpeed:** ролик 60 с в 480p = **$1,80**, в 720p = **$3,60**.
  Тридцать роликов — $54 или $108 в месяц, **без месячной подписки вообще**
  (оплата по факту). На fal те же ролики стоят $6 и $12 — вчетверо дороже,
  fal под эту модель брать незачем.
- **Самостоятельный хостинг:** S2V-14B требует «at least 80GB VRAM» — это
  A100 80G / H100, не RTX 4090. Аренда такой карты в РФ дороже 4090; точную
  ставку в этом пассе не замерял. ⚠️ не найдено.
- **Почему это важно:** Apache 2.0 снимает лицензионную грязь, которой болеют
  открытые русские голоса, а автоподбор длины снимает склейку кусков — главный
  инженерный налог Veo, Kling и MiniMax H3.
- **Чего нет:** русский в документации Wan **не обсуждается вообще** — модель
  ведёт артикуляцию от звуковой волны, поэтому технически проходит, но замеров
  нет. Тот же открытый вопрос, что у sync.so.

**Обновлённая строка в таблицу 5.3:**

| Стек | Видео за ролик | Абонплата | Итого/мес (30 шт.) | Итого за ролик |
| --- | --- | --- | --- | --- |
| Wan 2.2 S2V 480p через WaveSpeed + Cartesia | $1,80 | $5 | **$59** | **$1,97** |
| Wan 2.2 S2V 720p через WaveSpeed + ElevenLabs | $3,60 | $22 | **$130** | **$4,33** |

### 5.6. Добор второй: LatentSync — абсолютный минимум цены (перепроверено лично)

Цифра пришла из раздела 1B, но в самом блоке стояло «фиксированной цены за
секунду не найдено» — поэтому переоткрыл страницу сам, чтобы не тащить в расчёт
неподтверждённое число.

- **LatentSync 1.6 (ByteDance)** — дословно «an end-to-end lip-sync method based
  on audio-conditioned latent diffusion models», лицензия дословно «Apache-2.0
  license», инференс «18 GB with LatentSync 1.6», обучено на «512×512 resolution
  to address blurriness». [github.com/bytedance/LatentSync](https://github.com/bytedance/LatentSync),
  проверено 2026-09-20, **официоз**.
- **Цена на fal.ai — ДОСЛОВНО, проверено лично 2026-09-20:**
  «Up to 40 seconds: $0.20 per video» и «Longer videos: $0.005 per second of
  output video». [fal.ai/models/fal-ai/latentsync](https://fal.ai/models/fal-ai/latentsync),
  **официоз платформы**.
- **Арифметика:** ролик 60 секунд = 60 × $0,005 = **$0,30**. Ролик 40 секунд и
  короче — **$0,20**. Тридцать роликов по 60 с = **$9 в месяц**, без подписки.
- **Вход:** видео (MP4/MOV/WebM/M4V/GIF) с лицом + аудиофайл (MP3/OGG/WAV/M4A/AAC),
  оба по URL. То есть архитектура та же, что у sync.so: **один раз снять базовое
  видео**, дальше каждый день переклеивать артикуляцию.
- **Русский:** поимённо не подтверждён (в README отмечено только улучшение на
  китайском), **но модель работает на признаках Whisper** — то есть ведёт
  артикуляцию от звука, а не от текста, и язык для неё не барьер по конструкции.
  ⚠️ замеров качества русских фонем нет ни у кого; проверяется прогоном.
- **Ограничение:** лицо 512×512. Для вертикального ролика с крупным планом
  головы это приемлемо, для 4K-картинки — нет.

**Это в 3–20 раз дешевле всего остального в срезе:** $0,30 против $0,97 у
HeyGen Creator, $1,00 у Hedra, $2,40–5,00 у sync.so, $4,80 у MiniMax H3,
$9,00 у Captions/Mirage.

**Обновлённая строка в таблицу 5.3:**

| Стек | Видео за ролик | Голос | Абонплата | Итого/мес (30 шт.) | Итого за ролик |
| --- | --- | --- | --- | --- | --- |
| LatentSync через fal + Yandex SpeechKit | $0,30 | ~40 ₽/мес | 0 | **≈ $9,5** | **≈ $0,32** |
| LatentSync через fal + Cartesia Pro (клон голоса) | $0,30 | в подписке | $5 | **$14** | **$0,47** |


---

## 6. Выводы пасса

### Рекомендуемый стек за минимум денег

**≈ $35/мес, ~$1,2 за ролик.** Лицо — Hedra Creator «$30/month» в 540p (вход:
**одна фотография** владельца, ни съёмки, ни consent-видео) или HeyGen Creator
«$29/mo» на фото-аватаре Avatar IV; голос — Cartesia Pro «$5/mo · 100K credits …
instant voice cloning». Сценарий пишет LLM за полкопейки, вертикаль и субтитры —
ffmpeg локально, публикация — своими скриптами через API площадок; оплата обеих
подписок через посредника, +10–20 % сверху.

**Ещё дешевле, но это проект, а не покупка:** открытые модели на арендованной в
РФ RTX 4090 («82,76 ₽» за час) — **≈ 7 ₽ за ролик**, зато лицензии открытых
русских голосов (F5-TTS, XTTS) некоммерческие, а качество русского липсинка
нигде официально не подтверждено.

### Рекомендуемый стек по качеству

**Нижняя планка, ≈ $71/мес, $2,37 за ролик:** HeyGen Pro «$49/mo» — настоящий
Digital Twin по consent-видео, 1 000 кредитов ≈ 32 минуты, экспорт 4K — плюс
ElevenLabs Creator ($22/мес, дословно «Creator — $22 … Professional Voice
Cloning») с Professional Voice Clone (лучший русский клон
из коммерческих; 30 минут записи минимум, обучение 3–6 часов, обязательная
голосовая верификация — клонировать разрешено только свой голос).

**Верхняя планка, ≈ $161–190/мес, $5,4–6,3 за ролик:** владелец один раз снимает
1–2 минуты себя, дальше каждый день sync.so lipsync-2-pro («$0.067 — $0.083/sec»)
переклеивает артикуляцию под новую дорожку ElevenLabs. Лицо при этом **настоящее,
своё** — не сгенерированное, не загруженное в аватар-платформу, без её модерации.
Это самый честный «цифровой двойник» из всех найденных путей.

**Если нужен русский, подтверждённый официально:** MiniMax H3 — единственная
модель среза, где русский назван поимённо в карточке модели вендора («Stable
support for 11 languages: … Russian …»); через fal.ai 768p — «$0.08/second»
= $4,80 за ролик, но один запрос даёт «5 to 15 seconds», то есть ролик собирается
из 4–5 кусков.

### Три развилки, которые надо решить до покупки

1. **Сгенерированное лицо или настоящее.** Аватар-платформа (HeyGen, Hedra) —
   дешевле и проще, но лицо синтезируется. Липсинк поверх своего видео (sync.so) —
   дороже, зато в кадре реальная съёмка владельца.
2. **Один комбайн или сборка из кубиков.** Комбайн (Revid Ultra «$199/month»,
   Auto-Mode workers, автопостинг в YouTube/TikTok/Instagram прямо через API) —
   дороже и без VK/Telegram; сборка из кубиков дешевле втрое и гибче, но её надо
   написать.
3. **Западный SaaS через посредника или свой контур.** Ни один западный сервис
   среза не принимает российские карты — это общий барьер, а не различие между
   ними. Рублями платятся только российские речевые сервисы и аренда GPU.

### Не найдено / сомнительно (сводно по пассу)

**Цены, не подтверждённые официозом:**
- HeyGen, официальная таблица API-ставок: `developers.heygen.com/docs/pricing` —
  404, `heygen.com/api-pricing` — редирект в кабинет за логином. Ставки
  $0,0167–0,0667/сек взяты из вторичных обзоров.
- D-ID: обе официальные страницы прайса не отрисовались, обзоры расходятся между
  собой (Pro $29 vs $29.90; Advanced $196 vs $79.90). «$5.90/min» не подтверждено.
- MiniMax H3 на официальном `platform.minimax.io`: страница прайса H3 не покрывает
  модель, `api-reference/video-generation` — 404. Цена «$0.13 per second at 2K» —
  пресса.
- Цены Whisper/TTS у OpenAI **подтверждены** официозом (переоткрыл сам), цены
  fal.ai на sync-lipsync — только из поисковой выдачи, не переоткрыты.
- gpuindex.ru: даты обновления нет, в подвале «Цены носят справочный характер и
  не являются публичной офертой» — минимум «18,45 ₽/час» брать осторожно.
- VK / T-Bank VoiceKit / MTS Exolve: публичных цен за 1M символов не найдено.
- Welder (единственный найденный российский сервис говорящей головы): цены, API,
  клон лица — не проверял вовсе. **Кандидат на добор следующим пассом.**

**Русский язык, не подтверждённый поимённо вендором:**
- Synthesia, Tavus, Elai, Captions/Mirage, sync.so — везде «30+/75+/175+ языков»
  без списка. У sync.so язык не оговорён в документации **вообще**.
- Качество русской артикуляции у sync.so и у всех открытых моделей — **главный
  открытый вопрос пасса**. Решается только живым тестом на 30-секундном фрагменте,
  до покупки годовых тарифов.

**Право:**
- Номер законопроекта об обязательной маркировке (внесён 17.08.2026) не найден.
- Отклонение комитетом 15.04.2026, санкции по поправкам в «Мошенничество»
  (400 тыс. руб. / 5 лет), позиция Верховного суда — только из поисковых сводок,
  первоисточники не открыты, **в выводы не брались**.
- Правовой статус голоса как охраняемого объекта в ГК РФ — не проверен.

**Прочее:**
- Hedra Character-4 **не существует** — в каталоге и обзорах 2026 только
  Character 3 плюс Hedra Avatar и Omnia.
- Клонирование голоса на HeyGen Creator — официозом не подтверждено; это влияет
  на самый дешёвый расчёт, проверить до покупки.
- Оплата из РФ у Tavus, Elai, sync.so отдельно не проверялась.

### Добор к выводам: Wan 2.2 S2V как «третий путь»

Между «дёшево, но лицо синтетическое» и «дорого, но лицо настоящее» есть третий
вариант, найденный в блоке открытых моделей: **Wan 2.2 S2V-14B** — Apache 2.0,
речь-в-видео, и единственная модель среза, которая делает 60-секундный ролик
**одним прогоном** («The generated video length will automatically adjust based
on the input audio length»). Через WaveSpeedAI — «$0.15 per 5 seconds (480p)»,
то есть **$1,80 за ролик 60 с, без месячной подписки вообще**.

Чем он хорош именно здесь: чистая коммерческая лицензия (в отличие от MiniMax H3
с географическими исключениями и открытых русских голосов на CC-BY-NC), отсутствие
склейки кусков (в отличие от Veo, Kling и H3), оплата по факту (в отличие от
подписочных аватар-платформ). Чем плох: 80 ГБ VRAM для своего хостинга и **полное
молчание документации про русский**.

**Что это меняет в рекомендации:** если владелец готов к сборке из кубиков, путь
«Wan 2.2 S2V 480p + Cartesia Pro» даёт ≈ **$59/мес ($1,97 за ролик)** без
подписочной привязки и без лицензионных вопросов — это разумная середина между
$35 на аватар-платформе и $161–190 на sync.so с настоящим лицом.

### Главный практический вывод: сборку изобретать не надо

Из раздела 3: ровно этот сценарий уже разложен по шагам и лежит **бесплатными
шаблонами в каталоге n8n** (класс — **официоз каталога n8n**, проверено 2026-09-20).
Эталон — шаблон [#8050 «Generate & publish AI news avatar videos with HeyGen and
Blotato»](https://n8n.io/workflows/8050-generate-and-publish-ai-news-avatar-videos-with-heygen-and-blotato/):
Schedule Trigger → RSS Feed Read → AI Agent → OpenAI → HeyGen API → Wait →
Blotato API. Агент «collects fresh AI/LLM news from multiple feeds», выбирает
самую вирусную и пишет «a 30-second script»; HeyGen зовётся так, чтобы
«generate a vertical avatar video (9:16) using your selected `avatar_id`,
`voice_id`»; узлы публикации «preconfigured for TikTok, Instagram, YouTube,
Facebook, etc.».

Есть ещё как минимум шесть таких шаблонов, включая
[#6084](https://n8n.io/workflows/6084-viral-video-generator-heygen-to-tiktok-and-instagram-auto-post-any-content/),
который «запускается ежедневно в 6:00» и публикует сам.

**Под нашу задачу правятся три вещи:** ленты — на русские, промпт агента — «три
новости, 45–60 секунд, по-русски», `voice_id` — русский голос (или ветка «свой
аудиофайл → `audio_url`», если голос делается снаружи клоном). Это работа на
вечер, а не стройка.

**Цена оркестратора:** n8n Starter — дословно «Starter – €20/month (billed
annually)», «2,500 executions/month» ([n8n.io/pricing](https://n8n.io/pricing/),
**официоз**). Тридцать роликов в месяц — это десятки исполнений, тариф берётся
с колоссальным запасом; n8n можно и поднять у себя бесплатно.

**Автопостинг:** Blotato Starter «$29/month», API входит во все платные тарифы;
площадки дословно — «Instagram, TikTok, LinkedIn, Facebook, X (Twitter), Threads,
Bluesky, Pinterest, and YouTube». **VK и Telegram в списке нет** — Telegram
закрывается Bot API в две строки, VK придётся делать своим скриптом.

### Развилка, которая решает цену: свой голос или синтетический ведущий

Это самое важное различие пасса, и оно не про технологию, а про решение владельца.

**Если нужен ЕГО голос** — платим западному вендору за право иметь клон:
ElevenLabs Creator $22/мес (лучший русский клон, PVC), Cartesia Pro $5/мес
(мгновенный клон), Fish ~$11/мес. Оплата только через посредника. Российский
аналог есть, но цена запретительная: Yandex **Brand Voice Lite** — дословно
«Разовый платеж … 9 150 ₽» плюс «Хостинг, один голос, за месяц: 101 666 ₽»,
то есть ~3 390 ₽ за один ролик при ежедневном режиме (**официоз**, раздел 2).

**Если достаточно хорошего синтетического русского голоса** — весь голосовой
вопрос закрывается **Yandex SpeechKit за ~30 ₽/мес российской картой**
(дословно: «Синтез … API v1, за 1 млн символов: 1 342 ₽»; наш расход
~28 500 знаков/мес ≈ 38 ₽). Это лучший русский синтез из всех найденных —
ударения, числительные, интонация — и он вообще не касается платёжного барьера.

**Почему это важнее, чем кажется:** липсинк-движок языка не знает — он ведёт
артикуляцию от звуковой волны. Значит, **«поддержка русского» у видео-вендора
перестаёт быть критерием выбора**, если голос делается отдельно и подаётся
файлом (HeyGen API умеет режим `audio_url`, Hedra и sync.so принимают аудио
по определению). Это снимает главный открытый риск пасса — неподтверждённое
качество русского у sync.so, Wan, Tavus, Elai.

### Публикация: квота YouTube больше не узкое место

- **YouTube Data API**: с июня 2026 `videos.insert` стоит 1 юнит в отдельном
  пуле, квота — **100 загрузок в сутки**. Старая оценка «6 роликов в день»
  устарела (раздел 3). Публикация бесплатна.
- **Telegram Bot API** `sendVideo` — бесплатен, лимит 50 МБ.
- **VK Клипы** (`shortVideo.create`) — по практикам работает, но официальной
  страницы метода найти не удалось, и комментарии у клипа отключены без
  возможности включить. ⚠️ проверять руками.
- **TikTok** — без аудита приложения все посты уходят в приватный режим. Это
  процедура ревью, а не тариф; закладываться до прохождения нельзя.
- Ни один готовый автопостер (Revid, Blotato, Opus Clip) **не умеет VK**;
  Postiz умеет, но у его VK-провайдера открыт баг.

### Итоговая рекомендация одной строкой

**Синтетический русский ведущий, дёшево:** n8n (самохост, бесплатно) → Yandex
SpeechKit (~40 ₽/мес, рублями) → HeyGen API в режиме `audio_url` или Hedra
(фото + своё аудио) → ffmpeg → YouTube + Telegram. **≈ $30–45/мес.**

**Цифровой двойник владельца, качество:** то же самое, но голос — ElevenLabs
Professional Voice Clone ($22/мес), а лицо — HeyGen Pro Digital Twin по
consent-видео ($49/мес) либо sync.so поверх один раз снятого видео.
**≈ $71–190/мес**, плюс 10–20 % посреднику за платёж из РФ.

### Пересмотр «минимального» стека после добора LatentSync

Первая версия рекомендации называла минимумом $35/мес на аватар-платформе.
После добора раздела 1B и личной перепроверки прайса это больше не минимум.

**Настоящий минимум: ≈ $9,5/мес, ≈ $0,32 за ролик.**
Владелец **один раз** снимает базовое видео себя в кадре (1–2 минуты, «говорящая
поза»). Дальше ежедневно: n8n самохостом (бесплатно) читает русские RSS-ленты →
LLM пишет сценарий на три новости (полкопейки) → Yandex SpeechKit озвучивает
по-русски (~40 ₽/мес, российской картой) → **LatentSync на fal.ai переклеивает
артикуляцию** (дословно «Longer videos: $0.005 per second of output video» →
$0,30 за ролик 60 с) → ffmpeg делает вертикаль и вшивает субтитры → публикация
через YouTube Data API (100 загрузок в сутки) и Telegram Bot API — бесплатно.

Что здесь хорошо: лицо **настоящее, своё**; лицензия модели Apache-2.0; русский
голос — лучший из доступных и оплачивается рублями; никакой подписки на
аватар-платформу и никакой её модерации. Единственный платёж за границу —
$9/мес на fal, и это pay-as-you-go, а не ежемесячная привязка.

Что здесь плохо: лицо в 512×512 (крупный план — ок, 4K — нет); голос
синтетический, а не клон владельца (клон добавляется за $5/мес Cartesia или
$22/мес ElevenLabs); и **качество русской артикуляции никем не замерено** —
это проверяется одним тестовым прогоном на 30 секундах до того, как строить
пайплайн.


---

## 7. Финальный свод пасса (читать, если больше ничего не читать)

### Три стека, от дешёвого к дорогому

| | Минимум | Середина | Премиум |
| --- | --- | --- | --- |
| **Лицо** | своё снятое видео + LatentSync на fal («$0.005 per second of output video») | HeyGen Creator «$29/mo» фото-аватар Avatar IV («16 credits per minute») | HeyGen Pro «$49/mo» Digital Twin 4K, либо sync.so lipsync-2-pro («$0.067 — $0.083/sec») поверх своего видео |
| **Голос** | Yandex SpeechKit, синтетический русский («за 1 млн символов: 1 342 ₽») | Cartesia Pro «$5/mo … instant voice cloning» | ElevenLabs Creator $22/мес, Professional Voice Clone |
| **Сборка** | n8n самохост (бесплатно) + ffmpeg | n8n Starter «€20/month» или самохост | то же |
| **Публикация** | YouTube Data API (100 загрузок/сутки) + Telegram Bot API, бесплатно | то же, либо Blotato «$29/month» | то же |
| **Цена/мес (30 роликов)** | **≈ $9,5** | **≈ $35** | **$71–190** |
| **Цена за ролик** | **≈ $0,32** | **≈ $1,17** | **$2,37–6,33** |
| **Чьё лицо в кадре** | настоящее, своё | сгенерированное по фото | настоящее (sync.so) либо Digital Twin |
| **Оплата из РФ** | $9 на fal через зарубежную карту; голос — рублями | всё через посредника, +10–20 % | всё через посредника, +10–20 % |

### Правовой вердикт: делать можно, с одной галочкой

1. **YouTube — галочку «altered or synthetic content» ставить.** Синтезированное
   реалистичное лицо попадает под «Makes a real person appear to say or do
   something they didn't do» (**официоз**). При этом клон СВОЕГО голоса прямо
   вынесен в корзину «minor edits», где раскрытие не требуется: дословно
   «Cloning one's own voice to create voice overs or dubs». То есть галочка нужна
   из-за лица, не из-за голоса.
2. **Meta (Instagram/Facebook/Threads) — ярлык ставить.** Дословно: «We'll require
   people to use this disclosure and label tool when they post organic content with
   a photorealistic video or realistic-sounding audio that was digitally created or
   altered, and we may apply penalties if they fail to do so» (**официоз**).
3. **TikTok — ярлык AIGC ставить.** Промаркированный AIGC остаётся монетизируемым;
   без ярлыка — авто-метка, понижение в выдаче или удаление. Запрет площадки
   касается подобия ЧУЖИХ людей, наш случай туда не попадает.
4. **Россия — обязанности маркировать нет.** **ФЗ от 26.07.2026 № 243-ФЗ**
   (публикация 0001202607260003; принят Госдумой 08.07.2026, проект № 1271570-8).
   Маркировка **добровольная**: пользователю «обеспечивается возможность разместить
   информационное предупреждение», а обязанность лежит на площадках с суточной
   аудиторией РФ около 500 тыс. Охват — только аудио и видео, тексты не входят.
   Закон в силе с 01.09.2026, **статья 9 (маркировка) — с 01.03.2027**.
   Законопроект об **обязательной** маркировке — № 1317978-8, внесён 17.08.2026,
   **не принят**. Охраны голоса как самостоятельного объекта в ГК РФ **нет**:
   законопроект № 718834-8 (ст. 152.3 ГК) получил отрицательные отзывы
   Правительства и Совета по кодификации.
5. **Уголовный риск — не наш.** Законопроект № 1288702-8 (внесён 12.08.2026,
   **не принят**) делает отягчающим обстоятельством «применение ИИ для создания
   … материалов, имитирующих действия, внешность или высказывания конкретного
   человека». Все дипфейк-нормы, и принятые, и предлагаемые, бьют по имитации
   **другого** человека и по обману. Владелец синтезирует себя, с собственного
   согласия, ничего не выдавая за чужое — состава нет.
6. **Где настоящий риск:** (а) чужие лица, логотипы и кадры внутри новостей —
   обычное авторское право и ст. 152.1 ГК, к синтетике отношения не имеет;
   (б) **ToS вендоров** — HeyGen/Synthesia/ElevenLabs требуют consent-видео/аудио
   и голосовую верификацию, и блокировка аккаунта наступит быстрее любого закона;
   (в) TikTok без аудита приложения кладёт все посты через API в приватный режим.

7. **Самый крупный денежный риск в этой затее — не ИИ, а реклама.** С 01.09.2025
   реклама на заблокированных ресурсах (Instagram) запрещена — штраф по ст. 14.3
   КоАП; плюс `erid`/ЕРИР на любой призыв купить (10–30 тыс. ₽ физлицу по ч. 15).
   То есть рекламный слой из инстаграм-версии ролика надо вырезать, и это дороже
   любого вопроса про синтетику.
8. **Страховка на будущее:** записаться в YouTube likeness detection (открыт всем
   18+ с мая 2026) и держать локальный архив своего аватара — чем раньше у
   владельца появится публичный эталон с датой, тем легче потом доказать «а вот
   это не я».

**Вердикт одной строкой: делать можно, раскрытие ставить на всех трёх западных
площадках, в РФ раскрытие пока добровольное — но поставить всё равно дешевле,
чем потом доказывать. Красная линия одна: ноль синтеза ЧУЖИХ лиц и голосов
спикеров новости.**

### Единственный тест, который надо сделать до любых покупок

Во всём срезе **нет ни одного замера качества русской артикуляции**. Все «русский
работает» — это либо маркетинговое «any language», либо вывод из того, что модель
слушает Whisper. Поэтому порядок такой:

1. Записать 30 секунд своего базового видео и 30 секунд русской дорожки.
2. Прогнать через LatentSync на fal — это стоит **$0,20** (тариф «Up to 40 seconds»).
3. Посмотреть на рот. Устроило — строить минимальный стек за $9,5/мес.
   Не устроило — те же 30 секунд через sync.so lipsync-2 (~$1,50) и MiniMax H3
   768p (~$2,40), выбрать по картинке.

Двадцать центов решают вопрос, на который весь этот срез ответить не может.
