# @plasius/scene-layout

[![npm version](https://img.shields.io/npm/v/@plasius/scene-layout.svg)](https://www.npmjs.com/package/@plasius/scene-layout)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/scene-layout/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/scene-layout/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/scene-layout)](https://codecov.io/gh/Plasius-LTD/scene-layout)
[![License](https://img.shields.io/github/license/Plasius-LTD/scene-layout)](./LICENSE)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

Reusable scene layout contracts for zones, anchors, coordinate spaces, and responsive placement variants.

Apache-2.0. ESM + CJS builds. TypeScript types included.

## Installation

```bash
npm install @plasius/scene-layout
```

## Rollout ownership

This package does not evaluate rollout flags itself. The parent Plasius feature flag remains:

- `scene.layout.foundation.enabled`

Source of truth:

- site-owned rollout control in `plasius-ltd-site`
- package consumers decide whether to expose or consume these contracts

## What the package exports

- stable TypeScript types for layout manifests, zones, anchors, and variants
- deterministic validation helpers for untrusted runtime input
- responsive variant resolution for width, height, orientation, and aspect ratio

## Usage

```ts
import {
  createSceneLayoutManifest,
  resolveSceneLayoutVariant,
  type SceneLayoutManifest,
} from "@plasius/scene-layout";

const manifest: SceneLayoutManifest = createSceneLayoutManifest({
  schemaVersion: "1.0.0",
  baseVariant: "desktop",
  variants: [
    {
      id: "desktop",
      breakpoint: {
        minWidth: 1024,
        orientation: "landscape",
      },
      zones: [
        {
          id: "hero",
          coordinateSpace: "normalized-viewport",
          rect: { x: 0.05, y: 0.08, width: 0.5, height: 0.36, unit: "ratio" },
          anchors: [
            {
              id: "hero-center",
              x: 0.5,
              y: 0.5,
              horizontal: "center",
              vertical: "center",
            },
          ],
        },
      ],
    },
  ],
});

const active = resolveSceneLayoutVariant(manifest, {
  width: 1440,
  height: 900,
});
```

## Contract model

### Coordinate spaces

- `normalized-viewport`
- `pixel-viewport`
- `world`
- `local`

### Anchor semantics

Anchors are normalized within a zone. Their coordinates are always `0..1` and use explicit horizontal and vertical alignment markers:

- `start`
- `center`
- `end`

### Variant resolution

Variants can constrain:

- `minWidth`
- `maxWidth`
- `orientation`
- `minAspectRatio`
- `maxAspectRatio`

If multiple variants match, the resolver prefers the most specific one. If none match, the package falls back to the declared `baseVariant`.

## Validation guarantees

- ids must be kebab-case
- variants, zones, and anchors must have unique ids within their scope
- surfaces and dimensions must be finite positive numbers
- ratio rectangles and anchor coordinates are bounded
- variant selection inputs are validated before resolution

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

## Architecture

- ADR: [Scene layout contract boundaries](./docs/adrs/adr-0001-scene-layout-contract-boundaries.md)
