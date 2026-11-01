---
publish: true
content_type: "post"
title: "How long do you need to hold down the power button to turn off a PC?"
description: "Raymond Chen describes a Windows behavior tied to holding a PC's power button. After 12 seconds, the machine powers off at the hardware level without notifying the operating system, a safety measure for when the OS shutdown command fails..."
date: "2026-10-31T08:43:32.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.osnews.com/story/146273/how-long-do-you-need-to-hold-down-the-power-button-to-turn-off-a-pc/"
discussion_url: "https://news.ycombinator.com/item?id=50314243"
tags: ["source/hackernews","topics/hardware"]
---

## Article

Raymond Chen describes a Windows behavior tied to holding a PC's power button. After 12 seconds, the machine powers off at the hardware level without notifying the operating system, a safety measure for when the OS shutdown command fails. After eight seconds of holding the button, the Windows kernel detects an attempted forced power-off and captures a kernel dump, uploaded to Windows Error Reporting on next boot. The author notes a discrepancy: most PCs power off after only a few seconds—roughly 4–5 seconds according to most sources—so the 12-second hardware cutoff and 8-second dump trigger seem rarely reached. The forced power-off delay is handled by motherboard hardware, such as a microcontroller, not by Windows; ATX provides standby power and a button press shorts the power pin to ground, prompting the OS to shut down, while a sustained hold forces power off. Despite the apparent rarity, Chen says these “long power button hold” &#40;LPBH&#41; dumps do arrive at Microsoft, and he reviews them; cases where the screen is entirely black are sub-classified as “black screen LPBH” and routed to a special team. The author speculates that Windows might adapt its dump timing to the motherboard or chipset drivers, but this is unresolved and he invites more informed explanations.

## HN discussion

Based on 8 selected comments and replies.

Commenters offered several explanations and anecdotes. superjan wondered whether the 12-second rule applies only when the OS fails to respond to a power-down request. throwa356262 joked that Microsoft may not have coordinated with hardware makers. Wowfunhappy found it spooky that the dumps reportedly reach Microsoft. benlivengood suggested server and consumer motherboards differ: BMCs log data, and some laptops report MANUALLY&#95;INITIATED&#95;POWER&#95;BUTTON&#95;HOLD after roughly eight seconds. epihelix noted modern laptops' embedded controller, not the OS, handles hard power-off, so lockups can still be powered down. NightPageReader said most PCs shut off quickly but Lenovo laptops seem to require a longer hold.

Selected comments: [superjan](https://news.ycombinator.com/item?id=50315604) · [throwa356262](https://news.ycombinator.com/item?id=50314814) · [Wowfunhappy](https://news.ycombinator.com/item?id=50315529) · [benlivengood](https://news.ycombinator.com/item?id=50317451) · [epihelix](https://news.ycombinator.com/item?id=50315781) · [NightPageReader](https://news.ycombinator.com/item?id=50314804)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50314243>)
