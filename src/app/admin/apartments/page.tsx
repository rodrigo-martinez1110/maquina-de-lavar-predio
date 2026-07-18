import { resetApartmentPin, updateApartment } from "../../../lib/actions/admin-apartments";
import { getAdminSession } from "../../../lib/auth/admin-session";
import { listApartmentsForAdmin } from "../../../lib/repositories/apartments";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminApartmentsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const apartments = await listApartmentsForAdmin();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Apartamentos</h1>
        <p className="text-sm text-slate-600">
          Gerencie moradores, ajuste de cota e redefinicao de PIN.
        </p>
      </header>

      <section className="grid gap-3">
        {apartments.map((apartment) => (
          <article className="rounded border p-4" key={apartment.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-medium">Apartamento {apartment.number}</h2>
              <span className="text-xs text-slate-500">
                {apartment.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <form action={updateApartment} className="grid gap-3 sm:grid-cols-3">
                <input name="apartmentId" type="hidden" value={apartment.id} />
                <label className="grid gap-1 text-sm">
                  Moradores
                  <input
                    className="rounded border p-2"
                    defaultValue={apartment.residentCount}
                    max={2}
                    min={1}
                    name="residentCount"
                    required
                    type="number"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Ajuste semanal
                  <input
                    className="rounded border p-2"
                    defaultValue={apartment.manualAdjustmentMinutes}
                    max={360}
                    min={-360}
                    name="manualAdjustmentMinutes"
                    step={30}
                    type="number"
                  />
                </label>
                <button className="self-end rounded bg-slate-900 p-2 text-white" type="submit">
                  Salvar
                </button>
              </form>

              <form action={resetApartmentPin} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input name="apartmentId" type="hidden" value={apartment.id} />
                <label className="grid gap-1 text-sm">
                  Novo PIN
                  <input
                    className="rounded border p-2"
                    inputMode="numeric"
                    maxLength={8}
                    minLength={4}
                    name="pin"
                    pattern="[0-9]*"
                    required
                    type="password"
                  />
                </label>
                <button className="self-end rounded border p-2" type="submit">
                  Redefinir PIN
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
