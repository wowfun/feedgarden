---
publish: true
content_type: "post"
title: "I built MaRN: a PyTorch library for training neural networks through low-dimensional parameter mappings [P]"
description: "MaRN (Mapping Networks) is a PyTorch library that lets users optimize a compact latent representation instead of directly training every model parameter. The author reports results from current exploratory benchmarks, including synthetic da"
date: "2026-10-09T08:05:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x1fjrv/i_built_marn_a_pytorch_library_for_training/"
tags: ["source/reddit","topics/research","topics/coding"]
---

MaRN &#40;Mapping Networks&#41; is a PyTorch library that lets users optimize a compact latent representation instead of directly training every model parameter. The author reports results from current exploratory benchmarks, including synthetic data for some tasks, and states the benchmarks are not evidence of general superiority over direct training.

With an MNIST CNN, a 537,748-parameter model was reduced to 4,080 trainable parameters, a 131.8x reduction, with accuracy dropping from 99.07% to 98.10% &#40;down 0.97 percentage points&#41;. A smaller 107,998-parameter CNN was reduced to 1,872 trainable parameters, a 57.7x reduction, with accuracy falling from 98.83% to 97.18% &#40;down 1.65 percentage points&#41;. The author notes mapped models can train substantially slower and that performance varies by task.

The library includes global and layer-wise mappings, regularization options, and pruning and low-rank decomposition integrations. The author is seeking feedback on the approach, benchmark design, and where this kind of parameter-efficient optimization could be useful.
