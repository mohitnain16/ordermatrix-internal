import { StatGridSkeleton, ChartSkeleton, TableSkeleton } from '../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sk" style={{ width: 180, height: 22, borderRadius: 4, marginBottom: 6 }} />
        <div className="sk" style={{ width: 120, height: 14, borderRadius: 4 }} />
      </div>
      <StatGridSkeleton n={4} />
      <ChartSkeleton height={260} label="MRR" />
      <ChartSkeleton height={260} label="ARR" />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
