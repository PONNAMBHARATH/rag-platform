const skeletonLineClass = "h-2.5 rounded-full bg-gray-200";

export function ConversationListSkeleton() {
    return (
        <div aria-hidden="true" className="space-y-1 motion-safe:animate-pulse">
            {["w-3/4", "w-2/3", "w-4/5", "w-1/2"].map((width) => (
                <div key={width} className="space-y-2 rounded-lg px-3 py-3">
                    <div className={`${skeletonLineClass} ${width}`} />
                    <div className={`${skeletonLineClass} w-16`} />
                </div>
            ))}
        </div>
    );
}

export function MessageHistorySkeleton() {
    return (
        <>
            <p role="status" className="sr-only">Loading conversation messages…</p>
            <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
                <div className="ml-auto w-2/5 max-w-64 rounded-2xl bg-gray-200 px-4 py-4">
                    <div className="h-2.5 w-4/5 rounded-full bg-gray-300" />
                </div>
                <div className="w-3/4 max-w-md space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                    <div className={`${skeletonLineClass} w-full`} />
                    <div className={`${skeletonLineClass} w-4/5`} />
                    <div className={`${skeletonLineClass} w-3/5`} />
                </div>
                <div className="ml-auto w-1/3 max-w-48 rounded-2xl bg-gray-200 px-4 py-4">
                    <div className="h-2.5 w-3/4 rounded-full bg-gray-300" />
                </div>
            </div>
        </>
    );
}
