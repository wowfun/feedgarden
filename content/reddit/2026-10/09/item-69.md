---
publish: true
content_type: "post"
title: "Strata rewrote their GitHub history to wipe evidence of Claude-authoring"
description: "A user reports that Strata rewrote its repository history so that all previous commits had the \"Co-Authored by Claude\" text stripped from their descriptions. The evidence described is indirect: they noticed it when running the project's ..."
date: "2026-10-08T22:52:03.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x15a8w/strata_rewrote_their_github_history_to_wipe/"
tags: ["source/reddit","topics/coding","topics/content-provenance","topics/industry"]
---

A user reports that Strata rewrote its repository history so that all previous commits had the "Co-Authored by Claude" text stripped from their descriptions.

The evidence described is indirect: they noticed it when running the project's built-in UPDATE script, which failed in git because there was no common ancestor, indicating the history had been replaced rather than merely extended. The poster says they checked further and concluded that every historical commit was rewritten to remove the attribution text.

The item contains no statement from the project, no confirmation of who ordered the rewrite, and no verified reason. The poster offers their own judgment that the change looks bad and says they cannot think of a reason to do it other than an intention to be dishonest about the project's origins.
