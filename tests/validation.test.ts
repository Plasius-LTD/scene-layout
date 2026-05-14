import { describe, expect, it } from "vitest";
import {
  SCENE_LAYOUT_FOUNDATION_FLAG_ID,
  SCENE_LAYOUT_SCHEMA_VERSION,
  createSceneLayoutManifest,
  validateSceneLayoutSurface,
  type SceneLayoutManifest,
  validateSceneLayoutManifest,
} from "../src/index.js";

const validManifest: SceneLayoutManifest = {
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
          id: "hero",
          coordinateSpace: "normalized-viewport",
          rect: {
            x: 0.05,
            y: 0.08,
            width: 0.55,
            height: 0.32,
            unit: "ratio",
          },
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
};

describe("scene layout manifest validation", () => {
  const baseVariant = validManifest.variants[0]!;
  const baseZone = baseVariant.zones[0]!;
  const baseAnchor = baseZone.anchors[0]!;

  it("accepts a valid manifest", () => {
    const result = validateSceneLayoutManifest(validManifest);

    expect(result.valid).toBe(true);
    expect(result.value?.baseVariant).toBe("desktop");
  });

  it("exports the documented parent rollout flag", () => {
    expect(SCENE_LAYOUT_FOUNDATION_FLAG_ID).toBe(
      "scene.layout.foundation.enabled",
    );
  });

  it("rejects duplicate anchor ids within a zone", () => {
    const result = validateSceneLayoutManifest({
      ...validManifest,
      variants: [
        {
          ...baseVariant,
          zones: [
            {
              ...baseZone,
              anchors: [
                baseAnchor,
                {
                  ...baseAnchor,
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-id",
          path: "$.variants[0].zones[0].anchors[1].id",
        }),
      ]),
    );
  });

  it("rejects ratio rectangles that overflow without an explicit override", () => {
    const result = validateSceneLayoutManifest({
      ...validManifest,
      variants: [
        {
          ...baseVariant,
          zones: [
            {
              ...baseZone,
              rect: {
                x: 0.8,
                y: 0.2,
                width: 0.3,
                height: 0.3,
                unit: "ratio",
              },
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-value",
          path: "$.variants[0].zones[0].rect",
        }),
      ]),
    );
  });

  it("rejects a missing fallback variant", () => {
    const result = validateSceneLayoutManifest({
      ...validManifest,
      baseVariant: "tablet",
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-variant",
          path: "$.baseVariant",
        }),
      ]),
    );
  });

  it("throws when callers try to build an invalid manifest", () => {
    expect(() =>
      createSceneLayoutManifest({
        ...validManifest,
        variants: [],
      }),
    ).toThrow(/invalid scene layout manifest/i);
  });

  it("fails closed for missing manifest and surface roots", () => {
    const manifestResult = validateSceneLayoutManifest(undefined);
    const surfaceResult = validateSceneLayoutSurface(undefined);

    expect(manifestResult.valid).toBe(false);
    expect(surfaceResult.valid).toBe(false);
    expect(manifestResult.issues[0]?.path).toBe("$");
    expect(surfaceResult.issues[0]?.path).toBe("$");
  });

  it("rejects duplicate variant ids", () => {
    const result = validateSceneLayoutManifest({
      ...validManifest,
      variants: [
        baseVariant,
        {
          ...baseVariant,
          zones: [
            {
              id: "supporting",
              coordinateSpace: "local",
              rect: {
                x: 0.1,
                y: 0.1,
                width: 0.2,
                height: 0.2,
                unit: "ratio",
              },
              anchors: [
                {
                  id: "supporting-center",
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

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-id",
          path: "$.variants[1].id",
        }),
      ]),
    );
  });

  it("rejects malformed zones, anchors, tags, and breakpoint rules", () => {
    const result = validateSceneLayoutManifest({
      schemaVersion: "0.0.1",
      baseVariant: "bad variant",
      variants: [
        {
          id: "desktop",
          breakpoint: {
            minWidth: 900,
            maxWidth: 800,
            minAspectRatio: 2,
            maxAspectRatio: 1,
            orientation: "sideways",
          },
          zones: [
            {
              id: "hero",
              coordinateSpace: "pixel-viewport",
              rect: {
                x: -10,
                y: -5,
                width: 100,
                height: 50,
                unit: "pixels",
              },
              anchors: [
                {
                  id: "hero-center",
                  x: 0.5,
                  y: 0.5,
                  horizontal: "center",
                  vertical: "center",
                  tags: "bad",
                },
              ],
              tags: "bad",
            },
            {
              id: "hero",
              coordinateSpace: "screen",
              allowOverflow: "true",
              rect: {
                x: "left",
                y: 0,
                width: 1.2,
                height: 0,
                unit: "percent",
              },
              anchors: [
                {
                  id: "bad anchor",
                  x: 1.5,
                  y: -0.2,
                  horizontal: "left",
                  vertical: "up",
                  depth: -1,
                  tags: ["dup", "dup", ""],
                },
                {
                  id: "bad anchor",
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

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.schemaVersion" }),
        expect.objectContaining({ path: "$.baseVariant" }),
        expect.objectContaining({ path: "$.variants[0].breakpoint" }),
        expect.objectContaining({
          path: "$.variants[0].zones[0].rect",
        }),
        expect.objectContaining({
          path: "$.variants[0].zones[0].tags",
        }),
        expect.objectContaining({
          path: "$.variants[0].zones[1].coordinateSpace",
        }),
        expect.objectContaining({
          path: "$.variants[0].zones[1].allowOverflow",
        }),
        expect.objectContaining({
          path: "$.variants[0].zones[1].rect.unit",
        }),
        expect.objectContaining({
          path: "$.variants[0].zones[1].anchors[0].id",
        }),
      ]),
    );
  });

  it("rejects missing breakpoints, empty zones, missing anchors, and invalid surfaces", () => {
    const manifestResult = validateSceneLayoutManifest({
      schemaVersion: SCENE_LAYOUT_SCHEMA_VERSION,
      baseVariant: "desktop",
      variants: [
        null,
        {
          id: "desktop",
          breakpoint: null,
          zones: [],
        },
        {
          id: "tablet",
          breakpoint: {},
          zones: [
            {
              id: "empty-anchor-zone",
              coordinateSpace: "normalized-viewport",
              rect: null,
              anchors: [],
            },
          ],
        },
      ],
    });

    const surfaceResult = validateSceneLayoutSurface({
      width: -1,
      height: 0,
    });

    expect(manifestResult.valid).toBe(false);
    expect(surfaceResult.valid).toBe(false);
    expect(manifestResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.variants[0]" }),
        expect.objectContaining({ path: "$.variants[1].breakpoint" }),
        expect.objectContaining({ path: "$.variants[1].zones" }),
        expect.objectContaining({ path: "$.variants[2].zones[0].rect" }),
        expect.objectContaining({ path: "$.variants[2].zones[0].anchors" }),
      ]),
    );
    expect(surfaceResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.width" }),
        expect.objectContaining({ path: "$.height" }),
      ]),
    );
  });
});
