export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-slate-600">Acesso para ajustes e relatorios.</p>
      </header>
      <form className="flex flex-col gap-3">
        <input
          className="rounded border p-3"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
        <input
          className="rounded border p-3"
          name="password"
          placeholder="Senha"
          required
          type="password"
        />
        <button className="rounded bg-slate-900 p-3 text-white" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
