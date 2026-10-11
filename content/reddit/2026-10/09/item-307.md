---
publish: true
content_type: "post"
title: "I built ALHR: A tree based sparse attention system that achieves sub-quadratic inference while retaining accuracy. [P]"
description: "ALHR (Adaptive Learnable Hierarchical Routing) is a sparse attention system that uses static binary trees and learnable functions to minimize the number of keys read per query. The author notes it relies on a dense teacher during phase 1 of"
date: "2026-10-09T13:29:43.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x1lem3/i_built_alhr_a_tree_based_sparse_attention_system/"
tags: ["source/reddit","topics/inference","topics/research"]
---

ALHR &#40;Adaptive Learnable Hierarchical Routing&#41; is a sparse attention system that uses static binary trees and learnable functions to minimize the number of keys read per query. The author notes it relies on a dense teacher during phase 1 of training.

In an MQAR test at 1,024 tokens, a dense baseline read an average of 512 keys per query with 94.9% top-1 accuracy, while ALHR read an average of 30 keys per query with 92.1% top-1 accuracy. That corresponds to a 35.3x KV compression, or 2.83% of keys read, with 100% cache compression reported for ALHR. Peak VRAM was 57 MB for the dense model, which scales quadratically, versus 422 MB for ALHR, which scales linearly.

The author states the work has limitations: full-scale tests are not yet complete, and while training remains quadratic, inference would be N log N as indicated in the repository logs. The true log and the Kaggle cell used to run the test are included in the logs folder of the repository.
