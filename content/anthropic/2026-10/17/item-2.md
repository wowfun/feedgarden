---
publish: true
content_type: "post"
title: "Designing more efficient quantum circuits with Claude"
description: "Quantum computers need carefully designed circuits to run useful algorithms on hardware that still offers only hundreds to thousands of noisy qubits, where errors from heat, vibration and other disturbances accumulate. Anthropic gave Cla..."
date: "2026-10-16T17:29:00.000Z"
updated: "2026-10-17T04:55:05.144Z"
first_seen: "2026-10-17T04:47:21.425Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/designing-efficient-quantum-circuits"
tags: ["source/anthropic","topics/quantum-physics","topics/research","topics/coding"]
---

Quantum computers need carefully designed circuits to run useful algorithms on hardware that still offers only hundreds to thousands of noisy qubits, where errors from heat, vibration and other disturbances accumulate. Anthropic gave Claude plain-language specifications for eight circuits drawn from chemistry, optimization, physics simulation and number theory, together with an automated evaluator that checks and scores each design. Working largely on its own, Claude produced designs that improve on the best published circuits, in some cases by an order of magnitude or more — reductions that could lower the quantum resources useful applications require and bring practical machines closer.

The work was led by Andi Gu as part of Anthropic's STEM Fellows Program, mentored by the company's quantum physicist Alek Kemeny, in collaboration with Susanne Yelin and Mikhail Lukin of Harvard University &#40;Lukin is also at QuEra Computing&#41;; the full paper is on arXiv.

The economics of quantum hardware make gate counts decisive. Toffoli gates are among the most expensive operations, so counting them is a standard way to estimate runtime. For FeMoco, the iron–sulfur cluster at the heart of nitrogenase, researchers estimated in 2017 that computing its ground-state energy would need about 50 trillion Toffoli gates. Algorithmic advances have since brought that to roughly 340 million gates — a 150,000-fold reduction corresponding to a few hours on a future machine with about three million physical qubits — mostly through circuit redesign rather than better hardware. Claude was considered well suited to the task because quantum circuits can be described in code, letting it write, run and revise designs as ordinary programs.
