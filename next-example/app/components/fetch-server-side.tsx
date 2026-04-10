import { api } from '../libs/api';

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export default async function FetchServerSide() {
  const users = await api.get<User[]>('/users');

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Server Component
        </span>
        <h2 className="text-2xl font-semibold text-zinc-950">
          Request data during server render
        </h2>
        <p className="text-sm leading-6 text-zinc-700">
          This component is a Server Component by default. It can await the
          shared API client directly while the page is rendering on the server.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-white/80 p-4 text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">Example call</p>
        <p className="mt-1 font-mono text-xs text-zinc-600">
          {`const users = await api.get('/users')`}
        </p>
      </div>

      <ul className="space-y-3">
        {users.data.map((user) => (
          <li
            key={user.id}
            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm"
          >
            <p className="font-semibold text-zinc-950">{user.name}</p>
            <p className="text-zinc-600">@{user.username}</p>
            <p className="text-zinc-600">{user.email}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
