import { loginApartment } from "../../lib/actions/apartment-auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Entrar no apartamento</h1>
      <form action={loginApartment} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="apartmentNumber">
          Apartamento
        </label>
        <input className="rounded border p-3" id="apartmentNumber" name="apartmentNumber" inputMode="numeric" required />
        <label className="text-sm font-medium" htmlFor="pin">
          PIN
        </label>
        <input className="rounded border p-3" id="pin" name="pin" type="password" required />
        <button className="rounded bg-slate-900 p-3 text-white" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
