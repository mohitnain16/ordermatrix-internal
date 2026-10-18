import { TableSkeleton } from '../../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sk" style={{ width: 160, height: 22, borderRadius: 4 }} />
      </div>
      <TableSkeleton rows={10} cols={7} />
    </div>
  );
}
