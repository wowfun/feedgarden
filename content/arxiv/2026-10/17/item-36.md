---
publish: true
content_type: "post"
title: "ISW-Agent: Coupling LLM Dialogue with n8n Workflows for Internal Solitary Wave Image Processing"
description: "Internal solitary wave (ISW) remote sensing depends on passing task parameters and spatial information through a chain of image acquisition, detection, stripe extraction and propagation prediction. ISW-Agent, from researchers at the Firs..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21502"
tags: ["source/arxiv","topics/agents","topics/research"]
---

Internal solitary wave &#40;ISW&#41; remote sensing depends on passing task parameters and spatial information through a chain of image acquisition, detection, stripe extraction and propagation prediction. ISW-Agent, from researchers at the First Institute of Oceanography under China's Ministry of Natural Resources, links large language model interpretation to n8n workflows and independent scientific models, using structured task constraints, geospatial transformations and stage-specific output validation to keep the chain consistent.

In trials with 120 Chinese instructions per backend, GPT-5.6 Sol and DeepSeek each reached a 94.2% strict task-match rate, and all intents and execution decisions matched the reference. Sentinel-1 cases showed continuous processing from a dialogue request to wavefront prediction for the specified scene.

Of 50 timed scenes, 39 completed detection, extraction and prediction with a median turnaround of 48.04 seconds; the other 11 stopped after an empty extraction result. In 3,408 controlled fault-injection runs, retries recovered 234 transient-failure conditions and output validation rejected 234 structural defects. A further 61 provenance or completeness errors pointed to the need for content-consistency checks, which the current validation stage does not provide.

The authors present the system as a way to connect natural-language requests to traceable spatial processing chains for multi-model ISW analysis, rather than as a replacement for the underlying scientific models.
