---
publish: true
content_type: "post"
title: "Infinite Mac adds BeOS to its browser-based retro OS collection"
description: "Infinite Mac now lets users run multiple BeOS versions directly in the browser, with full disk images streamed on demand, access to preinstalled software, CD-ROM mounting from the Internet Archive, and a saved drive for persistent work. ..."
date: "2026-10-30T19:30:09.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://blog.persistent.info/2026/10/infinite-mac-beos.html"
discussion_url: "https://news.ycombinator.com/item?id=50309029"
tags: ["source/hackernews","topics/products","topics/hardware"]
---

## Article

Infinite Mac now lets users run multiple BeOS versions directly in the browser, with full disk images streamed on demand, access to preinstalled software, CD-ROM mounting from the Internet Archive, and a saved drive for persistent work. The project builds on DingusPPC, a PowerPC emulator, which was already used by the site for classic Mac systems. Adding an OS developed independently from Apple exposed a series of small compatibility issues in the emulator: BeOS's bootloader expected no modifier keys held &#40;triggering a partition screen&#41;, screen depth changes required notifying both the video controller and DAC in an order BeOS handled differently, early BeOS versions did little-endian video memory updates that were missing from DingusPPC, and HFS mounting was stricter about disk structure than what some generated images produced. Most fixes were upstreamed to DingusPPC, and in the process the emulator's hardware modeling became more accurate. The work also confirmed BeOS can run under SheepShaver in this setup after a separate fix for ROM memory mapping, and the author notes this is likely the only emulator configuration capable of running PowerPC BeOS. Practical implications are mostly about preservation and exploration: users can compare BeOS side by side with contemporaries like OPENSTEP in the browser, and the same emulator improvements may help bring up other alternate OSes such as MkLinux and Rhapsody. The effort reflects a tradeoff common in emulation work - correctness for one OS can rely on quirks of another, and adding a new target reveals them.

## HN discussion

Based on 10 selected comments and replies.

Discussion in this sample revolves less around the implementation details and more around BeOS's legacy. One commenter asks what might have happened if Apple had bought BeOS instead of NeXT, and a reply points to former Be employees' view that NeXT was the stronger technical choice at the time, citing BeOS's C++ ABI/compiler lock-in and perceived gaps in areas like networking and printing. Others look to the present: one recommends Haiku OS as the FOSS successor, while another recalls using BeOS as their primary OS in the early 2000s and praises its look and feel. A separate thread questions what the modern equivalent of the BeBox's GeekPort might be, reflecting nostalgia for hardware-hacking accessibility. These are individual perspectives rather than a settled consensus, and they touch on counterfactuals, succession, and lost platform affordances.

Selected comments: [sfblah](https://news.ycombinator.com/item?id=50310152) · [ndiddy](https://news.ycombinator.com/item?id=50310477) · [renehsz](https://news.ycombinator.com/item?id=50309208) · [hobo123](https://news.ycombinator.com/item?id=50314453) · [Singletail](https://news.ycombinator.com/item?id=50310127)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50309029>)

## Media

![Image: BeOS R5 running inside Infinite Mac, showing GL Teapot, Mandelbrot, Gobe Productive, Terminal, image viewer and CPU monitor.](<https://persistent.info/images/infinite-mac-beos-desktop.webp>)

[Image: BeOS R5 running inside Infinite Mac, showing GL Teapot, Mandelbrot, Gobe Productive, Terminal, image viewer and CPU monitor.](<https://persistent.info/images/infinite-mac-beos-desktop.webp>)

![Image: Infinite Mac emulating BeOS R5 emulating System 7.6.1 running Speedometer](<https://persistent.info/images/infinite-mac-beos-sheepshaver.webp>)

[Image: Infinite Mac emulating BeOS R5 emulating System 7.6.1 running Speedometer](<https://persistent.info/images/infinite-mac-beos-sheepshaver.webp>)

![Image: Infinite Mac custom instance dialog with a BeOS control appearance.](<https://persistent.info/images/infinite-mac-beos-appearance.webp>)

[Image: Infinite Mac custom instance dialog with a BeOS control appearance.](<https://persistent.info/images/infinite-mac-beos-appearance.webp>)
