# Сырьё без редактуры · угол: TTS-движки кроме ElevenLabs · 2026-09-21

Выход агента-разведчика дословно, канон — синтез в [raw.md](raw.md).
(Агент работал в read-only режиме, файл записан диспетчером без правок.)

## ВЫЖИМКА

1. **Ни один движок кроме ElevenLabs не имеет параметра «тянуть последний слог».** Прямого рычага нет нигде — только косвенные: глобальный `speed`, инструкция-промпт, SSML-теги пауз.
2. **Chatterbox — единственный с документированной связкой «параметр → темп»**: «Higher `exaggeration` tends to speed up speech; reducing `cfg_weight` helps compensate with slower, more deliberate pacing» (HF/GitHub). Русский есть (Multilingual v3, 23 языка). НО issue #183: «Changing the CFG, as suggested helps only a little» — рычаг слабый.
3. **Клонирование манеры (темп/ритм) почти нигде не переносится надёжно.** Жёсткое доказательство: Qwen3-TTS issue #290 — замедление референса на 20% не изменило выход вообще. Это ключевой негативный факт для всей гипотезы «короткий образец решит задачу».
4. **Топ-1 по управляемости: Cartesia Sonic 3.x** — числовой `speed` 0.6–1.5 *и* инлайн-SSML `<speed ratio="1.5"/>` посреди фразы + word- И phoneme-level таймкоды в одном API. Русский поддержан нативно.
5. **Топ-2: Fish Audio S2.1-pro** — `prosody.speed` 0.5–2.0, `temperature`, теги `[break]`/`[long-break]`, русский в 13 языках, и TTS-stream-with-timestamps (word-level, `text/start/end`).
6. **Топ-3: Hume Octave 2** — `speed` 0.5–2.0 + `trailing_silence` + word-level таймстемпы; русский есть в Octave 2. Но `description` (акт. инструкции) — пока только Octave 1 (англ/исп).
7. **Ноль пауз (run-on)**: единственный надёжный приём — текстовый (убрать точки/запятые, склеивать фразы), плюс `<break time="0ms"/>` там, где SSML жив (Inworld, Google Cloud). У MiniMax/Yandex теги умеют только *добавлять* паузу, не убирать.
8. **Промптом рулят** Gemini 3.1 Flash TTS (теги `[slow]`/`[fast]`/`[pause=0.5]`, 200+ тегов) и OpenAI gpt-4o-mini-tts (`instructions` со структурой Voice Affect/Tone/Pacing/Pauses). Официальные формулировки «без пауз, тяни слог» в доках НЕТ — практиков с рабочими формулировками не нашёл.
9. **Таймкоды для монтажа**: Cartesia (word+phoneme), Fish (word), Inworld (word+char, но «Timestamps currently support English... other languages experimental»), Hume (word), OpenAI — только через `whisper-1` + `timestamp_granularities=["word"]`. Gemini/MiniMax/Yandex — нет. **MFA имеет русскую акустическую модель (v2_0_0, v2_0_0a, v3_1_0)** — это лучший путь к фонемным границам для монтажа.
10. **Рекомендация агента**: не искать «тянущий» движок, а строить пайплайн **Cartesia/Fish (speed ~0.9, текст без точек) → MFA russian v3_1_0 → точечная растяжка последнего фонемного сегмента**. Проблема отвергнутой растяжки была в инструменте (atempo на слове), а не в подходе: по фонемным границам нужен WSOLA/Rubber Band на *гласном сегменте*.

## ПОДРОБНО ПО ДВИЖКАМ

### Cartesia Sonic 3 / 3.6
- Параметры запроса: `model_id`, `transcript`, `voice`, `language`, `locale`, `accent`, `normalization`, `output_format`, `pronunciation_dict_id`, `generation_config {volume, speed, emotion}` — https://docs.cartesia.ai/api-reference/tts/bytes (проверено 2026-09-21)
- `speed`: «Range is `0.6` to `1.5` inclusive», «any double-precision floating-point value in that range»; `volume` 0.5–2.0; эмоции: `neutral, calm, angry, content, sad, scared` + всего 66 значений — https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion (2026-09-21)
- **Инлайн-SSML внутри транскрипта**: `<speed ratio="1.5"/>`, `<volume ratio="1.5"/>`, `<emotion value="angry"/>`, `[laughter]`. **`<break>` и `<prosody rate>` НЕ поддерживаются** (там же).
- Важная оговорка вендора: «Sonic interprets these parameters as guidance rather than strict adjustments, to ensure natural speech» — т.е. `speed` не гарантирован.
- Таймкоды: `add_timestamps` — «If `true`, the server will return timestamp events containing word-level timing information»; поля `words`, `start`, `end`. Есть и `add_phoneme_timestamps` → `phonemes/start/end` — https://docs.cartesia.ai/api-reference/tts/sse (2026-09-21). **Это уникально: фонемные таймкоды из коробки.**
- Русский: нативно, «Sonic-3 supports 42 languages including Russian» — https://www.cartesia.ai/languages/russian (2026-09-21)
- Клонирование: «You can get started with 10 seconds of one speaker's audio, and Sonic 3.6 and newer can use up to 60 seconds to better retain the speaker's accent» — https://www.cartesia.ai/product/voice-cloning. Заявлено сохранение **акцента**, про темп/ритм — не заявлено.
- Цена: кредитная система, Startup 1.25M кредитов / $39 мес (annual), Scale 8M / $239 мес.

### Fish Audio S1 / S2 / S2.1-pro
- Параметры (дословно) — https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech (2026-09-21):
  - `temperature` (0–1, default 0.7): «Controls expressiveness. Higher is more varied, lower is more consistent.»
  - `top_p` (0–1, default 0.7): «Controls diversity via nucleus sampling.»
  - `prosody.speed` (0.5–2.0, default 1): «Speaking rate multiplier.»
  - `prosody.volume` (dB), `prosody.normalize_loudness`
  - `chunk_length` (100–300): «Text segment size for processing.»
  - `latency` (low/balanced/normal), `normalize`, `reference_id`, `references` (inline zero-shot, требует MessagePack)
- Теги: S1 — круглые скобки `(excited)`, S2 — квадратные `[happy]`, причём «Bracket cues can use natural language descriptions and are not limited to a fixed set of tags». Паузы: `[break]` (короткая), `[long-break]` (длинная). Тегов темпа/протяжности нет. «All 13 supported languages can use emotion markers» — https://docs.fish.audio/developer-guide/core-features/emotions (2026-09-21)
- Потенциально полезный тег из S1-списка: `(in a hurry tone)` — ближайшее к «слитно, без пауз».
- Русский: да, 13 языков включая Russian — https://fish.audio/blog/introducing-s1/ (2026-09-21)
- Таймкоды: отдельный эндпоинт TTS-stream-with-timestamps, **word-level**, поля `text`, `start`, `end`, плюс `chunk_audio_offset_sec`. Модели: `s1`, `s2-pro`, `s2.1-pro`, `s2.1-pro-free`, `drama-3-preview` — https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech-stream-with-timestamps (2026-09-21)
- Цена: Fish Audio S2 Pro ~$15/1M символов (сводка silma.ai, 08.2026). Есть `s2.1-pro-free`.

### MiniMax Speech-02 / 2.5 / HD
- `voice_setting`: `speed` (0.5–2), `vol` (0–10), `pitch` (−12…+12), `emotion` (happy, sad, angry, fearful, disgusted, surprised, calm, fluent, whisper), `english_normalization` — https://platform.minimax.io/docs/api-reference/speech-t2a-async-create (2026-09-21)
- `language_boost` включает **Russian** (полный enum там же).
- Паузы (дословно): «customize pauses by adding markers in the form `<#x#>`, where `x` is the pause duration in seconds. Valid range: `[0.01, 99.99]`... Pause markers must be placed between speakable text segments and cannot be used consecutively.» — **только добавляет паузы, убрать нельзя**.
- Клонирование: «duration from 10 seconds to 5 minutes and a file size up to 20 MB»; опциональное prompt audio «less than 8 seconds» — https://platform.minimax.io/docs/guides/speech-voice-clone (2026-09-21)
- Цена: ~$40–50/1M символов (сводка silma.ai 08.2026) — дорого.

### Hume Octave 1 / 2
- Параметры: `description` (acting instructions), `speed` «non-linear scale from 0.5 (much slower) to 2.0 (much faster)», `trailing_silence` (секунды) — https://dev.hume.ai/docs/text-to-speech-tts/acting-instructions (2026-09-21)
- Дословно про speed: «changes are not proportional to the value provided—for example, setting speed to `2.0` will make speech faster but not exactly twice as fast.»
- Дословно про длину инструкции: «Short instructions work best—aim for no more than 100 characters.» — **это убивает идею длинного стилевого промпта**.
- Паузы в тексте: `[pause]`, `[long pause]`.
- Примеры инструкций (дословно): «whispering, hushed» / «urgent, panicked» / «warm, inviting» / «sarcastic».
- **Критично**: «The `description` field for acting instructions is available for Octave 1 only. Support for `description` with Octave 2 is coming soon.» А русский есть только в Octave 2. **Т.е. русский + актёрские инструкции одновременно — НЕДОСТУПНО.**
- Таймкоды: word-level через streaming (подтверждено интеграцией Pipecat — https://docs.pipecat.ai/api-reference/server/services/tts/hume).

### Gemini TTS (3.1 Flash TTS)
- Официальные примеры промптов (дословно, https://ai.google.dev/gemini-api/docs/speech-generation, 2026-09-21):
  - «Say in an spooky whisper: "By the pricking of my thumbs... Something wicked this way comes"»
  - «Make Speaker1 sound tired and bored, and Speaker2 sound excited and happy»
- Инлайн-теги: `[slow]`, `[fast]`, `[pause=0.5]`, `[short pause]`, `[long pause]`, `[whispers]`, `[shouting]` — 200+ тегов. «Tags like `[slow]`, `[fast]`, and `[pause]` let you shape the timing of delivery» — https://www.mindstudio.ai/blog/gemini-3-1-flash-tts-controllable-text-to-speech (2026-09-21)
- Правила: «All inline tags must be enclosed in square brackets... Ensure tags are separated by text or punctuation to avoid system errors. Do not place two tags directly next to each other.»
- Русский: `ru` в списке 70+ языков BCP-47. Работают ли теги на русском — **в доках не сказано**.
- SSML: не поддерживается. Таймкоды: нет.
- Цена: ~$20/1M audio tokens, аудио метрится «25 tokens per second» (≈ $36.6/1M символов).

### OpenAI gpt-4o-mini-tts / gpt-realtime
- Управление только через `instructions`. Официальный пример: `"Speak in a cheerful and positive tone."`; управляемые аспекты: «Accent, Emotional range, Intonation, Impressions, Speed of speech, Tone, Whispering» — https://developers.openai.com/api/docs/guides/text-to-speech (2026-09-21)
- **Развёрнутый официальный пример из OpenAI Cookbook** (дословно, https://cookbook.openai.com/examples/gpt_with_vision_for_video_understanding, 2026-09-21):
  - «Voice Affect: Calm, measured, and warmly engaging; convey awe and quiet reverence for the natural world.»
  - «Tone: Inquisitive and insightful, with a gentle sense of wonder and deep respect for the subject matter.»
  - «Pacing: Even and steady, with slight lifts in rhythm when introducing a new species or unexpected behavior; natural pauses to allow the viewer to absorb visuals.»
  - «Emotion: Subtly emotive—imbued with curiosity, empathy, and admiration without becoming sentimental or overly dramatic.»
  - «Pauses: Insert thoughtful pauses before introducing key facts or transitions ("And then... with a sudden rustle..."), allowing space for anticipation and reflection.»
- Это готовый каркас: поля **Pacing:** и **Pauses:** можно инвертировать под задачу. Официальных примеров «без пауз / тяни слог» нет.
- Нет параметра `speed` у gpt-4o-mini-tts (только у tts-1/tts-1-hd).
- Русский: входит в список, «generally follows the Whisper model», 50+ языков.
- Таймкоды: **у TTS нет**. Только через транскрипцию: `response_format="verbose_json"` + `timestamp_granularities=["word"]`, модель **`whisper-1`** — https://developers.openai.com/api/docs/guides/speech-to-text (2026-09-21)
- Цена: $0.60/1M text input + $12/1M audio output tokens.

### Chatterbox (Resemble, open-source) — ПОДРОБНО
- Дословно из Tips (https://huggingface.co/ResembleAI/chatterbox и https://github.com/resemble-ai/chatterbox, 2026-09-21):
  - «The default settings (`exaggeration=0.5`, `cfg=0.5`) work well for most prompts.»
  - «Try lower `cfg` values (e.g. `~0.3`) and increase `exaggeration` to around `0.7` or higher.»
  - «Higher `exaggeration` tends to speed up speech; reducing `cfg_weight` helps compensate with slower, more deliberate pacing.»
  - «If the reference speaker has a fast speaking style, lowering `cfg_weight` to around `0.3` can improve pacing.»
- Диапазоны: `exaggeration` 0.0–1.0+, `cfg_weight` 0.0–1.0. **Параметра speed/rate НЕТ.**
- Реальность из issues: #183 «Speech Speed control Request» — клон «too fast», и «Changing the CFG, as suggested helps only a little»; просят «finer control of speech speed/rate control would be much welcome». Открыт, без ответа — https://github.com/resemble-ai/chatterbox/issues/183 (2026-09-21)
- Turbo-версия: «CFG, min_p and exaggeration are not supported by Turbo version and will be ignored» — https://github.com/devnen/Chatterbox-TTS-Server/issues/100. **Для нашей задачи нужен НЕ turbo.**
- Русский: да, Chatterbox Multilingual v3 (500M, MIT), 23 языка, Russian включён. Русскоязычные практики подтверждают клонирование с 3–5 с — https://vc.ru/services/2255842-chatterbox-multilingual-klonirovanie-golosov (2026-09-21)
- Цена: бесплатно, локально. Доступность из РФ: полная (веса на HF).

### Inworld TTS / Realtime TTS-2
- SSML-паузы: `<break time="1s" />` / `<break time="1000ms" />`, максимум 10 с. **Про `0ms` в доках не сказано** — https://docs.inworld.ai/docs/tts/capabilities/pause-controls (2026-09-21)
- Теги: `[happy]`, `[sad]`, `[whisper]`, `[cough]`, `[sigh]`, `[breathe]`, `[clear_throat]`; плюс free-form указания на английском.
- IPA-произношение поддерживается инлайн.
- Таймкоды: word-level И character-level. **Ограничение дословно: «Timestamps currently support English for both streaming and non-streaming, with other languages experimental.»** — https://inworld.ai/blog/tts-custom-pronunciation-timestamps-websockets (2026-09-21)
- Русский: есть (200+ языков у Realtime TTS-2). Клонирование от 5–15 с.

### Yandex SpeechKit v3
- TTS-разметка (дословный список, https://aistudio.yandex.ru/docs/en/speechkit/tts/markup/tts-markup, 2026-09-21):
  - `+` — ударение (**только русский**)
  - `sil<[t]>` — пауза в мс, максимум 7000
  - `<[tiny]>`, `<[small]>`, `<[medium]>`, `<[large]>`, `<[huge]>` — контекстные паузы
  - `<[accented]>` или `**слово**` — акцент (**только русский**)
  - `[[фонемы]]` — фонетическая транскрипция
  - Оговорка: «pauses set at the beginning and end of a sentence will be ignored»
- `speed` — есть в `hints` запроса v3 (пример `"speed": 1.1`) — https://github.com/yandex-cloud/cloudapi/blob/master/yandex/cloud/ai/tts/v3/tts.proto (2026-09-21)
- **Нет** `<prosody rate>` / `<prosody duration>`, нет способа растянуть слог.
- Доступность из РФ: единственный движок с нативной оплатой в рублях. Тарификация: «request shorter than 250 characters is charged as a single billing unit, 250-500 characters as two units».
- Минус: ограничение 250 символов / 24 с на запрос по умолчанию — ломает «слитность» между кусками.

### Rime (Arcana v2/v3, Mistv2)
- Параметры: `speed_alpha` (default 1.0), `reduce_latency`, `pause_between_brackets`, `phonemize_between_brackets`.
- **Русского НЕТ** (English, Spanish, French, German, Hindi; Arcana v3 — 11 языков, русского в подтверждённом списке нет) — https://www.rime.ai/resources/arcana-v3 (2026-09-21). **Исключаем.**

### PlayHT / PlayAI Play 3.0 mini / PlayDialog
- `language` enum, 30+ языков. Русский **явно не подтверждён**.
- Параметры `speed`/`temperature` в публичной документации не найдены.
- Низкий приоритет.

### Открытые модели
- **XTTS v2 (Coqui)**: 17 языков включая `ru`, есть `speed`. Старая, качество русского посредственное — https://docs.coqui.ai/en/latest/models/xtts.html
- **F5-TTS**: zero-shot от ~10 с + транскрипт; русского в базовой модели нет. Дословно: «does not rely on fine-grain prosody control but a reference encoder that learns to transfer acoustic and stylistic features automatically»; «does not support separate reference inputs for timbre and prosody».
- **IndexTTS2**: **русского НЕТ**. Duration control: «The first autoregressive TTS model with precise synthesis duration control... **This functionality is not yet enabled in this release.**» В 2.5 — `duration_factor` (0.5x–2.0x). Механизм идеально подошёл бы, но русского нет — https://github.com/index-tts/index-tts (2026-09-21)
- **Higgs Audio v2 / TTS 3**: v2 — 50+ языков, клон от 3–10 с; TTS 3 — «100+ languages», «inline tags can change emotion, style, speed, pitch, pauses, and sound effects mid-utterance». Русский явно не подтверждён — https://www.boson.ai/blog/higgs-tts-3 (2026-09-21)
- **Qwen3-TTS (0.6B/1.7B, релиз 22.01.2026)**: русский в 10 языках, `speed`, клон от ~3 с. **Ключевой негативный факт** — issue #290 «Speaking Rate Ignored in Clone»: «I am using a reference audio, cloned voice and the output for what should be approximately one minute of output is **ALWAYS** 41-48 seconds»; замедление референса на 20% не помогло; закрыт как «not planned» — https://github.com/QwenLM/Qwen3-TTS/issues/290 (2026-09-21)

### Форсированное выравнивание (для монтажа)
- **MFA**: русские акустические модели — `Russian MFA acoustic model v2_0_0`, `v2_0_0a`, `v3_1_0` — https://mfa-models.readthedocs.io/en/latest/acoustic/Russian/index.html (2026-09-21). Даёт **фонемные и словные** границы в TextGrid. Единственный путь к точной границе гласного в последнем слове.
- **WhisperX**: word-level, но issue #1247 «Word-level timestamps from WhisperX are inaccurate compared to Montreal Forced Aligner (MFA)» — https://github.com/m-bain/whisperX/issues/1247 (2026-09-21). Для растяжки конкретной гласной точности не хватит.

## НЕ НАЙДЕНО / СОМНИТЕЛЬНО

- **Нигде не найдено параметра или тега «elongate / sustain / drawl последний слог»** — ни в одном из 15+ проверенных API.
- **Работают ли инлайн-теги Gemini (`[slow]`, `[pause=]`) на русском** — в доках не сказано, примеры только английские.
- **Цена Cartesia в пересчёте на 1M символов** — вендор публикует только кредиты.
- **Русский у PlayAI Play 3.0 / PlayDialog** — не подтверждён официальным списком.
- **Русский у Higgs Audio v2 / TTS 3** — явного списка с Russian не нашёл.
- **Rime Arcana v3 полный список 11 языков** — не нашёл; русский вероятно отсутствует, но 100 % подтверждения нет.
- **Yandex SpeechKit v3 + SSML** — какие версии API принимают SSML, не указано; наличие `<prosody>` не подтверждено.
- **Цены** взяты из агрегатора silma.ai (август 2026), не из первоисточников.
- **Доступность из РФ** проверена только для OpenAI. Chatterbox/XTTS — локально, проблемы доступа нет.
- **Формулировки практиков «говори без пауз, тяни последний слог» для Gemini/OpenAI** — не нашёл ни одной.

## ТОП-3 КАНДИДАТА (оценка агента)

1. **Cartesia Sonic 3.6** — `speed` 0.6–1.5 + инлайн `<speed ratio="0.6"/>` прямо перед последним словом + фонемные таймкоды в том же ответе. Русский нативный. Риск: «Sonic interprets these parameters as guidance rather than strict adjustments».
2. **Chatterbox Multilingual v3 (НЕ turbo, локально)** — документированная связь `cfg_weight`↓/`exaggeration`↑ с темпом, бесплатно, без проблем оплаты из РФ, клон от 3–5 с. Риск: issue #183 — рычаг слабый, нет speed.
3. **Fish Audio S2.1-pro** — `prosody.speed` 0.5–2.0 + `temperature` + `[break]`/`[long-break]` + word-таймкоды + русский + бесплатный тариф. S2 принимает свободные описания в скобках.

**Не рекомендует**: Rime (нет русского), IndexTTS2 (нет русского + duration control отключён), Hume (русский и инструкции взаимоисключающи), Yandex (лимит 250 символов рвёт слитность), MiniMax (дорого, теги только добавляют паузы), PlayHT (русский не подтверждён).

**Стратегический вывод агента**: гипотеза «короткий образец клонирует манеру» опровергнута для Qwen3-TTS напрямую (#290) и для Chatterbox косвенно (#183) — клоны переносят тембр, но темп/ритм нормализуют к усреднённому.
