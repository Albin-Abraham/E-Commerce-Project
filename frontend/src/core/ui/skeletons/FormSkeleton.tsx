import { Zenith } from '@shared/theme';

/** Simple shimmering form placeholder */
export const FormSkeleton = ({ fields = 3 }: { fields?: number }) => (
  <div className={Zenith.layout.flexColumn + ' space-y-2'}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className='h-4 w-full bg-gray-200 rounded animate-pulse' />
    ))}
    <div className='h-8 w-24 bg-gray-200 rounded animate-pulse mt-4' />
  </div>
);
