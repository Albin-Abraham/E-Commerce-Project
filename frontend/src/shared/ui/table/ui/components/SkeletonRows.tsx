import { TD, TR } from "../TablePrimitives";

/** Deterministic skeleton width based on row/col index (no Math.random) */
function skeletonWidth(rowIndex: number, colIndex: number): number {
  const hash = ((rowIndex * 7 + colIndex * 13 + 37) % 40) + 60;
  return hash;
}

export interface SkeletonRowsProps {
  count: number;
  colSpan: number;
}

/**
 * SkeletonRows — inline loading skeleton for the table body.
 * Avoids importing the full DefaultLoadingState which renders its own <tbody>.
 */
export function SkeletonRows({ count, colSpan }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: count }, (_, rowIndex) => (
        <TR key={`skeleton-${rowIndex}`} data-status="loading" aria-hidden>
          <TD colSpan={colSpan}>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(colSpan, 4) }, (_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 rounded-md bg-muted/50 animate-pulse flex-1"
                  style={{
                    width: `${skeletonWidth(rowIndex, colIndex)}%`,
                    animationDelay: `${(rowIndex * 4 + colIndex) * 50}ms`,
                  }}
                />
              ))}
            </div>
          </TD>
        </TR>
      ))}
    </>
  );
}
