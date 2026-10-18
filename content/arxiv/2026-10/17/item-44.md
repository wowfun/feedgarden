---
publish: true
content_type: "post"
title: "The Self-Improvement Problem"
description: "The paper examines whether an automated gate—such as a reward model or an automated reviewer—can reliably decide whether a proposed update to a self-improving agent should be accepted. The authors note a structural mismatch: the gate mus..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21646"
tags: ["source/arxiv","topics/agents","topics/ai-safety","topics/agent-self-improvement"]
---

The paper examines whether an automated gate—such as a reward model or an automated reviewer—can reliably decide whether a proposed update to a self-improving agent should be accepted. The authors note a structural mismatch: the gate must be a terminating, computable procedure, while whether an update is a genuine semantic improvement depends on potentially unbounded program behavior. They model agents as programs and define improvement through a semantic score that need not be computable.

They study two abstractions: a certifier that approves or rejects an update, and a search procedure that, given a proposal generator, tries to output an improving candidate if one exists. In the fully general setting, they show that no terminating procedure can guarantee both reliability &#40;never accepting a non-improvement&#41; and non-conservatism &#40;never missing an available improvement&#41;; self-referential constructions can force any such gate or searcher to fail, and randomized gates with bounded error face the same limit.

The paper then identifies a standard decidable regime used in practice—bounded evaluation plus a finite proposal budget—in which exhaustive simulation yields a terminating search procedure with the desired guarantees. It also shows the limit of this recovery: a chain of accepted updates can raise the bounded score in every round while the true score falls. The results draw a boundary between unbounded, universal settings where correctness guarantees collapse and bounded settings where they can be recovered by design.
