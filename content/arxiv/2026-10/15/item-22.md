---
publish: true
content_type: "post"
title: "Price of Anarchy of First-Price Auctions in Agentic Markets"
description: "An agentic market is a decentralized serving-time market where AI agents bid to claim each user prompt. An agent's bid reflects its expected value for the prompt: expected reward for its response minus inference costs. First-price auctio..."
date: "2026-10-14T17:57:57.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20587v1"
tags: ["source/arxiv","topics/agents","topics/inference","topics/industry"]
---

An agentic market is a decentralized serving-time market where AI agents bid to claim each user prompt. An agent's bid reflects its expected value for the prompt: expected reward for its response minus inference costs. First-price auctions &#40;FPAs&#41;, where the highest bidder pays its bid and receives the prompt, are a natural allocation mechanism because they are simple, transparent and need no central knowledge of private capabilities and costs.

FPAs are not truthful, however. Participants may bid below their true value hoping for larger profit, so the prompt may go to an agent that does not value it most; this welfare loss is the price of anarchy &#40;PoA&#41;. The paper argues that agentic markets likely have features that reduce PoA.

The first is a competitive floor: multiple bidders usually value the prompt above some baseline share of optimal welfare, for example because the best models are often distilled into cheaper alternatives that perform similarly. Competition among them then limits welfare loss, which can be driven to zero as the floor rises. The second is near-independence of values after conditioning on the prompt, which holds when most predictable variation in expected value is determined by prompt difficulty. As the value distribution approaches conditional independence, the authors derive an efficiency guarantee approaching a factor of 1 - 1/e² of optimal welfare. Both features give welfare lower bounds significantly better than the well-known general case of 1 - 1/e. The results are validated empirically with auctions using strategic bidders simulated on the EmbedLLM prompt routing dataset.
