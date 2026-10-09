---
publish: true
content_type: "post"
title: "Help requested: EXL2/EXL3 models produce gibberish in SillyTavern"
description: "A user with an RTX 4060 and 16 GB of memory is trying to run EXL2/EXL3 format models through SillyTavern, having previously used GGUF, to see whether EXL2/3 gives better lore coherence than Q4 quants. They are using TabbyAPI as the API prov"
date: "2026-10-08T18:18:13.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0ye23/help_with_exl23_pls/"
tags: ["source/reddit","topics/inference","topics/models"]
---

A user with an RTX 4060 and 16 GB of memory is trying to run EXL2/EXL3 format models through SillyTavern, having previously used GGUF, to see whether EXL2/3 gives better lore coherence than Q4 quants. They are using TabbyAPI as the API provider and ask whether a better option exists for EXL2/3.

With a ChatML preset imported from a Hugging Face repository &#40;Nitral-AI/Violet&#95;Magcap-12B&#41; and various adjustments to settings such as temperature, the output is gibberish. The user reports that sometimes it half-works but still has grammatical errors and truncated words, and sometimes produces loops that never emit a stop token; often it is word salad. A screenshot in the post shows the default bot's response to "Hello".

The post contains no settings dump beyond the template reference, no log output and no measurements, so the cause of the failure is not established from the material provided.

## Images and video

- [Image: Help with EXL2/3 pls](<https://preview.redd.it/k6q7nbylcauh1.jpg?width=140&height=136&auto=webp&s=c389c766108455eaf6425a83ce5959b93b9842c7>)
