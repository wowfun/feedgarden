---
publish: true
content_type: "post"
title: "Show HN: Jevman – AI decision models play Pac-Man"
description: "Jevman is an open-source benchmark that pits AI decision models against the classic arcade ghosts in Pac-Man. Seven models played 100 games each, and the project publishes a leaderboard ranking them by mean score, alongside replays of every"
date: "2026-10-08T16:34:13.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://opper.ai/jevman-benchmark/"
discussion_url: "https://news.ycombinator.com/item?id=50007993"
tags: ["source/hackernews","topics/evaluation","topics/agents"]
---

## Article

Jevman is an open-source benchmark that pits AI decision models against the classic arcade ghosts in Pac-Man. Seven models played 100 games each, and the project publishes a leaderboard ranking them by mean score, alongside replays of every game and a way for visitors to play against them. Models run through Opper are labeled as such; community models were run by their makers, with continuous integration replaying every submitted game to check its score and using the latency and cost figures those makers reported.

Mechanically, the game asks the model one question at every junction, supplying the maze, pellets and ghosts as state as JSON. The model returns a probability per direction and Pac-Man takes its pick, using those odds where a model provides them. Runs are real time with a 2-second deadline per answer; a slower answer is replaced by a simple backup rule and counted under backup moves. Each game uses the classic scripted ghosts, three lives or a 5-minute cap. None of the games came close to the cap: the longest lasted 2 minutes 24 seconds.

Scoring uses the mean score with a 95% margin of error, computed as ±2 standard errors, and models within each other's margin are treated as tied. The high score is a model's best single game. Every game is recorded and replays exactly, so results can be checked independently. The benchmark is meant to be extended: any model behind an HTTP endpoint can play, whether hosted, fine-tuned or running on a laptop. A 34-line example endpoint in the repository shows how to start, one command runs the games under the leaderboard's rules, and submitting a pull request adds a model to the leaderboard as a community entry.

## HN discussion

Based on 10 selected comments and replies.

Commenters were enthusiastic and focused on methodology. hung asked why the model is queried only at junctions rather than at every tick, since Pac-Man can change direction at any point. The author &#40;felix089&#41; replied that per-tick queries would not work with model latency, but noted it is partly covered because a model is asked again when a ghost enters its corridor, and pointed to a README explaining that the next junction is known when a character commits to a corridor. The same author later updated that doubling the tested models via community contributions produced a new number one and over 1,000 games played against decision-model ghosts. gsandahl predicted a model trained on this game will eventually take the top spot.

NichoPaolucci said they still beat the models at Pac-Man and liked the shared pool idea, describing a crowdfunded credits approach for a toy project; the author mentioned an "AI wallet" for users to pay for their own inference. nico asked whether locally runnable, CPU-trainable models and classifiers are tested too, citing their own Doom-playing project, and the author said not yet but the repo supports adding custom models. soltanov was skeptical of cloud API inference for Pac-Man, arguing a 2 MB local ONNX model on a CPU core beats network round-trip jitter.

Selected comments: [hung](https://news.ycombinator.com/item?id=50015449) · [felix089](https://news.ycombinator.com/item?id=50018518) · [felix089](https://news.ycombinator.com/item?id=50022442) · [NichoPaolucci](https://news.ycombinator.com/item?id=50014799) · [nico](https://news.ycombinator.com/item?id=50014967) · [soltanov](https://news.ycombinator.com/item?id=50016032)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50007993>)
