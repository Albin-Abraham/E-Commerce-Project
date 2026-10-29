import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TBody, TD, TH, THead, TR, Table } from "../TablePrimitives";

describe("TablePrimitives", () => {
  describe("THead", () => {
    it("renders without sticky by default", () => {
      const { container } = render(
        <table>
          <THead>
            <tr>
              <th>Header</th>
            </tr>
          </THead>
        </table>
      );

      const thead = container.querySelector("thead");
      expect(thead).not.toHaveClass("sticky");
    });

    it("applies sticky class when sticky=true", () => {
      const { container } = render(
        <table>
          <THead sticky>
            <tr>
              <th>Header</th>
            </tr>
          </THead>
        </table>
      );

      const thead = container.querySelector("thead");
      expect(thead).toHaveClass("sticky");
      expect(thead).toHaveClass("top-0");
      expect(thead).toHaveClass("z-20");
    });

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <THead className="custom-header">
            <tr>
              <th>Header</th>
            </tr>
          </THead>
        </table>
      );

      const thead = container.querySelector("thead");
      expect(thead).toHaveClass("custom-header");
    });
  });

  describe("Table", () => {
    it("renders with overflow-x-auto by default", () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      const scroller = container.querySelector('[class*="overflow-auto"]');
      expect(scroller).toBeInTheDocument();
    });

    it("renders with overflow-auto when virtualized", () => {
      const { container } = render(
        <Table virtualized>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      const scroller = container.querySelector('[class*="overflow-auto"]');
      expect(scroller).toBeInTheDocument();
    });

    it("applies striped class to table", () => {
      const { container } = render(
        <Table striped>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = container.querySelector("table");
      expect(table).toHaveClass("striped");
    });

    it("applies bordered class to table", () => {
      const { container } = render(
        <Table bordered>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = container.querySelector("table");
      expect(table).toHaveClass("bordered");
    });

    it("applies shadow-sm to container", () => {
      const { container } = render(
        <Table shadow="sm">
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );
      expect(
        container.querySelector('[class*="shadow-sm"]')
      ).toBeInTheDocument();
    });

    it("applies shadow-md to container", () => {
      const { container } = render(
        <Table shadow="md">
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );
      expect(
        container.querySelector('[class*="shadow-md"]')
      ).toBeInTheDocument();
    });

    it("applies shadow-lg to container", () => {
      const { container } = render(
        <Table shadow="lg">
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );
      expect(
        container.querySelector('[class*="shadow-lg"]')
      ).toBeInTheDocument();
    });

    it("applies shadow-premium when shadow=true (default)", () => {
      const { container } = render(
        <Table shadow>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      expect(
        container.querySelector('[class*="shadow-premium"]')
      ).toBeInTheDocument();
    });

    it("does not apply shadow class when shadow=false", () => {
      const { container } = render(
        <Table shadow={false}>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      const outerDiv = container.firstElementChild!;
      expect(outerDiv).not.toHaveClass(
        "shadow-premium",
        "shadow-sm",
        "shadow-md",
        "shadow-lg"
      );
    });

    it("applies containerClassName", () => {
      const { container } = render(
        <Table containerClassName="my-container">
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      expect(container.querySelector(".my-container")).toBeInTheDocument();
    });

    it("sets role=grid on the table element", () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = container.querySelector("table");
      expect(table).toHaveAttribute("role", "grid");
    });
  });

  describe("TBody", () => {
    it("applies custom className", () => {
      const { container } = render(
        <table>
          <TBody className="my-body">
            <tr>
              <td>Content</td>
            </tr>
          </TBody>
        </table>
      );

      const tbody = container.querySelector("tbody");
      expect(tbody).toHaveClass("my-body");
    });
  });

  describe("TR", () => {
    it("sets role=row", () => {
      const { container } = render(
        <table>
          <tbody>
            <TR>
              <td>Row</td>
            </TR>
          </tbody>
        </table>
      );
      const tr = container.querySelector("tr");
      expect(tr).toHaveAttribute("role", "row");
    });

    it("applies custom className", () => {
      const { container } = render(
        <table>
          <tbody>
            <TR className="custom-row">
              <td>Row</td>
            </TR>
          </tbody>
        </table>
      );
      const tr = container.querySelector("tr");
      expect(tr).toHaveClass("custom-row");
    });
  });

  describe("TH", () => {
    it("sets role=columnheader", () => {
      const { container } = render(
        <table>
          <thead>
            <tr>
              <TH>Header</TH>
            </tr>
          </thead>
        </table>
      );
      const th = container.querySelector("th");
      expect(th).toHaveAttribute("role", "columnheader");
    });
  });

  describe("TD", () => {
    it("sets role=gridcell", () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TD>Data</TD>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector("td");
      expect(td).toHaveAttribute("role", "gridcell");
    });
  });
});
