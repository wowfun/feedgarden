---
publish: true
content_type: "post"
title: "Editing an earlier prompt after refreshing the page sends it as a new message at the bottom instead"
description: "A Reddit user reports a bug on ChatGPT Web in Chrome on Windows, first seen on October 8. Normally, editing an earlier message branches the conversation, restarting it from that point; after a full page refresh, the edited prompt instead ap"
date: "2026-10-09T09:34:34.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:19:48.561Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/OpenAI/comments/1x1gxp9/editing_an_earlier_prompt_after_refreshing_the/"
tags: ["source/reddit","topics/products","topics/coding"]
---

A Reddit user reports a bug on ChatGPT Web in Chrome on Windows, first seen on October 8. Normally, editing an earlier message branches the conversation, restarting it from that point; after a full page refresh, the edited prompt instead appears as a brand-new message appended at the bottom of the conversation.

The user tested several conditions to isolate the trigger. Starting a new conversation and editing without refreshing works normally; leaving a conversation open for more than 20 minutes and then editing works normally; switching to another conversation, coming back, and editing works normally; refreshing the page and then editing an earlier prompt reproduces the bug. Age of the conversation, inactivity and switching chats therefore appear unrelated, while the page refresh appears to be the trigger: the Edit option is still available, but submitting the edit appends to the end rather than creating a new version or branch.

They confirm clearing the cache, disabling extensions and using incognito mode made no difference, and that the same behavior occurs in other web browsers. The post asks whether others can reproduce it after a refresh specifically.
