import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { getApartmentSession } from "../../lib/auth/apartment-session";
import { listApartmentNotifications } from "../../lib/repositories/notifications";

export default async function NotificationsPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  const notifications = await listApartmentNotifications(session.apartmentId);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 pb-24">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold">Avisos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Notificacoes sobre transferencias, atrasos e ajustes do apartamento{" "}
          {session.apartmentNumber}.
        </p>
      </header>

      <section className="space-y-3">
        {notifications.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            Nenhum aviso por enquanto.
          </p>
        ) : (
          notifications.map((notification) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={notification.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{notification.title}</h2>
                <time className="shrink-0 text-xs text-slate-500">
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(notification.createdAt))}
                </time>
              </div>
              <p className="mt-2 text-sm text-slate-700">{notification.body}</p>
            </article>
          ))
        )}
      </section>

      <AppNav />
    </main>
  );
}
