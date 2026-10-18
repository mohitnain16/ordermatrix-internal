import { Sk, StatGridSkeleton, TabsSkeleton } from '../../../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      {/* Tenant header */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Sk w={200} h={22} r={4} mb={8} />
            <Sk w={260} h={13} r={3} mb={6} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Sk w={64} h={22} r={99} />
              <Sk w={52} h={22} r={99} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Sk w={96} h={32} r={8} />
            <Sk w={96} h={32} r={8} />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <StatGridSkeleton n={3} />

      {/* Tabs */}
      <TabsSkeleton tabs={8} bodyRows={8} bodyCols={5} />
    </div>
  );
}
