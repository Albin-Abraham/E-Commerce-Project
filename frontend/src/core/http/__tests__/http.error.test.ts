import { describe, expect, it } from "vitest";

import { ApiErrorParser } from "../api-error-parser";
import { HttpError } from "../http.error";

describe("HttpError & ApiErrorParser Backend Compatibility", () => {
  it("parses DEBUG=False ResponseFactory.envelope format with meta", () => {
    const rawPayload = {
      status: 422,
      message: "Validation failed",
      detail: {
        non_field_errors: [
          "Invalid credentials. Please check your username/email and password.",
        ],
      },
      meta: {
        view: "UserLoginAuthView",
        function: "post",
        debug: false,
        issue: "ValidationError: Invalid credentials.",
      },
    };

    const error = new HttpError(
      rawPayload.message,
      rawPayload.status,
      "Unprocessable Entity",
      rawPayload
    );

    expect(error.isValidationError()).toBe(true);
    expect(error.nonFieldErrors).toEqual([
      "Invalid credentials. Please check your username/email and password.",
    ]);
    expect(error.meta).toEqual(rawPayload.meta);

    const parser = ApiErrorParser.from(error);
    expect(parser.isValidationError).toBe(true);
    expect(parser.nonFieldErrors).toEqual([
      "Invalid credentials. Please check your username/email and password.",
    ]);
    expect(parser.meta).toEqual(rawPayload.meta);
  });

  it("parses DEBUG=True PlatformException structure with meta", () => {
    const rawPayload = {
      error: {
        code: "domain_error",
        message: "Domain rule violated",
        metadata: {
          field_errors: {
            email: ["Email format is invalid."],
          },
          meta: {
            view: "UserRegistrationAuthView",
            function: "post",
            debug: true,
            issue: "DomainException: Invalid domain rule.",
          },
        },
      },
    };

    const error = new HttpError(
      rawPayload.error.message,
      400,
      "Bad Request",
      rawPayload
    );

    expect(error.code).toBe("domain_error");
    expect(error.fieldErrors).toEqual({
      email: ["Email format is invalid."],
    });
    expect(error.meta).toEqual(rawPayload.error.metadata.meta);

    const parser = ApiErrorParser.from(error);
    expect(parser.fieldErrors.email).toEqual(["Email format is invalid."]);
    expect(parser.meta?.view).toBe("UserRegistrationAuthView");
  });

  it("extracts direct field errors from metadata when field_errors key is omitted (DRF debug mode)", () => {
    const rawPayload = {
      error: {
        code: "request_error",
        message: "One or more validation errors occurred.",
        metadata: {
          email: ["This field must be unique."],
          username: ["Username already exists."],
          meta: {
            view: "UserRegistrationAuthView",
            function: "post",
            debug: true,
            issue: "ValidationError: Duplicate email.",
          },
        },
      },
    };

    const error = new HttpError(
      rawPayload.error.message,
      400,
      "Bad Request",
      rawPayload
    );

    expect(error.fieldErrors).toEqual({
      email: ["This field must be unique."],
      username: ["Username already exists."],
    });
    expect(error.meta?.debug).toBe(true);
    expect(error.meta?.function).toBe("post");
  });
});
