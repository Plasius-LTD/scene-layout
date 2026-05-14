import { describe, expect, it } from "vitest";
import {
  SCENE_LAYOUT_SCHEMA_VERSION,
  resolveSceneLayoutVariant,
  type SceneLayoutManifest,
} from "../src/index.js";

const manifest: SceneLayoutManifest = {
  schemaVersion: SCENE_LAYOUT_SCHEMA_VERSION,
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
          id: "desktop-hero",
          coordinateSpace: "normalized-viewport",
          rect: { x: 0.04, y: 0.08, width: 0.48, height: 0.28, unit: "ratio" },
          anchors: [
            {
              id: "desktop-hero-center",
              x: 0.5,
              y: 0.5,
              horizontal: "center",
              vertical: "center",
            },
          ],
        },
      ],
    },
    {
      id: "tablet",
      breakpoint: {
        minWidth: 640,
        maxWidth: 1023,
        orientation: "landscape",
      },
      zones: [
        {
          id: "tablet-hero",
          coordinateSpace: "normalized-viewport",
          rect: { x: 0.06, y: 0.1, width: 0.6, height: 0.3, unit: "ratio" },
          anchors: [
            {
              id: "tablet-hero-center",
              x: 0.5,
              y: 0.5,
              horizontal: "center",
              vertical: "center",
            },
          ],
        },
      ],
    },
    {
      id: "portrait",
      breakpoint: {
        orientation: "portrait",
        maxAspectRatio: 0.8,
      },
      zones: [
        {
          id: "portrait-hero",
          coordinateSpace: "normalized-viewport",
          rect: { x: 0.08, y: 0.12, width: 0.84, height: 0.22, unit: "ratio" },
          anchors: [
            {
              id: "portrait-hero-center",
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
};

describe("scene layout variant resolution", () => {
  it("selects the most specific matching landscape variant", () => {
    const variant = resolveSceneLayoutVariant(manifest, {
      width: 900,
      height: 700,
    });

    expect(variant.id).toBe("tablet");
  });

  it("selects portrait-specific variants when orientation and aspect ratio match", () => {
    const variant = resolveSceneLayoutVariant(manifest, {
      width: 720,
      height: 1280,
    });

    expect(variant.id).toBe("portrait");
  });

  it("falls back to the base variant when no breakpoint matches", () => {
    const variant = resolveSceneLayoutVariant(manifest, {
      width: 480,
      height: 480,
    });

    expect(variant.id).toBe("desktop");
  });

  it("prefers the tighter aspect-ratio-constrained variant when multiple variants match", () => {
    const variant = resolveSceneLayoutVariant(
      {
        ...manifest,
        variants: [
          ...manifest.variants,
          {
            id: "tablet-tight",
            breakpoint: {
              minWidth: 640,
              maxWidth: 1023,
              minAspectRatio: 1.2,
              maxAspectRatio: 1.5,
              orientation: "landscape",
            },
            zones: [
              {
                id: "tablet-tight-hero",
                coordinateSpace: "normalized-viewport",
                rect: {
                  x: 0.08,
                  y: 0.1,
                  width: 0.58,
                  height: 0.28,
                  unit: "ratio",
                },
                anchors: [
                  {
                    id: "tablet-tight-center",
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
      },
      {
        width: 900,
        height: 700,
      },
    );

    expect(variant.id).toBe("tablet-tight");
  });

  it("uses max-width and min-aspect-ratio guards to reject otherwise matching variants", () => {
    const variant = resolveSceneLayoutVariant(
      {
        ...manifest,
        variants: [
          {
            id: "any-layout",
            breakpoint: {
              orientation: "any",
              maxWidth: 700,
              minAspectRatio: 1.8,
            },
            zones: [
              {
                id: "any-zone",
                coordinateSpace: "normalized-viewport",
                rect: {
                  x: 0.1,
                  y: 0.1,
                  width: 0.5,
                  height: 0.3,
                  unit: "ratio",
                },
                anchors: [
                  {
                    id: "any-center",
                    x: 0.5,
                    y: 0.5,
                    horizontal: "center",
                    vertical: "center",
                  },
                ],
              },
            ],
          },
          ...manifest.variants,
        ],
      },
      {
        width: 720,
        height: 720,
      },
    );

    expect(variant.id).toBe("tablet");
  });

  it("rejects invalid surfaces before resolution", () => {
    expect(() =>
      resolveSceneLayoutVariant(manifest, {
        width: 0,
        height: 720,
      }),
    ).toThrow(/invalid scene layout surface/i);
  });
});
