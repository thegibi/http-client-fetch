'use client';

import { useEffect, useState } from 'react';
import { api } from '../libs/api';

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export default function FetchClientSide() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await api.get<User[]>('/users');
        setUsers(users.data);
      } catch {
        setError('Unable to load users from the browser.');
      }
    };

    fetchUsers();
  }, []);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-sky-200 bg-sky-50 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Client Component
        </span>
        <h2 className="text-2xl font-semibold text-zinc-950">
          Request data after hydration in the browser
        </h2>
        <p className="text-sm leading-6 text-zinc-700">
          This component uses the same shared API client, but the request runs
          inside an effect because the component needs browser-side execution.
        </p>
      </div>

      <div className="rounded-xl border border-sky-100 bg-white/80 p-4 text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">Example call</p>
        <p className="mt-1 font-mono text-xs text-zinc-600">
          {`useEffect(() => { api.get('/users') }, [])`}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!users && !error ? (
        <p className="text-sm text-zinc-600">Loading users in the browser...</p>
      ) : null}

      <ul className="space-y-3">
        {users?.map((user) => (
          <li
            key={user.id}
            className="rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm"
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
