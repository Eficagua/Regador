export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-0">
      <div className="h-4 w-24 animate-pulse rounded-full bg-track" />
      <div className="mt-3 h-10 w-56 animate-pulse rounded-2xl bg-track" />
      <div className="mt-6 h-36 animate-pulse rounded-3xl bg-card ring-1 ring-foreground/10" />
      <div className="mt-3 h-48 animate-pulse rounded-3xl bg-card ring-1 ring-foreground/10" />
    </main>
  )
}
