import type { Metadata } from "next";
import { Mark } from "@/components/brand/logo";
import { safeNext } from "@/lib/admin-session";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Вход — zavod.today",
  robots: { index: false, follow: false },
};

// Страница входа в админку и кабинет. Канон — docs/admin.md «Доступ».

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const failed = params.error === "1";
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <form
        action={login}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <div className="flex items-center gap-2">
          <Mark size={24} />
          <span className="font-semibold">zavod.today</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold">Вход</h1>
          <p className="text-sm text-zinc-500">Браузер запомнит вас на 90 дней.</p>
        </div>
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Пароль"
          aria-label="Пароль"
          className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
        />
        {failed ? <p className="text-sm text-red-600">Пароль не подошёл.</p> : null}
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Войти
        </button>
      </form>
    </main>
  );
}
