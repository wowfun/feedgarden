---
publish: true
content_type: "post"
title: "Porting Classic Mac OS to Nintendo Wii"
description: "A developer has ported classic Mac OS to Nintendo's PowerPC-based hardware, reaching the desktop on a Wii for both System 7.6 and Mac OS 9.2.2. The work targets consoles using ArtX chipsets like the GameCube and Wii, building on OpenBIOS..."
date: "2026-10-30T17:25:15.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://virtuallyfun.com/2026/10/29/my-favourite-powermac-is-a-nintendo-wii/"
discussion_url: "https://news.ycombinator.com/item?id=50307190"
tags: ["source/hackernews","topics/hardware","topics/coding"]
---

## Article

A developer has ported classic Mac OS to Nintendo's PowerPC-based hardware, reaching the desktop on a Wii for both System 7.6 and Mac OS 9.2.2. The work targets consoles using ArtX chipsets like the GameCube and Wii, building on OpenBIOS work from a prior Mac OS X port to the platform.

Bringing up the system required adapting a big-endian ELF loader, writing disk drivers for the EXI bus &#40;including SD Gecko and a custom EXI-IDE driver for emulation&#41;, and booting via OpenBIOS and the Trampoline bootloader using a TBXI ROM. A key hurdle was patching the Trampoline's assumptions about physical memory layout. According to the developer, this marks what is likely the first time classic Mac OS has been brought to the desktop on new non-Apple hardware since the CHRP clone era.

The project was done solo without AI assistance purely for learning. While still not ready for public release, the milestone shows classic Mac OS running on Wii hardware, with images and video demonstrating boot to the desktop.

## HN discussion

Based on 10 selected comments and replies.

Commenters noted renewed interest in the Wii following the shutdown of Mario Kart Tour on mobile, with modded consoles seeing new software and restored online play. Several recognized the developer from previous work porting NT to Mac and GameCube/Wii hardware. Others reflected on the console's legacy, recalling the hype around motion controls and its cultural impact ahead of its upcoming 20th anniversary.

Selected comments: [unfocused](https://news.ycombinator.com/item?id=50308039) · [unleaded](https://news.ycombinator.com/item?id=50312359) · [chamomeal](https://news.ycombinator.com/item?id=50315909)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50307190>)

## Media

![Image: Mac OS 9.2.2 booted on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos922_wii1_00-00-59.png>)

[Image: Mac OS 9.2.2 booted on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos922_wii1_00-00-59.png>)

![Image: Mac OS 7.6 booted in my hacked up Dolphin tree](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_dolphin.png>)

[Image: Mac OS 7.6 booted in my hacked up Dolphin tree](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_dolphin.png>)

![Video: Mac OS 7.6 booting on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_wii1-2.mp4>)

[Video: Mac OS 7.6 booting on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_wii1-2.mp4>)
