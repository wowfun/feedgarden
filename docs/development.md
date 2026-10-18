# Development and validation

Run all commands from the repository root.

## Pinned theme changes

`verify:scale`, `site:build` and publication use the exact published gem in the root `Gemfile` and `Gemfile.lock`. Run `bundle install` after checkout. Implement reusable theme changes upstream, publish and verify the gem, then update the exact version and run `bundle update jekyll-obsidian-site`. Commit both dependency files with Windows and Linux platforms. Builds use frozen Bundler resolution and precompiled gem assets; they do not clone the theme or run its frontend toolchain.

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

The 101-item bilingual fixture exercises full static build and browser flows. `fixture-planning.json` records its summary/render planning checks before the theme build; `fixture-build.json` is written only after the complete pinned build passes. The upstream index/query tests cover 100,000 records without generating 100,000 full Jekyll pages. `verify:agent` uses real OpenAI RSS items and the configured ACP backend in an isolated database, registry and content tree. It performs no publication. `npm run verify:opencode` uses a temporary OpenCode profile, delayed MCP startup and a local simulated model to check inherited selections, tool readiness, probe-session cleanup, all three fixed task contracts and forbidden-tool rejection without paid calls. MCP startup is delayed by 7000 ms per task by default; pass `-- --mcp-delay-ms 250` for a shorter local check, or combine it with `--command PATH`. CI installs OpenCode 2.0.31 and runs this acceptance script against its local simulated provider. Reusable validation artifacts default to `.local/validation/`; set `FEEDGARDEN_VALIDATION_DIR` to choose an evidence directory. Historical refactor notes remain in `.local/notes/1009/`.

## Related documentation

- [Deployment and publishing](deployment.md)
- [Runner operations](operations.md)
