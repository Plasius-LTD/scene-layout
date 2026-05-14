# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

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

[Unreleased]: https://github.com/Plasius-LTD/scene-layout/compare/v0.1.0...HEAD
