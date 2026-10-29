import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailRenderer } from "../detail/DetailRenderer";
import {
  DetailValueDisplay,
  isSafeUrl,
  isSafeEmail,
  isSafePhone,
  normalizeDisplayModel,
} from "../detail/DetailRenderers";
import { TextField } from "../fields/primitive/TextField";
import { SwitchField } from "../fields/primitive/SwitchField";
import { CheckboxField } from "../fields/primitive/CheckboxField";

describe("Architecture Boundary Tests", () => {
  describe("Invariant 1: Primitive Input Atoms are 100% Form & Shell Independent", () => {
    it("renders TextField as a pure HTML input atom without FieldShellContext or FormRuntimeProvider", () => {
      render(
        <TextField
          id="test-username"
          name="username"
          value="john_doe"
          placeholder="Enter username"
          aria-invalid={false}
          aria-describedby="user-help"
          aria-required={true}
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("john_doe");
      expect(input).toHaveAttribute("id", "test-username");
      expect(input).toHaveAttribute("name", "username");
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).toHaveAttribute("aria-describedby", "user-help");
      expect(input).toHaveAttribute("aria-required", "true");
    });

    it("renders SwitchField as a pure switch atom without FieldShellContext or FormRuntimeProvider", () => {
      render(
        <SwitchField
          id="notifications-toggle"
          name="notifications"
          value={true}
          aria-invalid={false}
          aria-required={false}
        />
      );

      const switchInput = screen.getByRole("switch");
      expect(switchInput).toBeInTheDocument();
      expect(switchInput).toBeChecked();
    });

    it("renders CheckboxField as a pure checkbox atom without FieldShellContext or FormRuntimeProvider", () => {
      render(
        <CheckboxField
          id="terms-toggle"
          name="terms"
          value={true}
          label="I agree to terms"
          aria-invalid={false}
        />
      );

      const checkboxInput = screen.getByRole("checkbox");
      expect(checkboxInput).toBeInTheDocument();
      expect(checkboxInput).toBeChecked();
      expect(screen.getByText("I agree to terms")).toBeInTheDocument();
    });
  });

  describe("Invariant 2: Display Value Normalizer & Protocol Security Allowlist", () => {
    it("isSafeUrl correctly validates permitted protocols and blocks dangerous schemes", () => {
      // Safe schemes
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("http://localhost:3000")).toBe(true);
      expect(isSafeUrl("/api/v1/resource")).toBe(true);
      expect(isSafeUrl("/dashboard")).toBe(true);

      // Dangerous schemes (XSS vectors)
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("JAVASCRIPT:alert(document.cookie)")).toBe(false);
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeUrl("//evil.com")).toBe(false); // protocol-relative to external domain
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
    });

    it("isSafeEmail and isSafePhone validate input formats", () => {
      expect(isSafeEmail("alice@example.com")).toBe(true);
      expect(isSafeEmail("bad\r\nemail@example.com")).toBe(false);
      expect(isSafeEmail("<script>@evil.com")).toBe(false);

      expect(isSafePhone("+1 (555) 019-2834")).toBe(true);
      expect(isSafePhone("123456")).toBe(true);
      expect(isSafePhone("bad-phone-with-letters")).toBe(false);
    });

    it("normalizeDisplayModel produces pure domain models without UI rendering", () => {
      const emptyModel = normalizeDisplayModel(null);
      expect(emptyModel).toEqual({ kind: "empty", text: "—" });

      const boolModel = normalizeDisplayModel(true, "boolean");
      expect(boolModel).toEqual({ kind: "boolean", value: true, isTrue: true });

      const currencyModel = normalizeDisplayModel(1250.5, "currency", undefined, undefined, "USD", "en-US");
      expect(currencyModel.kind).toBe("currency");
      expect((currencyModel as any).text).toContain("1,250.50");

      const safeUrlModel = normalizeDisplayModel("https://example.com", "url");
      expect(safeUrlModel).toEqual({
        kind: "url",
        href: "https://example.com",
        label: "https://example.com",
        isSafe: true,
      });

      const unsafeUrlModel = normalizeDisplayModel("javascript:alert(1)", "url");
      expect(unsafeUrlModel).toEqual({
        kind: "url",
        href: "javascript:alert(1)",
        label: "javascript:alert(1)",
        isSafe: false,
      });
    });

    it("DetailValueDisplay renders safe links as <a> tags and unsafe links as safe text", () => {
      const { rerender } = render(
        <DetailValueDisplay type="url" value="https://safe-domain.com" />
      );

      const link = screen.getByRole("link", { name: "https://safe-domain.com" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://safe-domain.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");

      // Now render an unsafe URL
      rerender(<DetailValueDisplay type="url" value="javascript:alert(1)" />);

      // Must NOT render as a link
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      // Must render as plain text
      expect(screen.getByText("javascript:alert(1)")).toBeInTheDocument();
    });
  });

  describe("Invariant 3: DetailRenderer Zero-Form Overhead in Display Mode", () => {
    it("renders pure semantic <article> and <dl> without mounting FormRuntimeProvider contexts", () => {
      const definition = {
        id: "server-spec",
        title: "Production Node 01",
        fields: [
          { id: "hostname", name: "hostname", label: "Hostname", type: "text" },
          { id: "ip_address", name: "ip_address", label: "IP Address", type: "text" },
          { id: "active", name: "active", label: "Status", type: "boolean" },
        ],
      };

      const data = {
        hostname: "zenos-prod-node-01.internal",
        ip_address: "10.0.4.12",
        active: true,
      };

      const { container } = render(
        <DetailRenderer definition={definition as any} data={data} mode="display" />
      );

      // 1. Semantic <article> root with data attribute
      const article = container.querySelector("article[data-detail-renderer='true']");
      expect(article).toBeInTheDocument();

      // 2. Strict invariant: ZERO <form> elements
      expect(container.querySelectorAll("form").length).toBe(0);

      // 3. Values displayed correctly
      expect(screen.getByText("zenos-prod-node-01.internal")).toBeInTheDocument();
      expect(screen.getByText("10.0.4.12")).toBeInTheDocument();
      expect(screen.getByText("Production Node 01")).toBeInTheDocument();
    });
  });
});
