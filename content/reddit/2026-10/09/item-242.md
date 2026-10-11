---
publish: true
content_type: "post"
title: "Can local models strip AI text watermarks? A user's question"
description: "A Reddit user asks how text watermarking on Claude-written content would hold up if the text is put through a locally run open-source model. The scenario: write an essay in Thai with Claude, then use a local open-source model to translate i"
date: "2026-10-09T09:57:10.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1ham3/how_will_claude_do_when_i_can_remove_watermarks/"
tags: ["source/reddit","topics/content-provenance","topics/security-privacy"]
---

A Reddit user asks how text watermarking on Claude-written content would hold up if the text is put through a locally run open-source model.

The scenario: write an essay in Thai with Claude, then use a local open-source model to translate it into English. The poster believes this would destroy a probabilistic watermark, because a local model is unlikely to adhere to the subset of words &#40;the poster calls it the green set&#41; that Claude selects for tracking. They add that even if Claude embeds the watermark in the writing's structure, a local AI could alter that too, and that a local model is not bound by policies since it runs on the user's own machine. The poster concludes detection would theoretically be hard.

The post is a theoretical question with no test results or evidence, and it does not describe how any specific watermarking or detection scheme actually works.
