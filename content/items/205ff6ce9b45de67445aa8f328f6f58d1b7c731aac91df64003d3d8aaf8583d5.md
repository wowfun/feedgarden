---
publish: true
content_type: "post"
title: "User reports Qwen3.8 Flash Next iq3_xxs underperforming the 27B at coding tasks"
description: "A Reddit user reports that a Qwen3.8 Flash Next model in iq3_xxs quantization is noticeably weaker than the 27B model at the same quantization in their hands-on testing. The core test was a request to build a 3D simulation of the solar syst"
date: "2026-10-09T09:50:42.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1h6tv/qwen38_flash_next_iq3_xxs_is_dumber_than_27b_iq3/"
tags: ["source/reddit","topics/models","topics/evaluation","topics/coding"]
---

A Reddit user reports that a Qwen3.8 Flash Next model in iq3&#95;xxs quantization is noticeably weaker than the 27B model at the same quantization in their hands-on testing.

The core test was a request to build a 3D simulation of the solar system as a standalone HTML file with no Three.js, no WebGPU and no extra libraries — only plain HTML, CSS, JavaScript and SVG. Flash Next consistently failed: the user had to follow up several times, and by then the model had exhausted its 120k context limit. The 27B model one-shot the same prompt "perfectly."

The user noted a trade-off in the failure: the Flash Next version produced far more features and a fairly complex UI, whereas the 27B output was simpler and actually worked. They describe the prompt as a quick "vibe" check on a model.

On subsequent agentic coding tasks, the poster says Flash Next "thinks wide" but consistently fails at the implementation stage, requires several follow-up steps, and consumes a large number of tokens overall. They ask whether others have had the same experience.
