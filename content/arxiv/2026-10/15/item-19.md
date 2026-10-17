---
publish: true
content_type: "post"
title: "Any Time, Any Space: A World-State-Centric Framework for Agentic Video Generation"
description: "Long-form agentic video generation must turn a screenplay into shots that stay spatially and temporally consistent even across nonconsecutive requests. The authors argue that passing prompts or recent frames between shots is insufficient..."
date: "2026-10-14T17:54:18.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:43.420Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20571v1"
tags: ["source/arxiv","topics/generative-media","topics/agents"]
---

Long-form agentic video generation must turn a screenplay into shots that stay spatially and temporally consistent even across nonconsecutive requests. The authors argue that passing prompts or recent frames between shots is insufficient: it provides neither a shared spatial frame for revisiting a scene nor a time-indexed record for replaying an earlier event.

Their system, Any Time, Any Space &#40;ATAS&#41;, compiles a screenplay into shot requests carrying explicit location, camera, and event-time references. Before generation, it retrieves relevant evidence from two memories: a scene memory of registered static geometry, and an event memory of dynamic observations indexed by scene, event, and time. After generation, ATAS reconstructs and registers the resulting clip. Memory is updated only when review and state checks accept the observation, while film delivery remains independent of memory admission.

Across four video generators, ATAS is reported to improve all reported cross-shot consistency measures and to achieve the highest aggregate benchmark score for each backbone. It also outperforms the compared agents and 3D-guided methods on target-image spatial revisit, leads on three event-recapture criteria, and receives the highest human ratings on all six criteria. Video results and code are available on the project page at https&#58;//lhmd.top/atas/.
