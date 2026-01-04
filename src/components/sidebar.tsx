
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  Settings,
  PieChart,
  LogOut,
  UserCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

// Use simple Cookie delete for signOut if custom
function deleteCookie(name: string) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

interface SidebarProps {
  slug: string;
  role: string;
}

export function Sidebar({ slug, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    deleteCookie("token");
    router.refresh();
    router.push("/login");
  };

  const links = [
    {
      href: `/${slug}`,
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["SUPERADMIN", "ADMIN", "ACCOUNT", "CREATIVE", "TRAFFIC"],
    },
    {
      href: `/${slug}/projects`,
      label: "Projekty",
      icon: Briefcase,
      roles: ["SUPERADMIN", "ADMIN", "ACCOUNT", "CREATIVE", "TRAFFIC"],
    },
    {
      href: `/${slug}/planner`,
      label: "Plánovač",
      icon: CalendarDays,
      roles: ["SUPERADMIN", "ADMIN", "ACCOUNT", "TRAFFIC"],
    },
    {
      href: `/${slug}/financials`,
      label: "Financie",
      icon: PieChart,
      roles: ["SUPERADMIN", "ADMIN", "ACCOUNT"],
    },
    {
      href: `/${slug}/settings`,
      label: "Nastavenia",
      icon: Settings,
      roles: ["SUPERADMIN", "ADMIN"],
    },
  ];

  return (
    <div className="flex flex-col h-full border-r bg-background w-64">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">AgencyFlow</h1>
        <p className="text-xs text-muted-foreground mt-1">Full Version</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          if (role && !link.roles.includes(role)) return null;

          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
          <UserCircle className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{role}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-500 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Odhlásiť sa
        </button>
      </div>
    </div>
  );
}