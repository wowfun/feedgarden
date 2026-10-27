# Development and validation

Run all commands from the repository root.

Verification commands accept `--config FILE`; their evidence defaults to `<storage.root>/validation/`. `FEEDGARDEN_VALIDATION_DIR` explicitly overrides that location. Database-backed fixtures select an independent storage root, including their Agent workspaces; they must never open the production database. `verify:clippings` uses the same evidence resolver.

`verify:collect` reuses the selected configuration's Twitter installation when checking X, while collection evidence and database state remain isolated.

## Pinned theme changes

`verify:scale`, `site:build` and publication use the exact published gem in the root `Gemfile` and `Gemfile.lock`. Run `bundle install` after checkout. Implement reusable theme changes upstream, publish and verify the gem, then update the exact version and run `bundle update jekyll-obsidian-site`. Commit both dependency files with Windows and Linux platforms. Builds use frozen Bundler resolution and precompiled gem assets; they do not clone the theme or run its frontend toolchain.

## Local Clippings validation

Clippings uses upstream shared-content and Web Clipper metadata support that is not in the pinned 0.3.1 release. This includes `published`/`source`, directory tags, and bare topic aliases. Until the next theme release is published and the exact production dependency is upgraded, ordinary `site:build` and CI cannot build the new configuration. Do not point the production Gemfile at a checkout or replace the published gem in the normal gem home.

### Release follow-up (open; blocks merging the new site configuration)

The local package checks below are development evidence, not a replacement for the pinned build or CI. Keep this candidate out of `main` until these tasks are complete:

- [ ] Publish and verify an upstream theme release containing shared directories, Web Clipper fields, directory tags, published Markdown image URLs.
- [ ] Pin that published version in `Gemfile`, run `bundle update jekyll-obsidian-site`, and retain Windows and Linux platforms in `Gemfile.lock`.
- [ ] From a clean checkout without `.references/` or a local theme gem, pass `npm run build`, `npm test`, `npm run site:build`, `npm run test:visual`, `npm run verify:scale`, and the fixture visual check documented below; pass the full PR CI job.
- [ ] Pass `npm run verify:clippings` in CI using the published package, then remove the temporary release limitation from this page and the paired site docs. Keep `--gem` for future isolated upstream development.

Close this follow-up only after the published dependency and full CI are verified together. This review does not publish the theme, upgrade the production dependency, or bypass the existing CI gate.

The Clippings verifier defaults to the frozen published dependency in `Gemfile` and `Gemfile.lock`; it needs no theme checkout. CI runs it for every non-docs change and retains its screenshots, exports and result records with the visual-validation artifact. With the current 0.3.1 pin this command fails on the unsupported site configuration, so the release checklist remains open.

```sh
npm run verify:clippings
```

For upstream development before that release, explicitly select a local package:

```powershell
Push-Location .references/jekyll-obsidian/website
npm run build
bundle exec ruby scripts/package.rb --skip-assets
Pop-Location
npm run verify:clippings -- --gem .references/jekyll-obsidian/pkg/jekyll-obsidian-site-0.3.1.gem
```

The package filename uses the upstream checkout's version; adjust it if that version changes. The local artifact is identified by its SHA-256, not treated as a new published release. Published-mode results instead record the locked version and bundle SHA-256. The verifier installs it into a fresh gem home under `.local/feedgarden/validation/clippings/run-*/`, reusing installed runtime dependencies without downloading or replacing the normal theme. It builds a copy of the current content and a 52-clipping fixture, runs desktop/mobile checks in both languages, and saves screenshots, Markdown exports and `results.json`. Existing site browser checks run against the real-content copy as well. No production database is opened, no collected content is rendered, and nothing is published. The real-content check accepts an empty or populated Clippings tab; the synthetic fixture exercises pagination and content interactions.

The fixture also covers local inline/reference images, Copy page clipboard content and absolute attachment URLs in exports. The current real article is checked for hosted image loading and absence of requests to its original image host. Run the manual image-fetch and preservation tests with `node --import tsx --test --test-concurrency=1 tests/fetch-clippings.test.ts tests/clippings.test.ts`; see [Clippings](clippings.md#fetch-and-host-images-manually) for usage. Image fetching is never part of the verifier or production build.

## Validation commands

`npm test` runs test files sequentially so cold CLI/SDK imports and other subprocess fixtures do not compete with parallel test files for their startup budget. Active-request cancellation still has its separate five-second assertion.

```sh
npm run build
npm test
npm run verify:opencode
npm run site:build
npx playwright install --with-deps --only-shell chromium
npm run test:visual
npm run verify:scale
FEEDGARDEN_VISUAL_ROOT=.local/feedgarden/validation/fixture/.jekyll-obsidian-cache/site FEEDGARDEN_VISUAL_FIXTURE=1 npm run test:visual
```

`build` compiles and typechecks the same TypeScript project. Use `npm run typecheck` when you only need diagnostics without emitted files. The fixture browser command above uses POSIX environment syntax; in PowerShell, set `$env:FEEDGARDEN_VISUAL_ROOT` and `$env:FEEDGARDEN_VISUAL_FIXTURE` before running `npm run test:visual`, then remove both variables. `npm run verify:agent` is a separate paid live check, not part of CI.

## CI scope and deployment

The Pages workflow keeps two jobs: `build`, then `deploy`. A dependency-free Node script classifies changes before installing npm or Ruby dependencies. The workflow always starts for PRs and pushes to `main`, so documentation changes still receive a completed check.

| Changed files | Validation | Deployment |
| --- | --- | --- |
| Only `docs/**`, `README.md`, `README.zh-CN.md`, `AGENTS.md`, or `THIRD_PARTY_NOTICES.md` | Classification only (`docs`) | None |
| Only `content/**`, optionally mixed with the documentation above | Production site build and production browser checks (`site`) | On `main` after validation |
| Any other path | Compile/typecheck, serial tests, OpenCode acceptance, production site/browser checks, and the 101-item fixture build/browser checks (`full`) | On `main` after validation |
| Manual dispatch | Full validation | Only on `main` |

In particular, topic registries, locale catalogs, theme configuration, dependencies, scripts, tests, workflows and unknown paths require full validation. The OpenCode acceptance keeps its 7000 ms MCP startup delay. Chromium installation uses only the headless shell used by the browser checks; npm and Bundler retain their existing caches.

PR classification compares the PR head with its merge base. Main-branch pushes compare against the latest successful `push` or manual run of this same workflow on `main`, including the deployment result. This carries changes forward when an earlier run failed or was cancelled, even if the latest push only changes documentation. The baseline must be an ancestor of the current commit. Missing or unreadable history, a failed API request, or no eligible baseline in the first 1000 successful runs selects full validation. Renames consider both old and new paths. An empty diff needs classification only.

The build job has read-only Actions access for this history lookup. Its summary records the chosen scope and comparison commits. Deployment requires a successful build and a Pages artifact uploaded by the current run; PRs, non-main manual runs and documentation-only runs cannot deploy. Validation failures block deployment. Full history checkout and cancellation of superseded runs remain enabled.

## Fixtures and evidence

The 101-item bilingual fixture exercises full static build and browser flows. `fixture-planning.json` records its summary/render planning checks before the theme build; `fixture-build.json` is written only after the complete pinned build passes. The upstream index/query tests cover 100,000 records without generating 100,000 full Jekyll pages. `verify:agent` uses real OpenAI RSS items and the configured ACP backend in an isolated database, registry and content tree. It performs no publication. `npm run verify:opencode` uses a temporary OpenCode profile, delayed MCP startup and a local simulated model to check inherited selections, tool readiness, probe-session cleanup, all three fixed task contracts and forbidden-tool rejection without paid calls. MCP startup is delayed by 7000 ms per task by default; pass `-- --mcp-delay-ms 250` for a shorter local check, or combine it with `--command PATH`. CI installs OpenCode 2.0.31 and runs this acceptance script against its local simulated provider. Reusable validation artifacts default to `.local/feedgarden/validation/`; set `FEEDGARDEN_VALIDATION_DIR` to choose an evidence directory. Historical refactor notes remain in `.local/notes/1009/`.

## Related documentation

- [Deployment and publishing](deployment.md)
- [Runner operations](operations.md)
