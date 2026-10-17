---
publish: true
content_type: "post"
title: "Claude reveals ECDSA curve origins"
description: "Anthropic says an internal research model, Claude, worked out how the seeds behind NIST's standard ECDSA elliptic curves were generated, a question that had been open for decades. According to the company's account, the answer came in un..."
date: "2026-10-16T18:55:59.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/ecdsa-curve-origins"
discussion_url: "https://news.ycombinator.com/item?id=50122800"
tags: ["source/hackernews","topics/security-privacy","topics/research"]
---

## Article

Anthropic says an internal research model, Claude, worked out how the seeds behind NIST's standard ECDSA elliptic curves were generated, a question that had been open for decades. According to the company's account, the answer came in under half an hour in October 2026, after an employee asked the model to investigate without pointing it at the longstanding rumor. The seeds for the P-192, P-224, P-256, P-384 and P-521 curves were not hashes of a passphrase, as earlier speculation held, but output from the C library's lrand48 pseudorandom generator seeded with a Unix timestamp.

The context is FIPS 186-2, which NIST adopted in 2000 and which lists standard curves at several security levels. Each published seed is hashed to define the curve coefficient b, but the seeds arrived from the NSA without explanation. Critics, including Neal Koblitz and Alfred Menezes in "A Riddle Wrapped in an Enigma," worried the parameters might have been chosen to hide weaknesses, and a bounty was offered for their origin. A 2015 recollection by NSA's Jerry Solinas suggested a hash of a humorous phrase; Anthropic says that turned out to be wrong. Solinas died in 2023, and former colleagues did not provide further details.

The reconstruction is mechanical: lrand48 is initialized with a timestamp and asked for 20 bytes per iteration, with the first 20 bytes as candidate one, the next 20 as candidate two, and so on; P-256's seed appeared at iteration 1,842. Anthropic stresses that this is not a cryptographic break, a new attack or a weakness in the curves. It argues the opposite: a simple, clock-seeded and now reproducible process leaves much less room for deliberate subversion, making backdoors less plausible and the parameters more trustworthy. It also says users have no action to take.

## HN discussion

Based on 10 selected comments and replies.

Commenters press on whether the reconstruction really settles how the curves were selected. fidotron argues that showing how candidate seeds were produced says nothing about which candidates were discarded, so searching timestamps for a curve with a desired property remains conceivable. FiloSottile replies that even trying every 1997 timestamp and choosing among early viable candidates amounts to only about 30 bits of freedom, and that a class of weak 256-bit curves large enough to be hit that way would itself be a cryptanalytic breakthrough; he cites section 3.1 of Koblitz and Menezes. sweis notes that the passphrase-hash story, which Solinas repeated in 2015 and which he had corroborated with four people including two former NSA staff, was simply wrong. teddyh points out that the fifth binary seed, B-163, remains unexplained and may contain a transcription error. Others joke about years of tinfoil hats and call the news devastating for NIST conspiracy theories.

Selected comments: [fidotron](https://news.ycombinator.com/item?id=50123213) · [FiloSottile](https://news.ycombinator.com/item?id=50125469) · [sweis](https://news.ycombinator.com/item?id=50123174) · [teddyh](https://news.ycombinator.com/item?id=50123292) · [tptacek](https://news.ycombinator.com/item?id=50123044)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50122800>)

## Media

![Image](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fe8e7bb885a5e83cbcfe80e5b25f5ef7203c558ba-2912x1016.png&w=3840&q=75>)

[Image](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fe8e7bb885a5e83cbcfe80e5b25f5ef7203c558ba-2912x1016.png&w=3840&q=75>)

![Image](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7ca7925885873b75479af7573759d7b784cf67ac-2912x1880.png&w=3840&q=75>)

[Image](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7ca7925885873b75479af7573759d7b784cf67ac-2912x1880.png&w=3840&q=75>)

![Image](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F38a85c534c21b7786af3c321056ae6527946f706-2912x3768.png&w=3840&q=75>)

[Image](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F38a85c534c21b7786af3c321056ae6527946f706-2912x3768.png&w=3840&q=75>)
