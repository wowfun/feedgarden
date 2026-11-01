---
publish: true
content_type: "post"
title: "Do the math: How we took over ChatGPT accounts"
description: "In October 2026, researchers demonstrated that an ordinary public ChatGPT share could be turned into attacker-controlled JavaScript executing inside the signed-in session of whoever opened it. An attacker could create a malicious convers..."
date: "2026-10-31T10:30:11.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.parameter.ai/labs/we-found-a-gap-at-openai"
discussion_url: "https://news.ycombinator.com/item?id=50314699"
tags: ["source/hackernews","topics/security-privacy"]
---

## Article

In October 2026, researchers demonstrated that an ordinary public ChatGPT share could be turned into attacker-controlled JavaScript executing inside the signed-in session of whoever opened it. An attacker could create a malicious conversation, publish it using ChatGPT's normal sharing feature, and send the link to another user; opening the shared link was the only action required—no app install, Project join, code paste, or developer tools. The payload could enumerate the victim's conversation list, read content from a private conversation that had never been shared with the attacker, and exfiltrate data to an external server. Because it could call ChatGPT's authenticated APIs as the victim, it amounted to account takeover rather than mere page modification. OpenAI fixed the issue on October 26 and classified the report as P1. The chain combined two features that looked harmless alone: an interactive graph and ChatGPT's HTML Preview. Preview runs arbitrary code inside a restricted frame on a separate web address, so it cannot directly read the signed-in ChatGPT page; at first this isolation appeared to work. But the graph loaded the MathLive math library, which installed a postMessage listener in the main ChatGPT page for its on-screen keyboard. MathLive's top-level controller used an origin policy of 'none,' accepting messages from any web address, and did not verify that update-setting messages came from an approved sender. The keyboard layout it accepted was allowed to contain HTML. The restricted Preview, acting as an untrusted sender, could therefore post two messages to the main page: one replacing a virtual keyboard layout with attacker HTML, and one telling MathLive to show the keyboard, rendering that HTML. Thus an untrusted frame crossed the sandbox boundary into the authenticated session. The researchers confirmed the impact with controlled proof that private conversation data could leave the victim's session.

## HN discussion

Based on 10 selected comments and replies.

Commenters largely criticized the &#36;5,000 bounty: yellow&#95;lead called it low for an account takeover requiring only a clicked link, Catloafdev likened it to a dismissive payment from a trillion-dollar company, and Kuyawa called it a joke and wished OpenAI ill. lxgr connected the report to a separate desktop-app issue allowing remote filesystem access in Work chats, while randomblock1 noted the Work-mode UI warns that cloud sessions can access the user's computer. zahlman found the technical write-up hard to follow and questioned how the Preview content was controlled; 0c3ca83 suggested the post reads like SEO-oriented marketing. dumberquestions and trungto discussed hand-written blogs, with trungto citing a personal site built without LLM assistance. usernametaken29 tied the bug to monolithic codebases and questioned OpenAI's agent-driven development claims.

Selected comments: [yellow&#95;lead](https://news.ycombinator.com/item?id=50315474) · [Catloafdev](https://news.ycombinator.com/item?id=50317858) · [lxgr](https://news.ycombinator.com/item?id=50315324) · [zahlman](https://news.ycombinator.com/item?id=50318963) · [dumberquestions](https://news.ycombinator.com/item?id=50315175) · [usernametaken29](https://news.ycombinator.com/item?id=50315368)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50314699>)

## Media

![Image: The public share modified the real ChatGPT page](<https://www.parameter.ai/labs/images/openai-public-share-modified-page.png>)

[Image: The public share modified the real ChatGPT page](<https://www.parameter.ai/labs/images/openai-public-share-modified-page.png>)

![Image: Controlled proof that private conversation data could leave the victim's session](<https://www.parameter.ai/labs/images/openai-private-chat-exfil-proof.png>)

[Image: Controlled proof that private conversation data could leave the victim's session](<https://www.parameter.ai/labs/images/openai-private-chat-exfil-proof.png>)
