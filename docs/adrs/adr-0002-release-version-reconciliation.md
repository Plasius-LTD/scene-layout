# ADR 0002: Release preparation reconciles package, tag, and npm version state

- Status: Accepted
- Date: 2026-06-13

## Context

`@plasius/scene-layout` publishes through `.github/workflows/cd.yml` on `main`.
The protected-branch-safe release rewrite already moved version and changelog mutation into a release-preparation PR, but the workflow still assumed `package.json` was the highest release source of truth.

That assumption failed after `v0.1.1` had already been published and tagged while `main` still carried `package.json` version `0.1.0`.
When release preparation later ran with a patch bump, it produced `0.1.1` again and aborted on the duplicate npm publish check instead of preparing the next valid release.

## Decision

Release preparation must derive its base version from the highest observed semantic version across:

- the repository `package.json` version,
- the published npm package version, and
- existing Git tags fetched from origin.

The workflow will continue to delegate bump semantics to `npm version`, but only after reconciling the highest occupied release version through a dedicated helper with regression tests.

When the operator chooses `bump: none`, the workflow must refuse to proceed if `package.json` trails published or tagged state, because that would only prepare an already-consumed release version.

## Consequences

- Release preparation becomes deterministic even when repository version metadata lags behind the last published package.
- The package keeps using the protected-branch-safe release PR flow without reintroducing direct pushes to `main`.
- Version reconciliation is now testable outside GitHub Actions shell steps, reducing the chance of future release drift regressions.

## Alternatives considered

- Manually editing `package.json` on `main` after every release drift incident.
  Rejected because it is error-prone and does not prevent recurrence.
- Querying npm alone as the release source of truth.
  Rejected because higher prerelease or release-tag state may exist in Git without being the npm `latest` version.
- Returning to direct workflow pushes on `main`.
  Rejected because branch protection explicitly forbids that path.
