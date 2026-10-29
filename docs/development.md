# Development and validation

Run all commands from the repository root.

Source module boundaries are documented in [Architecture](architecture.md) and enforced by `npm run check:architecture`. Each module exposes named public entries; new cross-module dependencies must satisfy `src/modules.json`. The worker handshake has a separate small dependency budget.

Tests mirror the source modules under `tests/agent/`, `tests/content/`, `tests/instance/`, `tests/platform/`, `tests/publishing/`, `tests/runs/`, `tests/sources/`, `tests/storage/` and `tests/ui/`. Cross-module and CLI behavior lives in `tests/integration/` and `tests/e2e/`; reusable fixtures and deliberate raw database access belong in `tests/support/`. `npm test` discovers test files recursively. To select cases across the suite, use `npm test -- --test-name-pattern="pattern"`.

`npm run build` checks architecture and the generated configuration schema, removes the previous `dist/` tree and compiles. Removing stale output is required after source moves so `npm pack` cannot include obsolete flat modules. `npm run schema` regenerates the single v3 schema at `resources/schemas/feedgarden.v3.json`; setup and upgrade copy that same input schema into instances. The frozen v2 schema remains an editor aid for the retained legacy configuration. `npm run test:package` validates the freshly built archive; it does not build implicitly. CI retains Node 24/26 and Windows/Linux/macOS package coverage. `npm test -- --suite=package` discovers every test in agent, e2e, instance, platform, publishing, runs and storage, so new tests in those modules automatically join the platform matrix.

Verification commands default to the isolated v3 `feedgarden.development.jsonc` and accept `--config FILE`; their evidence defaults to `<stateDir>/validation/`. `FEEDGARDEN_VALIDATION_DIR` explicitly overrides that location. Database-backed fixtures select an independent storage root, including their Agent workspaces; they must never open the production database. `verify:clippings` and `verify:footer` use the same evidence resolver.

`verify:collect` reuses the selected configuration's Twitter installation when checking X, while collection evidence and database state remain isolated.

## Pinned theme changes

Developer `verify:scale` and `dev:site:build` use the root Gemfile/Gemfile.lock. Consumer publication uses the identical trusted copies in resources/ui. Run `bundle install` after checkout. Implement reusable theme changes upstream, publish and verify the gem, then update the exact version and run `bundle update jekyll-obsidian-site`. Commit both dependency files with Windows and Linux platforms. Builds use frozen Bundler resolution and precompiled gem assets; they do not clone the theme or run its frontend toolchain.

## Local Clippings validation

Clippings uses shared-content and Web Clipper support from the pinned `jekyll-obsidian-site` 0.3.2 release, including `published`/`source`, directory tags, published Markdown image URLs and the footer API.

Both verifiers default to the frozen published dependency in `Gemfile` and `Gemfile.lock`; they need no theme checkout or personal-site directory. CI runs them for every non-docs change and retains their screenshots, exports and result records with the visual-validation artifact.

For future theme upgrades, publish and verify the upstream gem first, then update both dependency files. Validate a clean checkout without `.references/` or a local theme gem: run `npm run build`, `npm test`, `npm run dev:site:build`, `npm run test:visual`, `npm run verify:scale`, both verifiers, and the fixture visual check below. Require the full PR CI job before merging.

```sh
npm run verify:clippings
npm run verify:footer
```

For upstream development, explicitly select a local package:

```powershell
Push-Location .references/jekyll-obsidian/website
npm run build
bundle exec ruby scripts/package.rb --skip-assets
Pop-Location
npm run verify:clippings -- --gem .references/jekyll-obsidian/pkg/jekyll-obsidian-site-0.3.2.gem
```

The package filename uses the upstream checkout's version; adjust it if that version changes. The local artifact is identified by its SHA-256, not treated as a new published release. Published-mode results instead record the locked version and bundle SHA-256. The verifier installs it into a fresh gem home under `.local/feedgarden/state/validation/clippings/run-*/`, reusing installed runtime dependencies without downloading or replacing the normal theme. It builds a copy of the current content and a 52-clipping fixture, runs desktop/mobile checks in both languages, and saves screenshots, Markdown exports and `results.json`. Existing site browser checks run against the real-content copy as well. No production database is opened, no collected content is rendered, and nothing is published. The real-content check accepts an empty or populated Clippings tab; the synthetic fixture exercises pagination and content interactions.

The fixture also covers local inline/reference images, Copy page clipboard content and absolute attachment URLs in exports. The current real article is checked for hosted image loading and absence of requests to its original image host. Run the manual image-fetch and preservation tests with `node --import tsx --test --test-concurrency=1 tests/ui/fetch-clippings.test.ts tests/ui/clippings.test.ts`; see [Clippings](clippings.md#fetch-and-host-images-manually) for usage. Image fetching is never part of the verifier or production build.

## Footer navigation and two-site previews

`website.footer.links` in `.github/jekyll-obsidian.yml` links to Sinputer's Site. The Chinese override is an explicit full URL. Contacts and navigation are rendered by the upstream theme on every page. The footer API is supported by the pinned 0.3.2 release.

Without `--personal-site`, `verify:footer` validates Feedgarden alone. The optional second host uses its own configuration and content with the same selected theme package. Contact counts, language routes and base paths come from each host configuration; `--port` and `--personal-port` override the preview ports (58002 and 58000).

For paired previews using the published dependency, run:

```powershell
npm run verify:footer -- --personal-site D:/Projects/wowfun.github.io
$preview = Get-Content .local/feedgarden/state/validation/footer/current.json -Raw | ConvertFrom-Json
# Run these in separate terminals; stop any older preview occupying the same port first.
npm run dev:site:serve -- --root $preview.builds.'personal-minimal' --baseurl / --port 58000
npm run dev:site:serve -- --root $preview.builds.'feedgarden-minimal' --baseurl /feedgarden --port 58002
```

Open `http://127.0.0.1:58000/` and `http://127.0.0.1:58002/feedgarden/`. The verifier uses the frozen published bundle by default, copies each site's configured content directory and any imported-document cache, and disables comments and analytics in the copies. An explicit `--gem` installs a local development package in an isolated gem home. It retains each site's configured theme, checks footer URLs on every rendered page before remapping, and saves 1440px/390px, English/Chinese, light/dark screenshots and browser results in `run-*/results.json`. Every generated HTML page must have a footer. Only raw HTML listed by the theme manifest and bare redirect documents are exempt, and the result record lists each exemption. Browser cases cover home, available article/archive pages and actual missing routes: missing routes must return HTTP 404 with the localized header, title and footer. Checks include keyboard focus, touch areas, overflow and toolbar clearance. Upstream compiler, integration and browser tests cover both Minimal and Docs. Feedgarden requires Minimal for favorites and archive visibility rules; forcing its configuration into Docs is unsupported.

Only generated preview HTML maps configured host origins and base paths to the local ports; Jekyll Obsidian continues to link to the live documentation site. Repository configuration keeps production HTTPS URLs. The verifier never opens the production database, renders collected content, edits authored files, upgrades the pinned gem or deploys. These previews are static snapshots; rerun the verifier after source changes.

## Validation commands

`npm test` runs test files sequentially so cold CLI/SDK imports and other subprocess fixtures do not compete with parallel test files for their startup budget. Run clean builds, the test suite, package acceptance and UI acceptance sequentially: subprocess tests use `dist/` and copy durable runtimes, so deleting output or running several large copies concurrently can invalidate their timing assumptions. Active-request cancellation still has its separate five-second assertion.

```sh
npm run build
npm test
npm run verify:opencode
npm run dev:site:build
npx playwright install --with-deps --only-shell chromium
npm run test:visual
npm run verify:scale
FEEDGARDEN_VISUAL_ROOT=.local/feedgarden/state/validation/fixture/.jekyll-obsidian-cache/site FEEDGARDEN_VISUAL_FIXTURE=1 npm run test:visual
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

The 101-item bilingual fixture exercises full static build and browser flows. `fixture-planning.json` records its summary/render planning checks before the theme build; `fixture-build.json` is written only after the complete pinned build passes. The upstream index/query tests cover 100,000 records without generating 100,000 full Jekyll pages. `verify:agent` uses real OpenAI RSS items and the configured ACP backend in an isolated database, registry and content tree. It performs no publication. `npm run verify:opencode` uses a temporary OpenCode profile, delayed MCP startup and a local simulated model to check inherited selections, tool readiness, probe-session cleanup, all three fixed task contracts and forbidden-tool rejection without paid calls. MCP startup is delayed by 7000 ms per task by default; pass `-- --mcp-delay-ms 250` for a shorter local check, or combine it with `--command PATH`. CI installs OpenCode 2.0.31 and runs this acceptance script against its local simulated provider. Reusable validation artifacts default to `.local/feedgarden/state/validation/`; set `FEEDGARDEN_VALIDATION_DIR` to choose an evidence directory. Historical refactor notes remain in `.local/notes/1009/`.

## Related documentation

- [Deployment and publishing](deployment.md)
- [Runner operations](operations.md)

## Installable CLI acceptance

`npm run build` creates all runtime JavaScript before packing. `npm run test:package` installs a local tarball in an isolated directory with strict-allow-scripts, exercises default user paths, read-only diagnosis, detached completion, Skill receipts and clean-cache npm exec. Package contents exclude test/developer code, source history, private data and reference checkouts. Core dependencies contain neither better-sqlite3 nor DSH; node:sqlite provides storage, and DSH installation is an explicit operation.

The package CI matrix runs Node 24.12.0 and 26 on Windows, Linux and macOS. Linux also runs the complete unit suite; Pages retains the existing theme/browser validation. Configuring a CI matrix does not establish that those remote jobs passed. Record local Node/platform results separately from unrun remote CI, real provider work, push/deployment and registry publication.

`npm run verify:ui` exercises consumer export and isolated UI building with a temporary instance, bilingual accepted content and shared Clippings. It uses the bundled trusted template and dependency files, runs the browser checks, and retains screenshots and a receipt under `.local/acceptance/ui/run-*/`. It requires the optional Ruby/Bundler and Chromium dependencies. The existing `verify:clippings` separately checks a copy of the site's current content and its larger fixture.

`tests/e2e/end-to-end.test.ts` uses a simulated ACP peer and a local bare Git repository to verify a complete sync: explicitly saved historical items enter processing, a model quota permits partial publication, and switching the primary model processes only the remaining content. It makes no paid calls or remote pushes. Storage tests cover nested transaction rollback, WAL readers during writes, online backup, search cursor ceilings and interrupted upgrade recovery.
