---
publish: true
content_type: "post"
title: "New sparse attention method for ultra-long context"
description: "The team behind an open-source research project describes new approaches to attention. They report that the attention of Qwen 3.8 27B can be sparsified without observed loss in accuracy, and that extending context to 10 million tokens re..."
date: "2026-11-02T22:24:18.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:00:42.305Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmbj0v"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1xmbj0v/new_sparse_attention_method_for_ultralong_context/"
tags: ["source/reddit","topics/models","topics/inference"]
---

The team behind an open-source research project describes new approaches to attention. They report that the attention of Qwen 3.8 27B can be sparsified without observed loss in accuracy, and that extending context to 10 million tokens reduces accuracy on some specific tasks while most tasks such as NIAH remain fine. They also report that sparse attention can be trained natively using next-token prediction loss alone, achieving the same validation loss as full attention but faster. The work focuses on H200/B300 GPUs and larger-scale systems, and the authors say it can also be applied to small open-weight models to make longer context cheaper on local hardware. The kernels, SGLang integration, paper, and details are all openly available.
