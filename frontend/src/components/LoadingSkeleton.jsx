export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-200 animate-pulse h-12 rounded-lg"></div>
      ))}
    </div>
  );
}
