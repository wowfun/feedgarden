---
publish: true
content_type: "post"
title: "Developer open-sources Game Summoner, a multi-agent prompt-to-game pipeline"
description: "The developer behind gamesummoner.com has open-sourced the system under an MIT license in the ai-agent-test repository. The project generates playable games from a prompt and is described as a full, scalable, deployable website; the author "
date: "2026-10-08T17:09:01.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wki3/open_sourcing_game_summoner_my_prompt_to_game_site/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

The developer behind gamesummoner.com has open-sourced the system under an MIT license in the ai-agent-test repository. The project generates playable games from a prompt and is described as a full, scalable, deployable website; the author says it runs well on a 5090 with 64 GB of RAM, but any model capable of tool calls should work. They note it is not a clean turnkey repo: setup is tailored to their own Digital Ocean deployment with RunPod and AWS as hosted GPU providers, though a scripts/local&#95;gpu.py script helps with running locally.

Architecture and generation flow:

- Requests go into a SQL-backed queue &#40;chosen because it is cheap and sufficient at this scale&#41;, and a worker long-polls, picks up the job and returns the result.
- A simple autoscaler manages the worker boxes, walking up the cost ladder across AWS and RunPod to find the cheapest available GPU and spinning up inference instances.
- Generation uses a team of agents to first produce a design document: one agent writes the high-level design, two more work in parallel on visual and engineering aspects, and a fourth integrator combines them.
- The same model then receives a new prompt effectively asking it to build the game described in the design, with tools to test the game and take screenshots until it calls done.
- Validation includes a quick automated "play": the model looks at a photo, tries some input and observes the result. Exceptions and inputs that do nothing are returned as feedback and the loop repeats until none remain, at which point the result is marked complete.

Inference uses ninfer with Qwen 3.8 27B locally and a modified SGLang fork with Qwen 3.8 Flash-Next on a rented RTX 6000 in production, plus ComfyUI for image models. Two supporting repositories &#40;gamesummoner-workers and gamesummoner-images&#41; are also required. The author states the models used are well licensed, and estimates a couple of days of setup with an agent's help. He also mentions he is currently unemployed.
