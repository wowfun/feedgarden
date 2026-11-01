---
publish: true
content_type: "post"
title: "Show HN: A USB-C LTE modem that gives my computer a phone line"
description: "This project is a 4-layer, 85×65 mm open hardware board that gives a computer its own cellular phone line over a single USB-C cable. Plugging in a nano-SIM with a voice plan and the cable exposes three ordinary USB devices through an on-..."
date: "2026-10-31T15:56:41.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://github.com/Koppar-AI/koppar-lte-modem"
discussion_url: "https://news.ycombinator.com/item?id=50317331"
tags: ["source/hackernews","topics/hardware"]
---

## Article

This project is a 4-layer, 85×65 mm open hardware board that gives a computer its own cellular phone line over a single USB-C cable. Plugging in a nano-SIM with a voice plan and the cable exposes three ordinary USB devices through an on-board hub: an LTE data network adapter &#40;Quectel EC25-EUX, with 3G/2G fallback on European bands&#41;, serial ports for AT commands &#40;caller ID, SMS, answering&#41;, and a USB sound card &#40;RP2040&#41; carrying call audio as microphone and speaker. There is no battery, screen or speaker; three LEDs indicate network, ring and call status. Power comes from 5 V USB-C, with a 3.8 V/3 A buck for the modem's 2 A transmit bursts and 3.3 V for the hub, RP2040 and flash. The 5.1 kΩ CC resistors make the board a USB sink that negotiates nothing, so a USB-A or 1.5 A source can brown out during a 2G burst. Sourcing a 3 A USB-C port is therefore required for reliable operation, especially during transmit bursts on 2G fallback bands, and the design notes call out the Quectel module's LGA-144 footprint and the antenna feed impedance of 49 Ω as critical assembly details that must not be overlooked when ordering parts or configuring the stackup. The repository also includes the KiCad 10 project, Gerbers and drill files, IPC-2581, a schematic PDF, JLCPCB assembly BOM and placement files, RP2040 sound-card firmware and a REVIEW.md; assembly targets JLCPCB with a specified 4-layer, 1.6 mm stackup. The Quectel module, two LTE antennas &#40;698–2690 MHz, U.FL&#41;, nano-SIM and USB-C cable are sourced separately, and U8 must be deselected at assembly and soldered by hand. Notable caveats: VoLTE depends on carrier whitelisting and the correct Quectel MBN profile; 2G/3G fallback still works in Europe for now. There is no BOOTSEL button—a blank RP2040 boots into its USB bootloader, with labelled pad groups on the back for recovery &#40;BOOT+GND, SWD, USB&#95;BOOT+1V8 for emergency download mode&#41;. Two footprints lack 3D models in KiCad's library.

## HN discussion

Based on 9 selected comments and replies.

Commenters raised several practical concerns. gruez questioned whether the modem supports VoLTE, warning it could become unusable as carriers shut down 2G/3G; abijahkaj &#40;the submitter&#41; replied that the Quectel EC25-EUX supports VoLTE natively with the same PCM audio path, but that real-world VoLTE depends on carrier whitelisting and loading the correct Quectel MBN profile, and that 2G/3G remains available in Europe for now. Vaushite dismissed the project as “AI vibed” and likely unbuildable, an assertion the submitter did not address in the sampled replies. mycall asked whether LTE would survive 6G rollout in three years; wolrah argued that LTE's OFDM-based air interface lets towers dynamically share spectrum between generations, making a hard cutoff unlikely. whalesalad said they would like the board as a Framework module. The sample reflects a mix of technical questions, skepticism and enthusiasm rather than consensus.

Selected comments: [gruez](https://news.ycombinator.com/item?id=50320356) · [abijahkaj](https://news.ycombinator.com/item?id=50320617) · [Vaushite](https://news.ycombinator.com/item?id=50319590) · [mycall](https://news.ycombinator.com/item?id=50318605) · [wolrah](https://news.ycombinator.com/item?id=50319757) · [whalesalad](https://news.ycombinator.com/item?id=50320640)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50317331>)

## Media

![Image: The board, 85 x 65 mm, 4 layers](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/hero.png>)

[Image: The board, 85 x 65 mm, 4 layers](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/hero.png>)

![Image: Top](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/top.png>)

[Image: Top](<https://github.com/Koppar-AI/koppar-lte-modem/raw/main/images/top.png>)

![PDF: PDF](<https://github.com/Koppar-AI/koppar-lte-modem/blob/main/board/fab/schematic.pdf>)

[PDF: PDF](<https://github.com/Koppar-AI/koppar-lte-modem/blob/main/board/fab/schematic.pdf>)
