/**
 * Form URL Synchronization Hook Test Suite
 *
 * @issue [FEAT-FORM-URL-SYNC]
 * @bug [BUG-URL-INFINITE-LOOP]
 *
 * Validates bi-directional synchronization between headless Form state and PlatformUrlPort:
 *  1. Mount hydration without triggering re-render loops
 *  2. Non-destructive parameter merging
 *  3. Scoped namespacing support
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Form } from "@form-core/form";
import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import { useFormUrlSync } from "../useFormUrlSync";
import type { FormDefinition } from "@ui/form/types";

const TEST_SCHEMA: FormDefinition = {
  id: "test-filter-form",
  title: "Test Filter Form",
  fields: [
    { id: "status", name: "status", type: "text", label: "Status" },
    { id: "category", name: "category", type: "text", label: "Category" },
  ],
};

describe("useFormUrlSync", () => {
  it("hydrates form values from URL port on mount", async () => {
    const port = PlatformUrlAdapters.createMock({
      status: "active",
      category: "medical",
      unrelated_table_page: "3",
    });

    const form = new Form(TEST_SCHEMA);

    renderHook(() =>
      useFormUrlSync({
        form,
        port,
      })
    );

    // Give requestAnimationFrame hydration lock time to flush
    await new Promise((r) => setTimeout(r, 50));

    expect(form.values.status).toBe("active");
    expect(form.values.category).toBe("medical");
    // Ensure unrelated parameter remains in URL port untouched
    expect(port.snapshot().get("unrelated_table_page")).toBe("3");
  });

  it("merges form updates non-destructively without wiping table or global params", async () => {
    const port = PlatformUrlAdapters.createMock({
      page: "2",
      sort: "name:asc",
      globalSearch: "clinic",
    });

    const form = new Form(TEST_SCHEMA);

    renderHook(() =>
      useFormUrlSync({
        form,
        port,
        debounceMs: 0,
      })
    );

    await new Promise((r) => setTimeout(r, 50));

    // Form value update
    act(() => {
      form.setValue("status", "pending");
    });

    // Verify form parameter is written
    expect(port.get("status")).toBe("pending");
    // Verify ALL other URL parameters are strictly preserved
    expect(port.get("page")).toBe("2");
    expect(port.get("sort")).toBe("name:asc");
    expect(port.get("globalSearch")).toBe("clinic");
  });

  it("removes parameter when form field is cleared", async () => {
    const port = PlatformUrlAdapters.createMock({
      status: "active",
      page: "1",
    });

    const form = new Form(TEST_SCHEMA);

    renderHook(() =>
      useFormUrlSync({
        form,
        port,
        debounceMs: 0,
      })
    );

    await new Promise((r) => setTimeout(r, 50));

    // Clear status
    act(() => {
      form.setValue("status", "");
    });

    expect(port.get("status")).toBeNull();
    // Table parameter preserved
    expect(port.get("page")).toBe("1");
  });

  it("supports scoped parameter namespacing", async () => {
    const port = PlatformUrlAdapters.createMock(
      {
        filters_status: "in-review",
        other_widget_param: "safe",
      },
      "filters"
    );

    const form = new Form(TEST_SCHEMA);

    renderHook(() =>
      useFormUrlSync({
        form,
        scope: "filters",
        port,
        debounceMs: 0,
      })
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(form.values.status).toBe("in-review");

    act(() => {
      form.setValue("category", "hardware");
    });

    expect(port.snapshot().get("filters_category")).toBe("hardware");
    expect(port.snapshot().get("other_widget_param")).toBe("safe");
  });

  it("synchronizes wizard steps bi-directionally", async () => {
    const port = PlatformUrlAdapters.createMock({
      step: "step-account",
    });

    const form = new Form(TEST_SCHEMA);
    const onStepChange = vi.fn();

    const { rerender } = renderHook(
      ({ currentStepId }) =>
        useFormUrlSync({
          form,
          port,
          syncStep: true,
          currentStepId,
          onStepChange,
          debounceMs: 0,
        }),
      { initialProps: { currentStepId: "step-initial" } }
    );

    await new Promise((r) => setTimeout(r, 50));

    // Inbound: URL step hydrated to onStepChange
    expect(onStepChange).toHaveBeenCalledWith("step-account");

    // Outbound: step change writes to URL
    rerender({ currentStepId: "step-billing" });

    expect(port.get("step")).toBe("step-billing");
  });
});
