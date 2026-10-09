---
publish: true
content_type: "post"
title: "Text-only Qwen3.5 2B, 4B and 9B MLX 4-bit packages, including abliterated variants"
description: "A user published text-only MLX 4-bit packages of Qwen3.5 in sizes suited to local inference on Apple Silicon, saying comparable configurations and sizes do not otherwise exist. There are six packages: 2B, 4B and 9B, each in the original Qwe"
date: "2026-10-08T21:09:07.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x12vox/i_put_together_some_textonly_qwen35_2b_4b_and_9b/"
tags: ["source/reddit","topics/models","topics/inference","topics/coding"]
---

A user published text-only MLX 4-bit packages of Qwen3.5 in sizes suited to local inference on Apple Silicon, saying comparable configurations and sizes do not otherwise exist. There are six packages: 2B, 4B and 9B, each in the original Qwen version plus the corresponding Huihui abliterated version.

They are text-only, meaning vision was removed, and 4-bit, making them small — the 2B version is only 1GB. The author says this suits passive, always-on use with resources to spare, and reports running them in their writing software Minstrel for summarization and contextual decisions.

The author credits Qwen, Huihui and the community conversion authors linked in each model card, and states their own contribution was mainly the text-only packaging and MLX conversion. The Huihui 4B GGUF source was already text-only, so it only needed conversion. No benchmark results, accuracy figures or speed measurements are provided, and the models are presented as free to use by anyone.
