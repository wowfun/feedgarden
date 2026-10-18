---
publish: true
content_type: "post"
title: "Claude reveals ECDSA curve origins"
description: "An Anthropic Frontier Red Team post describes how Claude settled a decades-old question about ECDSA, the most widely used elliptic curve cryptography standard, adopted by NIST in 2000 as part of the FIPS 186-2 Digital Signature Standard...."
date: "2026-10-16T17:02:00.000Z"
updated: "2026-10-17T04:55:05.144Z"
first_seen: "2026-10-17T04:47:21.425Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/ecdsa-curve-origins"
tags: ["source/anthropic","topics/security-privacy","topics/history"]
---

An Anthropic Frontier Red Team post describes how Claude settled a decades-old question about ECDSA, the most widely used elliptic curve cryptography standard, adopted by NIST in 2000 as part of the FIPS 186-2 Digital Signature Standard. For curves over prime and binary fields, the specifications published a "seed" whose hash value defines the curve's coefficient b. The seeds were supplied by the NSA without explanation, fueling speculation about possible deliberate weaknesses; the NIST P-256 seed, for example, is C49D3608 86E70493 6A6678E1 139D26B7 819F7E90. Neal Koblitz and Alfred Menezes summarized the controversy in "A Riddle Wrapped in an Enigma," and an amateur bounty sought the answer.

The leading story, recalled by longtime NSA employee Jerry Solinas, held that the seeds were hashes of a humorous passphrase such as "Give Bob and Jerry a raise," with colleague Bob Reiter writing the code. No archives survived, Solinas died in 2023, and the story turned out to be wrong. In October 2026 an Anthropic employee asked an internal research model; without being pointed at the clue, Claude found in under half an hour that the P-192, P-224, P-256, P-384 and P-521 seeds came from the C library's lrand48 random-number generator, initialized with a Unix timestamp. Each iteration drew 20 bytes as a candidate seed; P-256 required 1,842 iterations.

Anthropic stresses that this is not a cryptographic break, attack or weakness. Because the seeds came from a simple, reproducible clock-seeded pseudorandom generator, deliberate subversion looks much less plausible, and the finding should increase confidence that the parameters are secure. The post says there is no action to take.
