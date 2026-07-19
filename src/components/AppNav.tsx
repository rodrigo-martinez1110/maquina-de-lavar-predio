import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/reservations", label: "Agenda" },
  { href: "/credits", label: "Horas" },
  { href: "/notifications", label: "Avisos" },
  { href: "/metrics", label: "Metricas" },
  { href: "/account", label: "Conta" },
];

export function AppNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-10 grid grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white/95 p-2 text-center text-[11px] font-medium text-slate-600 shadow-lg shadow-slate-200/70 backdrop-blur md:static md:rounded-xl md:shadow-sm">
      {links.map((link) => (
        <Link
          className="rounded-xl px-1 py-2 transition hover:bg-slate-100 hover:text-slate-950"
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
