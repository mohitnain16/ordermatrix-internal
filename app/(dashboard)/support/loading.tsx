import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sk" style={{ width: 150, height: 22, borderRadius: 4 }} />
      </div>
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
