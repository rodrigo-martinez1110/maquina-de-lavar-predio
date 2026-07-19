"use client";

import { useActionState } from "react";
import {
  acceptTransferFromForm,
  createHourOfferFromForm,
  createHourRequestFromForm,
  type TransferFormState,
} from "../../lib/actions/transfers";
import type { OpenTransferListItem } from "../../lib/repositories/transfers";

const initialState: TransferFormState = {};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function StateMessage({ state }: { state: TransferFormState }) {
  if (state.error) {
    return (
      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        {state.success}
      </p>
    );
  }

  return null;
}

function CreateTransferForm(props: {
  action: (
    previousState: TransferFormState,
    formData: FormData,
  ) => Promise<TransferFormState>;
  buttonClassName: string;
  buttonText: string;
  label: string;
  weekStart: string;
}) {
  const [state, formAction, isPending] = useActionState(props.action, initialState);

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input name="weekStart" type="hidden" value={props.weekStart} />
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {props.label}
        <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3" name="minutes" defaultValue="60">
          <option value="30">30 min</option>
          <option value="60">1h</option>
          <option value="90">1h30</option>
          <option value="120">2h</option>
        </select>
      </label>
      <StateMessage state={state} />
      <button className={props.buttonClassName} disabled={isPending} type="submit">
        {isPending ? "Salvando..." : props.buttonText}
      </button>
    </form>
  );
}

function AcceptTransferForm(props: {
  currentApartmentId: string;
  transfer: OpenTransferListItem;
}) {
  const [state, formAction, isPending] = useActionState(acceptTransferFromForm, initialState);
  const isOwnTransfer = props.transfer.apartmentId === props.currentApartmentId;
  const actionText = props.transfer.kind === "offer" ? "Pegar horas" : "Ajudar";

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input name="transferId" type="hidden" value={props.transfer.id} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {props.transfer.kind === "offer" ? "Oferta" : "Pedido"} do apt {props.transfer.apartmentNumber}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {formatMinutes(props.transfer.remainingMinutes)} restantes
          </p>
        </div>
        {isOwnTransfer ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            seu
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <select
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
          defaultValue={Math.min(60, props.transfer.remainingMinutes)}
          disabled={isOwnTransfer || isPending}
          name="minutes"
        >
          {[30, 60, 90, 120]
            .filter((minutes) => minutes <= props.transfer.remainingMinutes)
            .map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatMinutes(minutes)}
              </option>
            ))}
        </select>
        <button
          className="min-h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
          disabled={isOwnTransfer || isPending}
          type="submit"
        >
          {isPending ? "..." : actionText}
        </button>
      </div>
      <StateMessage state={state} />
    </form>
  );
}

export function CreditForms(props: {
  currentApartmentId: string;
  transfers: OpenTransferListItem[];
  weekStart: string;
}) {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2">
        <CreateTransferForm
          action={createHourOfferFromForm}
          buttonClassName="mt-3 min-h-11 w-full rounded-xl bg-slate-950 p-3 font-medium text-white shadow-sm disabled:opacity-60"
          buttonText="Ceder horas"
          label="Ceder"
          weekStart={props.weekStart}
        />
        <CreateTransferForm
          action={createHourRequestFromForm}
          buttonClassName="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white p-3 font-medium text-slate-800 shadow-sm disabled:opacity-60"
          buttonText="Pedir horas"
          label="Pedir"
          weekStart={props.weekStart}
        />
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Ofertas e pedidos abertos</h2>
          <p className="mt-1 text-sm text-slate-500">Horas disponiveis para esta semana.</p>
        </div>
        {props.transfers.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
            Nenhuma oferta ou pedido aberto.
          </p>
        ) : (
          props.transfers.map((transfer) => (
            <AcceptTransferForm
              currentApartmentId={props.currentApartmentId}
              key={transfer.id}
              transfer={transfer}
            />
          ))
        )}
      </section>
    </>
  );
}
