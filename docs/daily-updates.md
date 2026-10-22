# Daily feed tasks

[简体中文](daily-updates.zh-CN.md)

These copyable prompts do not create Codex automations. Use the local project `D:\Projects\feedgarden` and set the schedule timezone to **Asia/Shanghai**. Local execution requires the computer and Codex to be running.

| Time | Source IDs | Purpose |
| --- | --- | --- |
| Daily 06:00 | `hackernews reddit anthropic openai github x podcast` | Allow six hours after yesterday ends before preparing morning reading |
| Daily 18:00 | `arxiv producthunt` | Give delayed papers and the Los Angeles leaderboard more time to update |

06:00 is a practical morning-reading compromise, not a completeness guarantee: HN/Reddit expose ranking snapshots and X is a limited sample. Even 18:00 cannot guarantee that all yesterday's arXiv submissions are public. Product Hunt uses a Los Angeles leaderboard day, including daylight-saving changes, rather than an exact launch timestamp. This strict policy intentionally skips late items whose dates have expired; it does not backfill them.

Dated candidates must belong to yesterday in Shanghai, `[00:00, next 00:00)`. Undated candidates must have been first observed within seven days before execution starts; repeated fetches do not reset that date. Keep actual dates instead of relabeling content as yesterday. The migration cutoff, keywords, Top 50, hidden topics and existing budgets still apply. Top 50 filters unfinished candidates; published content remains.

`run --due` performs collection, ranking, summaries, rendering, relations and backup; `--no-publish` prevents remote publication. Channels may return snapshots wider than the window, which is enforced again at summary admission and first publication. Each source retains its own latest summary window across standalone `rank`/`render` commands and restarts. Processing another source cannot change that window. An unbounded summary removes the upper bound only for its selected sources; these tasks must never fall back to an unbounded command. Repeating a window preserves enrichment backoff. Each successful backup refreshes the daily and weekly snapshots, including earlier sources from the same task.

If `site:build` fails because the locked theme version does not support existing configuration, retain the generated content and existing preview and report the specific error. Do not automatically upgrade dependencies, remove hidden-topic configuration or bypass build validation. Acceptance of a local theme candidate is separate from a successful build with the locked release.

## 06:00 task prompt

```text
Run the morning feed update in D:\Projects\feedgarden. Process only hackernews, reddit, anthropic, openai, github, x and podcast, in that order.

Read AGENTS.md and docs/daily-updates.md. Confirm that the current CLI supports --until and --observed-days; otherwise report and stop without changing code or falling back to an unbounded run. Use Luxon with Asia/Shanghai to compute until as today's 00:00 and since as yesterday's 00:00 on the execution day, retaining the ISO timezone offset. Freeze both values for the entire task and retries, including across midnight.

Run the following command sequentially for each source, waiting for completion and replacing SOURCE, SINCE and UNTIL with actual values:
npm run feedgarden -- run --due --source SOURCE --since SINCE --until UNTIL --observed-days 7 --no-publish

Enforce yesterday's window for dated candidates and the last seven days of first observations for undated candidates; retain real dates. Respect existing Top 50, keyword, hidden-topic, ACP budget and cooldown rules. Do not backfill, widen dates, rescue expired candidates, or use --history, --refresh, --rebuild or --retry-failed. Retain published content regardless of ranking changes. Do not change configuration, code, credentials or schedules, commit, push or publish remotely.

For a source-specific partial failure, retain successful results, record the cause and continue to the next source. Stop the entire task on lock conflicts, lease loss or cancellation. Do not bypass exhausted budgets. Limited X samples, valid empty responses, cadence skips and filtered zeros do not establish no source activity. Read CLI output and this task's runs.details, recording fetchedItems, newItems, eligibleCandidates, generated, newPublications, window-scoped pending/failed and coverage notes per source. Do not count fetchedItems across channels as unique additions.

If there are first publications or public file changes, run npm run site:build and refresh the existing local preview. If no preview is running, start npm run site:serve and open its reported local URL. Notify only for new content, failures, unfinished work or required user action; stay quiet when everything succeeds without public changes. Report the frozen date range, actual new publications by source and exceptional conditions without claiming full coverage.
```

## 18:00 task prompt

```text
Run the evening feed update in D:\Projects\feedgarden. Process only arxiv and producthunt, in that order.

Read AGENTS.md and docs/daily-updates.md. Confirm that the current CLI supports --until and --observed-days; otherwise report and stop without changing code or falling back to an unbounded run. Use Luxon with Asia/Shanghai to compute until as today's 00:00 and since as yesterday's 00:00 on the execution day, retaining the ISO timezone offset. Freeze both values for the entire task and retries, including across midnight.

Run the following command sequentially for each source, waiting for completion and replacing SOURCE, SINCE and UNTIL with actual values:
npm run feedgarden -- run --due --source SOURCE --since SINCE --until UNTIL --observed-days 7 --no-publish

Enforce yesterday's Shanghai window for dated candidates. arXiv uses submission dates; Product Hunt uses the instant corresponding to its Los Angeles leaderboard day, not announcement dates or exact launch times. Undated candidates use first observations from the last seven days; retain real dates. Respect arXiv keywords, existing filters, hidden topics, ACP budgets and cooldowns. Do not backfill, widen dates, rescue expired candidates, or use --history, --refresh, --rebuild or --retry-failed. Retain published content. Do not change configuration, code, credentials or schedules, commit, push or publish remotely.

For a source-specific partial failure, retain successful results, record the cause and continue to the next source. Stop the entire task on lock conflicts, lease loss or cancellation. Do not bypass exhausted budgets. API visibility delays, valid empty responses, cadence skips and filtered zeros do not establish no source activity. Read CLI output and this task's runs.details, recording fetchedItems, newItems, eligibleCandidates, generated, newPublications, window-scoped pending/failed and coverage notes per source. Do not count fetchedItems across channels as unique additions.

If there are first publications or public file changes, run npm run site:build and refresh the existing local preview. If no preview is running, start npm run site:serve and open its reported local URL. Notify only for new content, failures, unfinished work or required user action; stay quiet when everything succeeds without public changes. Report the frozen date range, actual new publications by source and exceptional conditions without claiming full coverage.
```

## Reading results

`eligibleCandidates` measures membership in the eligible candidate set, including already accepted or reusable summaries. It is not a count of remaining generation work: a positive candidate count can accompany zero `generated` and zero `pending`.

`fetchedItems` counts channel results; `newItems` counts new stored identities; `eligibleCandidates` counts the candidate set admitted by the window and existing rules; `generated` counts accepted summary copies; `newPublications` counts first publications, excluding adoption/import of already installed history. A refreshed summary is not a first publication. Candidate counts are computed when `--since` is explicit, as in these tasks; unbounded runs return `eligibleCandidates: null` rather than scanning the entire history. Missing or null counts are not zero. Completed reports remain in `runs.details` if a later step fails.

Never automatically widen dates to explain zero additions. Check timezone, cadence, fallback, filtering and summary budgets using [source details](sources.md) and [operations](operations.md). [Archive maintenance](archives.md) can remove a miscollected generated identity in both languages while retaining private evidence and publication history; this is not an automatic daily cleanup step.
