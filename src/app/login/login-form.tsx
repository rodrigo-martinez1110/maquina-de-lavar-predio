"use client";

import { useActionState } from "react";
import type { LoginApartmentState } from "../../lib/actions/apartment-auth";

const initialState: LoginApartmentState = {};
const AUTH_ERROR_MESSAGE = "Apartamento ou PIN invalido";

export function LoginForm(props: {
  action: (previousState: LoginApartmentState, formData: FormData) => Promise<LoginApartmentState>;
}) {
  const [state, formAction, isPending] = useActionState(props.action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="apartmentNumber">
        Apartamento
      </label>
      <input className="rounded border p-3" id="apartmentNumber" name="apartmentNumber" inputMode="numeric" required />
      <label className="text-sm font-medium" htmlFor="pin">
        PIN
      </label>
      <input className="rounded border p-3" id="pin" name="pin" type="password" required />
      {state.error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {AUTH_ERROR_MESSAGE}
        </p>
      ) : null}
      <button className="rounded bg-slate-900 p-3 text-white disabled:opacity-60" disabled={isPending} type="submit">
        Entrar
      </button>
    </form>
  );
}
