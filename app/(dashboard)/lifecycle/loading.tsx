import { TabsSkeleton } from '../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <div className="sk" style={{ width: 180, height: 22, borderRadius: 4, marginBottom: 6 }} />
          <div className="sk" style={{ width: 260, height: 13, borderRadius: 4 }} />
        </div>
      </div>
      <TabsSkeleton tabs={3} bodyRows={10} bodyCols={7} />
    </div>
  );
}
