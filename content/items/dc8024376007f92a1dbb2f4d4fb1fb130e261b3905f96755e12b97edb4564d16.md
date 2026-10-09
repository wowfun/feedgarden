---
publish: true
content_type: "post"
title: "GLM 5.3 Flash decided it is Claude, then lectured me about admitting when it does not know something"
description: "A user testing a local setup running GLM 5.3 Flash through a custom pipeline asked the model a single question: what is your knowledge cutoff. They report two failures in the response, which they describe as amusing rather than as a formal "
date: "2026-10-08T22:48:51.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x157uu/glm_53_flash_decided_its_claude_then_lectured_me/"
tags: ["source/reddit","topics/evaluation","topics/models"]
---

A user testing a local setup running GLM 5.3 Flash through a custom pipeline asked the model a single question: what is your knowledge cutoff. They report two failures in the response, which they describe as amusing rather than as a formal benchmark.

First, the model's opening thinking line asserted an identity: "I'm jarvis-thinker, custom model name, but based on Claude." The poster says nothing in the setup ever told it that, so it apparently invented a lineage and continued with full confidence. They attribute this at least partly to identity traces in training data, but note that this is not their main point.

Second, when estimating the cutoff, the model reasoned that "Claude models typically have early 2025 cutoffs, I should say roughly early 2025," and separately wrote that it did not know the exact date with certainty, yet still gave a date. The final answer then included a bullet stating the model knows what it does not know and will say so rather than confidently inventing an answer, which the poster contrasts with the identity it had just fabricated. The post is a single anecdotal report and the poster notes they found it funny.

## Images and video

- [Image: GLM 5.3 Flash decided it's Claude, then lectured me about admitting when it doesn't know something lol](<https://preview.redd.it/04ewprdgobuh1.jpeg?width=640&crop=smart&auto=webp&s=4b1ceaa6759796827c18eca28b09f59b8a05f2ad>)
