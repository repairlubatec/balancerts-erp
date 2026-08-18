import { Skeleton } from "./ui/skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#dfe4ea]">
      <aside className="w-[280px] border-r border-[#aeb8c4] bg-[#edf1f5]">
        <div className="flex h-11 items-center gap-2 border-b border-[#c9d1db] bg-[#e5e9ee] px-3"><Skeleton className="h-5 w-5 rounded-sm" /><Skeleton className="h-3 w-28" /></div>
        <div className="space-y-4 p-2">
          {["Contexto", "Financeira", "Comercial", "Operações", "Controlo"].map((group) => <div key={group} className="space-y-1"><Skeleton className="h-2 w-16" />{[1, 2].map((item) => <Skeleton key={item} className="h-8 w-full rounded-sm" />)}</div>)}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <Skeleton className="h-8 rounded-none" />
        <Skeleton className="h-10 rounded-none" />
        <main className="space-y-3 p-3"><Skeleton className="h-12 w-full rounded-sm" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-24 rounded-sm" /><Skeleton className="h-24 rounded-sm" /><Skeleton className="h-24 rounded-sm" /></div><Skeleton className="h-56 rounded-sm" /></main>
      </section>
    </div>
  );
}
