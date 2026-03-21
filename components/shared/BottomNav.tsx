import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Panel" },
  { href: "/dashboard/events", label: "Eventos" },
  { href: "/dashboard/poll", label: "Votación" },
  { href: "/dashboard/history", label: "Historial" },
  { href: "/dashboard/checklist", label: "Checklist" }
];

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-full bg-surface-lowest/80 p-2 shadow-card backdrop-blur-xs">
      <ul className="grid grid-cols-5 gap-2 text-center text-xs font-semibold text-secondary">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-full px-2 py-3 transition",
                  active ? "bg-primary text-white" : "hover:bg-surface-high"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
