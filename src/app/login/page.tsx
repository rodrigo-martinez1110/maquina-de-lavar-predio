import { loginApartment } from "../../lib/actions/apartment-auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <header className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm font-medium text-slate-300">Lava e Seca</p>
        <h1 className="mt-1 text-2xl font-semibold">Entrar no apartamento</h1>
        <p className="mt-3 text-sm text-slate-300">
          Use o numero do apartamento e o PIN combinado com o admin.
        </p>
      </header>
      <LoginForm action={loginApartment} />
    </main>
  );
}
