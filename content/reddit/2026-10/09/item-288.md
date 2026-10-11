---
publish: true
content_type: "post"
title: "Nine months building a video app with Claude and Codex, from picture selection to HDR and audio sync"
description: "A developer describes nine months of work on Immich Memories, a free, MIT-licensed, self-hosted app that turns a personal photo library into yearly recap films with titles, music and optional trip maps, able to run entirely locally. It star"
date: "2026-10-09T12:40:37.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1kbiy/nine_months_building_a_video_app_with_claude_and/"
tags: ["source/reddit","topics/products","topics/coding","topics/agents"]
---

A developer describes nine months of work on Immich Memories, a free, MIT-licensed, self-hosted app that turns a personal photo library into yearly recap films with titles, music and optional trip maps, able to run entirely locally. It started as a weekend project after the author missed the automatic memories Google Photos made for his son's pictures in his Immich library. Claude and Codex wrote most of the code, but the author says he had to supply the product ideas and learn to keep the engineering under control.

Selection was a major lesson. The first version scored every photo and kept the highest numbers; it worked technically but produced flat films. The model dropped a positive pregnancy test from a year recap because it scored 0.455 against a 0.53 threshold. Applying the author's photography training, the pipeline now culls, groups into moments, chooses within them and then sequences. No model proposed that change and the models had been content to build the scoring system as specified.

Media handling proved much larger than expected. The app reconstructs HDR photos from gain maps, keeps HLG and PQ video looking right, tone-maps for SDR output and draws titles that don't glare over HDR. Live Photos are stitched from overlapping motion, and because shutter timestamps are not precise enough, audio is matched to find the joins. A concrete example: a 0.25-second fade at 30 fps became seven frames, or 0.2333 seconds, while the audio still overlapped the full 0.25 seconds, leaving 800 extra samples per join at 48 kHz. Across 74 fades that put sound over a second ahead. Proving it required a synthetic clapper film with flashes and beeps measured from the rendered output; after the fix, a 75-clip test showed 0.7 ms of first-to-last drift. A short preview would not have caught it.

Models also needed evidence. One training experiment took 34 hours of labelling and lost to a simple rule over facts the app already stored, so it was deleted. Rendering on a two-core Synology was described as a better reminder of real user hardware than the development machine. The default now makes a complete film without an LLM or GPU, with optional models refining it.

The agent workflow relies on gates: every PR passes types, complexity, security and the test suite using the same checks run locally. But a gate can be satisfied stupidly — a 500-line file cap produced 23 mixins, including 11 on the assembler, shrinking files while worsening the design; fixing it meant restructuring and writing down the rule's intent. Product rules and their reasons now live in files agents read first because agents kept undoing decisions from earlier sessions. In one recorded day, Opus found defects in eight of nine film fixes written by Sonnet despite green tests, though the author frames that as evidence for another review rather than a guarantee. Codex reviewing Claude's PRs and vice versa also helped, especially on complex changes. The author does not read every diff but sets direction, inspects selected changes and judges the films, since a green suite cannot say whether a film is dull. Releases get real-library runs on Macs, Linux, a NAS and Kubernetes, and screenshots and demo videos have rebuild recipes. The app now runs on a nightly schedule in the author's own library and rarely needs the editor.

## Images and video

- [Image: Nine months building a video app with Claude and Codex, from picture selection to HDR and audio sync](<https://external-preview.redd.it/dawU9ifdhu-Oz9WQ-kS_DXqb3GqfXM819sPmrGYVE6A.jpeg?width=640&crop=smart&auto=webp&s=06b92d5d860b677096f913ab1276b034c2bedfcc>)
- [Video: Here's a film made from public CC0 footage](<https://sam-dumont.github.io/immich-memories/demo/trip-preview.mp4>)
