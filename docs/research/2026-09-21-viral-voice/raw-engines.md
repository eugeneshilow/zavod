# raw-engines — движки русского синтеза с характером, на 2026-09-21

Сырьё без редактуры, канон — синтез (README пасса).
Пасс: 2026-09-21. Метод: официальные доки и прайсы вендоров + пресса +
практики. Исполнитель: opus-5 (разведчик).

Что проверяется у каждого движка: **русский подтверждён вендором ·
управление эмоцией/стилем · создание голоса по описанию · клон по
образцу · цена · API · оплата из РФ · лицензия · что говорят практики
про русский.**

---

## 1. ElevenLabs — эталон выразительности, но РФ-оплата сломана

### Модели и русский (официальные доки)

Источник: https://elevenlabs.io/docs/models, проверено 2026-09-21.

- **Eleven v3** — **«70+ languages»**, русский в списке явно:
  **«Russian (rus)»**.
- **Eleven v3 Conversational** — те же 70+, латентность **«~280ms†»**.
- **Multilingual v2** — **29 языков**, русский в списке: **«Russian»**.
- **Flash v2.5** — **32 языка** (языки Multilingual v2 + **«Hungarian,
  Norwegian & Vietnamese»**), латентность **«~75ms†»**,
  **«50% lower price per character»**.
- **Flash v2** — **только английский**.

Вывод по русскому: подтверждён вендором в v3, Multilingual v2 и
Flash v2.5.

### Управление эмоцией: аудио-теги v3

Источник: https://elevenlabs.io/docs/best-practices/prompting/eleven-v3,
проверено 2026-09-21. Теги ставятся прямо в текст квадратными скобками.

- Голосовые: `[laughs]`, `[laughs harder]`, `[starts laughing]`,
  `[wheezing]`, `[whispers]`, `[sighs]`, `[exhales]`, `[sarcastic]`,
  `[curious]`, `[excited]`, `[crying]`, `[snorts]`, `[mischievously]`.
- Эмоции: `[happy]`, `[sad]`, `[angry]`, `[appalled]`, `[annoyed]`,
  `[thoughtful]`, `[surprised]`.
- Паузы и дыхание: `[short pause]`, `[long pause]`,
  `[exhales sharply]`, `[inhales deeply]`, `[muttering]`,
  `[chuckles]`, `[clears throat]`.
- Эффекты: `[gunshot]`, `[applause]`, `[clapping]`, `[explosion]`,
  `[swallows]`, `[gulps]`.
- Экспериментальные: `[strong X accent]`, `[sings]`, `[woo]`, `[fart]`.

**Дословные правила текста (важно для ремесла, дублируется в
raw-craft):**
- **«Ellipses (...) add pauses and weight»**
- **«Capitalization increases emphasis»**
- **«Standard punctuation provides natural speech rhythm»**
- **«Eleven v3 does not support SSML break tags. Use audio tags,
  punctuation (ellipses), and text structure to control pauses and
  pacing with v3.»**
- **«Text structure strongly influences output with v3. Use natural
  speech patterns, proper punctuation, and clear emotional context for
  best results.»**

### Цена (официальный прайс)

Источник: https://elevenlabs.io/pricing, проверено 2026-09-21.

| План | Цена/мес | Кредиты/мес | коммерция |
|---|---|---|---|
| Free | **$0** | **10 000** | **не включена** |
| Starter | **$6** | **30 000** | **включена** |
| Creator | **$22** (первый месяц $11) | **121 000** | + professional voice cloning |
| Pro | **$99** | **600 000** | 44.1kHz PCM via API, 192 kbps |
| Scale | **$299** | **1.8M** | 3 seats, 3 Professional Voice Clones |
| Business | **$990** | **6M** | 10 seats, 10 clones |

**Дословно про расход кредитов: «Text to Speech 1 credit per
character; Speech to Text 330 credits per minute; Dubbing 2,000
credits per minute (automatic with watermark), 3,000 (automatic
without watermark)».**

Арифметика под наш кейс (расчёт мой, не цитата): ролик 60 с при
110 словах/мин ≈ 110 слов ≈ **~700 знаков** русского текста ≈ 700
кредитов. План Creator ($22 / 121 000 кредитов) даёт
**~170 роликов в месяц**; Starter ($6 / 30 000) — **~42 ролика**.
То есть при «одна новость в день» хватает **самого дешёвого платного
плана с коммерческой лицензией ($6/мес)**.

### Оплата из РФ — ГЛАВНЫЙ СТОПОР

Источник: vc.ru, «ElevenLabs в России 2026: как пользоваться сервисом,
выбрать подписку и оплатить доступ»,
URL: https://vc.ru/services/2976323-elevenlabs-v-rossii-kak-polzovatsya-servisom-i-vybrat-podpisku
Проверено 2026-09-21 (пресса, не вендор).
**Дословно из выдачи: «с конца 2025 года официальный сайт ElevenLabs
недоступен с российских IP-адресов, и оплата российскими картами не
проходит».** Практический обход, который продают посредники, — VPN +
зарубежная карта или реселлеры (elevenlabs.com.ru, gptrf.ru,
vlex-ai.io и пр.). ⚠️ Реселлеры — не вендор; их цены и легальность
в этом срезе НЕ проверялись.

### Что говорят практики про русский ElevenLabs

- Habr, «70 языков и нейросеть-актёр: чем удивил ElevenLabs v3»,
  URL: https://habr.com/ru/amp/publications/916350, проверено
  2026-09-21. Языков **«более чем 70»** (было 33), покрытие — до 90%
  населения планеты. Дословная оговорка: **«Правда, с надежностью на
  всех языках пока могут быть нюансы»**. Отдельной оценки русского в
  статье НЕТ (отрицательный результат).
- Афиша Daily (исторический контекст качества русского у ElevenLabs):
  «Нейросеть ElevenLabs запустила автоперевод роликов на русский.
  Результат похож на дубляж из 90-х»,
  URL: https://daily.afisha.ru/news/81004-neyroset-elevenlabs-zapustila-avtoperevod-rolikov-na-russkiy-rezultat-pohozh-na-dublyazh-iz-90-h/
  ⚠️ Это про dubbing, старый материал; для нашего кейса **«дубляж из
  90-х» — это скорее ПЛЮС**, ровно та эстетика.

---

## 2. Yandex SpeechKit — наш текущий движок; потолок по характеру виден

### Русские голоса и амплуа (официальные доки)

Источник: https://aistudio.yandex.ru/docs/ru/speechkit/tts/voices
(редирект с yandex.cloud/ru/docs/speechkit/tts/voices), проверено
2026-09-21. Все перечисленные — только `ru-RU`.

**Мужские:**

| голос | амплуа (роли) | API |
|---|---|---|
| **filipp** | **— (амплуа нет)** | v1, v3 |
| **ermil** | neutral — `neutral`, joyful — `good` | v1, v3 |
| **zahar** | neutral — `neutral`, joyful — `good` | v1, v3 |
| **alexander** | neutral — `neutral`, joyful — `good` | v3 |
| **kirill** | neutral — `neutral`, **strict — `strict`**, joyful — `good` | v3 |
| **anton** | neutral — `neutral`, joyful — `good` | v3 |
| **madi_ru** | — | v1, v3 |

**Женские (для полноты):** jane (`neutral`/`good`/`evil`), omazh
(`neutral`/`evil`), dasha, julia, lera, masha, **marina — есть
`whisper`**, saule_ru, zamira_ru, zhanar_ru, yulduz_ru.

**Ключевой вывод (диагноз нашей проблемы):** у SpeechKit на русском
**весь набор мужских амплуа — это `neutral` / `good` / `strict`**.
Нет ни одного амплуа класса «рассказчик», «шёпот», «усталый»,
«ироничный» для мужского голоса (`whisper` есть только у женской
marina). Наш текущий `ermil` + `good` + скорость 1.25 — это буквально
**«диктор в приподнятом настроении, ускоренный»**, то есть ровно
противоположность эталону («низкий, спокойный, медленный»).
Характер здесь берут не амплуа, а **скорость и тон SSML** — потолок
низкий по конструкции.

### Цена (официальный прайс)

Источник: https://aistudio.yandex.ru/docs/ru/speechkit/pricing,
проверено 2026-09-21.

- **API v1 — за 1 млн знаков: «1 342 ₽» / «6 710 ₸» /
  «10.99999824 $».**
- **API v3 — за запрос (единица = 250 знаков): «0,1626 ₽» / «0,813 ₸» /
  «0,0013327867 $».** Дословная оговорка доков: запрос на 500 знаков
  стоит 2 единицы.
- **Brand Voice Call Center — за запрос: «0,1626 ₽».**
- **Brand Voice Lite — разовое создание голоса: 9 150 ₽ / 45 750 ₸ /
  $74.999988; ежемесячный хостинг первого голоса: «101 666 ₽» /
  «508 330 ₸» / «833.32773552 $».**

Арифметика под наш кейс (расчёт мой): ролик ~700 знаков = 3 единицы
v3 ≈ **0,49 ₽ за ролик**, ~15 ₽/мес при ролике в день. Практически
бесплатно.
**Но Brand Voice (единственный способ получить СВОЙ характерный голос
у Яндекса) — 101 666 ₽/мес хостинга.** Для канала «одна новость в
день» это не вариант.

### Итог по SpeechKit

- Русский: ✅ родной, лучший на рынке по ударениям и числам.
- Эмоция/стиль: ⚠️ только три амплуа у мужских голосов + SSML-скорость/тон.
- Голос по описанию: ❌ нет.
- Клон по образцу: ⚠️ только Brand Voice, **101 666 ₽/мес**.
- Оплата из РФ: ✅ штатно, рубли.
- Лицензия: ✅ коммерческая по оферте Yandex Cloud.

---

## 3. ElevenLabs Voice Design — голос по текстовому описанию

Источник: https://elevenlabs.io/docs/cookbooks/voices/voice-design,
проверено 2026-09-21.

- Суть: голос создаётся **из текстового описания**; API отдаёт
  несколько превью, ты выбираешь и сохраняешь в библиотеку.
- **Дословный пример промпта из доков: «A massive evil ogre speaking
  at a quick pace. He has a silly and resonant tone.»**
  Разбор по частям: **персонаж/возраст** («massive evil ogre») ·
  **тон** («silly and resonant») · **темп** («quick pace»).
- Модель в гайде: **`eleven_multilingual_ttv_v2`**.
- Лимитов на длину описания и число превью доки не называют
  (отрицательный результат).

**Что это значит для нас:** это ровно механизм «сделай мне низкий
спокойный рассказчик с плоской интонацией» — описанием, без образца
чужого голоса и без юридических вопросов клонирования.

---

## 4. Fish Audio (S2 / S2.1-Pro) — БЕСПЛАТНАЯ современная модель с тегами

### Модели и русский

Источник: https://docs.fish.audio/developer-guide/models-pricing/models-overview
+ https://fish.audio/s2/ (через поисковую выдачу), проверено 2026-09-21.

- Модели: **S2.1-Pro, S2.1-Pro Free, S2-Pro, S1** (+ ASR transcribe-1).
- Языки: **S2.1-Pro — «83 languages»**, **S2-Pro — «80+ languages»**,
  **S1 — 13 языков**.
- ⚠️ **Край доков:** в списке языков **русский явно назван только у
  S1** («Russian» в списке из 13). У S2/S2.1 доки дают только число
  «83 languages» без списка. Поисковая выдача утверждает, что
  **«Russian is included as a Tier 2 language, and S2.1-Pro supports
  83 languages, including Russian»** — но это вторичный источник,
  дословной цитаты со страницы вендора не получено. **Русский у S2
  считать вероятным, но НЕ подтверждённым вендорской цитатой.**
- Именование: по выдаче — **«As of February 28, 2026, OpenAudio S1 has
  been officially succeeded by the Fish Audio S2 (s2-pro) model»**,
  то есть бренда «OpenAudio S2» не существует, есть **Fish Audio S2**.

### Управление эмоцией

- По выдаче с fish.audio/s2/: **«Using simple [tag] syntax, you can
  precisely embed emotional instructions at any position in the text»**,
  **«15,000+ Unique Tags Supported»**; примеры тегов — **`[laugh]`,
  `[whispers]`, `[super happy]`**. Это самая гранулярная система тегов
  из найденных.

### Цена (официальный прайс)

Источник: https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits,
проверено 2026-09-21.

| модель | цена дословно |
|---|---|
| **s2.1-pro-free** | **«$0.00 / M UTF-8 bytes»** |
| s2.1-pro | «$15.00 / M UTF-8 bytes» |
| s2-pro | «$15.00 / M UTF-8 bytes» |
| s1 | «$15.00 / M UTF-8 bytes» |
| voice-design-1 | **«$0.01 / successful API request»** |
| transcribe-1 / -pro | «$0.36 / audio hour» |

**Дословная мерка объёма: «1M UTF-8 bytes is approximately 180,000
English words, or about 12 hours of speech».**
⚠️ Важный край для русского: **кириллица в UTF-8 — 2 байта на букву**,
значит русский текст съедает байты вдвое быстрее английского. Наш
ролик ~700 знаков ≈ **~1400 байт** ≈ $0,021 на платной модели.
На **s2.1-pro-free — $0**.

Лимиты параллелизма: Starter (< $100 оплачено) — **5 запросов**,
Elevated (≥ $100) — 15, High Volume (≥ $1000) — 50.

Оплата из РФ: ❌ не проверялось; сервис американо-китайский, карты РФ
почти наверняка не пройдут (предположение, не факт).

---

## 5. Cartesia Sonic 3 — есть параметр эмоции `calm` и замедление

Источник: https://docs.cartesia.ai/api-reference/tts/tts, проверено
2026-09-21.

- Модели: **sonic-3.6, sonic-3.5, sonic-3, sonic-latest** (sonic-2 в
  этих доках уже не числится).
- Русский: ✅ явно в списке — **«en, fr, de, es, pt, zh, ja, hi, it,
  ko, nl, pl, ru, sv, tr»** + региональные варианты вроде **«ru-RU»**.
- **Эмоция — отдельный параметр со значениями: «neutral, calm, angry,
  content, sad».** Дословная оговорка доков: **«If omitted, the model
  interprets the emotional subtext of the transcript.»**
- **Скорость: «0.6x to 1.5x»**; громкость **«0.5x to 2.0x»**.
- Клон по образцу: в этих доках **не описан** (отрицательный
  результат); API принимает voice id / voice object.
- Цена: в этих доках **нет**.

**Для нас:** `calm` + speed 0.7–0.8 — это ровно «спокойный медленный
рассказчик» одним вызовом, без разметки. Самый простой способ получить
нужный характер параметрами, а не промптом.

---

## 6. Hume Octave — голос ИЗ ОПИСАНИЯ, русский подтверждён

Источник: https://dev.hume.ai/docs/text-to-speech-tts/overview,
проверено 2026-09-21.

- Дословно про суть: **«Octave TTS is the first text-to-speech system
  built on LLM intelligence. Octave *understands* the text it speaks,
  both emotionally and semantically.»**
- **Голос по описанию (Voice Design):** просишь **«a patient,
  empathetic counselor»** или **«a dramatic medieval knight»** — система
  **«instantly creates a fitting voice»**.
- **Русский подтверждён вендором:** Octave 2 (preview) поддерживает
  **«English, Japanese, Korean, Spanish, French, Portuguese, Italian,
  German, Russian, Hindi, Arabic»** — русский назван явно.
- **«Acting instructions»** (инструкции актёрской подачи) помечены как
  **coming soon для Octave 2 (preview)** — на 2026-09-21 деталей нет.
- Цена: на этой странице **нет** (отрицательный результат).

---

## 7. MiniMax Speech 2.x — эмоции `calm` и `whisper`, русский в списке

Источник: https://platform.minimax.io/docs/api-reference/speech-t2a-async-create,
проверено 2026-09-21.

- Модели: **speech-2.8-hd, speech-2.8-turbo, speech-2.6-hd,
  speech-2.6-turbo, speech-02-hd, speech-02-turbo, speech-01-hd,
  speech-01-turbo**.
- Русский: ✅ явно в списке 39 языков — дословно
  **«Chinese, Chinese,Yue, English, Arabic, Russian, Spanish, French,
  Portuguese, German, Turkish, Dutch, Ukrainian, …»**.
- **Эмоции — параметр со значениями дословно: «happy, sad, angry,
  fearful, disgusted, surprised, calm, fluent, whisper»**; оговорка:
  **`fluent` и `whisper` доступны только для отдельных версий моделей**.
- Клон по образцу: ✅ упомянуты **«cloned voices»** наряду с системными
  и AI-generated.
- Цена: в этих доках **нет**.

**Для нас:** `calm` и `whisper` — два готовых режима ровно нашего
характера.

---

## 8. Gemini TTS — голоса с готовыми характерами, стиль обычным текстом

Источник: https://ai.google.dev/gemini-api/docs/speech-generation,
проверено 2026-09-21.

- Модели TTS: **Gemini 3.1 Flash TTS Preview, Gemini 2.5 Flash Preview
  TTS, Gemini 2.5 Pro Preview TTS**. Все три — одно- и многоголосые.
- **Русский подтверждён вендором:** в списке поддерживаемых языков
  назван **«Русский»**, всего **90+ языков**.
- **Стиль задаётся естественным языком прямо в промпте.** Дословный
  пример из доков: **«Say in an spooky whisper: 'By the pricking of my
  thumbs...Something wicked this way comes'»**; для диалога —
  **«Make Speaker1 sound tired and bored, and Speaker2 sound excited
  and happy»**.
- **30 встроенных голосов, каждый с характеристикой.** Полный список
  дословно: Zephyr (Bright), Puck (Upbeat), Charon (Informative),
  Kore (Firm), Fenrir (Excitable), Leda (Youthful), Orus (Firm),
  Aoede (Breezy), Callirrhoe (Easy-going), Autonoe (Bright),
  Enceladus (Breathy), Iapetus (Clear), Umbriel (Easy-going),
  Algieba (Smooth), Despina (Smooth), Erinome (Clear),
  **Algenib (Gravelly)**, Rasalgethi (Informative), Laomedeia (Upbeat),
  **Achernar (Soft)**, Alnilam (Firm), **Schedar (Even)**,
  **Gacrux (Mature)**, Pulcherrima (Forward), Achird (Friendly),
  **Zubenelgenubi (Casual)**, Vindemiatrix (Gentle), Sadachbia (Lively),
  **Sadaltager (Knowledgeable)**, Sulafat (Warm).
- Цена: на этой странице **нет** (отрицательный результат).

**Для нас:** жирным помечены кандидаты под «низкий спокойный
рассказчик»: **Gacrux (Mature)**, **Algenib (Gravelly)**,
**Schedar (Even)**, **Sadaltager (Knowledgeable)**, **Achernar (Soft)**.
Плюс стиль можно дописать словами в том же промпте.

---

## 9. OpenAI gpt-4o-mini-tts — стиль инструкцией, но русский не приоритет

Источник: https://developers.openai.com/api/docs/guides/text-to-speech
(редирект с platform.openai.com), проверено 2026-09-21.

- Модели: **`gpt-4o-mini-tts`** (новейшая, самая надёжная),
  **`tts-1`** (ниже задержка), **`tts-1-hd`** (выше качество).
- **Параметр `instructions`** — управление подачей обычным текстом.
  Дословный пример из доков: **«Speak in a cheerful and positive
  tone.»** Доки говорят, что так задаются **accent, emotional range,
  intonation, speed, tone** и прочие качества голоса.
- Голоса (13): **alloy, ash, ballad, coral, echo, fable, nova, onyx,
  sage, shimmer, verse, marin, cedar**; доки рекомендуют
  **`marin` и `cedar`** как лучшие по качеству. У `tts-1`/`tts-1-hd` —
  подмножество из 9.
- **Язык — ВАЖНАЯ ОГОВОРКА ВЕНДОРА:** модель **«generally follows the
  Whisper model in terms of language support»**, 60+ языков, НО
  **«voices are currently optimized for English»**. То есть русский
  формально работает, но вендор сам предупреждает: голоса заточены под
  английский (характерный акцент/ударения — ожидаемый риск).
- Цена: на этой странице **нет**.

---

## 10. SaluteSpeech (Сбер) — единственный РФ-движок с ПРЯМЫМ управлением высотой

### Голоса (официальные доки)

Источник: https://developers.sber.ru/docs/ru/salutespeech/guides/synthesis/voices,
проверено 2026-09-21.

| имя | код | пол | язык |
|---|---|---|---|
| Наталья | Nec_24000 / Nec_8000 | Ж | русский |
| **Борис** | **Bys_24000 / Bys_8000** | **М** | русский |
| Марфа | May_24000 / May_8000 | Ж | русский |
| **Тарас** | **Tur_24000 / Tur_8000** | **М** | русский |
| Александра | Ost_24000 / Ost_8000 | Ж | русский |
| **Сергей** | **Pon_24000 / Pon_8000** | **М** | русский |
| Kira | Kin_24000 / Kin_8000 | Ж | английский |

Доки отмечают: **синтез английской речи доступен только для Kira**.
Мужских голосов — три: **Борис, Тарас, Сергей**.

### SSML — вот где характер

Источник: https://developers.sber.ru/docs/ru/salutespeech/guides/synthesis/ssml,
проверено 2026-09-21.

- **`<paint>` — «Управление тоном, интонацией, скоростью и
  громкостью», атрибуты `pitch`, `slope`, `speed`, `loudness`.**
  Это **прямое управление ВЫСОТОЙ голоса на стороне движка** —
  у Яндекса такого нет. (⚠️ точные допустимые значения атрибутов не
  добыты: страница `.../ssml/paint` отдала 404 — см. «Не найдено».)
- **`<break time="200ms">` / `<break strength="weak">`** — паузы.
  **Это ровно наш инструмент для 0,3–0,6 с между фразами.**
- **Ударение — апостроф `'` после ударной гласной** (только русский).
- **`*` перед словом — «Выделение слова интонацией»**.
- **`<voice mode>` — «Управление эмоциями» (только русский)**
  (⚠️ список режимов не добыт — см. «Не найдено»).
- `<say-as>` (аббревиатуры, даты, числительные, только русский),
  `<sub alias>`, `<extra.background-audio>` (фоновые звуки!),
  `<extra.fulldate>`.
- Требование: всю разметку обернуть в `<speak>`, заголовок
  **`Content-Type: application/ssml`**.
- Лимиты: синхронный синтез — **до 4 000 знаков** с пробелами и
  разметкой; асинхронный — **до 1 000 000 знаков**. Форматы:
  **WAV16, PCM16, OPUS**. Мультиязычный синтез — **12 языков** любым
  голосом.

### Цена

⚠️ Официальная страница тарифов (developers.sber.ru/docs/ru/salutespeech/tariff)
отдала только оглавление. **Цифра из поисковой выдачи (вторичный
источник, НЕ подтверждена вендорской цитатой): синтез — «186 рублей за
1 000 000 символов» (0,186 ₽ за 1000 знаков, с НДС); минимальный
платёж — «600 рублей в месяц», но при нулевом использовании месяц
бесплатен.** Для физлиц есть бесплатный тариф Freemium. Проверять по
`.../tariffs/legal-tariffs` и `.../tariffs/individual-tariffs`.

Оплата из РФ: ✅ рубли, Сбер. Лицензия: коммерческая по оферте.

---

## 11. Silero — локально и бесплатно, НО лицензия запрещает коммерцию

Источник: https://github.com/snakers4/silero-models, проверено
2026-09-21.

- Русские голоса: **`aidar`, `baya`, `kseniya`, `xenia`, `eugene`**
  (`eugene` — с v5_3_ru и новее).
- Частоты: **8000, 24000, 48000** Гц для всех русских v5.
- **Дословно про ударения: «Russian-only models support automated
  stress and homographs.»** — автоматическая простановка ударений и
  разрешение омографов. Это сильная сторона именно для русского.
- **«V5 models support SSML.»**
- **ЛИЦЕНЗИЯ — СТОПОР. Дословно: «All of the models are published
  under the main repo license (i.e. CC-NC-BY) except for the `base`
  cis-tts models, which are under MIT.»** CC-NC-BY = **NonCommercial**,
  то есть монетизируемый канал под этой лицензией — нарушение.
  Коммерческий путь — только платная лицензия Silero Enterprise
  (в этом пассе не проверялась).

---

## 12. Открытые модели — Chatterbox выигрывает по лицензии и русскому

### Chatterbox (Resemble AI) — лучший открытый кандидат

Источник: https://github.com/resemble-ai/chatterbox, проверено
2026-09-21.

- **Русский подтверждён явно в списке языков multilingual-модели:
  «Arabic (ar) • Danish (da) • German (de) • Greek (el) • English (en)
  • Spanish (es) • Finnish (fi) • French (fr) • Hebrew (he) •
  Hindi (hi) • Italian (it) • Japanese (ja) • Korean (ko) •
  Malay (ms) • Dutch (nl) • Norwegian (no) • Polish (pl) •
  Portuguese (pt) • Russian (ru) • Swedish (sv) • Swahili (sw) •
  Turkish (tr) • Chinese (zh)»** — 23 языка.
- **Лицензия — MIT** (коммерция разрешена).
- **Два параметра характера, ровно под наш случай:**
  - **`cfg_weight`** — «Controls adherence to the prompt. Lowering it
    (around 0.3) produces **slower, more deliberate pacing**;
    the default is 0.5.» ← **вот наш «медленный рассказчик»**;
  - **`exaggeration`** — «Increases expressiveness and drama. Higher
    values (0.7+) speed up speech; the default is 0.5.» ← держать
    НИЗКИМ для плоской интонации.
- Клон по образцу: **zero-shot с ~10-секундного референса**
  (`your_10s_ref_clip.wav`).
- Практики (вторичный источник, findskill.ai / localaimaster.com,
  проверено 2026-09-21): Chatterbox **«preferred over ElevenLabs
  63.75% of the time»** (в другом обзоре — 65,3%). ⚠️ Это блог-обзоры,
  не рецензируемый бенч; цифру считать маркетинговой.

### Остальные открытые — лицензии и русский

Источники: github-страницы + обзоры localaimaster.com,
findskill.ai, texttolab.com, codesota.com; проверено 2026-09-21.
⚠️ Ниже лицензии — из обзоров (вторичный источник), кроме Chatterbox
и Silero; перед использованием сверять с LICENSE репозитория.

- **Kokoro** — permissive (Apache), безопасна для коммерции по обзорам;
  русский в обзорах **не подтверждён** (отрицательный результат).
- **F5-TTS** — **CC-BY-NC 4.0, НЕкоммерческая**. Стоп.
- **IndexTTS-2** — «more restrictive license (non-commercial without
  contact)». Стоп без письма авторам.
- **XTTS v2 (Coqui)** — репозиторий TTS под **MPL-2.0**, НО обзоры
  пишут про отдельную **Coqui Public Model License: «for personal
  projects only»**. Сам README репо говорит только про **«ⓍTTSv2 is
  here with 16 languages»** — списка языков и русского на главной
  странице **нет** (отрицательный результат). Проект Coqui закрыт
  как компания; поддержки нет.
- **GPT-SoVITS, CosyVoice 3, Higgs Audio, VibeVoice, Qwen3-TTS,
  Echo-TTS, Step Audio EditX** — существуют и собраны в одном
  ComfyUI-наборе **TTS-Audio-Suite**
  (https://github.com/diodiogod/TTS-Audio-Suite, 11 движков).
  ⚠️ Русский и лицензии по каждому в этом пассе **НЕ проверялись**.

---

## 13. Что говорят практики про РУССКИЙ (дословные цитаты)

### Разбор шести сервисов (klerk.ru, 03.09.2026)

Источник: https://www.klerk.ru/blogs/era2/707334/, «Озвучка текста
нейросетью: какие ИИ-голоса звучат живо на русском в 2026 году»,
дата статьи — **3 сентября 2026**, проверено 2026-09-21.
⚠️ **Предупреждение о смещении:** блог размещён под брендом ERA2 и
даёт лучшую оценку именно ERA2 Voice — читать как рекламный разбор,
но конкретные претензии к конкурентам полезны.

Сравниваются: **ERA2 Voice, iVox Studio, ElevenLabs, Murf.ai,
Microsoft Azure AI Speech, Amazon Polly.**

- **ElevenLabs про русский, дословно: «на сложном русском тексте
  ошибается в омографах и ударениях в фамилиях»** — требует ручной
  правки. Это ровно та болезнь, которую называл и автор «Зазеркалья»
  («неверные ударения»).
- **ERA2 Voice** — сильная сторона в предобработке: **«текст проходит
  через слой нормализации — числа разворачиваются в слова,
  аббревиатуры помечаются как побуквенные или слитные»**.
- **Murf.ai: «Русский язык — слабое место»**, признаки —
  **«плоская интонация и слипшееся перечисление»**.
- **Amazon Polly** звучит **«совершенно неживо»**.
- **Главный вывод статьи дословно:** сервисы без адаптации под русский
  звучат **«как робот с хорошей дикцией»**.

### Второй разбор (DTF, 12.12.2025)

Источник: https://dtf.ru/neuralart/4529050-luchshie-neyroseti-dlya-ozvuchki-teksta-i-video-besplatno,
дата статьи — **12.12.2025**, проверено 2026-09-21.
⚠️ Тоже похоже на рекламный материал ERA2/iVox.

- Про ElevenLabs дословно: **«Очень реалистичные голоса, включая
  русский»**.
- Про iVox дословно: **«нормально читает русский, без странного
  „робо-акцента“»**.
- **Ключевой совет по ремеслу дословно: «Итоговое звучание зависит от
  пунктуации и структуры предложений»** — то есть главный рычаг
  «живости» у русского TTS **не движок, а текст**.

---

## 14. Сводная таблица под НАШ кейс (60 с в день, ~700 знаков)

Колонка «характер» = насколько просто получить «низкий спокойный
неспешный рассказчик» без бубна.

| движок | русский от вендора | как задаётся характер | голос по описанию | клон | цена за наш ролик | оплата из РФ | лицензия |
|---|---|---|---|---|---|---|---|
| **ElevenLabs v3** | ✅ «Russian (rus)» | аудио-теги в тексте + Voice Design | ✅ Voice Design | ✅ | ~700 кредитов ≈ **$0,13** (Creator) | ❌ карты РФ не проходят | ✅ с $6 плана |
| **Fish Audio S2.1-Pro Free** | ⚠️ 83 языка, русский подтверждён только вторично | `[tag]` в тексте, 15 000+ тегов | ✅ voice-design-1 ($0,01/запрос) | ✅ | **$0,00** | ❌ (предположение) | ⚠️ не проверено |
| **Cartesia Sonic 3.6** | ✅ `ru`, `ru-RU` | параметр `emotion: calm` + `speed 0.6–1.5` | ❌ | ⚠️ не в доках | цена не найдена | ❌ (предположение) | ⚠️ не проверено |
| **Hume Octave 2** | ✅ «Russian» в списке | промпт-описание голоса; acting instructions — coming soon | ✅ ключевая фича | ⚠️ | цена не найдена | ❌ (предположение) | ⚠️ не проверено |
| **MiniMax Speech 2.8** | ✅ «Russian» в списке 39 | `emotion: calm / whisper` | ⚠️ AI-generated voices | ✅ | цена не найдена | ⚠️ китайский, не проверено | ⚠️ |
| **Gemini 2.5/3.1 Flash TTS** | ✅ «Русский», 90+ | стиль обычным текстом в промпте + 30 голосов с характерами | ⚠️ через промпт | ❌ | цена не найдена | ❌ (предположение) | ⚠️ |
| **OpenAI gpt-4o-mini-tts** | ⚠️ 60+ языков, но **«voices are currently optimized for English»** | параметр `instructions` текстом | ❌ | ❌ | цена не найдена | ❌ | ✅ |
| **Yandex SpeechKit (наш)** | ✅ родной | 3 амплуа (`neutral`/`good`/`strict`) + SSML скорость/тон | ❌ | Brand Voice **101 666 ₽/мес** | **≈0,49 ₽** | ✅ | ✅ |
| **SaluteSpeech** | ✅ родной | **SSML `<paint pitch slope speed loudness>`** + `<voice mode>` + `<break>` | ❌ | YourVoice (цена не найдена) | ≈**0,13 ₽** (186 ₽/млн, вторично) | ✅ | ✅ |
| **Silero** | ✅ + автоударения | SSML | ❌ | ❌ | **$0** локально | ✅ | ❌ **CC-NC-BY, коммерция запрещена** |
| **Chatterbox (MIT)** | ✅ «Russian (ru)» | `cfg_weight≈0.3` (медленнее) + низкий `exaggeration` | ❌ | ✅ 10 с референса | **$0** локально | ✅ | ✅ **MIT** |
| F5-TTS | ⚠️ | — | ❌ | ✅ | $0 | ✅ | ❌ CC-BY-NC |
| IndexTTS-2 | ⚠️ | — | ❌ | ✅ | $0 | ✅ | ❌ non-commercial |
| XTTS v2 | ⚠️ 16 языков, список не найден | — | ❌ | ✅ | $0 | ✅ | ❌ «personal projects only» (вторично) |
| Kokoro | ❌ русский не подтверждён | — | ❌ | ❌ | $0 | ✅ | ✅ Apache (вторично) |

---

## Не найдено / сомнительно (raw-engines)

1. **Цены Cartesia, Hume, MiniMax, Gemini TTS, OpenAI TTS** — на
   страницах доков, которые удалось открыть, прайсов нет. Нужен
   отдельный проход по `/pricing` каждого вендора.
2. **Допустимые значения `pitch / slope / speed / loudness` у
   SaluteSpeech `<paint>`** — страница `.../ssml/paint` отдала **404**.
   Это критично: именно этот тег даёт прямое управление высотой.
   Искать в `/rest/sync-general` или в полном описании SSML.
3. **Список режимов `<voice mode>` SaluteSpeech** (управление
   эмоциями, только русский) — не добыт.
4. **Официальный прайс SaluteSpeech** — страница `/tariff` отдала
   только оглавление; цифра «186 ₽ за 1 000 000 символов» и «минимум
   600 ₽/мес» взята из поисковой выдачи, **вендорской цитатой не
   подтверждена**.
5. **Русский у Fish Audio S2 / S2.1-Pro** — вендор даёт только «83
   languages» без списка; русский явно назван только у старой S1.
   Утверждение «including Russian» — вторичный источник.
6. **Оплата из РФ** проверена по прессе только для ElevenLabs
   («с конца 2025 года … оплата российскими картами не проходит»,
   vc.ru). Для Fish/Cartesia/Hume/MiniMax/Gemini/OpenAI — **не
   проверялась**, в таблице стоят предположения.
7. **Silero Enterprise** (платная коммерческая лицензия) — условия и
   цена не проверялись; для нас это единственный легальный путь к
   Silero.
8. **Русский и лицензии CosyVoice 3, GPT-SoVITS, Higgs Audio,
   VibeVoice, Qwen3-TTS, Kokoro** — не проверялись поимённо.
9. **Цифры «Chatterbox beats ElevenLabs 63.75% / 65.3%»** — из
   блог-обзоров (findskill.ai, localaimaster.com), не из
   рецензируемого бенча. Маркетинг, не факт.
10. **Оба «разбора TTS для русского» (klerk.ru, DTF) — вероятно
    рекламные** материалы ERA2/iVox. Их похвалы читать со скидкой;
    претензии к конкурентам — как гипотезы к проверке ушами.
11. **ERA2 Voice и iVox** — российские сервисы, всплывшие в обоих
    разборах; в этом пассе по официальным сайтам **не проверялись**
    (цены, API, лицензия). Возможный кандидат — проверить отдельно.
12. **ElevenLabs Voice Design и модель `eleven_multilingual_ttv_v2` —
    работает ли она по-русски** (описание голоса на английском,
    речь на русском) — доки прямо не говорят. Проверять руками.
