import type { TableQueryParams } from "@ui/table/types";

/**
 * QueryDialectAdapter Contract
 *
 * Pluggable dialect strategy translating internal TableQueryParams
 * to/from backend specific query string protocols (REST, OData v4, RSQL/FIQL).
 */
export interface QueryDialectAdapter {
  name: string;
  serialize(params: TableQueryParams): Record<string, string>;
  parse(rawParams: Record<string, string>): Partial<TableQueryParams>;
}

// ─── Standard REST Dialect ───────────────────────────────────────────────────

export class RestDialectAdapter implements QueryDialectAdapter {
  readonly name = "rest";

  serialize(params: TableQueryParams): Record<string, string> {
    const result: Record<string, string> = {
      page: String(params.page),
      size: String(params.pageSize),
    };

    if (params.search) {
      result.search = params.search;
    }

    if (params.sort && params.sort.length > 0) {
      result.sort = params.sort.map((s) => `${s.key}:${s.dir}`).join(",");
    }

    if (params.filters && Object.keys(params.filters).length > 0) {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          result[`filter[${k}]`] = String(v);
        }
      });
    }

    return result;
  }

  parse(raw: Record<string, string>): Partial<TableQueryParams> {
    const page = raw.page ? parseInt(raw.page, 10) : undefined;
    const pageSize = raw.size ? parseInt(raw.size, 10) : undefined;
    const search = raw.search ?? undefined;

    const sort = raw.sort
      ? raw.sort.split(",").map((token) => {
          const [key, dir] = token.split(":");
          return { key, dir: (dir === "desc" ? "desc" : "asc") as "asc" | "desc" };
        })
      : undefined;

    const filters: Record<string, unknown> = {};
    Object.entries(raw).forEach(([k, v]) => {
      const match = k.match(/^filter\[(.*)\]$/);
      if (match && match[1]) {
        filters[match[1]] = v;
      }
    });

    return {
      ...(page !== undefined ? { page, offset: page * (pageSize ?? 10) } : {}),
      ...(pageSize !== undefined ? { pageSize } : {}),
      ...(search !== undefined ? { search } : {}),
      ...(sort !== undefined ? { sort } : {}),
      ...(Object.keys(filters).length > 0 ? { filters } : {}),
    };
  }
}

// ─── OData v4 Dialect ────────────────────────────────────────────────────────

export class ODataDialectAdapter implements QueryDialectAdapter {
  readonly name = "odata";

  serialize(params: TableQueryParams): Record<string, string> {
    const result: Record<string, string> = {
      $top: String(params.pageSize),
      $skip: String(params.page * params.pageSize),
    };

    if (params.search) {
      result.$search = `"${params.search}"`;
    }

    if (params.sort && params.sort.length > 0) {
      result.$orderby = params.sort
        .map((s) => `${s.key} ${s.dir}`)
        .join(", ");
    }

    if (params.filters && Object.keys(params.filters).length > 0) {
      const clauses = Object.entries(params.filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => {
          if (typeof v === "number" || typeof v === "boolean") {
            return `${k} eq ${v}`;
          }
          return `${k} eq '${v}'`;
        });

      if (clauses.length > 0) {
        result.$filter = clauses.join(" and ");
      }
    }

    return result;
  }

  parse(raw: Record<string, string>): Partial<TableQueryParams> {
    const top = raw.$top ? parseInt(raw.$top, 10) : undefined;
    const skip = raw.$skip ? parseInt(raw.$skip, 10) : undefined;
    const pageSize = top ?? 10;
    const page = skip !== undefined ? Math.floor(skip / pageSize) : undefined;
    const search = raw.$search ? raw.$search.replace(/^"|"$/g, "") : undefined;

    const sort = raw.$orderby
      ? raw.$orderby.split(",").map((token) => {
          const parts = token.trim().split(/\s+/);
          return {
            key: parts[0],
            dir: (parts[1]?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc",
          };
        })
      : undefined;

    return {
      ...(page !== undefined ? { page, offset: page * pageSize } : {}),
      ...(top !== undefined ? { pageSize: top } : {}),
      ...(search !== undefined ? { search } : {}),
      ...(sort !== undefined ? { sort } : {}),
    };
  }
}

// ─── RSQL / FIQL Dialect ─────────────────────────────────────────────────────

export class RsqlDialectAdapter implements QueryDialectAdapter {
  readonly name = "rsql";

  serialize(params: TableQueryParams): Record<string, string> {
    const result: Record<string, string> = {
      page: String(params.page),
      size: String(params.pageSize),
    };

    if (params.sort && params.sort.length > 0) {
      result.sort = params.sort.map((s) => `${s.key},${s.dir}`).join(";");
    }

    const conditions: string[] = [];
    if (params.search) {
      conditions.push(`search=="*${params.search}*"`);
    }

    if (params.filters && Object.keys(params.filters).length > 0) {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          conditions.push(`${k}==${v}`);
        }
      });
    }

    if (conditions.length > 0) {
      result.query = conditions.join(";");
    }

    return result;
  }

  parse(raw: Record<string, string>): Partial<TableQueryParams> {
    const page = raw.page ? parseInt(raw.page, 10) : undefined;
    const pageSize = raw.size ? parseInt(raw.size, 10) : undefined;

    const sort = raw.sort
      ? raw.sort.split(";").map((token) => {
          const [key, dir] = token.split(",");
          return {
            key,
            dir: (dir?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc",
          };
        })
      : undefined;

    return {
      ...(page !== undefined ? { page, offset: page * (pageSize ?? 10) } : {}),
      ...(pageSize !== undefined ? { pageSize } : {}),
      ...(sort !== undefined ? { sort } : {}),
    };
  }
}
