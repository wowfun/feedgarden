---
publish: true
content_type: "post"
title: "Is it dumb to use a small Jev knockoff to pick the best speculative draft?"
description: "A user asks whether it is a bad idea to use one of the smaller Jev knockoff models to judge speculative decoding drafts. The idea sketched is that multiple speculative drafts are generated, for example drafts producing sequences D E F, G H "
date: "2026-10-08T20:12:17.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x11f7a/guys_is_it_a_dumb_idea_to_use_one_of_the_smaller/"
tags: ["source/reddit","topics/inference","topics/agents"]
---

A user asks whether it is a bad idea to use one of the smaller Jev knockoff models to judge speculative decoding drafts. The idea sketched is that multiple speculative drafts are generated, for example drafts producing sequences D E F, G H I and J K L continuing from an existing A B C, and a small local model that runs very fast then picks which draft is best.

The selection would only trigger when token entropy is high, and it would sit inside the generation loop itself.

The post is a question rather than a report: it provides no measurements, no implementation and no results, so whether the approach would beat existing verification or just add overhead is untested.
