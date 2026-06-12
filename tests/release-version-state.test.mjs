import { describe, expect, it } from "vitest";

import {
  compareSemver,
  normalizeVersionCandidate,
  selectHighestKnownReleaseVersion,
} from "../scripts/resolve-release-base-version.mjs";

describe("release version reconciliation", () => {
  it("normalizes valid semver inputs and strips release tag prefixes", () => {
    expect(normalizeVersionCandidate(" v0.1.1 \n")).toBe("0.1.1");
    expect(normalizeVersionCandidate("0.2.0-beta.3")).toBe("0.2.0-beta.3");
    expect(normalizeVersionCandidate("release/0.2.0")).toBeNull();
  });

  it("selects the highest known version across repository, tags, and npm state", () => {
    expect(
      selectHighestKnownReleaseVersion([
        "0.1.0",
        "0.1.1",
        "v0.1.1",
        "",
        "not-a-version",
      ]),
    ).toBe("0.1.1");
  });

  it("treats a stable release as newer than its prereleases", () => {
    expect(compareSemver("0.2.0", "0.2.0-beta.11")).toBeGreaterThan(0);
  });

  it("orders prerelease numeric identifiers numerically instead of lexically", () => {
    expect(compareSemver("0.2.0-beta.11", "0.2.0-beta.3")).toBeGreaterThan(0);
  });

  it("prefers the highest prerelease when only prerelease tags exist for the next line", () => {
    expect(
      selectHighestKnownReleaseVersion([
        "0.1.9",
        "0.2.0-beta.2",
        "v0.2.0-beta.11",
      ]),
    ).toBe("0.2.0-beta.11");
  });
});
