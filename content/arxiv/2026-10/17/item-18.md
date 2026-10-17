---
publish: true
content_type: "post"
title: "Auditing Escalation Reliability in Healthcare LLM Agents: A Perturbation-Controlled Benchmark of Workflow-State Failures"
description: "Trustworthy biomedical AI requires reliable action selection when evidence is missing, stale, conflicting, or late, not only accurate answers on static inputs. The authors instantiate an episode-level evaluation protocol with 400 synthet..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21270"
tags: ["source/arxiv","topics/agents","topics/health","topics/evaluation"]
---

Trustworthy biomedical AI requires reliable action selection when evidence is missing, stale, conflicting, or late, not only accurate answers on static inputs. The authors instantiate an episode-level evaluation protocol with 400 synthetic healthcare workflow episodes: 40 hand-authored semantic seeds across four task classes, two surface parameterizations, and five controlled variants. Episodes are scored on four actions—ANSWER, ASK CLARIFICATION, ABSTAIN, and ESCALATE—under a pre-declared 5:1 missed-versus-unnecessary escalation cost. Reference actions are single-author study-policy labels, not clinician-adjudicated ground truth.

Across five open-weight configurations from 1.7B to 9.7B parameters, clean decision accuracy reaches 0.97, yet uncertainty-prompted models miss 32% to 97% of required escalations. The stronger 9.7B configuration narrows but does not remove the gap, falling from 0.97 clean accuracy to 0.78 under conflict. Verbalized confidence is inconsistent, with ECE of 0.10 to 0.54 and failure AUROC of 0.48 to 0.77, and a development-tuned confidence-only policy yields no utility gain.

A transparent workflow-aware controller improves 5:1 utility for every model and reduces missed escalations to 0.12–0.24 at specificity of 0.83–0.93. However, a 30-concept lexical stress test reduces each rule detector's recall from 1.00 on trigger phrases to 0.00 on unseen paraphrases, limiting the controller claim to this benchmark. Seed-clustered statistics, ablations, cross-task transfer results, raw outputs, and manifests are packaged for audit. The results motivate explicit workflow-state evaluation while showing that apparently effective routing controls need their own generalization tests.
