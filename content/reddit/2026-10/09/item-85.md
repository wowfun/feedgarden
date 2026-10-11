---
publish: true
content_type: "post"
title: "Opus 5.5 turned one video still into a 13-second cartoon written as JavaScript"
description: "A reddit user reports an experiment in which Claude Code (Opus 5.5) produced a 13-second, 1080p cartoon with sound starting from a single screenshot. The author says no image or video model was used: every frame is drawn by JavaScript the a"
date: "2026-10-09T00:32:02.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x17fb4/i_gave_opus_55_one_frame_of_peppa_pig_it_wrote/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

A reddit user reports an experiment in which Claude Code &#40;Opus 5.5&#41; produced a 13-second, 1080p cartoon with sound starting from a single screenshot. The author says no image or video model was used: every frame is drawn by JavaScript the agent wrote inside KitCut, an animation editing platform where each frame is a pure function of time, so the model wrote the code rather than painting pixels itself.

Input was one frame screenshotted from a YouTube "Swimming with Peppa" video at the 1:41 mark. Across four prompts taking roughly 90 minutes, the agent produced 645 lines of JavaScript and zero generated images; rendering took 29 seconds. In a first round it reproduced the pool setting &#40;fence, deck, ladder, tree&#41; but drew unfamiliar bears and cats, noting the show's characters belong to someone else and were not redrawn.

After the author said the still was his own, the agent measured rather than traced: it cut the frame into gridded 4x crops and read outlines, eyes and pupils, fitting the fence at a period of 65.6 px and slope 0.76, then repeating the fit after a first measurement drifted 24 px near the left edge. It solved the water as a single colour at one alpha from visible above- and below-surface cues, concluding that the "blue stripe" on the large character is skin seen underwater.

Later prompts asked for a 10-second wave-and-jump animation and then three more seconds of close-up splashing with an "organic" transition. Motion is built as poses and arcs: an arm is a group swung about its shoulder, a jump is a crouch plus a constant-gravity arc and a plunge settling into a bob, and splashes land on the right frames because sound and picture read the same clock. For the transition the agent had a small rabbit throw water at the lens, so the water runs down off the glass; it also observed that a flat-colour wipe "reads as a broken frame even for four frames" and added bubbles.

The author is explicit about limits: this is not an episode but 13 seconds in one location, in a flat-shape style he calls the kindest case, with no dialogue and motion that is poses and arcs rather than acting. He frames it as an unofficial experiment and notes Peppa Pig belongs to Hasbro, with no affiliation or endorsement.

## Images and video

- [Image: I gave Opus 5.5 one frame of Peppa Pig. It wrote 645 lines of JavaScript and handed back a 13-second cartoon.](<https://external-preview.redd.it/eGI2YndndnY2Y3VoMWEh3W9K21Hwnpl1Ohf_Jcf14evxL8dy0mzmhKLHP8Zg.png?width=640&crop=smart&auto=webp&s=a1b57626a691cef3d8420ee4cc37c32de3eab329>)
