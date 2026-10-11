---
publish: true
content_type: "post"
title: "Audit of 162 benchmark gaps across recent model launches and nine leaderboards finds only 20 separate cleanly"
description: "A user audited 162 quoted model-comparison gaps from recent Claude, GPT, Gemini and Mistral launches and from nine leaderboard views, checking each against the benchmark's own sampling noise. Only 20 separate cleanly. The author stresses th"
date: "2026-10-09T03:38:05.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1b2w9/i_checked_162_benchmark_gaps_from_the_latest/"
tags: ["source/reddit","topics/evaluation","topics/research","topics/models"]
---

A user audited 162 quoted model-comparison gaps from recent Claude, GPT, Gemini and Mistral launches and from nine leaderboard views, checking each against the benchmark's own sampling noise. Only 20 separate cleanly. The author stresses this does not mean the other 142 gaps are fake or that the models are equal: some are genuinely unresolved at that benchmark size, and others cannot be honestly tested from what was published.

The unpublishable data was the bigger concern. Of 44 gaps quoted in six frontier launch posts, 11 separate, 5 do not, and 28 are not checkable from the published data. Gemini 4 Argon alone accounts for 15 quoted comparisons where public numbers do not support an honest interval &#40;averaged runs with unstated repeat counts, mismatched harnesses or effort settings&#41;; Mistral Large 4 adds 9 more. The author says 0 of those 24 comparisons can be checked honestly from what was published.

Of 118 adjacent pairs across nine leaderboard views, 9 separate. The example given is SWE-bench Multilingual, where the top two entries read 72.7% versus 66.3%, a 6.4-point lead that looks decisive but rests on only 300 tasks. Near the most uncertain part of the scale, the conservative resolution is roughly 24 tasks, and for this pair the applicable interval still includes zero. Six positions on that leaderboard cannot be distinguished from first place.

The audit also went against the author: a first pass found 21 separating gaps, and re-reading each comparison against the benchmark's actual score type and published uncertainty removed 5 of the author's own separated calls and added 4 others, for a final 20. Both the frozen original results and the audited verdicts are kept in the data, and nothing was overwritten. The pipeline was built and run with Claude Code, which helped implement the interval calculations, source extraction, audit checks and reproducible result generation. The data, write-up and a two-score-and-N calculator are public and free, with no signup.

Key takeaways:
- Treat small launch-chart leads as unresolved unless a noise-aware interval is published.
- "Not separated" means indistinguishable at that benchmark size, not equal.
