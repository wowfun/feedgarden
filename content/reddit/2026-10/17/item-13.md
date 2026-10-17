---
publish: true
content_type: "post"
title: "Rust framework DenseCore matches PyTorch's nanoGPT training bit for bit"
description: "A computer-science student has built DenseCore, a small deep-learning framework in Rust with a PyTorch-like Python API, and reports that Karpathy's nanoGPT produces bit-for-bit identical results when its import torch line is pointed at D..."
date: "2026-10-16T18:49:12.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:56.708Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x7ojxo/p_my_rust_framework_trains_nanogpt_with_the_exact/"
tags: ["source/reddit","topics/coding","topics/open-source"]
---

A computer-science student has built DenseCore, a small deep-learning framework in Rust with a PyTorch-like Python API, and reports that Karpathy's nanoGPT produces bit-for-bit identical results when its import torch line is pointed at DenseCore. The comparison used the same initial weights from manual&#95;seed and matched loss, gradients and weights for all 50 tested steps, including with dropout enabled.

Getting there required reproducing several non-obvious PyTorch behaviors: its CPU attention uses a flash-attention kernel and switches paths when dropout is on; Adam rounds differently on the tail elements of each thread's chunk because of compiler tail-loop fusion; and clip&#95;grad&#95;norm&#95; multiplies by reciprocal&#40;&#41; &#42; max&#95;norm rather than dividing. The author also found PyTorch does not match itself across machines: with the same version on macOS versus Linux x86, only 1 of 26 tested ops produced identical bits. DenseCore therefore matches only on Apple Silicon Macs. It is about 2 MB versus roughly 580 MB for PyTorch.

The student asks whether the project is useful or just a learning exercise, and floats three directions: continue copying PyTorch until most of it works, become a lightweight drop-in for small CPU workloads such as serverless and CI, or become a tool that explains why two PyTorch runs diverge.
