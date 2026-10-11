---
publish: true
content_type: "post"
title: "I gave four coding agents $100 budget to build a PDF editor"
description: "A researcher who studies LLMs for code describes an experiment in which four coding agents — Gemini 3.8 Flash, GPT Astra 6, Opus 5 and Fable 5 — were each given a $100 budget, their own VM with free rein to install tools such as computer-us"
date: "2026-10-08T23:43:50.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://blog.nielstron.de/2026/10/08/the-remaining-shortcomings-of-coding-agents/"
discussion_url: "https://news.ycombinator.com/item?id=50014011"
tags: ["source/hackernews","topics/agents","topics/coding","topics/evaluation"]
---

## Article

A researcher who studies LLMs for code describes an experiment in which four coding agents — Gemini 3.8 Flash, GPT Astra 6, Opus 5 and Fable 5 — were each given a &#36;100 budget, their own VM with free rein to install tools such as computer-use utilities, and the task of building an open-source PDF editor with a great user experience. They were told to inspect existing tools and search for complaints about what users found lacking, ran in isolated harnesses so they could not influence one another, and were restarted after each return until the budget ran out. The author publishes the artifacts and links to the resulting web apps in a GitHub project.

The verdict: the implementations are okay but not great, and within a few clicks the author found bugs in almost all of them. His hypothesis is that agents do not interact with software the way people do — they do not pursue concrete goals, do not experience friction along the way, and look at the UI far less. His first criticism is structural: all four models chose to build a web app, whereas a PDF editor is most useful natively installed and set as the system's default viewer. One first public attempt by Gemini offered only npm installation instructions, which he counts as a failure; Astra did arrange a GitHub Pages deployment. In later, private runs no model appears to have spent effort making the apps locally installable or executable, for example as an Android app.

Background: the author argues the bottleneck for code generation has shifted. Six years ago no system could translate natural-language requirements into working code; ChatGPT answered that, and the problem became contextualizing — knowing existing functionality, language constraints and input shapes. Coding agents, described as general symbolic wrappers around LLMs that read, edit and execute code, are the answer there, with some reinforcement learning on top to shape goal-seeking behavior. He attributes the remaining human value to two things: keeping agents on track and pressing enter when they exit prematurely, and noticing and reporting broken or annoying behavior — the latter often conflated with "taste."

## HN discussion

Based on 7 selected comments and replies.

The thread largely engaged with the author's framing rather than disputing it. Boltgolt argued the key difference is the feedback loop that existed when hand-coding: inverted PDF colors in dark mode is a bug he could imagine creating himself, but he would have seen it immediately when testing whether dark mode works at all. CoolestBeans welcomed the more nuanced take relative to the usual "it's all slop" versus "you're an idiot for hand-coding" camps, and said his experience is that agents need cheap, easily runnable third-party ways to validate their work and stay on track — compilers and test suites, but also visual checks; for humans these help too, but the lack of feedback is catastrophic for agents. bentt distilled a minimal requirement: a PDF app that lets you scribble a signature would mostly suffice. alyssassan described a personal workflow of using Jev for simple steps and Fable or Opus only for planning or review. MiroslavPokorny questioned why the models reinvented the wheel and what new value was added, prompting ferrouswheel to reply, dismissively, asking whether he had read the piece.

Selected comments: [Boltgolt](https://news.ycombinator.com/item?id=50016027) · [CoolestBeans](https://news.ycombinator.com/item?id=50018013) · [bentt](https://news.ycombinator.com/item?id=50019770) · [alyssassan](https://news.ycombinator.com/item?id=50017709) · [MiroslavPokorny](https://news.ycombinator.com/item?id=50014126) · [ferrouswheel](https://news.ycombinator.com/item?id=50014935)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50014011>)

## Images and video

- [Image: Even if I had known where these pickaxes land, I would have preferred them unslanted &#40;original on the right&#41;.](<https://res.cloudinary.com/lesswrong-2-0/image/upload/v1791501283/lexical_client_uploads/djeznvao6rzwj33mesie.png>)
- [Image: Just give me a native binary please.](<https://res.cloudinary.com/lesswrong-2-0/image/upload/v1791499469/lexical_client_uploads/bpmeptaulf9rmbrcyzez.png>)
