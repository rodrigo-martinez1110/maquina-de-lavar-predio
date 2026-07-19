import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { changeApartmentPin } from "../../lib/actions/account";
import { getApartmentSession } from "../../lib/auth/apartment-session";
import { ChangePinForm } from "./change-pin-form";

export default async function AccountPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 pb-24">
      <header className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">Apartamento {session.apartmentNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold">Conta</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-300">
          Troque o PIN sempre que precisar. Use apenas numeros e evite datas ou sequencias obvias.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trocar PIN</h2>
        <ChangePinForm action={changeApartmentPin} />
      </section>

      <AppNav />
    </main>
  );
}
