---
publish: true
content_type: "post"
title: "Verdict Without the Rule: Diagnosing and Auditing Regulatory Rule Sensitivity in LLM Compliance Systems"
description: "Large language model compliance systems are deployed on the assumption that a verdict depends on the regulatory rule it is given. The authors test this directly across five models and 20 regulatory and platform-policy domains: they delet..."
date: "2026-10-08T16:59:40.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12313v1"
tags: ["source/arxiv","topics/evaluation","topics/agents","topics/industry"]
---

Large language model compliance systems are deployed on the assumption that a verdict depends on the regulatory rule it is given. The authors test this directly across five models and 20 regulatory and platform-policy domains: they delete, swap or negate the governing rule while holding the case fixed, then check whether the verdict changes &#40;a metric they call OCS&#41; or whether the model's internal representation of compliance shifts at all &#40;ICS-delta&#41;.

Neither moves much. Model verdicts are often invariant to substantial perturbations of the supplied rule. The guard model, evaluated here under a custom-rule adaptation of its native taxonomy, is the least rule-sensitive and least accurate of the five, performing barely above chance at 51%, versus 90–92% for general-purpose models. The authors note this reflects easy cases more than blanket neglect: on cases where deleting the rule changes a previously correct model prediction, models do track the rule closely.

They also report that neither better prompting nor direct intervention on the model's internal representations closes this gap. The central implication is that accuracy alone does not establish that a compliance verdict is grounded in the supplied rule, which matters for audit and assurance claims about such systems.
