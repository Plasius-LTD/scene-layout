# @plasius/scene-layout

[![npm version](https://img.shields.io/npm/v/@plasius/scene-layout.svg)](https://www.npmjs.com/package/@plasius/scene-layout)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/scene-layout/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/scene-layout/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/scene-layout)](https://codecov.io/gh/Plasius-LTD/scene-layout)
[![License](https://img.shields.io/github/license/Plasius-LTD/scene-layout)](./LICENSE)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

Reusable scene layout contracts for zones, anchors, coordinate spaces, responsive placement variants, and overlay composition semantics.

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
- exported overlay semantics for Player System, Party System, and shared alert composition zones
- deterministic validation helpers for untrusted runtime input
- responsive variant resolution for width, height, orientation, and aspect ratio

## Usage

```ts
import {
  SCENE_LAYOUT_INTERFACE_ZONE_IDS,
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
          id: SCENE_LAYOUT_INTERFACE_ZONE_IDS.playerSystemWorldPanel,
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
          semantics: {
            surfaceFamily: "player-system",
            role: "world-space-panel",
            visibilityModes: ["ambient", "focused"],
            collisionPolicy: "stack",
          },
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

### Overlay composition semantics

Zones can opt into reusable overlay semantics for Player System and Party System composition:

- `surfaceFamily`: `player-system`, `party-system`, or `shared`
- `role`: `world-space-panel`, `focus-pane`, `reduced-combat-overlay`, `overlay-rail`, or `alert-stack`
- `visibilityModes`: one or more of `ambient`, `focused`, or `combat-reduced`
- `collisionPolicy`: `stack`, `exclusive`, or `allow-overlap`

The package also exports stable zone ids for the first Player/Party interface foundation:

- `player-system-world-panel`
- `player-system-focus-pane`
- `player-system-reduced-combat-overlay`
- `party-system-overlay-rail`
- `shared-alert-stack`

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
- overlay semantics fail closed for invalid surface families, roles, collision policies, or duplicate visibility modes
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
