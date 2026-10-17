# Development and validation

Run all commands from the repository root.

## Pinned theme changes

`verify:scale`, `site:build` and publication require a clean theme checkout at the full SHA in `.github/theme.lock.json`. After changing the upstream theme, commit and push it there, then update this lock to the published SHA before running the pinned build. Uncommitted upstream changes deliberately stop it; a local theme preview does not establish publication readiness.

## Validation commands

`npm test` runs test files sequentially so cold CLI/SDK imports and other subprocess fixtures do not compete with parallel test files for their startup budget. Active-request cancellation still has its separate five-second assertion.

```sh
npm run typecheck
npm test
npm run verify:scale
FEEDGARDEN_VISUAL_ROOT=.local/validation/fixture/.jekyll-obsidian-cache/site FEEDGARDEN_VISUAL_FIXTURE=1 npm run test:visual
npm run verify:agent
```

## Fixtures and evidence

The 101-item bilingual fixture exercises full static build and browser flows. `fixture-planning.json` records its summary/render planning checks before the theme build; `fixture-build.json` is written only after the complete pinned build passes. The upstream index/query tests cover 100,000 records without generating 100,000 full Jekyll pages. `verify:agent` uses real OpenAI RSS items and the installed DSH ACP in an isolated database, registry and content tree. It performs no publication. Reusable validation artifacts default to `.local/validation/`; set `FEEDGARDEN_VALIDATION_DIR` to choose an evidence directory. Historical refactor notes remain in `.local/notes/1009/`.

## Related documentation

- [Deployment and publishing](deployment.md)
- [Runner operations](operations.md)
