---
publish: true
content_type: "post"
title: "Whistle: Speech to Text in 16.9 MB"
description: "Whistle is an open speech-recognition model from the team behind Needle, intended for mobiles, wearables, robots, smart home devices, automotive systems and microcontrollers. It ships as a single 16.9 MB file, runs on the CPU without depend"
date: "2026-10-08T16:59:39.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://cactuscompute.com/blog/whistle"
discussion_url: "https://news.ycombinator.com/item?id=50008427"
tags: ["source/hackernews","topics/models","topics/inference","topics/products"]
---

## Article

Whistle is an open speech-recognition model from the team behind Needle, intended for mobiles, wearables, robots, smart home devices, automotive systems and microcontrollers. It ships as a single 16.9 MB file, runs on the CPU without dependencies, and loads into the same C++ engine, container and quantisation as Needle, so one binary can turn an audio clip into tool calls. It supports English, German, French, Spanish, Italian, Dutch and Polish, with language detected unless specified, and reaches its first token in 11 ms.

Whistle performs three tasks on device: transcription of 16 kHz mono audio up to 30 seconds in one pass; word timestamps with start, end and probability aligned from the decoder's attention; and speech embeddings, one row per 80 ms frame taken from the encoder output without decoding a transcript. In the browser sandbox, the model is downloaded on first press and audio never leaves the device.

The pipeline is described in detail. Audio is framed with a 25 ms window and 10 ms hop into 80 log-mel bins band-limited to 250-3500 Hz, giving 3,000 frames for 30 seconds. A convolutional stem of 128 channels and kernel 9 halves the frame count three times, leaving 375 frames at one per 80 ms; every later stage runs at that rate. The encoder uses eight Simple Attention blocks with four mHC residual lanes and a Monarch Hadamard MLP instead of a feed-forward network, and its attention is non-causal, so a frame at 3 s can attend to one at 12 s.

The decoder uses eight Laddered Simple Attention blocks at width 512, 8 query heads to 2 KV heads, 48-dimensional queries and keys and 64-dimensional values, a 3-tap causal convolution on Q, K and V, and engram lookups at layers 3 and 7 over 18,432 slots. The speech-specific addition is one gated cross attention per layer, with K and V projected once per clip, so five beams cost five short transcript caches rather than five passes over the audio. Decoding uses five beams scored by length-normalised log probability, keyword biasing via an Aho-Corasick automaton, and a transcript capped at 320 tokens from a vocabulary of 8,192 text pieces plus 7 language tokens. A --audio-depth flag selects decoder layers while the encoder always runs all eight.

## HN discussion

Based on 10 selected comments and replies.

Commenters tested Whistle against practical and quality expectations rather than file size. One user took over an Echo Show with local speech tools: versus Qwen ASR 1.7B on an RTX 5080, Whistle recognised 70 of 170 messages correctly against Qwen's 168, and their fix was to constrain Whistle to a fixed set of trained templates rather than free-form dictation. A reply drew a parallel to CMU Sphinx4 and its grammar-constrained approach, wondering whether template or grammar guidance is returning.

Accuracy drew direct criticism. One commenter ran the "You can't handle the truth" monologue and reported "can handle" instead of "can't" plus words that were never spoken, warning against relying on it for faithful transcripts. Another reported a high error rate even with a podcast-quality microphone, comparing it to Dragon from twenty years ago and arguing models need to predict context to compensate for imprecise pronunciation.

Several commenters said size is not the main obstacle. One needs accuracy for an 84-year-old stroke survivor's dictation, though a reply argued that calls for a dictation-tuned model that drops umms and handles self-corrections. Others raised missing streaming output and uncertainty about how streaming handles corrections.

Selected comments: [skolos](https://news.ycombinator.com/item?id=50011633) · [bambax](https://news.ycombinator.com/item?id=50017722) · [INTPenis](https://news.ycombinator.com/item?id=50008908) · [ComputerGuru](https://news.ycombinator.com/item?id=50009019) · [albert&#95;e](https://news.ycombinator.com/item?id=50009740) · [hn&#95;submit](https://news.ycombinator.com/item?id=50020397)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50008427>)
