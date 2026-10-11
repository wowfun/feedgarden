---
publish: true
content_type: "post"
title: "Engineering notes from running a 3B roleplay model fully on iPhone"
description: "The developer of Castmates, a closed-source iOS app with a free tier and paid Pro option, shared engineering measurements from running a 3B roleplay model entirely on-device. The app is mentioned only once, at the end. Setup: Impish Llama 3"
date: "2026-10-08T17:46:37.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0xkk7/running_a_3b_roleplay_finetune_fully_on_iphone/"
tags: ["source/reddit","topics/inference","topics/evaluation","topics/products"]
---

The developer of Castmates, a closed-source iOS app with a free tier and paid Pro option, shared engineering measurements from running a 3B roleplay model entirely on-device. The app is mentioned only once, at the end.

Setup: Impish Llama 3B, a Llama 3.2 3B roleplay fine-tune, plus the team's own rank-16 LoRA, fused and requantized to Q4&#95;K&#95;M from the fp16 base. The download is about 2.0 GB, fetched after install. It runs on llama.cpp with Metal, all layers offloaded, and an 8-bit KV cache at roughly 60 KB per token. There is no server and no account, and it works in airplane mode.

Hardware limits shape everything: 4 GB phones are the floor, since weights times 1.6 plus KV plus about 350 MB of compute buffers must fit, and the app refuses to load rather than risk being killed by the system; those phones stay at 4,096 context. Six-gigabyte phones get 6,144 context and 8 GB phones get 8,192. Llama 3.2 is natively 128K so no rope scaling is needed, only KV RAM cost. Speed is slow: early measurements were around 6 tok/s on an A18, and the developer declines to quote a newer number not re-measured on the current build. The 2 GB download is the biggest funnel drop-off, so Background Assets starts it before first launch, deliberately non-essential so it cannot block launch.

Findings about staying in character:

- A bigger window alone does nothing; the history trim budget was the binding constraint. Scaling trim to roughly 0.68 x n&#95;ctx raised long-conversation fact recall from 25% to 75% in their lab, and verbatim history beat a lossy summarizer.
- Retrieval can backfire: BM25 memory retrieval re-injected superseded facts when the window still held the newer one &#40;says-stale +20.8pp versus no retrieval&#41;. Dropping any hit whose rare entities still appear in the live window fixed it &#40;-18.8pp, CI &#91;-35.4, -6.2&#93;&#41; without losing recall-benchmark facts.
- Most prompt tweaks measured as zero; single runs with 3-4 seeds were noise. Only fixed-history micro-tests with N=16 and same-seed controls were trusted. One example: "say my name" went from 4/12 to 11/12 purely from history length, with no prompt change.
- Placement matters more than wording. A scene direction is ignored in the reminder slot &#40;0/16&#41; but lands 16/16 as its own block after the final user turn, while a reminder placed after the user turn makes the model answer the reminder instead of the user.
- Guards beat prompts against the 3B's habits: rerolls on third-person drift about the user, invented names and bare role-label output. Thinking mode did not help; one-pass is impossible with this finetune and two-pass was noise at twice the latency.

Remaining ceiling: the model cannot override a fact it can still read in context, so contradictions in a long scene persist. The lab is a Python port of the production prompt and guard pipeline run against llama-server with fixed seeds, so the claims come from runs rather than impressions.
