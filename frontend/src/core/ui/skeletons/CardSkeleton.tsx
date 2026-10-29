import { Zenith } from '@shared/theme';

/** Simple shimmering card placeholder */
export const CardSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className={Zenith.layout.flexColumn + ' space-y-2'}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className='h-24 w-full bg-gray-200 rounded animate-pulse'
      />
    ))}
    <div className='h-6 w-1/2 bg-gray-200 rounded animate-pulse mt-4' />
  </div>
);
