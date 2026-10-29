import React from "react";

import { describe, expect, it, vi } from "vitest";

import { createTableCompound } from "../createTableCompound";

describe("createTableCompound", () => {
  it("attaches components to Root", () => {
    const Root = (() => null) as React.FC;
    const Header = (() => null) as React.FC;
    const Body = (() => null) as React.FC;

    const Compound = createTableCompound(Root, { Header, Body });

    expect(Compound.Header).toBe(Header);
    expect(Compound.Body).toBe(Body);
  });

  it("returns Root with attached components", () => {
    const Root = (() => null) as React.FC;
    const Child = (() => null) as React.FC;

    const Compound = createTableCompound(Root, { Child });

    expect(Compound).toBe(Root);
    expect((Compound as any).Child).toBe(Child);
  });

  it("handles empty components object", () => {
    const Root = (() => null) as React.FC;
    const Compound = createTableCompound(Root, {});

    expect(Compound).toBe(Root);
  });

  it("warns in development when overwriting existing property", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const Root = (() => null) as React.FC & { Header?: React.FC };
    Root.Header = (() => "old") as React.FC;
    const NewHeader = (() => "new") as React.FC;

    createTableCompound(Root, { Header: NewHeader });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"Header" overwrites existing property')
    );

    warnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("does not warn in production", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const Root = (() => null) as React.FC & { Header?: React.FC };
    Root.Header = (() => "old") as React.FC;
    const NewHeader = (() => "new") as React.FC;

    createTableCompound(Root, { Header: NewHeader });

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
