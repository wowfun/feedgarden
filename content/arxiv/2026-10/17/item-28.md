---
publish: true
content_type: "post"
title: "MemCut benchmarks whether LLM agents truly forget secrets held in long-term memory"
description: "Long-term memory is now a core part of large language model agents, but most work optimizes retrieving relevant information rather than deleting sensitive user data on request. MemCut is a systematic benchmark for that second capability:..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21405"
tags: ["source/arxiv","topics/agent-memory","topics/evaluation","topics/security-privacy"]
---

Long-term memory is now a core part of large language model agents, but most work optimizes retrieving relevant information rather than deleting sensitive user data on request. MemCut is a systematic benchmark for that second capability: 456 hand-designed secrets placed in long-horizon conversations, each carrying fully annotated evidence trails so that recovery can be tested after deletion, including from messages that never state a secret directly.

The benchmark defines two recovery metrics. Native recovery measures whether a reader can still recover a secret through the system's own retrieval, while residual recovery measures the same reader's success when handed surviving objects traced to annotated disclosures or evidence. The authors establish three reference deletion baselines and test how far existing retrievers and write models support forgetting across five memory designs and four LLMs.

Removing disclosures cut native recovery far more than residual recovery. When an LLM guided the deletion of ten additional turns chosen from twenty retrieval candidates, 39-76% residual recovery remained, depending on configuration. Subset sweeps over 144 facts, three systems and two models showed that widening the candidate pool at a fixed budget reduced residual recovery more than deleting all original candidates did, identifying candidate coverage as a bottleneck in the reference baselines. The practical implication is that a dependable memory system needs deletion guarantees audited on indirect evidence, not only on the explicit sentences that state a secret.
