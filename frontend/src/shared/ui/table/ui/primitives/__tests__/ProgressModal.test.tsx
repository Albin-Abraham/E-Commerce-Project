import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgressModal } from "../ProgressModal";

describe("ProgressModal", () => {
  it("renders nothing when closed", () => {
    render(
      <ProgressModal
        isOpen={false}
        onClose={vi.fn()}
        status="idle"
        progress={0}
      >
        {({ status }) => <div data-testid="content">{status}</div>}
      </ProgressModal>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(
      <ProgressModal isOpen={true} onClose={vi.fn()} status="idle" progress={0}>
        {({ status }) => <div data-testid="content">{status}</div>}
      </ProgressModal>
    );

    expect(screen.getByTestId("content")).toHaveTextContent("idle");
  });

  it("passes correct render props", () => {
    const onClose = vi.fn();

    render(
      <ProgressModal
        isOpen={true}
        onClose={onClose}
        status="processing"
        progress={50}
        title="Exporting..."
      >
        {({ status, progress, title }) => (
          <div>
            <span data-testid="status">{status}</span>
            <span data-testid="progress">{progress}</span>
            <span data-testid="title">{title}</span>
          </div>
        )}
      </ProgressModal>
    );

    expect(screen.getByTestId("status")).toHaveTextContent("processing");
    expect(screen.getByTestId("progress")).toHaveTextContent("50");
    expect(screen.getByTestId("title")).toHaveTextContent("Exporting...");
  });

  it("calls close on escape key", () => {
    const onClose = vi.fn();

    render(
      <ProgressModal
        isOpen={true}
        onClose={onClose}
        status="completed"
        progress={100}
      >
        {() => <div />}
      </ProgressModal>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("prevents close on escape when processing and not dismissable", () => {
    const onClose = vi.fn();

    render(
      <ProgressModal
        isOpen={true}
        onClose={onClose}
        status="processing"
        progress={50}
        dismissable={false}
      >
        {() => <div />}
      </ProgressModal>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("allows close on escape when processing and dismissable", () => {
    const onClose = vi.fn();

    render(
      <ProgressModal
        isOpen={true}
        onClose={onClose}
        status="processing"
        progress={50}
        dismissable={true}
      >
        {() => <div />}
      </ProgressModal>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("shows correct title for each status", () => {
    const statuses: Array<[string, string]> = [
      ["idle", "Processing..."],
      ["processing", "Processing..."],
      ["completed", "Complete"],
      ["failed", "Failed"],
    ];

    for (const [status, expectedTitle] of statuses) {
      const { unmount } = render(
        <ProgressModal
          isOpen={true}
          onClose={vi.fn()}
          status={status as "idle" | "processing" | "completed" | "failed"}
          progress={0}
        >
          {({ title }) => <span data-testid="title">{title}</span>}
        </ProgressModal>
      );

      expect(screen.getByTestId("title")).toHaveTextContent(expectedTitle);
      unmount();
    }
  });

  it("accepts queued and uploading statuses", () => {
    for (const status of ["queued", "uploading", "pending"] as const) {
      const { unmount } = render(
        <ProgressModal
          isOpen={true}
          onClose={vi.fn()}
          status={status}
          progress={10}
        >
          {({ status: s }) => <div data-testid="content">{s}</div>}
        </ProgressModal>
      );
      expect(screen.getByTestId("content")).toHaveTextContent(status);
      unmount();
    }
  });

  it("allows dismiss when idle even if dismissable is false", () => {
    const onClose = vi.fn();

    render(
      <ProgressModal
        isOpen={true}
        onClose={onClose}
        status="idle"
        progress={0}
        dismissable={false}
      >
        {() => <div />}
      </ProgressModal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("blocks dismiss when queued and not dismissable", () => {
    const onClose = vi.fn();

    render(
      <ProgressModal
        isOpen={true}
        onClose={onClose}
        status="queued"
        progress={0}
        dismissable={false}
      >
        {() => <div />}
      </ProgressModal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sets role and aria attributes", () => {
    render(
      <ProgressModal isOpen={true} onClose={vi.fn()} status="idle" progress={0}>
        {() => <div />}
      </ProgressModal>
    );

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
