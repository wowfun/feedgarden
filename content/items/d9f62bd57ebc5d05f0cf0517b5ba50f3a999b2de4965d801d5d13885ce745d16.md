---
publish: true
content_type: "post"
title: "Shakespeare: a free macOS menu bar typing-stats app built with Claude Code"
description: "A developer released Shakespeare, a free, open-source (MIT), fully offline macOS menu bar app that counts how much you type and turns it into statistics. It was built with Claude Code. Features include keys typed today and over 14 days, a s"
date: "2026-10-09T10:25:31.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1hrzq/shakespeare_fun_typing_stats_for_your_mac_menu_bar/"
tags: ["source/reddit","topics/coding","topics/security-privacy","topics/hardware"]
---

A developer released Shakespeare, a free, open-source &#40;MIT&#41;, fully offline macOS menu bar app that counts how much you type and turns it into statistics. It was built with Claude Code.

Features include keys typed today and over 14 days, a streak for days with 50 or more keys, your busiest hour, and a count of "Hamlets" typed. It measures best words per minute over a full 60-second window, counting letters and spaces only, so shortcuts and arrow keys cannot inflate the number. Monthly badges named after Shakespeare works run from Couplet up to Complete Works; progress resets on the 1st and the collection tracks how many months each badge was earned. It also generates share cards &#40;a week or a badge&#41; drawn on a mechanical keyboard in one of nine colourways, saved as PNGs.

On privacy, the app reads only the numeric key code of each press, never the characters, so typed content cannot be reconstructed. Per-day counters are stored in a single owner-only file, and "top apps" tracking is opt-in and off by default.

On the build, the developer says they directed product and design while Claude wrote roughly 2,500 lines of Swift and SwiftUI, with review and iteration. Claude split the app into a tested layer and wrote the build, install and icon-generation scripts; for visuals, the developer supplied a reference site and browser pages and Claude drew the keyboard and cards in code and rendered them offscreen to check before showing them. It wrote 31 unit tests, including hostile stats files fed to the loader, and ran them under AddressSanitizer. The developer advises running security reviews constantly and double-checking work.

The app is free with no account or payment tier; building from source is required, and the installer builds, signs and launches it before opening the macOS settings page where the needed Input Monitoring permission is granted. Caveats: it requires Input Monitoring, so the developer suggests reading the source before trusting it, and letter detection assumes US key positions, so other layouts may be slightly off.

## Images and video

- [Image: Shakespeare: fun typing stats for your Mac menu bar](<https://preview.redd.it/ytgg69ar4fuh1.png?width=140&height=140&crop=1:1,smart&auto=webp&s=23cbf1b4d2326ad253e174c97006d5efb0812a5b>)
