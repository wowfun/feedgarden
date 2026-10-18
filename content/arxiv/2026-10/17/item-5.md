---
publish: true
content_type: "post"
title: "SkillNEO: Non-Elitist Evolutionary Optimization of Agent Skills"
description: "Agent skills turn procedural knowledge into reusable artifacts, letting LLM agents accumulate and refine expertise from experience. Skill evolution improves those skills using execution feedback, but the authors note that a useful improv..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20926"
tags: ["source/arxiv","topics/agents","topics/research","topics/evaluation"]
---

Agent skills turn procedural knowledge into reusable artifacts, letting LLM agents accumulate and refine expertise from experience. Skill evolution improves those skills using execution feedback, but the authors note that a useful improvement may require several interdependent edits. Requiring an immediate reward gain can therefore discard partial repairs before their benefits appear.

SkillNEO, which stands for Non-Elitist Evolutionary Optimization for Agent Skills, allows new versions to receive further edits even when they score below earlier versions. It separates the choice of which version to use from the choice of which versions to keep improving. By comparing how related versions perform on the same task, it identifies working steps to preserve and remaining failures to fix, and it can revisit earlier versions when later evidence arrives.

The authors evaluated on 86 SkillsBench tasks in eight domains, including software engineering and office work. SkillNEO raised GPT-5.4 Mini's average reward from 49.1% to 66.4%, within the original-skill range reported for GPT-5.5 and GPT-5.6 Luna. Mini executes tasks, proposes revisions and edits skills, while final evaluation uses the same task instances. Gains appeared in all eight domains. The same skills improved stronger models without further editing: on the 41 tasks with modified skills, reuse improved Luna by 10.5 percentage points and placed GPT-5.5 10.6 points above its published original-skill reference. Execution records showed benefits for stronger models even when Mini still failed some task requirements, and search histories included lower-scoring versions that led to skills ultimately selected for use.
