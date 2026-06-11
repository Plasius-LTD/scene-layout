import {
  SCENE_LAYOUT_SCHEMA_VERSION,
  type SceneLayoutAnchor,
  type SceneLayoutBreakpoint,
  type SceneLayoutCollisionPolicy,
  type SceneLayoutManifest,
  type SceneLayoutRect,
  type SceneLayoutSurface,
  type SceneLayoutSurfaceFamily,
  type SceneLayoutValidationIssue,
  type SceneLayoutValidationResult,
  type SceneLayoutVariant,
  type SceneLayoutVisibilityMode,
  type SceneLayoutZoneSemantics,
  type SceneLayoutZone,
} from "./types.js";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const COORDINATE_SPACES = new Set([
  "normalized-viewport",
  "pixel-viewport",
  "world",
  "local",
]);
const UNITS = new Set(["ratio", "pixels"]);
const ALIGNMENTS = new Set(["start", "center", "end"]);
const ORIENTATIONS = new Set(["portrait", "landscape", "any"]);
const SURFACE_FAMILIES = new Set<SceneLayoutSurfaceFamily>([
  "player-system",
  "party-system",
  "shared",
]);
const ZONE_ROLES = new Set([
  "world-space-panel",
  "focus-pane",
  "reduced-combat-overlay",
  "overlay-rail",
  "alert-stack",
]);
const VISIBILITY_MODES = new Set<SceneLayoutVisibilityMode>([
  "ambient",
  "focused",
  "combat-reduced",
]);
const COLLISION_POLICIES = new Set<SceneLayoutCollisionPolicy>([
  "stack",
  "exclusive",
  "allow-overlap",
]);

function pushIssue(
  issues: SceneLayoutValidationIssue[],
  issue: SceneLayoutValidationIssue,
): void {
  issues.push(issue);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateKebabId(
  value: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): value is string {
  if (typeof value !== "string") {
    pushIssue(issues, {
      code: "invalid-type",
      path,
      message: "Expected a string id.",
    });
    return false;
  }

  if (!ID_PATTERN.test(value)) {
    pushIssue(issues, {
      code: "invalid-id",
      path,
      message: "Ids must be non-empty kebab-case tokens.",
    });
    return false;
  }

  return true;
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): value is string[] {
  if (value === undefined) {
    return true;
  }

  if (!Array.isArray(value)) {
    pushIssue(issues, {
      code: "invalid-type",
      path,
      message: "Expected an array of strings.",
    });
    return false;
  }

  const seen = new Set<string>();
  let valid = true;

  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || item.trim().length === 0) {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}[${index}]`,
        message: "Expected a non-empty string tag.",
      });
      valid = false;
      continue;
    }

    if (seen.has(item)) {
      pushIssue(issues, {
        code: "duplicate-id",
        path: `${path}[${index}]`,
        message: `Duplicate tag '${item}' is not allowed.`,
      });
      valid = false;
      continue;
    }

    seen.add(item);
  }

  return valid;
}

function validateVisibilityModes(
  value: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): value is SceneLayoutVisibilityMode[] {
  if (!Array.isArray(value) || value.length === 0) {
    pushIssue(issues, {
      code: "required",
      path,
      message: "visibilityModes must contain at least one mode.",
    });
    return false;
  }

  let valid = true;
  const seen = new Set<string>();

  for (const [index, item] of value.entries()) {
    if (!VISIBILITY_MODES.has(item as SceneLayoutVisibilityMode)) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}[${index}]`,
        message:
          "visibilityModes entries must be ambient, focused, or combat-reduced.",
      });
      valid = false;
      continue;
    }

    if (seen.has(item)) {
      pushIssue(issues, {
        code: "duplicate-id",
        path: `${path}[${index}]`,
        message: `Duplicate visibility mode '${item}' is not allowed.`,
      });
      valid = false;
      continue;
    }

    seen.add(item);
  }

  return valid;
}

function validateRect(
  rect: unknown,
  path: string,
  allowOverflow: boolean,
  issues: SceneLayoutValidationIssue[],
): rect is SceneLayoutRect {
  if (!rect || typeof rect !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected a rectangle definition.",
    });
    return false;
  }

  const value = rect as Record<string, unknown>;
  const unit = value.unit;
  const x = value.x;
  const y = value.y;
  const width = value.width;
  const height = value.height;
  let valid = true;

  if (!UNITS.has(String(unit))) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.unit`,
      message: "Rectangle unit must be 'ratio' or 'pixels'.",
    });
    valid = false;
  }

  for (const [field, raw] of [
    ["x", x],
    ["y", y],
    ["width", width],
    ["height", height],
  ] as const) {
    if (!isFiniteNumber(raw)) {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}.${field}`,
        message: `Rectangle ${field} must be a finite number.`,
      });
      valid = false;
    }
  }

  if (!valid) {
    return false;
  }

  const rectX = x as number;
  const rectY = y as number;
  const rectWidth = width as number;
  const rectHeight = height as number;

  if (rectWidth <= 0 || rectHeight <= 0) {
    pushIssue(issues, {
      code: "invalid-value",
      path,
      message: "Rectangle width and height must be greater than zero.",
    });
    valid = false;
  }

  if (unit === "ratio") {
    for (const [field, raw] of [
      ["x", rectX],
      ["y", rectY],
      ["width", rectWidth],
      ["height", rectHeight],
    ] as const) {
      if (raw < 0 || raw > 1) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.${field}`,
          message: `Ratio rectangle ${field} must be between 0 and 1.`,
        });
        valid = false;
      }
    }

    if (
      !allowOverflow
      && (rectX + rectWidth > 1 || rectY + rectHeight > 1)
    ) {
      pushIssue(issues, {
        code: "invalid-value",
        path,
        message:
          "Ratio rectangles must stay within the unit surface unless allowOverflow is true.",
      });
      valid = false;
    }
  } else if (rectX < 0 || rectY < 0) {
    pushIssue(issues, {
      code: "invalid-value",
      path,
      message: "Pixel rectangles must start at non-negative coordinates.",
    });
    valid = false;
  }

  return valid;
}

function validateAnchor(
  anchor: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): anchor is SceneLayoutAnchor {
  if (!anchor || typeof anchor !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected an anchor definition.",
    });
    return false;
  }

  const value = anchor as Record<string, unknown>;
  let valid = validateKebabId(value.id, `${path}.id`, issues);

  for (const [field, raw] of [
    ["x", value.x],
    ["y", value.y],
  ] as const) {
    if (!isFiniteNumber(raw) || raw < 0 || raw > 1) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.${field}`,
        message: "Anchor coordinates must be finite numbers between 0 and 1.",
      });
      valid = false;
    }
  }

  if (!ALIGNMENTS.has(String(value.horizontal))) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.horizontal`,
      message: "Anchor horizontal alignment must be start, center, or end.",
    });
    valid = false;
  }

  if (!ALIGNMENTS.has(String(value.vertical))) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.vertical`,
      message: "Anchor vertical alignment must be start, center, or end.",
    });
    valid = false;
  }

  if (
    value.depth !== undefined
    && (!isFiniteNumber(value.depth) || value.depth < 0)
  ) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.depth`,
      message: "Anchor depth must be a non-negative finite number when provided.",
    });
    valid = false;
  }

  if (!validateStringArray(value.tags, `${path}.tags`, issues)) {
    valid = false;
  }

  return valid;
}

function validateZoneSemantics(
  semantics: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): semantics is SceneLayoutZoneSemantics {
  if (!semantics || typeof semantics !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected a zone semantics definition.",
    });
    return false;
  }

  const value = semantics as Record<string, unknown>;
  let valid = true;

  if (!SURFACE_FAMILIES.has(value.surfaceFamily as SceneLayoutSurfaceFamily)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.surfaceFamily`,
      message: "surfaceFamily must be player-system, party-system, or shared.",
    });
    valid = false;
  }

  if (!ZONE_ROLES.has(String(value.role))) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.role`,
      message:
        "role must be world-space-panel, focus-pane, reduced-combat-overlay, overlay-rail, or alert-stack.",
    });
    valid = false;
  }

  if (
    value.collisionPolicy !== undefined
    && !COLLISION_POLICIES.has(value.collisionPolicy as SceneLayoutCollisionPolicy)
  ) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.collisionPolicy`,
      message:
        "collisionPolicy must be stack, exclusive, or allow-overlap when provided.",
    });
    valid = false;
  }

  if (!validateVisibilityModes(value.visibilityModes, `${path}.visibilityModes`, issues)) {
    valid = false;
  }

  return valid;
}

function validateZone(
  zone: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): zone is SceneLayoutZone {
  if (!zone || typeof zone !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected a zone definition.",
    });
    return false;
  }

  const value = zone as Record<string, unknown>;
  let valid = validateKebabId(value.id, `${path}.id`, issues);

  if (!COORDINATE_SPACES.has(String(value.coordinateSpace))) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.coordinateSpace`,
      message:
        "Coordinate space must be normalized-viewport, pixel-viewport, world, or local.",
    });
    valid = false;
  }

  if (
    value.allowOverflow !== undefined
    && typeof value.allowOverflow !== "boolean"
  ) {
    pushIssue(issues, {
      code: "invalid-type",
      path: `${path}.allowOverflow`,
      message: "allowOverflow must be a boolean when provided.",
    });
    valid = false;
  }

  if (!validateRect(value.rect, `${path}.rect`, value.allowOverflow === true, issues)) {
    valid = false;
  }

  if (!Array.isArray(value.anchors) || value.anchors.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: `${path}.anchors`,
      message: "Zones must declare at least one anchor.",
    });
    valid = false;
  } else {
    const seenAnchors = new Set<string>();
    for (const [index, anchor] of value.anchors.entries()) {
      if (!validateAnchor(anchor, `${path}.anchors[${index}]`, issues)) {
        valid = false;
        continue;
      }

      const id = (anchor as SceneLayoutAnchor).id;
      if (seenAnchors.has(id)) {
        pushIssue(issues, {
          code: "duplicate-id",
          path: `${path}.anchors[${index}].id`,
          message: `Duplicate anchor id '${id}' is not allowed within a zone.`,
        });
        valid = false;
        continue;
      }

      seenAnchors.add(id);
    }
  }

  if (
    value.semantics !== undefined
    && !validateZoneSemantics(value.semantics, `${path}.semantics`, issues)
  ) {
    valid = false;
  }

  if (!validateStringArray(value.tags, `${path}.tags`, issues)) {
    valid = false;
  }

  return valid;
}

function validateBreakpoint(
  breakpoint: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): breakpoint is SceneLayoutBreakpoint {
  if (!breakpoint || typeof breakpoint !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected a breakpoint definition.",
    });
    return false;
  }

  const value = breakpoint as Record<string, unknown>;
  let valid = true;

  for (const field of [
    "minWidth",
    "maxWidth",
    "minAspectRatio",
    "maxAspectRatio",
  ] as const) {
    const raw = value[field];
    if (raw !== undefined && (!isFiniteNumber(raw) || raw <= 0)) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.${field}`,
        message: `${field} must be a positive finite number when provided.`,
      });
      valid = false;
    }
  }

  if (
    isFiniteNumber(value.minWidth)
    && isFiniteNumber(value.maxWidth)
    && value.minWidth > value.maxWidth
  ) {
    pushIssue(issues, {
      code: "invalid-value",
      path,
      message: "minWidth cannot be greater than maxWidth.",
    });
    valid = false;
  }

  if (
    isFiniteNumber(value.minAspectRatio)
    && isFiniteNumber(value.maxAspectRatio)
    && value.minAspectRatio > value.maxAspectRatio
  ) {
    pushIssue(issues, {
      code: "invalid-value",
      path,
      message: "minAspectRatio cannot be greater than maxAspectRatio.",
    });
    valid = false;
  }

  if (
    value.orientation !== undefined
    && !ORIENTATIONS.has(String(value.orientation))
  ) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.orientation`,
      message: "orientation must be portrait, landscape, or any.",
    });
    valid = false;
  }

  return valid;
}

function validateVariant(
  variant: unknown,
  path: string,
  issues: SceneLayoutValidationIssue[],
): variant is SceneLayoutVariant {
  if (!variant || typeof variant !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected a variant definition.",
    });
    return false;
  }

  const value = variant as Record<string, unknown>;
  let valid = validateKebabId(value.id, `${path}.id`, issues);

  if (!validateBreakpoint(value.breakpoint, `${path}.breakpoint`, issues)) {
    valid = false;
  }

  if (!Array.isArray(value.zones) || value.zones.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: `${path}.zones`,
      message: "Variants must provide at least one zone.",
    });
    valid = false;
  } else {
    const seenZones = new Set<string>();
    for (const [index, zone] of value.zones.entries()) {
      if (!validateZone(zone, `${path}.zones[${index}]`, issues)) {
        valid = false;
        continue;
      }

      const id = (zone as SceneLayoutZone).id;
      if (seenZones.has(id)) {
        pushIssue(issues, {
          code: "duplicate-id",
          path: `${path}.zones[${index}].id`,
          message: `Duplicate zone id '${id}' is not allowed within a variant.`,
        });
        valid = false;
        continue;
      }

      seenZones.add(id);
    }
  }

  return valid;
}

export function validateSceneLayoutManifest(
  manifest: unknown,
): SceneLayoutValidationResult<SceneLayoutManifest> {
  const issues: SceneLayoutValidationIssue[] = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$",
          message: "Expected a scene layout manifest object.",
        },
      ],
    };
  }

  const value = manifest as Record<string, unknown>;
  let valid = true;

  if (value.schemaVersion !== SCENE_LAYOUT_SCHEMA_VERSION) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.schemaVersion",
      message: `schemaVersion must equal ${SCENE_LAYOUT_SCHEMA_VERSION}.`,
    });
    valid = false;
  }

  if (!validateKebabId(value.baseVariant, "$.baseVariant", issues)) {
    valid = false;
  }

  if (!Array.isArray(value.variants) || value.variants.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.variants",
      message: "Manifest must contain at least one variant.",
    });
    valid = false;
  } else {
    const seenVariants = new Set<string>();
    for (const [index, variant] of value.variants.entries()) {
      if (!validateVariant(variant, `$.variants[${index}]`, issues)) {
        valid = false;
        continue;
      }

      const id = (variant as SceneLayoutVariant).id;
      if (seenVariants.has(id)) {
        pushIssue(issues, {
          code: "duplicate-id",
          path: `$.variants[${index}].id`,
          message: `Duplicate variant id '${id}' is not allowed.`,
        });
        valid = false;
        continue;
      }

      seenVariants.add(id);
    }

    if (typeof value.baseVariant === "string" && !seenVariants.has(value.baseVariant)) {
      pushIssue(issues, {
        code: "missing-variant",
        path: "$.baseVariant",
        message: "baseVariant must reference an existing variant id.",
      });
      valid = false;
    }
  }

  return valid
    ? {
        valid: true,
        issues,
        value: manifest as SceneLayoutManifest,
      }
    : {
        valid: false,
        issues,
      };
}

export function createSceneLayoutManifest(
  manifest: SceneLayoutManifest,
): SceneLayoutManifest {
  const validation = validateSceneLayoutManifest(manifest);
  if (!validation.valid || !validation.value) {
    const summary = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid scene layout manifest. ${summary}`);
  }

  return validation.value;
}

export function validateSceneLayoutSurface(
  surface: unknown,
): SceneLayoutValidationResult<SceneLayoutSurface> {
  const issues: SceneLayoutValidationIssue[] = [];

  if (!surface || typeof surface !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$",
          message: "Expected a scene layout surface object.",
        },
      ],
    };
  }

  const value = surface as Record<string, unknown>;
  let valid = true;

  for (const field of ["width", "height"] as const) {
    const raw = value[field];
    if (!isFiniteNumber(raw) || raw <= 0) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `$.${field}`,
        message: `${field} must be a positive finite number.`,
      });
      valid = false;
    }
  }

  return valid
    ? {
        valid: true,
        issues,
        value: surface as SceneLayoutSurface,
      }
    : {
        valid: false,
        issues,
      };
}
