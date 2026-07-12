import { Skeleton } from '@client/src/components/ui/skeleton';

export function NotificationLoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}

