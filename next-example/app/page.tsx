import FetchClientSide from './components/fetch-client-side';
import FetchServerSide from './components/fetch-server-side';

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-6 py-16 text-zinc-950">
      <main className="flex w-full max-w-6xl flex-col gap-10 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
        <section className="flex flex-col gap-4 border-b border-zinc-200 pb-8">
          <span className="w-fit rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Next.js + http-client-fetch
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              One HTTP client for server and client components
            </h1>
            <p className="max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg">
              This example uses one shared http-client-fetch instance and shows
              how it can be called in a default Server Component and an
              interactive Client Component inside the App Router.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <FetchServerSide />
          <FetchClientSide />
        </section>
      </main>
    </div>
  );
}
