import { TableSkeleton } from '../../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <div className="sk" style={{ width: 100, height: 22, borderRadius: 4, marginBottom: 6 }} />
          <div className="sk" style={{ width: 130, height: 13, borderRadius: 4 }} />
        </div>
      </div>
      {/* Filter bar skeleton — matches real filter bar height */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '14px 20px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius) var(--radius) 0 0',
          borderBottom: '1px solid var(--line)',
          border: '1px solid var(--line)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div className="sk" style={{ width: 280, height: 36, borderRadius: 8 }} />
        <div className="sk" style={{ width: 140, height: 36, borderRadius: 8 }} />
        <div className="sk" style={{ width: 76, height: 36, borderRadius: 8 }} />
      </div>
      <TableSkeleton rows={10} cols={10} />
    </div>
  );
}
