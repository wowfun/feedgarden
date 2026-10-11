---
publish: true
content_type: "post"
title: "Uploading numerous documents to a website - Workflow"
description: "A user describes a manual workflow for uploading roughly 150 employee certification documents into SaaS products that require file uploads. Claude Desktop is used to rename and organize the files and prepare the form data, while Claude in C"
date: "2026-10-09T13:36:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1lkn2/uploading_numerous_documents_to_a_website_workflow/"
tags: ["source/reddit","topics/agents","topics/products"]
---

A user describes a manual workflow for uploading roughly 150 employee certification documents into SaaS products that require file uploads. Claude Desktop is used to rename and organize the files and prepare the form data, while Claude in Chrome must perform the actual uploads because Desktop cannot.

The current process involves two handoffs. Desktop renames, organizes and stages the documents in groups of 20, described as the limit for Claude in Chrome, and builds an Excel file containing all the data needed for the upload form entries. Claude in Chrome then imports each batch of 20 and produces a summary that is copied back to Desktop so it can record which certificates were uploaded and file them in the appropriate folders.

The author says the approach still saves time but involves too many back-and-forth steps to hand off smoothly to team members. No solution is proposed; the post asks whether others have hit the same limits and can recommend a workflow. Because this is a question rather than a report of results, the useful content is the described constraints: the 20-file batch ceiling in Claude in Chrome, Desktop's role in local file management, and the manual Excel-based tracking that ties the two sessions together.
