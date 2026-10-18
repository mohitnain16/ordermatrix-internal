import { TabsSkeleton } from '../../../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sk" style={{ width: 110, height: 22, borderRadius: 4 }} />
      </div>
      <TabsSkeleton tabs={3} bodyRows={8} bodyCols={5} />
    </div>
  );
}
