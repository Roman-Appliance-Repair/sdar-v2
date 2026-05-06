# Terminal Orchestration

> Multi-terminal Claude Code workflow. T1–T6+ роли и принципы.
> Этот чат (claude.ai) = orchestrator; Claude Code terminals = workers.

---

## 1. Роли

| Terminal | Роль |
|---|---|
| **T1** | Residential analyst — GSC анализ, SERP research, content briefs |
| **T2** | Residential writer — пишет .astro файлы по brief |
| **T3** | Commercial analyst — то же для commercial scope |
| **T4** | Commercial writer |
| **T5 / T-HUB** | Hub Chip Sync — обновляет hub pages когда добавляются new combo pages |
| **T6** | QA / navigation / build verification |

Не все терминалы активны всегда. Roman запускает по необходимости.

---

## 2. Принципы

### 2.1 Параллельное выполнение
- Multiple terminals могут работать одновременно
- Краткие статус-апдейты в чат между этапами
- Sequential page writing внутри терминала (один бренд за раз)
- Writer ждёт подтверждение деплоя перед следующей страницей

### 2.2 Roman как dispatcher
- Roman даёт сигнал коммита короткими русскими фразами:
  - «продолжай»
  - «всё ок»
  - «задеплоил дальше едем»
  - «остановись, проверим»
- Russian для оркестрации, English для кода и коммитов

### 2.3 Proceed-by-default autonomy
- При наличии полного контекста — терминал не спрашивает разрешения на каждый шаг
- НО: при появлении неожиданного состояния (dirty tree, conflicting changes, missing files) — STOP и доложить

### 2.4 Race condition protection
- См. @docs/methodology.md §5
- Multiple terminals → explicit `git add <paths>`, никогда `git add -A`

---

## 3. Стандартный prompt structure для terminal

Каждый промпт T-X содержит:

```
TASK: <one-line task description>

STEP 0 — Branch verification (mandatory):
  cd C:\Users\Roman\WebstormProjects\sdar-v2
  git branch --show-current
  git log -1 --format="%h %s"
  git status --short
  Stop if: not on main, dirty tree, or last commit unexpected.

STEP 1 — Audit (если task трогает existing files):
  ls -la <file>
  wc -w <file>
  view first 100 / last 100 lines
  Report findings, WAIT for Roman approval.

STEP 2 — Action (только после approval).

STEP 3 — Build verification:
  npm run build
  Verify 0 errors, page count matches expectation.

STEP 4 — Commit:
  git add <explicit paths>
  git status --short  (verify only intended files staged)
  git commit -m "<conventional format>"
  git push origin main
  git log origin/main -1  (confirm push)

REPORT BACK:
  - Audit findings
  - Files touched
  - Commit hash
  - Build verification
  - Push confirmation
```

---

## 4. Communication между orchestrator chat и Claude Code

**Что чат-orchestrator делает:**
- Reads terminal logs (paste'ed by Roman)
- Interprets results
- Makes decisions
- Produces next prompt

**Что чат не делает:**
- Не выполняет shell команды напрямую (sandbox limitations)
- Не пишет файлы в `sdar-v2` репо напрямую (только через Claude Code)
- Не commits/pushes сам

**Workflow:**
1. Roman: «продолжаем cluster 6»
2. Orchestrator chat: читает context, продумывает next step, выдаёт prompt
3. Roman: copy-paste prompt в Claude Code terminal
4. Terminal: executes, reports
5. Roman: copy-pastes terminal output в chat
6. Chat: интерпретирует, выдаёт следующий шаг

---

## 5. Wiki-first principle

**Перед любой cluster задачей** — прочитать в порядке:
1. `wiki/page-plans/METHODOLOGY.md` (v1.3.1) — главная методология
2. `wiki/page-plans/cluster-XX-NAME/index.md` — текущий cluster
3. Notion: writing standard
4. Notion: соответствующая Brand × Service DB

Wiki **beats** project knowledge files. Project knowledge **beats** chat memory. Memory **beats** assumptions.

---

## 6. Hub Chip Sync (§3.9 в methodology)

Все writer commits деплоящие новые combo pages должны содержать тэг в commit message:
```
[HUB-SYNC-TRIGGER: {section}]
```

Например:
```
feat(brands): add LG washer-dryer combo pages for 5 cities

[HUB-SYNC-TRIGGER: brands/lg]
```

T5 / T-HUB picks up these triggers и updates hub pages.

---

## 7. Session continuity

**Перед shutdown терминал пишет pause file:**
```
wiki/handoff/terminal-TX-pause-YYYY-MM-DD-evening.md
```

Содержит:
- Точка остановки (last completed task)
- Last commit hash
- Следующий шаг (next task to pick up)
- Файлы которые нужно re-read при resume

**На resume:**
- Новый orchestration chat читает CLAUDE.md
- Затем reads relevant pause file in wiki/handoff/
- Продолжает оттуда

---

## 8. Cloudflare deployment dance

После push:
```bash
git log origin/main -1                    # confirm push reached remote
sleep 90                                  # wait for Cloudflare deploy
curl -I https://samedayappliance.repair/<new-page>/  # check 200
```

**Cloudflare HTTP 200 fallback на homepage** делает её ненадёжной для existence checks — она вернёт 200 даже на 404. Always cross-reference:
- Response title (correct page title?)
- `git ls-tree origin/main src/pages/<path>` (file actually committed?)
