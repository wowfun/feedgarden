---
publish: true
content_type: "post"
title: "Vitalik Buterin backs crypto 'bunker mode' amid rapid AI math advances"
description: "Ethereum co-founder Vitalik Buterin has endorsed a warning from Ethereum researcher Justin Drake that advances in artificial intelligence could undermine the cryptography securing today's blockchains sooner than quantum computers do. Dra..."
date: "2026-10-08T19:17:51.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://cointelegraph.com/news/justin-drake-urges-crypto-bunker-mode-as-ai-could-break-wallet-security-within-months"
discussion_url: "https://news.ycombinator.com/item?id=50010656"
tags: ["source/hackernews","topics/security-privacy","topics/research","topics/industry"]
---

## Article

Ethereum co-founder Vitalik Buterin has endorsed a warning from Ethereum researcher Justin Drake that advances in artificial intelligence could undermine the cryptography securing today's blockchains sooner than quantum computers do. Drake called on the industry to prepare for "bunker mode," arguing that AI could eventually make it feasible to break the elliptic curve digital signature algorithm &#40;ECDSA&#41; used to protect cryptocurrency wallets, and recommended a controlled migration of assets to fresh addresses whose public keys have not been exposed.

Drake attributed his concern to OpenAI's release on Tuesday of hundreds of new mathematical findings spanning algebra, theoretical computer science and mathematical logic. He also cited a recent effort in which a team of 10,000 autonomous AI agents working in parallel solved the Navier-Stokes equation, described as one of the most famous unsolved problems in mathematics and physics, in 88 hours. "Recent days have been humbling for human mathematical intuition," Drake said, adding that elliptic curves could be especially vulnerable because they carry rich structure, unlike hashes, which are designed to minimize algebraic structure.

Buterin said he does not advise anyone to rush to move funds immediately, but argued the risks to cryptography from AI-accelerated mathematics should be taken seriously. He extended the concern beyond elliptic curves to lattice-based cryptography, warning that systems believed to resist quantum attacks could also be weakened: most people assume "elliptic curves broken, hashes safe, lattices safe," but lattice security may take serious hits from the next two years of AI mathematics. He said this is a major reason Ethereum's lean roadmap has moved toward a "hash-only" direction. Dragonfly managing partner Haseeb Qureshi called Drake's warning "a very sober call," framing the risk as conventional mathematics overturning unproven cryptographic hardness assumptions rather than quantum computing.

On practical precautions, Drake recommended setting in motion a controlled mass migration of assets to fresh addresses, with large and sophisticated holders moving first, and suggested moving any remaining funds to a new address after signing a transaction. Buterin backed the precaution if it is straightforward, saying it is a good idea to keep funds in addresses not yet used for a transaction. Both cautioned about migration risk: Buterin said he has personally lost more money in botched migrations than in all hacks combined, and Drake warned that a rushed migration would do more harm than good.

## HN discussion

Based on 10 selected comments and replies.

Commenters largely redirected the debate away from mathematics. simonw argued cryptography's real weak point is end-user key safety, given decades of evidence that people cannot protect keys against a flood of new vulnerabilities in operating systems, browsers, wallets and personal agents; a reply linked the relevant xkcd comic.

The proposal's provenance drew skepticism. int32&#95;64 noted that "bunker mode" came from an Ethereum researcher, recalling the DAO-era chain reorganization, and asked what strong cryptographic primitives are worth if a leader can reorganize the chain. kinakomochidayo disputed the framing, describing it as an unusual smart-contract state change agreed by node operators, and added that Satoshi rolled back the chain in 2010 after a bug printed 184 billion BTC.

Others questioned the stakes and the technical bet. gumby asked whether a failure would have any macro consequence beyond individual losses, noting their own money is in broad index funds; DaveFr replied that Iran uses cryptocurrency to tax oil tankers through the Strait of Hormuz, so practical impact exists. notnullorvoid called pushing security toward hashes a worse bet if mathematics advances, while MattPalmer1086 countered that hashes have less algebraic structure, which is desirable for math resistance. j2kun said substantial effort has already gone into AI attacks on lattice problems underlying post-quantum cryptography without results, and wondered why lattices are now the specific worry absent insider knowledge.

Selected comments: [simonw](https://news.ycombinator.com/item?id=50011665) · [int32&#95;64](https://news.ycombinator.com/item?id=50011945) · [kinakomochidayo](https://news.ycombinator.com/item?id=50015982) · [gumby](https://news.ycombinator.com/item?id=50012628) · [DaveFr](https://news.ycombinator.com/item?id=50013232) · [j2kun](https://news.ycombinator.com/item?id=50011732)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50010656>)
