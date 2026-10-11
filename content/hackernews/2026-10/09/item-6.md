---
publish: true
content_type: "post"
title: "Show HN: Making a flexible neon t-shirt with LED filaments"
description: "When his employer announced a neon-themed event less than a week in advance, the author used the deadline to turn LED filaments that had sat in his parts bin for years into a wearable neon shirt. The write-up covers parts, technique and con"
date: "2026-10-08T16:37:24.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "http://scottbezek.blogspot.com/2026/10/making-flexible-neon-t-shirt-with-leds.html"
discussion_url: "https://news.ycombinator.com/item?id=50008047"
tags: ["source/hackernews","topics/hardware"]
---

## Article

When his employer announced a neon-themed event less than a week in advance, the author used the deadline to turn LED filaments that had sat in his parts bin for years into a wearable neon shirt. The write-up covers parts, technique and constraints.

LED filaments are flexible strips of hundreds of tiny LEDs inside a roughly 1.8mm silicone diffuser. They are mass-produced for Edison-style bulbs and readily available for DIY use; Adafruit calls them noodles. The parts list includes 600mm warm white 12V filaments, 300mm red 3V filaments and a 1200mm red 24V filament, a USB battery bank, an ESP32, a constant-current LED boost driver such as the TPS61169 plus a ULN2003A transistor-array breakout, a black t-shirt, black thread, stiff cross-stitching &#40;Aida&#41; cloth as backing, tissue paper and heat shrink tubing.

A plain cotton shirt is too soft to support sewn-in filament shapes without bunching, so he backed it with the stiff fabric and held everything under tension in an embroidery hoop. Designs were drawn on tissue paper, the filament was loop-stitched in place every few centimetres, and the paper was torn away afterwards.

Because the filaments cannot be cut to length, each design had to match an available size. He drew a continuous path in Inkscape and used its Measure Path feature to scale the drawing to the filament length. The back is a llama built from a single 1200mm 24V red filament; the front is cursive neon text in the Playwrite Belgie Vlaandere font with a Vegas-inspired border, taking a roughly 900mm path made from several 300mm 3V filaments.

## HN discussion

Based on 9 selected comments and replies.

Commenters shared related builds and safety cautions. One describes embedding the same filaments in latex prosthetics such as horns or face pieces, liking the cyberpunk look but warning that the strips resist solder: too little heat and the joint fails, too much damages the filament, and crimped metal contacts solve it only by sacrificing end flexibility. Another recounts a child's store-bought costume whose filament began failing within a day; while hunting for the bad connection he was shocked, and measured 240V from two AA batteries, which he could not believe. A reply suggests that costume more likely used electroluminescent wire, which requires high drive voltages; a third commenter says he abandoned an EL-wire project after a shock and finds 24V much nicer. Others praise the PWM ramp-up and animation, the careful photos and the quality of the write-up, while one quotes the author's own caveat that the shirt is not machine-washable, nor really hand-washable, and argues that solving washability would be the valuable unlock.

Selected comments: [wolvoleo](https://news.ycombinator.com/item?id=50015985) · [khaki54](https://news.ycombinator.com/item?id=50014200) · [throawayonthe](https://news.ycombinator.com/item?id=50014496) · [IshKebab](https://news.ycombinator.com/item?id=50013087) · [4d4m](https://news.ycombinator.com/item?id=50008474) · [peter&#95;d&#95;sherman](https://news.ycombinator.com/item?id=50026576)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50008047>)

## Images and video

- [Image](<https://scottbez1.github.io/LedNeonShirt/IMG_0582%202.jpeg>)
- [Image](<https://blogger.googleusercontent.com/img/a/AVvXsEgs97-o3J1ajkrgSlL30Hi0TEdzSvL-0gPDR_GZX2oN0XAuFdG4264P2tlPh2fVHuyS_Q0neFBiChV43SyFa1_2Mo-2k2mdla1Eh4pCt-q30Z1dRTqpfarkzVJhUilzCMTwz1jJ-XiaiS7v9MwEf_8j1wo7qm39Dcxb0zgIjIfYZhznmWIJHy-OQMzwDGo=w640-h480>)
- [Image](<https://blogger.googleusercontent.com/img/a/AVvXsEi9sSVYZFaXBVnzyDY7JFKH_PXSKFgPuwiMEbao5G14IOvU-iLHJrnENqK6IYsVb6U9Vi5q0bEWB8LmhpI_hzExGMppLnKwk6edb43TZCITUdk2LJZdwjIQ790SRRuZ5hS5Gss0dhtdFItcaKf4A_kVmcP7VCyZC0E08_AEfe3_dv-3qnnlgMh4_z_whEw=w640-h374>)
