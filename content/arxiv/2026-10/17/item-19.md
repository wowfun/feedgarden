---
publish: true
content_type: "post"
title: "Diviner: Agentic RCA with Human-Governed Adaptation for Large-Scale Infrastructure"
description: "Root-cause analysis in large-scale distributed systems is difficult because a single symptom can cross service, data, configuration, compute and organizational boundaries. Responders must assemble incomplete evidence while coordinating e..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21281"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

Root-cause analysis in large-scale distributed systems is difficult because a single symptom can cross service, data, configuration, compute and organizational boundaries. Responders must assemble incomplete evidence while coordinating experts who each hold part of the causal path. The authors argue that generic language-model agents do not solve this through tool access alone: they can rely on stale or mistimed context, read a failed query as an absent symptom, report system state the evidence does not support, and overload observability services built for human-paced use.

Diviner &#40;Domain-Informed Verifiable Incident Navigation through Evidence and Review&#41; is an agentic RCA system operating at Meta, organized around a four-stage reliability lifecycle. Encode combines a large corpus of reviewed incidents with service-owner expertise to produce scoped, versioned skills, workflows, typed tools and an incident knowledge graph. Execute uses an adaptive Lead and context-isolated workers to apply that knowledge to point-in-time evidence and maintain hypotheses explicitly linked to evidence.

Evaluate compares saved investigation trajectories against responder-reviewed outcomes, measuring exact cause, useful direction and Groundedness. Adapt turns recurring gaps and on-call feedback into focused operational-knowledge updates, which are admitted only after replay, quality checks and owner approval.
