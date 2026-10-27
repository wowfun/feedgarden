# Clippings

[简体中文](clippings.zh-CN.md)

Clippings is a manually maintained collection. Put Markdown files in `content/clippings/`; its checked-in `index.md` supplies the tab. The tab remains visible when empty and appears between Home and Podcasts. Posts also appear on the homepage, ordered by date alongside collected items. Existing independent source tabs keep their homepage visibility rules.

Both language interfaces display the same title and body. Each keeps its own navigation, search and article URL, without a missing-translation notice. The collection name stays “Clippings” in both interfaces. Do not add copies under `_translations/`; archive import, rendering and recovery reject a Clippings translation directory and keep its files for manual resolution. Set `lang` to the language of the saved body when known, including when it is a translation; omit it for mixed or unspecified language. There is no automatic translation, collection or summary job for Clippings.

## Add a clipping

Keep `clippings/` as a regular directory containing regular files and directories, including attachments. Archive import, rendering, recovery and publication reject symbolic links and directory junctions. If a link interrupts a content handoff, the recovery journal and content trees are kept; replace or remove the link at the reported path before retrying `render`.

Choose a stable descriptive filename, such as `content/clippings/a-useful-note.md`:

```markdown
---
title: A useful note
lang: en
source: https://example.com/original
source_title: The original article title
author:
  - "[[Author name]]"
published: 2026-10-24
created: 2026-10-24
tags: [coding]
description: A short description for the archive card.
---

Write the original clipping here.
```

Obsidian Web Clipper frontmatter works directly. The site publishes `clippings/` and its descendants as posts by directory policy and adds `source/clippings` during compilation. These defaults do not rewrite the file. Set `publish: false` to keep a draft private. Keep `index.md` as `content_type: page`; its archive tab uses folder membership and intentionally has no `tab.topics` source selector.

Publication dates use `date`, then `published`, then `created`, then the first Git commit. `source_url` takes precedence over `source` for the original link; both accept HTTP(S) URLs without credentials. Optional `source_title` supplies the link label on lists, details, favorites and Markdown exports; without it, the URL is shown. It does not replace the clipping's `title`. Author wiki links stay intact: an existing public author note becomes a link, while a missing one displays its name and produces a build warning. Bare maintained topic IDs such as `agents` or `coding` map to `topics/agents` or `topics/coding` for filters; other tags remain available to search. Replaced topic IDs map directly to the current topic. These aliases apply site-wide: maintained bare IDs are reserved for those topics. Use a distinct tag such as `personal/agents` when an authored tag has a different meaning. No translated Markdown is needed. Without an authored `lang`, the shared body uses `und` and automatic direction.

The explicit `publish: true`, `content_type: post`, `date`, `source_url`, and namespaced-tag style also works. Title and a deterministic date are needed for a useful post; description, original URL, tags and `lang` are optional. Images and other shared attachments can live beside the note or in a subdirectory.

## Edit and remove

Edit, rename or delete files directly, then build the site. Rendering collected content transfers the current Clippings directory into the new tree without rewriting its bytes. Changes made while the generated tree is being prepared remain in that directory. Clippings never enters the private archive snapshot; a stale snapshot cannot restore deleted notes. The `clippings` source ID is reserved, and archive-maintenance commands refuse this directory.

If a process stops during the content-tree exchange, the journal completes the directory transfer on recovery. If another process recreates the destination during that brief exchange, rendering stops and keeps all trees and the journal. Resolve the competing edits before retrying; do not discard a retained tree without checking its Clippings files.

## Local theme validation

Shared content requires the upstream `website.i18n.shared_directories` implementation. The production Gemfile remains pinned to the published theme until a later upstream release. Before that release, use the isolated local-package validation described in [Development](development.md#local-clippings-validation). It does not change the production database, dependency lock or deployed site.
