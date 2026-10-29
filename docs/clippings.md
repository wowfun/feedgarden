# Clippings

[简体中文](clippings.zh-CN.md)

Clippings is a manually maintained collection. Put Markdown files in `content/clippings/`; its checked-in `index.md` supplies the tab. The tab remains visible when empty and appears between Home and Podcasts. Posts also appear on the homepage, ordered by date alongside collected items. Existing independent source tabs keep their homepage visibility rules.

Both language interfaces display the same title and body. Each keeps its own navigation, search and article URL, without a missing-translation notice. The collection name stays “Clippings” in both interfaces. Do not add copies under `_translations/`; archive import, rendering and recovery reject a Clippings translation directory and keep its files for manual resolution. Set `lang` to the language of the saved body when known, including when it is a translation; omit it for mixed or unspecified language. There is no automatic translation, collection or summary job for Clippings.

## Add a clipping

Keep `clippings/` as a regular directory containing regular files and directories, including attachments. Archive import, rendering, recovery and publication reject symbolic links and directory junctions. If a link interrupts a content handoff, the recovery journal and content trees are kept; replace or remove the link at the reported path before retrying `export`.

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

## Fetch and host images manually

```powershell
fdg ui clippings fetch --target site "content/clippings/Building agents_ When to fold subagents into your main agent loop.md"
fdg ui clippings fetch --target site content/clippings/folder content/clippings/another.md
fdg ui clippings fetch --target site --all --dry-run
fdg ui clippings fetch --target site --all --max-mib 64 --config feedgarden.jsonc
```

Every explicit file or directory must be within the configured `feed.directory/clippings/` and outside its reserved `assets/` subtree. Explicit paths selecting no Markdown files fail with a nonzero exit. `--all` skips `assets/` and succeeds for an empty collection. Paths are relative to the working directory, just like the other CLI commands. No arguments shows help. `--dry-run` lists external Markdown image URLs without consulting the asset cache. A listed URL may reuse a cached image during the real run; an already-local reference is omitted. Dry-run does not create a lock, download files or write anything. The command runs only when invoked; collection, rendering, builds, CI and schedules do not fetch these images.

Inline and reference-style Markdown images are supported. Code, comments, ordinary links, frontmatter (including `source_title`), HTML images and Obsidian embeds remain unchanged. Inline images retain alt text, title, whitespace and line endings. An image reference whose definition is shared with an ordinary link becomes an inline image; the link and its definition keep their original URL.

PNG, JPEG, GIF, WebP, AVIF, APNG and BMP are identified by file signature and saved without conversion, including animation. SVG and non-image responses are unsupported. Downloads preserve signed query parameters and use the existing public-address validation and pinned connections, checking every redirect. Defaults are three concurrent requests, a 30-second request timeout, three redirects, two retries for temporary errors and 32 MiB per image. `--max-mib` changes the size limit.

The system resolver must return real public addresses. Proxy Fake-IP answers such as `198.18.x.x` are rejected by the same public-address policy; configure real DNS for the image hosts before fetching in that environment. The command does not silently bypass that policy or change proxy settings.

Files live at `assets/<SHA-256>.<extension>` inside Clippings; equal bytes share one file, and nested notes receive the appropriate relative path. `assets/manifest.json` records only each original URL, final URL, path and media type. The manifest retains complete URLs, including signing parameters, and is committed with the assets. The theme publishes referenced images; the manifest itself is not a page or published attachment.

All images for one article must succeed before its text changes. A failed article keeps its original bytes, other articles continue, and the command exits nonzero with the reasons. Repeated URLs and existing local images are reused. The manifest does not record or validate `size` or `sha256`. Reuse checks the local path, regular-file status, configured byte limit and image type. New downloads use SHA-256 filenames for deduplication. Already-local references are not refreshed, and unreferenced assets are never automatically deleted. Rerunning an unchanged article neither downloads nor rewrites it.

The command shares the runner filesystem lock with rendering and never opens SQLite. An unfinished content-exchange journal must first be recovered with `fdg export --target site --rebuild`. Downloads are staged; complete attachments are installed atomically, followed by an atomic manifest update and an atomic article update. The article's identity and original bytes are rechecked just before replacement. Detected edits, renames or deletions abandon that article's commit. Avoid editing selected notes until the command exits: the final content check and replacement are separate filesystem operations. An interruption can leave complete unreferenced assets, manifest entries or `.fetch-*` staging folders; rerunning is safe. Retained staging folders can be inspected and removed manually when no runner is active.

Commit the rewritten Markdown, assets and manifest together. The local theme fix projects Markdown image references to the actual published attachment URL for Copy page and archive export: absolute when the site URL is configured, otherwise root-relative with `baseurl`. Both interfaces share the attachment; the on-disk note keeps its relative path.

Validation commands:

```powershell
npm run typecheck
node --import tsx --test --test-concurrency=1 tests/ui/fetch-clippings.test.ts tests/ui/clippings.test.ts
# From .references/jekyll-obsidian/website:
bundle exec ruby -Itest test/compiler/published_markdown_test.rb
```

## Local theme validation

Shared content and Web Clipper metadata are supported by the pinned `jekyll-obsidian-site` 0.3.2 release. Run `npm run verify:clippings` with the published dependency. For upstream development, [Development](development.md#local-clippings-validation) describes the explicit local-package override. Validation does not change the production database, dependency lock or deployed site.
