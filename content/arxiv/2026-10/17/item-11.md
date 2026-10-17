---
publish: true
content_type: "post"
title: "Kolab: Benchmarking Human-Agent Collaboration in Long-Horizon Workflows"
description: "When humans collaborate with AI agents on long-horizon tasks, they value ongoing interaction, such as revising plans, more than an agent's ability to finish a task in a single attempt. Yet most agentic benchmarks emphasize automation, an..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21109"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

When humans collaborate with AI agents on long-horizon tasks, they value ongoing interaction, such as revising plans, more than an agent's ability to finish a task in a single attempt. Yet most agentic benchmarks emphasize automation, and strong automation scores do not imply effective real-world collaboration. To address this gap, the authors introduce Kolab, a dataset of more than 115 hours of screen recordings from 50 professionals across 40 occupations working with agents on realistic, long-horizon problems. It also includes participants' judgments of collaboration and output quality.

The analysis documents diverse collaboration patterns and highlights the importance of when and how professionals coordinate with agents. A collaborative agent must do two things that automation benchmarks never test: anticipate whether experts will adopt, modify, or reject its contribution once it leaves the chat window, and assess collaboration quality from the unfolding workflow without constant expert feedback. Kolab operationalizes both by asking models to forecast how professionals use agent contributions and to verify their judgments of satisfaction and output quality.

The findings show that frontier models, both agentic and non-agentic, overestimate collaboration with experts and struggle to distinguish high-quality from low-quality collaboration. Longer workflow context does not consistently improve these predictions. The authors conclude that frontier agents cannot yet understand long-horizon collaboration with experts and position Kolab as a dataset for studying human-agent collaboration grounded in real professional workflows.
