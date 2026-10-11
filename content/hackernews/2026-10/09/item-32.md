---
publish: true
content_type: "post"
title: "Show HN: Crashlytics for AI Coding Agents"
description: "xcrashlytics is a macOS command-line tool that exposes Firebase Crashlytics and local Xcode Organizer crash reports to developers and to coding agents, on the premise that a stack trace alone does not show how widespread a crash is or which"
date: "2026-10-08T18:33:49.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/0xfirattamur/xcrashlytics"
discussion_url: "https://news.ycombinator.com/item?id=50009985"
tags: ["source/hackernews","topics/coding","topics/agents","topics/products"]
---

## Article

xcrashlytics is a macOS command-line tool that exposes Firebase Crashlytics and local Xcode Organizer crash reports to developers and to coding agents, on the premise that a stack trace alone does not show how widespread a crash is or which release introduced it, and that an agent cannot investigate evidence it has not seen. It works with iOS, Android, macOS and other Crashlytics apps; on iOS it also reads reports Xcode has already downloaded.

The intended workflow has three parts: find the issue, follow the stack, and measure the impact. Issues can be searched by feature, error or version. Counting and ranking are scoped to the window you choose rather than lifetime totals, and a --by-day option with JSON output gives daily event counts pulled from the Crashlytics report. Events can be inspected individually, with --app-frames-only limiting output to app frames including first-party libraries configured in the profile.

Installation options include a curl script that installs into &#126;/.local/bin, verifies a SHA-256 checksum and needs no sudo; Homebrew via the tap 0xfirattamur/xcrashlytics, which requires running brew trust once per machine because Homebrew refuses untrusted third-party taps by default; a direct download of the macOS universal tarball with a matching .sha256 file; or a build from source with swift build -c release. The Firebase CLI is also required. Setup runs firebase login, then xcrashlytics init --scan, which discovers apps and writes .xcrashlytics.json; xcrashlytics use selects a profile when several apps are found. Authentication reuses the Firebase CLI login rather than gcloud.

The author is explicit about scope: the CLI retrieves crash evidence and exports a Markdown report or structured JSON for sharing, but it does not diagnose or fix code. A block of instructions can be pasted into a coding agent to install and configure the tool, save guidance in the repository's agent instructions, and list the top issues as JSON. The same commands work directly in a terminal without an agent.
