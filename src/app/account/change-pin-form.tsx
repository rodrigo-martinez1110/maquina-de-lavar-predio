"use client";

import { useActionState } from "react";
import type { ChangePinState } from "../../lib/actions/account";

const initialState: ChangePinState = {};

export function ChangePinForm(props: {
  action: (previousState: ChangePinState, formData: FormData) => Promise<ChangePinState>;
}) {
  const [state, formAction, isPending] = useActionState(props.action, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          PIN atual
          <input
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
            inputMode="numeric"
            name="currentPin"
            required
            type="password"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Novo PIN
          <input
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
            inputMode="numeric"
            maxLength={8}
            minLength={4}
            name="newPin"
            pattern="[0-9]*"
            required
            type="password"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Confirmar novo PIN
          <input
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-900"
            inputMode="numeric"
            maxLength={8}
            minLength={4}
            name="confirmPin"
            pattern="[0-9]*"
            required
            type="password"
          />
        </label>

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {state.success}
          </p>
        ) : null}

        <button
          className="min-h-11 w-full rounded-md bg-slate-950 px-4 font-medium text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Salvando..." : "Salvar novo PIN"}
        </button>
      </div>
    </form>
  );
}
