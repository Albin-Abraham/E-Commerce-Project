import { describe, it, expect, vi } from "vitest";
import { adaptEnginePropsToViewModel } from "../useFieldViewModel";

describe("adaptEnginePropsToViewModel", () => {
  it("flattens nested inputProps to the root view-model props", () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onFocus = vi.fn();

    const rawProps = {
      id: "username",
      name: "username",
      label: "User Name",
      inputProps: {
        value: "albin",
        valid: true,
        errors: [],
        onChange,
        onBlur,
        onFocus,
      },
    };

    const vm = adaptEnginePropsToViewModel("username", rawProps, null);

    expect(vm.value).toBe("albin");
    expect(vm.onChange).toBe(onChange);
    expect(vm.onBlur).toBe(onBlur);
    expect(vm.onFocus).toBe(onFocus);
    expect(vm.error).toBe(false);
    expect(vm.isInvalid).toBe(false);
    expect(vm.isEmpty).toBe(false);
    expect(vm.label).toBe("User Name");
  });

  it("extracts error message and flags isInvalid when errors are present", () => {
    const rawProps = {
      id: "email",
      name: "email",
      inputProps: {
        value: "invalid-email",
        valid: false,
        errors: [{ message: "Must be a valid email", rule: "email", code: "ERR_EMAIL" }],
      },
    };

    const vm = adaptEnginePropsToViewModel("email", rawProps, null);

    expect(vm.error).toBe(true);
    expect(vm.isInvalid).toBe(true);
    expect(vm.errorMessage).toBe("Must be a valid email");
    expect(vm.errors).toHaveLength(1);
  });

  it("accurately detects isEmpty for null, undefined, empty string vs 0 and false", () => {
    expect(adaptEnginePropsToViewModel("f1", { inputProps: { value: "" } }, null).isEmpty).toBe(true);
    expect(adaptEnginePropsToViewModel("f2", { inputProps: { value: null } }, null).isEmpty).toBe(true);
    expect(adaptEnginePropsToViewModel("f3", { inputProps: { value: undefined } }, null).isEmpty).toBe(true);

    // 0 and boolean false are NOT empty
    expect(adaptEnginePropsToViewModel("f4", { inputProps: { value: 0 } }, null).isEmpty).toBe(false);
    expect(adaptEnginePropsToViewModel("f5", { inputProps: { value: false } }, null).isEmpty).toBe(false);
  });

  it("delegates onSearch to form.remoteOptions.executeSearch", () => {
    const executeSearch = vi.fn();
    const mockForm = {
      remoteOptions: {
        executeSearch,
      },
    };

    const vm = adaptEnginePropsToViewModel("country", {}, mockForm);
    expect(typeof vm.onSearch).toBe("function");

    vm.onSearch?.("Germany");
    expect(executeSearch).toHaveBeenCalledWith("country", "Germany");
  });

  it("handles null or undefined fieldProps gracefully without throwing", () => {
    const vm = adaptEnginePropsToViewModel("fieldX", null, null);
    expect(vm.value).toBeUndefined();
    expect(vm.isInvalid).toBe(false);
    expect(vm.isEmpty).toBe(true);
  });
});
