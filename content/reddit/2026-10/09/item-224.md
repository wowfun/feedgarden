---
publish: true
content_type: "post"
title: "Creators compare open-weight local models for long-form fiction, not benchmarks"
description: "Setting benchmarks and coding aside, a Reddit user asked which open-weight models people actually use for creative writing, and shared notes from running models locally for science fiction and fantasy novels, short stories and some fanficti"
date: "2026-10-09T09:08:52.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1gjae/stepping_away_from_benchmarks_and_code_what/"
tags: ["source/reddit","topics/models","topics/evaluation"]
---

Setting benchmarks and coding aside, a Reddit user asked which open-weight models people actually use for creative writing, and shared notes from running models locally for science fiction and fantasy novels, short stories and some fanfiction on a modest machine.

Their usual pick is Gemma 31B finetunes with a refined creative-writing system prompt. Favorite so far: Gemma 31B Mero-mero-v2, which they describe as writing well, not feeling "lobotomized," and being mostly uncensored, though instruction following is only okay — it sometimes mixes up character traits, which their Pi-based creative writing harness corrects.

Other results:
- Qwen 3.8 27B finetunes were disappointing; the base model is judged poor at creative writing, and the finetune follows instructions well but writes badly.
- Muse Glimmer 30B produces sometimes very good prose and sometimes output resembling a 2B model, with unusually high variance; the user suspects the chat template and still rates it above Qwen.
- Gemma 4 26B A4 is good but beaten by the larger Gemma 4 31B; they use it for faster responses and to check initial scene-beat prompts.
- Gemma 31B Artemis, a finetune from "drummer," was disappointing: it seemed focused on roleplay rather than long-form story writing and produced refusals the Mero finetune did not.

The author's process uses hand-written outlines and scene-beat prompts, and they say AI still needs heavy hand-holding to avoid cliché-heavy prose, while noting the harness matters for correcting the model's output.
