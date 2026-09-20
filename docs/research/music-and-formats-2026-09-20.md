# Срез: музыка и форматы для faceless-машины Reels

Пасс: 2026-09-20 (МСК). Метод: поиск + чтение первоисточников (Meta for Developers, Meta/Instagram Help & Legal, страницы лицензий сервисов). У каждого факта — URL и дата проверки; класс источника помечен: [офиц] — сайт/доки вендора, [пресса], [практики], [данные вендора аналитики]. Канон пасса — research.md. Технический край всего пасса: `curl` к developers.facebook.com и к справкам Meta блокируется, часть страниц (цены, help-центр) рендерится JS и боту не отдаётся — всё непрочитанное честно вынесено в §5.

---

## 1. Музыка

### 1а. Трек из библиотеки Instagram через Graph API — ТЕПЕРЬ МОЖНО

Главное изменение против всех гайдов 2023–2025: с мая 2026 у Meta есть **Instagram Audio API**. Раньше музыку надо было вшивать в файл, теперь есть оба пути.

[офиц] «Instagram Audio API», https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/ (проверено 2026-09-20), дословно:

> «The Instagram Audio API allows you to retrieve and search for audio — both original sounds from Instagram Reels and music — and attach them to Reels at creation time. This API is available on the Instagram Platform with Facebook Login.»

Механика (там же): поиск — `GET /ig_audio` с `audio_type` (`music` | `original_sound`), `user_id`, необязательным `search_query`; метаданные — `GET /{ig-audio-id}`; публикация — `POST /{ig-user-id}/media` с объектом `audio_configuration` (`audio_id`, `audio_volume` 0–100, `video_volume` 0–100). Пример из доки дословно:

```
curl -X POST "https://graph.facebook.com/v22.0/{ig-user-id}/media" \
  -d "media_type=REELS" -d "video_url={video-url}" \
  -d 'audio_configuration={"audio_id":"587784541076604","audio_volume":80,"video_volume":50}' \
  -d "access_token={access-token}"
```

Требования дословно: «An Instagram Business or Instagram Creator account, A Facebook Page connected to that account, A registered Facebook App with the following permissions granted via Facebook Login: instagram_basic, instagram_content_publish, A valid User access token.»

Ограничения дословно (секция Limitations): «Music availability: This API returns audio that has been authorized for third party use. Note that the available selection may vary from what appears in the native app. Platform support: This API is only available on the Instagram API with Facebook Login. It is not supported on the Instagram API with Instagram Login. Reel previews: Previewing a Reel with attached audio is not supported. The Reel will be published as configured. Filter constraints: When retrieving audio, if no search query is provided, trending audio is returned.»

Следствия для машины: (1) каталог API — подмножество каталога приложения, «тот самый трендовый звук» не гарантирован; (2) обязателен путь Facebook Login + связанная FB-страница — ветка Instagram Login эту фичу не даёт; (3) предпросмотра нет — что собрали, то и уехало.

[пресса] Дата открытия: «Scheduling Reels with audio became available as of May 18, 2026» — со страниц вендоров-планеров (help.metricool.com/how-to-add-audio-to-your-instagram-reels-from-metricool-2o2ks; пресс-релиз Enji, https://www.barchart.com/story/news/3444506/enji-launches-instagram-audio-for-scheduled-reels-a-capability-most-social-media-schedulers-still-dont-offer), проверено 2026-09-20. В доке Meta даты нет — держать уровнем «пресса».

Альтернатива, работающая всегда: музыка вшита в файл. Тогда `audio_configuration` не нужен, звук становится «original audio» аккаунта, и его можно один раз назвать параметром `audio_name` (§4).

### 1б. Правила Meta про музыку для бизнес-аккаунта

[офиц] Meta Music Guidelines, https://www.facebook.com/legal/music_guidelines (2026-09-20), дословно: «You are solely responsible for the content you publish or promote, including any music in such content.» · «If you use video or other content in our Products to enable music listening for yourself or others, your content may be blocked and your Page, profile or group may be deleted.» · «Your content may be checked by the relevant rights holder, and then blocked, hidden or removed if you do not have proper permission.» · «The music contained in it may not be available in all countries of the world.»

[офиц] Instagram Blog, «Updates and Guidelines for Including Music in Video», https://about.instagram.com/blog/announcements/updates-and-guidelines-for-including-music-in-video (опубликовано 2020-05-20, проверено 2026-09-20), дословно: «The greater the number of full-length recorded tracks in a video, the more likely it may be limited» · «For that reason, shorter clips of music are recommended.» · «There should always be a visual component to your video; recorded audio should not be the primary purpose of the video.» · «if your video is muted or blocked, we'll make it clear what actions you can take to stop the interruption.»

Бизнес vs личный: Meta держит отдельную библиотеку для бизнеса — Meta Sound Collection. [офиц] её лицензия https://www.facebook.com/sound/collection/terms (2026-09-20): Meta даёт «неисключительную, бесплатную лицензию» на использование аудиоконтента «в коммерческих или некоммерческих целях» «исключительно в контенте, который вы создаёте, загружаете и распространяете в Продуктах компаний Meta»; воспроизводить и распространять его «отдельно от Продуктов компаний Meta» запрещено. То есть внутри IG/FB — бесплатно и коммерчески, вынести тот же ролик на YouTube/TikTok — нельзя.

Широко повторяемая формулировка «бизнес-аккаунт видит не полный каталог, а Sound Collection (~14 000 треков)» — уровень [практики]: справка Meta на эту тему боту не отдаётся (§5). Rights Manager (https://www.facebook.com/rights_manager) — инструмент правообладателей, из-за которого чужой трек в файле ловится автоматически; тело страницы тоже не читается.

Риск-профиль машины (вывод, не факт источника): трек из библиотеки Meta вшить в файл нельзя — лицензия запрещает вынос за пределы продуктов Meta; покупной royalty-free вшивать легально, но матчер может сработать (у Epidemic/Artlist есть процедуры снятия клеймов); самый безопасный контур для бизнес-аккаунта — `audio_configuration` с `audio_id` из Audio API либо вообще без музыки.

### 1в. Легальные источники музыки для вшивания в файл

| источник                                                                   | что разрешает                                                                                                                                                           | цена                                                                                         |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Meta Sound Collection** [офиц] facebook.com/sound/collection/terms       | бесплатно, коммерческое и некоммерческое использование, но только внутри продуктов Meta                                                                                 | $0                                                                                           |
| **Pixabay** [офиц] pixabay.com/service/license-summary                     | «Use Content for free», «without having to attribute the author», «Modify or adapt Content into new works»; нельзя «sell or distribute Content… on a Standalone basis»  | $0                                                                                           |
| **YouTube Audio Library** [офиц] support.google.com/youtube/answer/3376882 | «Music and sound effects from the YouTube Audio Library are copyright-safe»; CC-треки требуют кредита. Разрешения использовать ВНЕ YouTube в справке НЕТ (§5)           | $0                                                                                           |
| **Mixkit**                                                                 | бесплатная музыкальная лицензия есть, текст за ссылкой «View License», боту не отдаётся                                                                                 | н/д                                                                                          |
| **Uppbeat**                                                                | free с обязательным кредитом + премиум; и /pricing, и /legal/license вернули 429                                                                                        | н/д                                                                                          |
| **Epidemic Sound** [офиц] epidemicsound.com/pricing                        | «all of the music and sound effects in our catalog are royalty-free… you pay only your monthly subscription price for unlimited usage»; реклама — только Pro/Enterprise | [пресса] Personal ≈$9/мес (≈$6/мес годовой), Commercial ≈$25/мес годовой — обзоры расходятся |
| **Artlist**                                                                | страница подписок — 403, условия не подтверждены                                                                                                                        | н/д                                                                                          |

Генерация музыки (ИИ):

- **Suno** [офиц] suno.com/pricing (2026-09-20): Free $0, **Pro $8/мес ($64/год)**, **Premier $24/мес ($192/год)**; «Commercial use rights» только на Pro и Premier с припиской «See the terms of service for limitations on commercial use». [практики] обзоры называют $10/$30 — расхождение не разрешено (§5). Из справки Suno: права закрепляются за тем, у кого была подписка **в момент создания** трека, и сохраняются после отмены; ремиксы — только личное некоммерческое.
- **ElevenLabs Music** [офиц] elevenlabs.io/music (2026-09-20), дословно: «The tracks you generate are cleared for broad commercial use. Commercial rights vary by subscription tier»; на self-serve тарифах «online and offline commercial use is permitted, except for film, TV, and Studio Games»; free — «Personal use only». Отдельные Music Terms: elevenlabs.io/eleven-music-model-specific-terms.
- **Udio** — для нашей машины не годится. [пресса] Billboard и Music Business Worldwide (окт–ноя 2025): UMG урегулировала иск, свободную выгрузку закрыли, дали 48-часовое окно скачать старое (с 3 ноября 2025), новая платформа 2026 года — «walled garden» без свободного экспорта.
- **Stable Audio** — в пассе не проверен (§5).

Вариант «без музыки» полностью легален и снимает весь риск матчинга. Ограничение из гайдлайнов IG («There should always be a visual component to your video») нам не мешает: визуал и есть продукт. Компромисс: эмбиент/UI-звуки из Pixabay или Sound Collection + субтитры, ставка на просмотр без звука.

### 1г. Практика faceless-каналов: трендовый звук vs вшитый

Исследований с числами именно по этой развилке **не найдено** (§5). Что есть с провенансом:

- [офиц, косвенно] Adam Mosseri, январь 2025: главные сигналы ранжирования Reels — watch time, likes per reach, sends per reach; «sends» весят больше для показа не подписчикам. Трендовое аудио в официальных сигналах не названо. Первоисточник — сторис/видео Mosseri; страницы Meta с этим перечнем не нашёл (§5).
- [данные вендора] Metricool, Instagram Study 2026, https://metricool.com/press-release-instagram-study-2026/ (2026-06-16, проверено 2026-09-20), выборка 24 364 803 поста с 375 118 аккаунтов, янв–фев 2025 против янв–фев 2026: Reels дают >4× взаимодействий против одиночной картинки; средняя досматриваемость Reels выросла до 8,5 секунды (более чем вдвое год к году); карусели — 9× сохранений против картинки; посты с хештегами получают −31,7 % просмотров и −33,89 % взаимодействий к среднему; CTA на комментарий — +202,78 % комментариев; выросли только 21 % аккаунтов до 10 тыс. подписчиков.

Вывод (мнение): Audio API снял главный довод за ручную публикацию. Разумно держать оба контура — `audio_id` из Audio API по умолчанию, вшитый royalty-free как фолбэк и как способ завести собственный именованный звук.

---

## 2. Форматы «картинки+текст» и «код-рендер» без лица

Честный статус: **кейсов конкретных аккаунтов ниши «ИИ/софт/no-code» с охватами и датами не найдено** — выдача забита SEO-листиклами сервисов faceless-генерации (§5). Есть только отраслевые замеры по большим выборкам.

[данные вендора] Socialinsider, «Instagram Reels Performance Statistics For 2026», https://www.socialinsider.io/blog/instagram-reels-statistics/ (обновлено 2026-06-24, проверено 2026-09-20), выборка 140 тыс. Reels бизнес-страниц, январь–июнь 2026:

- reach rate у аккаунтов 1–5 тыс. подписчиков: Reels **9,78 %**, карусели **8,80 %**, картинки **7,00 %**;
- длина: 30–60 с — «the highest reach rate, of 5.60% on average»; <30 с — 5,20 %; 60–90 с — 5,30 %; >120 с — 3,50 %;
- skip rate: 65,50 % у аккаунтов 1–5 тыс., 60,50 % у 100 тыс.–1 млн;
- частота: 8 Reels в месяц у аккаунтов 1–5 тыс., 20 — у 100 тыс.–1 млн.

Metricool (те же цифры, что в §1г) добавляет: досматриваемость 8,5 с и 9× сохранений у каруселей. Как это читается для машины: смысл должен укладываться в первые 3–5 секунд, длина 30–60 с оправдана только при реальном удержании, а слайд-ритм выигрывает по сохранениям — целевое действие для ниши «как сделать X».

Форматы без лица: слайды-картинки с текстом под музыку — конструктивно наш кейс, отдельных замеров «слайд-рилс vs съёмка» нет. Скринкаст кода/терминала, typewriter-анимация, before/after, ranking-листы — подтверждающих замеров с датами и охватами не найдено, все найденные утверждения из блогов сервисов. Формат «текст на экране + тихий звук» правилам не противоречит: Instagram требует лишь визуальную составляющую.

Гайды Meta про формат: справочные страницы Meta Business Help и ads-guide боту не отдаются (пустое тело либо 404, §5). Точные требования к файлу берём из доки разработчика — §4: 9:16 рекомендовано, 1080×1920 укладывается в «Maximum columns (horizontal pixels): 1920», длительность 3 с — 15 мин, до 300 МБ. Цифры safe zone (верх ~14 %, низ 20–35 %, бока по 6 %; буфер 250 px сверху и снизу) подтверждены только вторичными источниками — ориентир, не канон.

---

## 3. Инструменты сборки видео из картинок и кода без человека

Все проверки — 2026-09-20.

**Remotion** (React → видео). [офиц] remotion.pro/license дословно: «Remotion is free to use for individuals and companies up to three people». Платные тарифы там же: «Remotion for Creators» — **$25/мес за место** («Get 1 Seat per user»); «Remotion for Automators» — **$0.01 за рендер при минимуме $100/мес**, разработчики на автоматизационных проектах мест не занимают. Доки remotion.dev/docs/licensing порогов не называют и отсылают на remotion.pro. Вывод: команде 1–3 человека бесплатно; машина, рендерящая по расписанию в компании больше трёх человек, — это Automators от $100/мес.

**ffmpeg** — бесплатный (LGPL/GPL), `brew install ffmpeg`. Закрывает всё: склейка кадров (`-loop 1 -t`), кроссфейды (`xfade`), прожиг субтитров (`subtitles=`/`ass`), сведение музыки, кодирование H.264/AAC 1080×1920. Для машины из слайдов — минимальный и самый надёжный путь: ноль рантайма браузера, детерминированный выход.

**Playwright / Puppeteer** — рендер HTML-слайда в PNG, дальше ffmpeg. Бесплатны, ставятся одной командой; `locator.screenshot()` даёт точный кадр. Самый «агентский» контур: слайд — обычная HTML-страница, вёрстка правится как код, дизайн переиспользуется с сайта. Край периметра (память флота): снимать `locator.screenshot()`, а не fullPage.

**Motion Canvas** — [офиц] motioncanvas.io/docs: «Motion Canvas consists of two main components: A TypeScript library that uses generators to program animations. An editor providing a real-time preview»; «Motion Canvas is a free and open source project». Заточен под ручной монтаж с редактором и озвучкой; подтверждения headless-CLI рендера в доке нет (§5). Для автомата — не первый выбор.

**Revideo** — форк Motion Canvas с headless-рендером. [офиц] midrender.com/revideo дословно: «An open-source TypeScript framework for creating and editing videos programmatically»; про статус — команда «now primarily works on Midrender», «Revideo's animation engine continues to be developed as part of Midrender, though recent changes have not yet been upstreamed to the open-source repository». [практики] npm `@revideo/core` — 0.11.0, публикация около июля 2026. Читается как «живо, но центр тяжести уехал в коммерческий продукт».

Итог по зрелости (мнение): для «картинки+текст» — Playwright/Puppeteer + ffmpeg (бесплатно, ставится агентом за один промпт, нет лицензионного хвоста). Для «кода-анимации» — Remotion (самый зрелый, но платный за порогом трёх человек) либо HTML+CSS-анимация со снятием кадров. Motion Canvas и Revideo — запасные ветки.

---

## 4. Публикация Reels через Graph API

Источник — [офиц] Meta for Developers, проверено 2026-09-20.

**Требования к файлу** (справочник IG User Media, developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/), дословно: «Container: MOV or MP4 (MPEG-4 Part 14), no edit lists, moov atom at the front» · «Audio codec: AAC, 48khz sample rate maximum, 1 or 2 channels» · «Video codec: HEVC or H264, progressive scan, closed GOP, 4:2:0 chroma subsampling» · «Frame rate: 23-60 FPS» · «Video bitrate: VBR, 25Mbps maximum» · «Audio bitrate: 128kbps» · «Required aspect ratio is between 0.01:1 and 10:1 but we recommend 9:16» · «Maximum columns (horizontal pixels): 1920» · «Duration: 15 mins maximum, 3 seconds minimum» · «File size: 300MB maximum». То есть 1080×1920, H.264 + AAC, 30 fps, 15–60 с — внутри всех рамок.

**Параметры контейнера REELS**: `media_type=REELS`, `video_url` (или `upload_type=resumable`), `caption` (до 2200 символов), `share_to_feed`, `collaborators` (до 3), `cover_url`, `thumb_offset` (мс), `user_tags`, `location_id`, `audio_name` (назвать звук можно один раз), `audio_configuration` (§1а), плюс `trial_params` и `is_ai_generated`.

**Публичный URL обязателен**, дословно: «We cURL media used in publishing attempts, so the media must be hosted on a publicly accessible server at the time of the attempt.» Альтернатива — `upload_type=resumable` (докачка файла напрямую); базовый путь требует публичной ссылки, значит машине нужен объектный хостинг (S3/R2/Vercel Blob).

**Лимит публикаций**, дословно: «Instagram accounts are limited to 100 API-published posts within a 24-hour moving period.» Остаток — `GET /{ig-user-id}/content_publishing_limit`. **Цифра 25 из вопроса устарела: в доке 100.**

**App Review**, дословно (overview): «Your app must complete Meta App Review to be granted Advanced Access» — нужно, если приложение обслуживает чужие профессиональные аккаунты либо им пользуются люди без роли в приложении. Standard Access работает «during app development, or for testing your app» людьми с ролью, с оговоркой «some features might not work properly until your app has been granted Advanced Access». Практический смысл: для публикации в СВОЙ аккаунт, где владелец — админ приложения, ревью не требуется; оговорку про «some features» держать как риск. Аккаунт: «your app users must have an Instagram professional account» — бизнес или creator.

**Instagram Login vs Facebook Login** (на 2026-09-20): у Instagram Login скоупы `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_messages`, `instagram_business_manage_comments`; аккаунт Business/Creator, FB-страница не нужна, публикация поддержана. У Facebook Login for Business аккаунт обязан быть «linked to a Facebook Page», зато доступны хештег-поиск и business discovery. Решающее для нас: Audio API «is only available on the Instagram API with Facebook Login. It is not supported on the Instagram API with Instagram Login» — хотим трек из библиотеки, идём веткой Facebook Login. Уведомлений о депрекации какой-либо ветки на developers.facebook.com/docs/instagram-platform/ на дату проверки нет.

---

## 5. Не найдено / сомнительно

1. **Справка Meta для бизнеса про музыку** — facebook.com/business/help/402084904469945, help.instagram.com/402084904469945 и help.instagram.com/629037417957828 отдают боту только заголовок. Следствие: «бизнес-аккаунт видит Sound Collection (~14 000 треков) вместо полного каталога» первоисточником НЕ подтверждено — уровень [практики], нужен ручной заход глазами.
2. **Rights Manager** — facebook.com/rights_manager: редирект, тело не читается; механики клеймов/мьюта дословно не получены.
3. **Цены Epidemic Sound и Artlist** — epidemicsound.com/pricing отдаёт текст без цифр (цены в JS), artlist.io/subscriptions — 403. Вторичные обзоры расходятся и в названиях тарифов (Personal/Commercial против Creator/Pro/Business), и в суммах. Таблица §1в — ориентир, перед покупкой смотреть глазами.
4. **Uppbeat** — /pricing и /legal/license вернули 429: условия free-тарифа, лимиты и цена не подтверждены.
5. **Mixkit** — текст музыкальной лицензии за ссылкой «View License», боту не отдаётся.
6. **YouTube Audio Library вне YouTube** — прямого разрешения или запрета в support.google.com/youtube/answer/3376882 НЕТ; подтверждено только «copyright-safe» внутри YouTube и кредит для CC-треков. Использование в Instagram — серая зона.
7. **Stable Audio** — stableaudio.com/pricing отдал только заголовок; тарифы и коммерческие права не подтверждены.
8. **Точная дата запуска Instagram Audio API** — в доке Meta даты нет; «18 мая 2026» приходит от вендоров-планеров [пресса].
9. **Кейсы faceless-аккаунтов ниши ИИ/no-code с охватами и датами** — не найдено: вся выдача SEO-листиклы сервисов (facelessgenie, flowshorts, shortopus и подобные) с числами без методики и ссылок на замеры. В срез сознательно не взято.
10. **Сравнение «трендовый звук IG» против «вшитый royalty-free» по охвату** — замеров нет ни у Metricool, ни у Socialinsider, ни у Meta. Любое утверждение на эту тему сегодня — догадка.
11. **Официальные safe-zone цифры Meta** — facebook.com/business/help/980593475366490 и facebook.com/business/ads-guide/video/instagram-reels/ не открылись (пустое тело / 404). Проценты и «250 px» — вторичка.
12. **Первоисточник перечня сигналов ранжирования Mosseri** (watch time / likes per reach / sends per reach, январь 2025) — только пересказы обзоров.
13. **Headless-рендер Motion Canvas из CLI** — в доке не подтверждён.
