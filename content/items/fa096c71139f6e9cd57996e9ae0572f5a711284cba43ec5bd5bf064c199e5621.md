---
publish: true
content_type: "post"
title: "A portable 'memory journal' format aims to transfer context and skill between AI models"
description: "A Reddit user shared a portable memory format they built last month as a plain .txt file, calling it a Memory Journal in the shape of a skill card. It is essentially a large prompt wrapped in a text file, with early testing going better tha"
date: "2026-10-09T11:38:22.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1j2lx/i_made_a_portable_ai_memory_format_that_transfers/"
tags: ["source/reddit","topics/agents","topics/products"]
---

A Reddit user shared a portable memory format they built last month as a plain .txt file, calling it a Memory Journal in the shape of a skill card. It is essentially a large prompt wrapped in a text file, with early testing going better than expected, followed by a month of further tests and improvements.

The design goal is general purpose — it can handle casual and technical sessions alike, though the author says it can bend a bit. The underlying philosophy is that if an AI knows the context, it can also describe how it created something. Beyond context, the format aims to be reproducible and to transfer skill and mistakes, distinguishing proven, unproven and disproven facts. The journal gives the writing AI broad latitude and stays relatively neutral, and is split into A/B/C sections with different purposes.

Reported capabilities include resuming work from the journal plus project files. As an example, the author says an AI wrote a journal about converting an EGO engine XML file, and that readers could reproduce the converter from the journal alone; DeepSeek 4.1 &#40;deep think mode&#41; and Claude Sonnet 5 &#40;high effort&#41; each recreated the converter on the first try. They also note that a philosophically charged journal can cause drift in behavior and vocabulary.

Usage is simple: the card is given to an AI, which then produces the memory journal as a text file, and users can add instructions such as adding completion status to goals or excluding a section. The author recommends pairing it with a capable model that offers an effort slider, and links the journal format plus example outputs, including the XML converter reproduction, a modding journal, and casual chat journals. They acknowledge the format is not perfect.

## Images and video

- [Image: I made a portable AI memory format that transfers both context and skill](<https://preview.redd.it/19xcinownfuh1.png?width=140&height=60&auto=webp&s=995e384847331c3b0dc90718f1f9da78957b8e1d>)
