---
publish: true
content_type: "post"
title: "Libreboot 26.10 \"Ominous Olive\" released with UEFI, Chromebook support"
description: "The submitter argued that attention on the release's AI policy missed the bigger story: UEFI/EDK integration and Chromebook support greatly expand the devices Libreboot can target and should make future devices easier to add. A commenter..."
date: "2026-10-15T12:52:16.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://libreboot.org/news/libreboot2610.html"
discussion_url: "https://news.ycombinator.com/item?id=50102923"
tags: ["source/hackernews","topics/open-source","topics/hardware","topics/ai-code-policy"]
---

## HN discussion

Based on 9 selected comments and replies.

The submitter argued that attention on the release's AI policy missed the bigger story: UEFI/EDK integration and Chromebook support greatly expand the devices Libreboot can target and should make future devices easier to add.

A commenter working on the Heads firmware project agreed, describing their own effort to port ChromeOS devices: a first ChromeOS port using MrChromebox's code as an upstream dependency was merged, a second is in progress, and a third came from someone else. They were surprised Libreboot added all the ChromeOS devices at once, since adding two ports for Heads has not been easy. The submitter replied that seeing both efforts advance together is encouraging, noted Heads has important features Libreboot lacks, and speculated that porting is harder when those features need neutered rather than removed blobs, while acknowledging uncertainty about Heads' internals.

On the separate AI controversy, one commenter cited the repository's AGENTS file as evidence the project dislikes AI. Another called the stance extreme, quoting text that a heavily AI vibe-coded U-Boot fork is useless to Libreboot and that the author will not encourage or facilitate AI use, while noting that dependencies such as GCC and GRUB contain AI-assisted commits.

Elsewhere, a commenter highlighted that all 233 supported Chromebooks were imported from the MrChromebox coreboot distro, that Baytrail &#40;Kip&#41; was tested while others need testing, and that the release is source-only with no binaries. A reply mused that running Libreboot on a Google Pixel would be a surprising second life for a phone never meant to be a Chromebook. One commenter assumed Chromebooks already ship with Coreboot support; the submitter clarified that Libreboot is not Coreboot but a freedom-oriented distribution of it that removes binary blobs and Intel ME. These are individual commenters' views and recollections, not verified statements.

Selected comments: [iamnothere](https://news.ycombinator.com/item?id=50103753) · [cwiggs](https://news.ycombinator.com/item?id=50104073) · [kyrra](https://news.ycombinator.com/item?id=50103233) · [ImaCake](https://news.ycombinator.com/item?id=50103400) · [AdmiralAsshat](https://news.ycombinator.com/item?id=50103336) · [iamnothere](https://news.ycombinator.com/item?id=50104329)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50102923>)
