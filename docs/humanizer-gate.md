# Humanizer Gate — Step 4.5 (mandatory before deploy)

After writing any new article/page prose and BEFORE build+commit, run the humanizer skill (.claude/skills/humanizer/SKILL.md) in detect mode on the visible prose only (intro, sections, recent repairs, FAQ answers).

## Auto-ACCEPT edits that:
- Remove AI-cliché phrases and filler ("it's worth noting", "seamless", "in today's world", inflated transitions)
- Fix robotic sentence rhythm (uniform sentence lengths → varied)
- Replace vague abstractions with tighter wording WITHOUT adding new facts

## Auto-REJECT edits that:
- Touch ANY fact: model numbers, error codes, prices, phones, credentials, brand claims, statistics, hours, names (Mikhail V. / Artur S. / David K.)
- Touch JSON-LD, frontmatter, code, HTML structure, headings, titles, meta
- Invent human details: stories, opinions, experiences not in the original (zero-invention gate applies to style edits too)
- Conflict with docs/voice-and-style.md (e.g. changing "our techs/we" voice, breaking forbidden-phrases replacements with new clichés)
- Reduce section word count by more than 10%

## Priority order on conflict:
voice-and-style.md + factual-accuracy.md > humanizer suggestions. Always.

## After applying accepted edits:
1. Diff-check: all numbers, model names, prices, phones identical to pre-humanizer version
2. Report in commit summary: "humanizer: X flags, Y accepted, Z rejected"
3. If humanizer flags ZERO issues on 5 consecutive articles, note it in session log (signal that our standard already covers everything — gate may be removed)
