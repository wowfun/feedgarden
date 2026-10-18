---
publish: true
content_type: "post"
title: "Designing More Efficient Quantum Circuits with Claude"
description: "Anthropic reports that Claude, given only plain-language specifications for eight quantum circuits drawn from chemistry, optimization, physics simulation and number theory, produced designs that improve on the best published circuits, so..."
date: "2026-10-16T18:00:18.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/designing-efficient-quantum-circuits"
discussion_url: "https://news.ycombinator.com/item?id=50121939"
tags: ["source/hackernews","topics/quantum-physics","topics/agents","topics/research"]
---

## Article

Anthropic reports that Claude, given only plain-language specifications for eight quantum circuits drawn from chemistry, optimization, physics simulation and number theory, produced designs that improve on the best published circuits, sometimes by an order of magnitude or more. An automated evaluator checked whether each design was correct and scored it; working largely on its own, Claude wrote, ran and revised circuits as code. The project was led by Andi Gu in Anthropic's STEM Fellows Program, with mentorship from Alek Kemeny and collaboration from Harvard's Susanne Yelin and Mikhail Lukin, also of QuEra; a paper is on arXiv.

Quantum computers store information in qubits, which exploit phenomena such as superposition, but machines built so far have only hundreds to thousands of qubits and are highly sensitive to heat, vibration and even cosmic rays. Errors accumulate, so researchers redesign algorithms to use fewer qubits and finish in less time. The article's example is FeMoco, the iron–sulfur cluster at the heart of the nitrogenase enzyme: a 2017 estimate put its ground-state energy calculation at about 50 trillion Toffoli gates, a costly gate whose count is a standard proxy for runtime. Earlier algorithmic advances have since cut that estimate to roughly 340 million gates—about a 150,000-fold reduction, or a few hours on a future machine with about three million physical qubits. Those gains came largely from redesigning circuits, not from better hardware.

Claude suits the task partly because quantum algorithms are implemented as circuits of gates, and circuits can be described in code, so its coding capabilities can write, run and revise designs. Anthropic says such improvements substantially reduce the quantum resources useful applications require, so practical quantum computers could arrive sooner than previously anticipated. The comparisons are with previously published designs, and the benefits assume future hardware that does not yet exist; the FeMoco gate-count reduction comes from prior algorithmic work, not this experiment.

## HN discussion

Based on 10 selected comments and replies.

Commenters focused on why the approach works and what the comparisons mean. keeganryan said the work builds on Google's Kickmix language for classically simulatable quantum circuits, likening optimization to code golf and noting that LLMs benefit from a closed verification loop that lets them test and discard ideas quickly; he added that such deep optimization was a good task to automate, while jacquesm framed it as AI filling in gaps inside an existing envelope of knowledge. adastra22 questioned whether removing components needed only for extremely rare inputs means the circuit no longer performs the same computation, while perching&#95;aix replied that the post states where such optimizations apply and that one example saves memory rather than compute. cgio asked why Bennet &#40;1973&#41; was not cited, and whoishiding summarized the reported reductions—up to 17× and 12×—as coming from reconstructing temporary data and replacing an algorithm with a better one.

Selected comments: [keeganryan](https://news.ycombinator.com/item?id=50122821) · [jacquesm](https://news.ycombinator.com/item?id=50123200) · [adastra22](https://news.ycombinator.com/item?id=50127006) · [perching&#95;aix](https://news.ycombinator.com/item?id=50127774) · [cgio](https://news.ycombinator.com/item?id=50127890) · [whoishiding](https://news.ycombinator.com/item?id=50122490)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50121939>)

## Media

![Image: Figure 2: Claude designed smaller and faster circuits across eight different quantum-circuit design tasks. Gray marks show the best previously published designs; orange marks and lines show Claude’s designs. Point addition, the eighth task,](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fd5d27ec3f141696918c6bed3f6b887f5b84e75f0-3840x2430.png&w=3840&q=75>)

[Image: Figure 2: Claude designed smaller and faster circuits across eight different quantum-circuit design tasks. Gray marks show the best previously published designs; orange marks and lines show Claude’s designs. Point addition, the eighth task,](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fd5d27ec3f141696918c6bed3f6b887f5b84e75f0-3840x2430.png&w=3840&q=75>)

![Image: Table 1: Resources for elliptic-curve point addition. Bold rows are Claude’s designs; the others are the best previously published designs. Sources: Schrottenloher &#40;2026&#41;, Luo et al. &#40;2026&#41;.](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7e8a0d4b9d7e826f25379d351ee6d2cab3900f84-3840x1052.png&w=3840&q=75>)

[Image: Table 1: Resources for elliptic-curve point addition. Bold rows are Claude’s designs; the others are the best previously published designs. Sources: Schrottenloher &#40;2026&#41;, Luo et al. &#40;2026&#41;.](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7e8a0d4b9d7e826f25379d351ee6d2cab3900f84-3840x1052.png&w=3840&q=75>)

![Video: Figure 1: Closed–loop quantum circuit optimization. Claude designs new implementations in Python, which are then sent to a programmatic evaluator. The evaluator checks whether the proposed implementation is correct, then scores it on the nu](<https://cdn.sanity.io/files/4zrzovbb/website/0e9f7b41ac662fb1b2544315dc7cae1967f1fff8.mp4>)

[Video: Figure 1: Closed–loop quantum circuit optimization. Claude designs new implementations in Python, which are then sent to a programmatic evaluator. The evaluator checks whether the proposed implementation is correct, then scores it on the nu](<https://cdn.sanity.io/files/4zrzovbb/website/0e9f7b41ac662fb1b2544315dc7cae1967f1fff8.mp4>)
