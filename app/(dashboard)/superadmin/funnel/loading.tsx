import { StatGridSkeleton, TableSkeleton } from '../../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sk" style={{ width: 200, height: 22, borderRadius: 4, marginBottom: 6 }} />
        <div className="sk" style={{ width: 280, height: 13, borderRadius: 4 }} />
      </div>
      <StatGridSkeleton n={4} />
      <TableSkeleton rows={12} cols={6} />
    </div>
  );
}
