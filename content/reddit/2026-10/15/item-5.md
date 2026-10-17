---
publish: true
content_type: "post"
title: "A 15M decision-only model: linear recurrence vs Transformer attention came down to cost, not accuracy"
description: "Inspired by TypeSafe's Jev — a non-generative model that only outputs bounded decisions such as choices, probabilities and calibrated confidence — a developer built two small decision models end-to-end on identical budgets and tasks to t..."
date: "2026-10-14T18:07:44.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:12.259Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x5yhr6/i_trained_a_15m_decisiononly_model_two_ways/"
tags: ["source/reddit","topics/research","topics/models","topics/evaluation"]
---

Inspired by TypeSafe's Jev — a non-generative model that only outputs bounded decisions such as choices, probabilities and calibrated confidence — a developer built two small decision models end-to-end on identical budgets and tasks to test which substrate makes a better Jev. The code is on GitHub.

Setup &#40;V4, the main result&#41;: each model has about 15.09M parameters, budget-matched to within ±0.02%. One uses a linear recurrent backbone &#40;a Gated Segmented State Space architecture from the author's linear-attention-lab&#41; plus a decision head; the other uses a standard attention backbone with an identical head. The task is long-context retrieval-decision: given a 2k–8k character passage, decide which of four sentences appears in it &#40;2000 train / 500 validation / 500 test, 25% chance baseline&#41;. Everything was trained on a Colab T4 and is reproducible in the notebooks.

Results: accuracy was noise — 26.8% for the linear model versus 28.2% for the Transformer on test, neither learning much at this scale. Latency showed a real crossover: the Transformer is faster below about 1,550 tokens, but at T=8192 the linear model is 2.37x faster &#40;108.6 ms vs 257.7 ms&#41;, the expected O&#40;T&#41; versus O&#40;T²&#41; behavior. Training speed showed the biggest gap: 6 finetune epochs took roughly 30 minutes for the linear model versus about 40–45 minutes per epoch for the Transformer at 2k–8k context, a 6–7x difference that worsens with scale. Earlier rounds &#40;V2/V3&#41; on shorter decision tasks had the linear model winning outright on accuracy &#40;50.4 vs 46.2 and 66.2 vs 61.0&#41;.

The author's conclusion: linear recurrence wins or ties on short-context decisions and dominates on long-context cost, but it does not learn the hard retrieval task better than attention at 15M. A V5 bidirectional variant of both models &#40;15M, same budget&#41; is running. The author stresses that the negative result is the point: small decision models are accuracy-starved at this scale regardless of substrate.
