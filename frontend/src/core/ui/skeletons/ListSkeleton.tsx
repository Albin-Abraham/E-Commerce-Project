import { Zenith } from '@shared/theme';

/** Simple shimmering list placeholder */
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className={Zenith.layout.flexColumn + ' space-y-3'}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className='h-4 w-full bg-gray-200 rounded animate-pulse'
      />
    ))}
  </div>
);
