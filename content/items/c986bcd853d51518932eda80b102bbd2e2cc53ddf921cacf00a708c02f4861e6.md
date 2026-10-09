---
publish: true
content_type: "post"
title: "Tencent releases Youtu-Parsing-Omni, a 5B omni-modal document parsing model"
description: "Tencent has published Youtu-Parsing-Omni, described as a compact 5B omni-modal parsing model. Given a single input — a document page, natural image, chart or flowchart, geometry figure, audio clip, or audio-visual video — it emits one struc"
date: "2026-10-09T12:03:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1jk9z/tencentyoutuparsingomni_hugging_face/"
tags: ["source/reddit","topics/models","topics/research"]
---

Tencent has published Youtu-Parsing-Omni, described as a compact 5B omni-modal parsing model. Given a single input — a document page, natural image, chart or flowchart, geometry figure, audio clip, or audio-visual video — it emits one structured JSON envelope covering both perception and cognition.

Perception output includes layout elements, text, tables, formulas, bounding boxes, timestamps, ASR, OCR, acoustic events and camera motion, while cognition covers captions, narratives and reports. The particular output family is selected through the task prompt &#40;the --task argument in examples, with keys in prompts/youtu&#95;parsing&#95;omni.json&#41;.

The supported task families and their key contents:
- document: layout elements with bounding boxes, text, LaTeX, OTSL tables, Markdown charts, Mermaid flowcharts, reading order.
- natural&#95;image: entities and text with bounding boxes, tags, captions, global description.
- graphics&#95;chart: one chart element as a Markdown table, notes and caption.
- graphics&#95;flowchart: one flowchart element as Mermaid plus caption.
- graphics&#95;geometric: one geometric element with points, lines, arcs, shapes, geometric relations and measurements.
- audio: vocal and non-vocal segments with timestamps, speakers, ASR, timbre, and scene captions plus acoustic events.
- natural&#95;video: temporal segments with visual elements, actions, interactions, camera motion and the audio track.
- textrich&#95;video: segments with OCR plus ASR and a Markdown structured&#95;report of the whole video.

Reported highlights: a unified schema, one JSON envelope for seven parsing families driven by the task prompt; an omni encoder handling image, audio and interleaved audio-visual inputs &#40;frames plus audio track&#41; in one model; and strong small-model results, with state of the art on OmniDocBench v1.6 &#40;96.96 Overall&#41;, best open-weight model on OmniParsingBench &#40;75.08 average, second only to Gemini-3-Pro&#41;, and competitive results against specialized models on chemical-structure &#40;ChemOCR&#41; and music-score &#40;PDMX-Synth&#41; recognition. The release includes a vLLM plugin, pinned serving settings, task prompts and inference examples.

## Images and video

- [Image: tencent/Youtu-Parsing-Omni · Hugging Face](<https://external-preview.redd.it/IOBGwlG1GLeePwVjEukOZAnpm3Exke5IVIyCT999tcc.png?width=640&crop=smart&auto=webp&s=92e43f735caa647c81054cba869632fd1b787ce5>)
