# AI Diagnostic — Setup Guide

Этот пакет добавляет в `sdar-v2` интерактивный блок AI-диагностики на главной странице с тремя CTA-карточками (PDF / Call Back / Book Visit).

---

## 📁 Что в пакете

```
src/
  components/
    AiDiagnostic.astro       — компонент блока (форма + AI-ответ + 3 карточки + PDF-генератор на jsPDF)
  pages/
    index.astro              — обновлён: добавлен <AiDiagnostic /> в слот Special Block
functions/
  api/
    diagnose.js              — CF Pages Function: proxy к Anthropic API
    contact.js               — CF Pages Function: Telegram logger + Resend email (с PDF attachment)
.dev.vars.example            — шаблон секретов для локальной разработки
README-AI-DIAGNOSTIC.md      — этот файл
```

---

## 🚀 Как распаковать

```powershell
cd C:\Users\Roman\WebstormProjects\sdar-v2
Expand-Archive -Path .\sdar-v2-ai-diag.zip -DestinationPath .\_unpack -Force
Copy-Item -Path .\_unpack\sdar-v2-ai-diag\* -Destination . -Recurse -Force
Copy-Item -Path .\_unpack\sdar-v2-ai-diag\.dev.vars.example -Destination . -Force
Remove-Item .\_unpack -Recurse -Force
Remove-Item .\sdar-v2-ai-diag.zip
```

Проверь что файлы на месте:
```powershell
ls src\components\AiDiagnostic.astro
ls functions\api\diagnose.js
ls functions\api\contact.js
ls .dev.vars.example
```

---

## 🔑 Environment Variables — что нужно

| Переменная | Где взять | Зачем |
|---|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | AI-диагноз |
| `TELEGRAM_BOT_TOKEN` | у тебя есть (тот же что lgdryer) | Логи в Telegram |
| `TELEGRAM_CHAT_ID` | у тебя есть (тот же что lgdryer) | Адрес группы |
| `RESEND_API_KEY` | https://resend.com/api-keys | Email-дубль + PDF юзеру |
| `RESEND_FROM` | _опционально_ | По умолчанию `noreply@samedayappliance.repair` |
| `RESEND_TO` | _опционально_ | По умолчанию `abysov@gmail.com` |

### ⚠️ Resend — ВАЖНО

Чтобы Resend отправлял письма, нужно **верифицировать домен** `samedayappliance.repair`:

1. https://resend.com/domains → **Add Domain** → `samedayappliance.repair`
2. Resend даст 3 DNS-записи (SPF, DKIM, DMARC)
3. Добавь их в Cloudflare DNS для `samedayappliance.repair`
4. Жди 5-30 минут → статус в Resend: **Verified** ✓

**До верификации PDF-emails работать НЕ будут.** Telegram будет работать.

Если домен уже верифицирован для lgdryer — это другой домен, нужен отдельный для SDAR.

---

## 🛠 Локальная разработка

### Режим 1 — обычный (только фронтенд)

```powershell
npm run dev
```

Открой http://localhost:4321/ — увидишь всю вёрстку, форму, дропдауны. **Кнопка "Get AI Diagnosis" вернёт ошибку сети** — это норма, потому что `npm run dev` не запускает Pages Functions.

Используй этот режим для правки вёрстки, стилей, порядка секций.

### Режим 2 — с Functions (тестируем AI вживую)

1. Скопируй `.dev.vars.example` → `.dev.vars` и заполни значения:
```powershell
Copy-Item .dev.vars.example .dev.vars
notepad .dev.vars
```

2. Собери и запусти с wrangler:
```powershell
npm run build
npx wrangler pages dev ./dist --compatibility-date=2024-01-01
```

Откроется на http://localhost:8788 (другой порт!). Там AI-диагностика **полностью работает**: кнопка зовёт Anthropic, Telegram получает логи, Resend шлёт email.

⚠️ Если ты запускаешь wrangler впервые, он установит нужные пакеты автоматически.

---

## ☁️ Cloudflare Pages — продакшн setup

После того как пакет задеплоен и сайт на `sdar-v2.pages.dev`:

1. Открой **Cloudflare Dashboard** → **Workers & Pages** → `sdar-v2` → **Settings** → **Environment variables**

2. Добавь все переменные (для **Production** и **Preview** — обе среды):
   - `ANTHROPIC_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `RESEND_API_KEY`
   - `RESEND_FROM` (опционально)
   - `RESEND_TO` (опционально)

3. **⚠️ ВАЖНО:** переменные **БЕЗ** префикса `PUBLIC_`. Astro требует `PUBLIC_` для клиентских переменных, но CF Pages Functions читают серверные env **напрямую** — `env.ANTHROPIC_API_KEY`, не `env.PUBLIC_ANTHROPIC_API_KEY`.

4. После сохранения переменных — **пересобери**: в Pages → Deployments → три точки → **Retry deployment**. Новые env подхватываются только на свежем build.

---

## 🧪 Как проверить что всё работает

### Проверка 1 — Telegram logger

Открой сайт (staging или prod) → прокрути до AI Diagnostic → выбери *«Refrigerator»* → напиши *«Stopped cooling overnight»* → Get Diagnosis.

Через 2-3 секунды в твоей Telegram-группе должно появиться:
```
🤖 AI Diagnostics used

Sector: residential
Equipment: Refrigerator

Issue: Stopped cooling overnight
```

### Проверка 2 — AI ответ

На сайте должен появиться блок с диагнозом (4-6 предложений, упоминание реальной цены, призыв позвонить).

### Проверка 3 — PDF

В блоке AI-ответа нажми *«Send PDF»* с любым email → на твоё устройство скачается PDF → через минуту на email придёт письмо с attach.

В Telegram также прилетит:
```
📄 PDF Diagnosis Requested

Email: test@...
Equipment: Refrigerator
Diagnosis: ...
```

### Проверка 4 — Call Back

В карточке Call Back введи номер → *«Call Me Back»*. В Telegram:
```
📞 CALL BACK REQUEST

Phone: (xxx) xxx-xxxx
Equipment: Refrigerator
⏱ Call within 10 minutes.
```

### Проверка 5 — Book Visit

Телефон + адрес + время → *«Book Visit»*. В Telegram:
```
📅 NEW BOOKING REQUEST

Phone: ...
Address: ...
Time window: morning
Equipment: Refrigerator
```

---

## 🎛 Как редактировать системный промпт AI

Файл: `functions/api/diagnose.js`, строки 50-75.

Промпт сейчас адаптирован под SDAR:
- Отражает C-20 license, BBB, EPA
- Ценовые диапазоны из контекст-файла ($89/$120 diagnostic, waived with repair)
- Специальные цены для luxury брендов (Sub-Zero, Wolf, Miele, Thermador)
- Форбидн-фразы из вашего стандарта: "peace of mind", "certified technicians" и т.д.
- Тон: "like a tech thinking out loud", не corporate

Если хочешь подкрутить — редактируй `systemPrompt` переменную. После push → CF Pages автоматически передеплоит.

---

## 💰 Сколько это стоит

**Anthropic API:** Claude Sonnet 4, ~450 max_tokens на ответ. Это ~0.005–0.01 USD за диагноз. На 1000 диагнозов в месяц — ~$5-10. 

**Resend:** 3000 писем/месяц бесплатно, хватит на долго.

**Telegram:** бесплатно.

**Cloudflare Pages Functions:** 100,000 запросов/день бесплатно.

---

## 📊 Аналитика — что логируется

Каждое взаимодействие → Telegram:
- 🤖 AI Diagnostics used (кто попробовал, что сломалось)
- 📄 PDF Request (email + диагноз)
- 📞 Call Back Request (телефон + диагноз + 10min SLA)
- 📅 Booking Request (полный брифинг для техника)

Email-копии всех лидов → `abysov@gmail.com` (можно поменять через `RESEND_TO`).

---

## 🔐 Безопасность

- `ANTHROPIC_API_KEY` никогда не светится в браузере — только на сервере в Function
- Клиент-сайд код не содержит секретов, всё идёт через `/api/*`
- Input sanitization: description ограничен 1000 символов, поля обрезаются до 80
- Rate limit: CF Pages по умолчанию даёт Cloudflare DDoS-защиту. Если будут атаки через форму — добавим Cloudflare Turnstile (это отдельный тикет).

---

## ❓ Troubleshooting

**"Пишу в описании проблемы, нажимаю — ничего не происходит"**
→ Открой DevTools → Network → смотри запрос на `/api/diagnose`.
- 404: `functions/api/diagnose.js` не попал в билд — проверь что папка `functions/` в корне проекта (рядом с `src/`, не внутри)
- 500: env vars не заданы в CF Pages
- Network error на localhost: `npm run dev` не запускает Functions, используй wrangler

**"PDF скачался пустой / битый"**
→ Проверь что `jspdf` загружается: в DevTools → Console должно быть без ошибок.
→ Скрипт загружается с CDN `cdnjs.cloudflare.com` — если у тебя или юзера блокировки, может не догрузиться.

**"Email не пришёл"**
→ Самая частая причина: домен не верифицирован в Resend.
→ Проверь в Resend Dashboard → Logs что письмо вообще ушло.
→ Посмотри спам-папку.

**"Telegram молчит"**
→ Проверь `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` в CF Pages env.
→ Бот должен быть добавлен в группу.
→ `CHAT_ID` для супергрупп начинается с `-100...`.

---

Готово. Если что-то не заработает — скинь ошибку из DevTools Network/Console или из CF Pages → Deployments → Functions logs, разберём.
