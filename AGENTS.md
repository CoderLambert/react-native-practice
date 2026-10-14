# Repository working agreement

Read README and docs/02-architecture.md before changing architecture.

- Implement observable features, not empty scaffolds or fake success states.
- Keep domain independent of React/native/storage packages; inject ports in data/runtime.ts.
- Preserve the distinction between real news, original demo content, summary and full text.
- Never delete bookmarks while clearing feed cache; migrate user data explicitly.
- Cancellation is not offline success. 429 must not produce an aggressive retry loop.
- Native modules live in modules/. Generated root android/ and ios/ are not the source of truth.
- Do not add permissions, tracking, account flows or paid service dependencies without a feature need.
- Use pnpm and the committed lockfile. New dependencies must match the pinned Expo SDK.
- Tests: pnpm test, pnpm test:sql, pnpm test:ui, pnpm typecheck, pnpm lint. Native changes require Android compilation separately.
- Report executed, failed and unverified checks separately. Never weaken a check to label the build green.
- Do not force push, upload secrets, overwrite newer branches, or claim device testing without an actual device run.
