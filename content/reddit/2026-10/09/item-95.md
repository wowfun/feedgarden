---
publish: true
content_type: "post"
title: "ThinkingBox: Solving an agent task once vs. solving it 20/20: 507 stateful workflows graded on terminal database state [R]"
description: "ThinkingBox is a benchmark that measures how much of an agent's single success rate survives repetition, and whether \"the agent finished the task\" means the backend database actually reached the correct state. The paper, code, dataset, and "
date: "2026-10-09T00:50:36.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x17shf/thinkingbox_solving_an_agent_task_once_vs_solving/"
tags: ["source/reddit","topics/agents","topics/evaluation"]
---

ThinkingBox is a benchmark that measures how much of an agent's single success rate survives repetition, and whether "the agent finished the task" means the backend database actually reached the correct state. The paper, code, dataset, and a Hugging Face OpenEnv environment are public; raw evaluation trajectories are not released.

ThinkingBox-Bench contains 507 policy-conditioned business workflows across five domains: retail, travel and hospitality, auto insurance, neobank internal IT, and consulting IT/HR. Each task runs in 20 independently executed attempts from an identical clean backend, giving 10,140 trials per model. A simulated user holds private context and reveals it only when asked. Grading compares terminal backend state and side effects against the required end state; any trajectory reaching the right outcome passes, while wrong, missing, or extra effects fail. A total of 477 of 507 tasks are graded on state alone, and 30 also check a narrow property of the final response. Three metrics are reported: pass@1, pass@20, and all-20, where all-20 is an observed count on a fixed trial budget rather than an estimator.

Discovery and repeatability rank models very differently. Kimi-K3 had the broadest coverage measured, solving 93.89% of tasks at least once &#40;476/507&#41; but only 13.41% &#40;68/507&#41; on all 20 attempts. Claude Opus 5 discovered fewer &#40;79.09%&#41; and repeated far more &#40;47.53%, or 241 tasks&#41;. Qwen3.8-27B reached 89.35% at least once and 7.50% every time. Ranking by pass@20 and by all-20 produces nearly reversed leaderboards.

Failures often look clean. In a retrospective ablation over 121,680 valid trials across 12 models, 79,853 failed the executable checks, and 67.24% of those still terminated cleanly, invoked a state-changing tool, and ended without a final tool error, so a completion-style proxy would have scored them as done. Among those clean terminating failures the overlapping categories were wrong field values &#40;77.61%&#41;, unintended extra effects &#40;43.30%&#41;, and missing required effects &#40;25.36%&#41;.

The authors caution that tasks are synthetic reconstructions of enterprise workflow patterns rather than production traffic, that 20/20 on the trial budget is not a guarantee of future reliability, and that the simulated user is a fixed LLM, a source of variance discussed in the appendix. Failure categories are deterministic diagnostic labels, not causal explanations. Anyone can run the 507 tasks against their own model through the HF OpenEnv environment. The appendix reports both the observed all-20 count and a plug-in pass^k estimate, which answer different questions: one records what happened in a fixed 20-attempt campaign, the other estimates repeated success under additional assumptions. The authors ask which should be emphasized on a reliability leaderboard, or whether both should be shown.

## Images and video

- [Image: ThinkingBox: Solving an agent task once vs. solving it 20/20: 507 stateful workflows graded on terminal database state &#91;R&#93;](<https://external-preview.redd.it/q3evP6JeDpAC2MdSQHWYxnCYTqbJkElIQsLFqVSdkss.png?width=140&height=81&auto=webp&s=d39c4c208d55b26179446aa55ac5f84224359090>)
