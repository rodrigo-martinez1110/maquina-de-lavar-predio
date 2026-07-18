import Link from "next/link";

export function AppNav() {
  return (
    <nav className="grid grid-cols-2 gap-2 text-center text-xs">
      <Link className="rounded border p-2" href="/">
        Inicio
      </Link>
      <Link className="rounded border p-2" href="/reservations">
        Agenda
      </Link>
    </nav>
  );
}
