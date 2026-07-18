import { loginApartment } from "../../lib/actions/apartment-auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Entrar no apartamento</h1>
      <LoginForm action={loginApartment} />
    </main>
  );
}
