---
publish: true
content_type: "post"
title: "ChatGPT Finances: your bank data isn't used for training, but what you type about it can be"
description: "A post explaining how ChatGPT's new Finances feature handles connected banking data versus the conversations about it. Finances rolled out to Free and Go users in the US the previous week. Users connect accounts through Plaid, after which C"
date: "2026-10-09T12:01:43.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:19:48.561Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/OpenAI/comments/1x1jiz0/chatgpt_finances_your_bank_data_isnt_used_for/"
tags: ["source/reddit","topics/products","topics/security-privacy"]
---

A post explaining how ChatGPT's new Finances feature handles connected banking data versus the conversations about it. Finances rolled out to Free and Go users in the US the previous week. Users connect accounts through Plaid, after which ChatGPT can read balances, transactions, investments and debts. According to the poster, it cannot see full account numbers and cannot move money.

The key distinction: OpenAI states that synced account data is not used to train models, but the conversation around that data is treated differently. Reporting on the rollout says those chats follow the user's normal training setting, which is "Improve the model for everyone" under Data controls, and that setting is on by default. So a question like "where did my money go last month," together with the answer containing the user's actual figures, is handled like any other chat.

The post also notes that Finances keeps its own memories, separate from regular saved memories, and that these are managed from the Finances page rather than from Personalization. If a user tries the feature and backs out, they should check that page as well as the connected accounts.

The author, who builds an extension called AI Toolbox, recommends searching older chats for salary figures, account details and statements pasted in before the feature existed. They say their extension searches the full text of every chat and can bulk delete matches, which is how they would locate such content. Note the final recommendation comes from a developer promoting their own tool.
