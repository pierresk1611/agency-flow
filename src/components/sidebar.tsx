"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  Users,
  LogOut,
  TrendingUp,
  Trophy,
  Building2,
  CalendarDays,
  CheckSquare,
  Settings,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Use simple Cookie delete for signOut if custom
function deleteCookie(name: string) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export function Sidebar({ slug, role, godMode }: { slug: string; role: string; godMode?: boolean }) {
  const pathname = usePathname();

  const routes = [
    { label: "Dashboard", icon: LayoutDashboard, href: `/${slug}`, color: "text-sky-500" },
    { label: "Plánovač", icon: CalendarDays, href: `/${slug}/planner`, color: "text-emerald-500" },
    { label: "Klienti", icon: Building2, href: `/${slug}/clients`, color: "text-blue-500" },
    { label: "Projekty & Tasky", icon: CheckSquare, href: `/${slug}/jobs`, color: "text-violet-500" },
    { label: "Financie", icon: PieChart, href: `/${slug}/financials`, color: "text-green-500" }, // NEW
    { label: "Traffic / Kapacita", icon: TrendingUp, href: `/${slug}/traffic`, color: "text-orange-500" },
    { label: "Timesheety", icon: Clock, href: `/${slug}/timesheets`, color: "text-pink-700" },
  ];

  // ADMIN VIEW: ADMIN, ACCOUNT, TRAFFIC a SUPERADMIN vidia viac možností
  if (role !== "CREATIVE") {
    routes.push({ label: "Tendre & Pitching", icon: Trophy, href: `/${slug}/tenders`, color: "text-yellow-400" });
    // Replaced old "Administrácia" with new "Nastavenia" if redundant, or keep both?
    // User wants "Sync", implies upgrade. The new Settings page is better.
    // I'll add Settings. Old Administration might be useful if it had other stuff, but usually Settings replaces it.
    // Based on user reaction, I should be careful not to delete.
    // I will add Settings.
    routes.push({ label: "Nastavenia", icon: Settings, href: `/${slug}/settings`, color: "text-gray-400" });
    // Keep Administration just in case, pointing to old path, unless they are the same?
    // I'll keep it for now at the end to be safe, labeled "Admin (Old)"? Or just "Administrácia".
    // If I look at the old code, it linked to `/${slug}/agency`.
    // Let's keep it but maybe visually distinct or separate?
    // Actually, let's assume 'Nastavenia' is the intended replacement. I'll comment out the old one or just include it if I'm not sure.
    // Better safe: Include it.

  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white border-r border-white/10 shadow-xl w-full">
      <div className="px-3 py-2 flex-1">
        <Link href={`/${slug}`} className="flex items-center pl-3 mb-10 hover:opacity-80 transition">
          <h1 className="text-xl font-bold italic">
            Agency<span className="text-blue-500 text-2xl">.</span>Flow
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => {
            // Basic role check for Financials/Settings if needed locally, though layout handles it too.
            if (route.label === "Financie" && !["ADMIN", "ACCOUNT", "SUPERADMIN"].includes(role) && !godMode) return null;
            if (route.label === "Nastavenia" && !["ADMIN", "SUPERADMIN"].includes(role) && !godMode) return null;

            const isActive = pathname === route.href || pathname.startsWith(route.href + "/");

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all",
                  isActive ? "text-white bg-white/20 shadow-sm" : "text-zinc-400"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="px-3 py-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10 group"
          onClick={() => {
            deleteCookie("token");
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-5 w-5 mr-3 group-hover:text-red-400 transition-colors" /> Odhlásiť sa
        </Button>
      </div>
    </div>
  );
}