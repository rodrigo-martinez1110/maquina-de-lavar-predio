import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/auth/admin-session";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-slate-600">Gestao da lava e seca compartilhada.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded border p-4" href="/admin/apartments">
          <h2 className="font-medium">Apartamentos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ajuste moradores, cotas extras e PINs.
          </p>
        </Link>
        <Link className="rounded border p-4" href="/admin/metrics">
          <h2 className="font-medium">Metricas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Veja uso, atrasos e horarios mais disputados.
          </p>
        </Link>
      </section>
    </main>
  );
}
