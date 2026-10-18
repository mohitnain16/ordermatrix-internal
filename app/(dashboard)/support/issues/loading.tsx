import { StatGridSkeleton, TableSkeleton } from '../../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sk" style={{ width: 170, height: 22, borderRadius: 4, marginBottom: 6 }} />
        <div className="sk" style={{ width: 320, height: 13, borderRadius: 4 }} />
      </div>
      <StatGridSkeleton n={3} />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
