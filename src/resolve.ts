import type {
  SceneLayoutBreakpoint,
  SceneLayoutManifest,
  SceneLayoutSurface,
  SceneLayoutVariant,
} from "./types.js";
import {
  createSceneLayoutManifest,
  validateSceneLayoutSurface,
} from "./validation.js";

function getOrientation(surface: SceneLayoutSurface): "portrait" | "landscape" {
  return surface.width >= surface.height ? "landscape" : "portrait";
}

function matchesBreakpoint(
  breakpoint: SceneLayoutBreakpoint,
  surface: SceneLayoutSurface,
): boolean {
  const aspectRatio = surface.width / surface.height;
  const orientation = getOrientation(surface);

  if (
    breakpoint.minWidth !== undefined
    && surface.width < breakpoint.minWidth
  ) {
    return false;
  }

  if (
    breakpoint.maxWidth !== undefined
    && surface.width > breakpoint.maxWidth
  ) {
    return false;
  }

  if (
    breakpoint.minAspectRatio !== undefined
    && aspectRatio < breakpoint.minAspectRatio
  ) {
    return false;
  }

  if (
    breakpoint.maxAspectRatio !== undefined
    && aspectRatio > breakpoint.maxAspectRatio
  ) {
    return false;
  }

  if (
    breakpoint.orientation !== undefined
    && breakpoint.orientation !== "any"
    && breakpoint.orientation !== orientation
  ) {
    return false;
  }

  return true;
}

function scoreVariant(
  variant: SceneLayoutVariant,
  surface: SceneLayoutSurface,
): number {
  const breakpoint = variant.breakpoint;
  let score = 0;

  if (breakpoint.minWidth !== undefined) {
    score += 4;
  }

  if (breakpoint.maxWidth !== undefined) {
    score += 4;
  }

  if (
    breakpoint.orientation !== undefined
    && breakpoint.orientation !== "any"
  ) {
    score += 3;
  }

  if (breakpoint.minAspectRatio !== undefined) {
    score += 2;
  }

  if (breakpoint.maxAspectRatio !== undefined) {
    score += 2;
  }

  const widthWindow =
    (breakpoint.maxWidth ?? Number.POSITIVE_INFINITY)
    - (breakpoint.minWidth ?? 0);
  if (Number.isFinite(widthWindow)) {
    score += Math.max(0, 1 - widthWindow / Math.max(surface.width, 1));
  }

  return score;
}

export function resolveSceneLayoutVariant(
  manifest: SceneLayoutManifest,
  surface: SceneLayoutSurface,
): SceneLayoutVariant {
  const validatedManifest = createSceneLayoutManifest(manifest);
  const validatedSurface = validateSceneLayoutSurface(surface);

  if (!validatedSurface.valid || !validatedSurface.value) {
    const summary = validatedSurface.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid scene layout surface. ${summary}`);
  }

  const resolvedSurface = validatedSurface.value;

  const matchingVariants = validatedManifest.variants
    .filter((variant) => matchesBreakpoint(variant.breakpoint, resolvedSurface))
    .sort(
      (left, right) =>
        scoreVariant(right, resolvedSurface)
        - scoreVariant(left, resolvedSurface),
    );

  if (matchingVariants.length > 0) {
    return matchingVariants[0] as SceneLayoutVariant;
  }

  const fallback = validatedManifest.variants.find(
    (variant) => variant.id === validatedManifest.baseVariant,
  );
  if (!fallback) {
    throw new Error(
      `Scene layout manifest fallback variant '${validatedManifest.baseVariant}' is missing.`,
    );
  }

  return fallback;
}
