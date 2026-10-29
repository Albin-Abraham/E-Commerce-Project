import { cn } from "@core/libs/utils";
import { useTableMeta } from "@ui/table/core/TableMetaContext";
import { TBody } from "../TablePrimitives";
import { DefaultEmptyState } from "../states/DefaultEmptyState";

export interface EmptyBodyProps {
  colSpan: number;
  className?: string;
}

/**
 * EmptyBody — renders the empty state when no rows are present.
 * Fills the remaining scroller height as an absolute centered overlay.
 */
export function EmptyBody({ colSpan, className }: EmptyBodyProps) {
  const meta = useTableMeta();
  const EmptyComponent = meta.ui?.empty ?? DefaultEmptyState;

  return (
    <>
      <TBody className="sr-only" aria-hidden="true">
        <tr>
          <td colSpan={colSpan} />
        </tr>
      </TBody>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center p-4 min-h-[220px] pointer-events-none z-10",
          className
        )}
      >
        <div className="pointer-events-auto">
          <EmptyComponent message="No records found" />
        </div>
      </div>
    </>
  );
}
