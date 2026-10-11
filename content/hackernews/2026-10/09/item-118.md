---
publish: true
content_type: "post"
title: "bigarrow: a macOS tool that lets AI agents draw arrows, boxes and text on the screen"
description: "bigarrow (big-arrow-on-the-screen) is an MIT-licensed macOS command-line tool, paired with a skill for Claude Code and Codex, that draws an arrow and a sign on top of every window. The stated problem is that an agent may refactor a monorepo"
date: "2026-10-09T11:03:48.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/franzenzenhofer/big-arrow-on-the-screen"
discussion_url: "https://news.ycombinator.com/item?id=50018817"
tags: ["source/hackernews","topics/agents","topics/coding","topics/products"]
---

## Article

bigarrow &#40;big-arrow-on-the-screen&#41; is an MIT-licensed macOS command-line tool, paired with a skill for Claude Code and Codex, that draws an arrow and a sign on top of every window. The stated problem is that an agent may refactor a monorepo or write a migration, but when it needs one human click it can only print "please click Allow" into a terminal nobody is watching. A single Swift binary renders one transparent window above everything, across every display and Space, while clicks pass through and keyboard focus stays put; the arrow removes itself afterward. The author says drawing requires no macOS permission at all, and that the tool has no daemon, menu-bar icon, account, telemetry or AI inside.

The command line takes an element, an app and a sign text, for example pointing at "Allow" in System Settings with the message that Ghostty may want to control the Mac. Options cover direction, style &#40;ring, box&#41;, shape &#40;straight, zigzag&#41;, colour, size, border, corner sharpness and a close button; some commands raise the window or select a tab first. Values written as &#123;&#123;...&#125;&#125; in the sign become a copy button for pasting codes or commands. A --say option reads the sign aloud.

The author frames the use cases as permission prompts, OAuth consent and "Open with...?" dialogs; human-only steps such as 2FA, CAPTCHAs, passkeys, payments and signatures; pasting a code, URL or command; and guided instruction, such as pointing at each step in Blender. The repository also offers a six-page PDF guide whose screenshots were produced by arrows drawn by an agent, and it documents staged real-app scenes on macOS 27. Code samples in the article include walking a user through System Settings privacy toggles and through Keynote or TextEdit steps.

The author notes arrows have existed since roughly the Paleolithic and argues what changed is that agents now do real work on a Mac and eventually hit a step only a human may perform. No benchmarks, adoption figures or independent evaluation are provided; the claims about permissions and window behaviour are the author's own, and the README also discusses prior art.

## HN discussion

Based on 10 selected comments and replies.

Reaction was sharply divided. A top commenter dismissed the whole direction: computers were cheap, efficient and powerful, and now a solved task is 1000x more expensive, depends on someone else's rented compute, and needs a robot to say which button to press; a reply argued computers were never actually used efficiently. One commenter said the "does it need Screen Recording or Accessibility?" section is too unclear to follow, then raised a security question: if bigarrow can draw over permission prompts, what stops it from covering a Decline button or rewriting an Approve button's label?

Others defended the project on accessibility grounds, comparing it to the soup-to-nuts PC tutorials of the past and saying it could help disabled or less technical users; a reply agreed Hacker News was unfairly dunking on something useful for people who do not live at a computer. On presentation, one commenter praised the line about spending an unreasonable amount of time on how the arrow looks, while another said the screenshots show badly misaligned arrows and messy labels, adding that the author later replaced a screenshot. A separate complaint called attention-grabbing popups and "Got it&#33;" notifications the worst UX trend of the decade and asked why anyone would want this.

Selected comments: [sicktriple](https://news.ycombinator.com/item?id=50022929) · [hn8726](https://news.ycombinator.com/item?id=50019459) · [kogus](https://news.ycombinator.com/item?id=50024169) · [tangotaylor](https://news.ycombinator.com/item?id=50021210) · [socializer](https://news.ycombinator.com/item?id=50021946) · [internet101010](https://news.ycombinator.com/item?id=50026433)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50018817>)

## Images and video

- [Image: A real macOS desktop, Hacker News of 2014-06-10 in Chrome, nine bigarrow arrows in nine colours from every side: same since 2007, already argued in 2014, not a lurker? log in, the article is in here, remember me? &#40;Firefox 30&#41;, nothing. noth](<https://github.com/franzenzenhofer/big-arrow-on-the-screen/raw/main/docs/images/hero-hn.png>)
- [Image: bigarrow pointing at a dialog's Allow button](<https://github.com/franzenzenhofer/big-arrow-on-the-screen/raw/main/docs/images/demo.gif>)
- [Image: System Settings, Device Control and Data Access: a green arrow with a close button, Franz, switch this on: Terminal may control your Mac, and an orange zigzag ring on the plus button: Not in the list? Plus. Then find it.](<https://github.com/franzenzenhofer/big-arrow-on-the-screen/raw/main/docs/images/real/settings.png>)
