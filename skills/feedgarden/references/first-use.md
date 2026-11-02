# First-use configuration

Use this guide when the user says this is their first use, asks to finish setup, or the bound CLI identifies an uninitialized instance. An existing instance missing a model or publishing target needs only that missing configuration. A new chat, an empty feed, a provider outage or an old config version does not establish first use.

## Establish what already exists

Bind the executable and instance using SKILL.md before asking questions. Inspect `instance paths`, the existing JSONC and `doctor` when available. Check `help --json`, `channels` and `subscriptions list` for actual capabilities and configured subscriptions. Reuse the user's prior choices and approvals; do not ask again merely because a turn or day changed. Never infer the user's publishing repository from the program's checkout.

For a genuinely new instance, distinguish the proposed paths from a verified initialized instance ID. If existing files are invalid or require migration, diagnose them and present the concrete recovery; `setup` does not repair or replace them. An ordinary daily request does not authorize initializing a different instance.

## Ask for the necessary choices

Use short questions in the user's language with concrete suggested answers. Gather the missing essentials first, then offer the recommendations relevant to their goal. Prefer one to three related questions per round over a long questionnaire. State which values are recommendations and which are already configured. Continue independent inspection while waiting; unanswered necessary choices are not consent.

| Choice | When necessary | What to ask or establish |
| --- | --- | --- |
| Instance and timezone | Creating an instance | Confirm the proposed standard user instance or the user's explicit paths, and the IANA timezone. Offer Asia/Shanghai as the package default without assuming it is the user's location. |
| Sources and subscriptions | Collecting a feed | Ask which sources to enable and whether their bundled subscriptions are suitable. Show the actual template choices. `setup` currently starts with Hacker News, OpenAI, Anthropic and GitHub; Reddit, X, podcasts, arXiv and Product Hunt are additional choices. |
| Model and spending policy | Generating summaries | Ask whether to inherit the installed backend's verified selection, select a named model, or explicitly try unused free OpenCode models. Resolve names against the installed catalog. Show the per-model daily call limit and whether fallback is allowed. A model probe verifies selection, not available quota or a successful summary. |
| Publication target | Publishing is requested | Establish the repository, branch, target format and managed prefix. Offer an existing Git worktree with `--worktree PATH`, or the default persistent clone in instance data. A Jekyll target also needs its public `ui.url` and `ui.baseurl`. Offer local-only output when publication is not wanted. |

If the user already asked to initialize/configure and supplied the necessary choices, apply them without a second blanket confirmation. If setup was merely discovered while running a daily update, ask whether to create the specifically identified instance before doing so.

Inspect the target worktree, branch, origin and Git differences. Existing valid content can be published directly, regardless of which instance or person created it. Reuse the user's chosen repository and worktree; no adoption or identity registration is needed.

## Offer recommended options

Offer the relevant options even when essentials are already supplied; let the user keep defaults or defer optional setup. Do not make an unanswered recommendation block unrelated configured work.

- **Daily window:** explain yesterday in the instance timezone, the seven-day undated first-observation window, and readiness defaults: 06:00 for Hacker News, Reddit, Anthropic, OpenAI, GitHub, X and podcasts; 18:00 for arXiv and Product Hunt. Preserve a source's own timezone when configuring the instance timezone.
- **Subscription details:** show the bundled subreddit/account/category/show selections and invite changes. Do not invent podcast feed URLs. X needs explicitly supplied cookies and its tooling for the authenticated route; offer its limited public-sample route with the coverage limits stated. Missing X credentials need not block other sources.
- **Model fallback:** offer explicit ordered candidates or `--free-models` when cost matters. The latter selects catalog IDs ending in `free` that this instance has not called today, in instance time; it does not guarantee provider availability. Existing call budgets still reset at UTC midnight and are independent per backend/account/model.
- **Presentation and optional work:** offer site language and relevant display features. Discuss whether to spend calls on relation analysis when the selected site does not display relations. The current `process`/`sync` pipeline includes relations; a display toggle alone does not disable those calls. If the user chooses to stop that stage, cancel the owned run after summary acceptance, verify it is terminal, then export and publish accepted results separately.
- **Operation:** offer manual updates first and scheduling when the user wants it. Schedule generation does not activate a schedule. Explain local secret storage without requesting credentials in chat or copying them into the repository.

## Apply and verify

Use `setup` only for the chosen new instance, then bind its returned configFile, dataDir and instanceId. For existing instances, keep those identities fixed. Use `subscriptions` and `targets` commands for their supported settings. For schema fields without a CLI setter, the bound package exports `editConfig` from `dist/src/app/index.js`; use its atomic, validated JSONC edit for the specific agreed fields instead of rewriting the config.

Keep secrets in the instance's `dataDir/secrets/runner.env`, preserving existing entries. Configure only the selected models, sources and targets. Tool installation, old-instance migration, schedule activation and publication are separate actions whose authorization comes from the user's actual request and decisions; do not bundle them silently into setup.

Read back effective configuration, run `doctor`, and inspect a requested target. If live validation belongs to the user's task, use one bounded channel query or a requested processing run and report what was actually verified. Do not spend model calls just to prove a configuration file can be read.

Finish configuration with a concise record of the instance, timezone, source coverage, model policy/budgets, target and any deferred options. Continue the user's original update or publication when it was requested. If that task already froze a day and eligible sources before configuration, retain that scope across midnight; newly selected sources require the user's intended scope rather than silently widening an in-progress update.
