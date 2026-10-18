import { redirect } from "next/navigation";
import { AppNav } from "../../components/AppNav";
import { acknowledgeRulesAction, reportMachineAction } from "../../lib/actions/machine";
import { getApartmentSession } from "../../lib/auth/apartment-session";

export default async function RulesPage() {
  const session = await getApartmentSession();
  if (!session) redirect("/login");
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 p-4 pb-24">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-500">Apartamento {session.apartmentNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold">Regras de uso</h1>
        <p className="mt-2 text-sm text-slate-600">O objetivo é garantir que todos consigam usar a máquina no horário reservado.</p>
        <div className="mt-5 space-y-4 text-sm text-slate-700">
          <p><strong>1. Limite:</strong> cada apartamento recebe 10 horas por semana e pode reservar no máximo 8 horas no mesmo dia.</p>
          <p><strong>2. Reserve o tempo real:</strong> inclua lavagem, secagem e o tempo para retirar as roupas. Exemplo: se o ciclo pode levar 3 horas, reserve 3 horas.</p>
          <p><strong>3. Comece no horário:</strong> ao iniciar, informe “Comecei a usar”. Se a reserva não for iniciada em até 30 minutos, ela poderá ser liberada.</p>
          <p><strong>4. A próxima reserva tem prioridade:</strong> uma extensão só é permitida se não houver outra reserva depois. Não retire roupas de outra pessoa sem tentar contato ou avisar pelo app.</p>
          <p><strong>5. Se houver problema:</strong> informe “Máquina ocupada”, “Terminei” ou “Problema/manutenção”. O aviso fica visível para todos e novas reservas podem ser bloqueadas.</p>
          <p><strong>6. Bom senso:</strong> retire as roupas assim que o ciclo terminar, deixe a máquina limpa e avise quando perceber qualquer defeito.</p>
        </div>
        <form action={acknowledgeRulesAction} className="mt-6">
          <button className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white" type="submit">Li e entendi as regras</button>
        </form>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">Avisar sobre a máquina</h2>
        <p className="mt-1 text-sm text-slate-600">Qualquer morador pode informar uma situação para todos verem.</p>
        <form action={reportMachineAction} className="mt-4 space-y-3">
          <select className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3" name="kind" defaultValue="problem">
            <option value="problem">Problema ou manutenção</option>
            <option value="occupied">Máquina ocupada</option>
            <option value="finished">Terminei de usar</option>
          </select>
          <textarea className="min-h-24 w-full rounded-md border border-slate-300 p-3" name="message" placeholder="Ex.: a máquina está fazendo barulho e não termina o ciclo" required />
          <button className="min-h-11 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white" type="submit">Enviar aviso</button>
        </form>
      </section>
      <AppNav />
    </main>
  );
}
