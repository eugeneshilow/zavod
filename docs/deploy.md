# Выход наружу — репозиторий, проверка, Vercel, Convex

Канон зоны: как проект живёт онлайн прямо сейчас. Меняется заменой.

## Устройство

- **Репозиторий** — открытый `eugeneshilow/zavod` на GitHub. В `main` попадают только слиянием pull request.
- **Проверка** — `.github/workflows/check.yml`: на каждый pull request и на каждый push в `main` GitHub Actions ставит pnpm и запускает `pnpm check` (та же команда, что у человека на машине). Тесту нужен пароль админки: в Actions он подставляется одноразовой строкой через переменную окружения; настоящий пароль в CI не живёт.
- **Хостинг** — Vercel, проект `zavod-v6`, привязан к репозиторию. Адрес продакшена — `https://zavod.today`; `www.zavod.today` редиректит на него (308); `app.zavod.today` ведёт в тот же проект (будущий кабинет покупателя, пока тот же сайт). Домен куплен на reg.ru, зона ведётся там же: `A @ → 216.150.1.1`, `CNAME www` и `CNAME app` → значения с экрана Vercel (подключено 22.09.2026 Codex в браузере по брифу; ⚖️ domain-codex-browser в [journal.md](journal.md)). Технический адрес `zavod-v6.vercel.app` остаётся. Push в `main` собирает продакшен; pull request собирает превью. Команда сборки — в `vercel.json` и зависит от `VERCEL_ENV`: в продакшене `pnpm check && npx convex deploy --cmd 'pnpm build'`, чтобы проверка записала результат для `/admin`, а Convex задеплоился и подставил адрес базы в сборку; на превью просто `pnpm build`, приложение там работает без Convex.
- **База** — Convex в облаке, два деплоя: dev (`npx convex dev`, адрес в `.env.local`) и продакшен (создаётся `npx convex deploy` под входом человека, дальше деплоится сборкой Vercel).
- **Стекло** — карточка «Проверка и продакшен» на `/admin` за паролем: результат последней проверки, коммит (`VERCEL_GIT_COMMIT_SHA`) и адрес продакшена (`VERCEL_PROJECT_PRODUCTION_URL`).
- **Иммунитет** — `.github/workflows/prod-alive.yml`: раз в час запрашивает адрес из переменной репозитория `PROD_URL` (сейчас `https://zavod.today`) и падает, если ответ не 200.

## Где живут ключи

- Локально — `main/.env.local` (никогда не коммитится): `ADMIN_PASSWORD`, `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`. Имена — в `.env.local.example`.
- В Vercel — `ADMIN_PASSWORD` (production и preview) и `CONVEX_DEPLOY_KEY` (только production; кладёт человек руками, через чат не проходит).
- Адрес продакшена для сторожа — переменная репозитория GitHub `PROD_URL`.

## Как откатиться

- Код: `git revert` коммита слияния в `main` через pull request; push в `main` пересобирает продакшен. Либо в Vercel → Deployments → предыдущий деплой → Promote to Production.
- Convex: серверные функции деплоятся вместе с кодом, откат кода откатывает и их; данные откатом не трогаются.

## Известные края

- Продакшен-сборка падает, пока в Vercel нет `CONVEX_DEPLOY_KEY`: первый деплой после слияния до ключа — Error, это ожидаемо.
- Vercel переписывает `vercel.json` в папке сборки своим форматом, поэтому файл исключён из prettier (`.prettierignore`); иначе `pnpm check` в продакшен-сборке красная.
- `pnpm check` в сборке Vercel опирается на `git ls-files`; без git в окружении сборки скрипт берёт файлы по маске (запасной путь в `scripts/check.mjs`).
- Docs в этом репо проходят через prettier: правка docs без `pnpm check` красит проверку и продакшен-сборку (кейс 22.09.2026, запись журнала без форматтера).
- Локальный резолвер мака после смены зоны может держать старый парковочный адрес часами: проверять `dig @ns1.reg.ru` и `curl --resolve zavod.today:443:<новый IP>`.
