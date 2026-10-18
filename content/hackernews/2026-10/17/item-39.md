---
publish: true
content_type: "post"
title: "I never authorized an integration that scans my secrets"
description: "The Home Assistant developer who responded apologized for a dismissive tone and explained that the password check can already be disabled with ha security options --pwned=false. They said it has existed in the Supervisor for years, now c..."
date: "2026-10-16T20:33:41.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://github.com/home-assistant/home-assistant.io/issues/49314"
discussion_url: "https://news.ycombinator.com/item?id=50124251"
tags: ["source/hackernews","topics/security-privacy","topics/open-source"]
---

## HN discussion

Based on 10 selected comments and replies.

The Home Assistant developer who responded apologized for a dismissive tone and explained that the password check can already be disabled with ha security options --pwned=false. They said it has existed in the Supervisor for years, now covers app options marked as passwords, and that only the first five characters of a SHA-1 hash are sent to Have I Been Pwned, with matching done locally.

Commenters still argued the feature should be opt-in and conspicuous. One said users expect a home automation system, not something scanning for passwords; another called the unrequested external contact a breach of trust and cited research on attacks against k-anonymity password-checking schemes as evidence that truncated hashes leak useful signal. A dissenting question asked what the concrete security risk of sending five hash characters is, while another commenter said they never expected Home Assistant to talk to outside services unless they configured it.

Selected comments: [frenck](https://news.ycombinator.com/item?id=50124797) · [infinite&#95;spin](https://news.ycombinator.com/item?id=50125188) · [rubinlinux](https://news.ycombinator.com/item?id=50126721) · [Arcuru](https://news.ycombinator.com/item?id=50125416) · [cbsks](https://news.ycombinator.com/item?id=50126879)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50124251>)
