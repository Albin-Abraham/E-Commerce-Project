import { describe, expect, it } from "vitest";

import { getStickyStyles } from "../getStickyStyles";

function createColumn(pinned: string | false = false, start = 100) {
  return {
    getIsPinned: () => pinned,
    getStart: (_side: string) => start,
  };
}

describe("getStickyStyles", () => {
  it("returns empty object when not pinned", () => {
    const styles = getStickyStyles(createColumn(false));
    expect(styles).toEqual({});
  });

  it("returns sticky styles for pinned cell", () => {
    const styles = getStickyStyles(createColumn("left", 200));

    expect(styles.position).toBe("sticky");
    expect(styles.left).toBe(200);
    expect(styles.zIndex).toBe(10);
    expect(styles.backgroundColor).toBe("var(--z-card-bg)");
  });

  it("returns sticky styles for pinned header", () => {
    const styles = getStickyStyles(createColumn("left", 200), "header");

    expect(styles.position).toBe("sticky");
    expect(styles.left).toBe(200);
    expect(styles.zIndex).toBe(25);
    expect(styles.backgroundColor).toBe("var(--z-card-bg)");
    expect(styles.backdropFilter).toBe("blur(8px)");
  });

  it("includes boxShadow when pinned", () => {
    const styles = getStickyStyles(createColumn("left"));
    expect(styles.boxShadow).toContain("4px 0 10px");
  });

  it("does not include backdropFilter for cell context", () => {
    const styles = getStickyStyles(createColumn("left"), "cell");
    expect(styles.backdropFilter).toBeUndefined();
  });

  it("defaults context to cell", () => {
    const styles = getStickyStyles(createColumn("left", 50));
    expect(styles.zIndex).toBe(10);
  });
});
