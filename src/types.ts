export const SCENE_LAYOUT_SCHEMA_VERSION = "1.0.0";
export const SCENE_LAYOUT_FOUNDATION_FLAG_ID =
  "scene.layout.foundation.enabled";
export const SCENE_LAYOUT_INTERFACE_ZONE_IDS = {
  playerSystemWorldPanel: "player-system-world-panel",
  playerSystemFocusPane: "player-system-focus-pane",
  playerSystemReducedCombatOverlay: "player-system-reduced-combat-overlay",
  partySystemOverlayRail: "party-system-overlay-rail",
  sharedAlertStack: "shared-alert-stack",
} as const;

export type SceneLayoutCoordinateSpace =
  | "normalized-viewport"
  | "pixel-viewport"
  | "world"
  | "local";

export type SceneLayoutUnit = "ratio" | "pixels";

export type SceneLayoutAlignment = "start" | "center" | "end";

export type SceneLayoutOrientation = "portrait" | "landscape" | "any";

export type SceneLayoutSurfaceFamily =
  | "player-system"
  | "party-system"
  | "shared";

export type SceneLayoutZoneRole =
  | "world-space-panel"
  | "focus-pane"
  | "reduced-combat-overlay"
  | "overlay-rail"
  | "alert-stack";

export type SceneLayoutVisibilityMode =
  | "ambient"
  | "focused"
  | "combat-reduced";

export type SceneLayoutCollisionPolicy =
  | "stack"
  | "exclusive"
  | "allow-overlap";

export interface SceneLayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: SceneLayoutUnit;
}

export interface SceneLayoutAnchor {
  id: string;
  x: number;
  y: number;
  horizontal: SceneLayoutAlignment;
  vertical: SceneLayoutAlignment;
  depth?: number;
  tags?: string[];
}

export interface SceneLayoutZoneSemantics {
  surfaceFamily: SceneLayoutSurfaceFamily;
  role: SceneLayoutZoneRole;
  visibilityModes: SceneLayoutVisibilityMode[];
  collisionPolicy?: SceneLayoutCollisionPolicy;
}

export interface SceneLayoutZone {
  id: string;
  coordinateSpace: SceneLayoutCoordinateSpace;
  rect: SceneLayoutRect;
  anchors: SceneLayoutAnchor[];
  allowOverflow?: boolean;
  semantics?: SceneLayoutZoneSemantics;
  tags?: string[];
}

export interface SceneLayoutBreakpoint {
  minWidth?: number;
  maxWidth?: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
  orientation?: SceneLayoutOrientation;
}

export interface SceneLayoutVariant {
  id: string;
  description?: string;
  breakpoint: SceneLayoutBreakpoint;
  zones: SceneLayoutZone[];
}

export interface SceneLayoutManifest {
  schemaVersion: string;
  baseVariant: string;
  variants: SceneLayoutVariant[];
}

export interface SceneLayoutSurface {
  width: number;
  height: number;
}

export interface SceneLayoutValidationIssue {
  code:
    | "required"
    | "invalid-type"
    | "invalid-id"
    | "invalid-value"
    | "duplicate-id"
    | "missing-variant";
  path: string;
  message: string;
}

export interface SceneLayoutValidationResult<T> {
  valid: boolean;
  issues: SceneLayoutValidationIssue[];
  value?: T;
}
