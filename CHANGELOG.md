# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.3] - 2026-06-14

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.2] - 2026-06-12

- **Added**
  - Exported reusable overlay semantics and canonical Player/Party composition zone ids for world-space panels, focus panes, reduced-combat overlays, and shared alert stacks.

- **Changed**
  - Extended scene layout manifest validation to fail closed when overlay composition semantics are malformed or ambiguous.

- **Fixed**
  - Hardened release preparation so protected-branch-safe CD derives the next version from repository, tag, and npm state instead of colliding with already-published versions.
  - Removed merge-message-dependent publish gating so protected-branch-safe release merges still publish when `main` carries a new package version.

- **Security**
  - (placeholder)

## [0.1.0] - 2026-05-14

- **Added**
  - Bootstrapped `@plasius/scene-layout` with layout manifest contracts, validation helpers, and responsive variant resolution.
  - Added ADR coverage for public scene layout boundaries and rollout ownership.

- **Changed**
  - Created the public package baseline from the `@plasius/schema` template for the scene package family.

- **Fixed**
  - Established bounded validation for invalid layout ids, duplicate anchors, and malformed ratio surfaces before downstream runtime use.

- **Security**
  - Validation fails closed for malformed untrusted layout input instead of inferring partial layout state.

---

[Unreleased]: https://github.com/Plasius-LTD/scene-layout/compare/v0.1.3...HEAD


[0.1.0]: https://github.com/Plasius-LTD/scene-layout/releases/tag/v0.1.0
[0.1.2]: https://github.com/Plasius-LTD/scene-layout/releases/tag/v0.1.2
[0.1.3]: https://github.com/Plasius-LTD/scene-layout/releases/tag/v0.1.3
