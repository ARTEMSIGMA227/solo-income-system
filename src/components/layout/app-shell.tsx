"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { XPBar } from "@/components/ui/xp-bar";
import { ClassBadge } from "@/components/ui/class-badge";
import {
  LayoutDashboard,
  Swords,
  ShoppingBag,
  Timer,
  Skull,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  MoreHorizontal,
  ChevronDown,
  Trophy,
  GitBranch,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mobileBottom: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobileBottom: true },
  { href: "/quests", label: "Квесты", icon: Swords, mobileBottom: true },
  { href: "/skills", label: "Навыки", icon: GitBranch, mobileBottom: true },
  { href: "/shop", label: "Магазин", icon: ShoppingBag, mobileBottom: false },
  { href: "/focus", label: "Фокус", icon: Timer, mobileBottom: true },
  { href: "/bosses", label: "Боссы", icon: Skull, mobileBottom: false },
  { href: "/guilds", label: "Гильдии", icon: Users, mobileBottom: false },
  { href: "/achievements", label: "Ачивки", icon: Trophy, mobileBottom: false },
  { href: "/analytics", label: "Аналитика", icon: BarChart3, mobileBottom: false },
  { href: "/settings", label: "Настройки", icon: Settings, mobileBottom: false },
];

const BOTTOM_MAIN_ITEMS = NAV_ITEMS.filter((i) => i.mobileBottom);
const BOTTOM_MORE_ITEMS = NAV_ITEMS.filter((i) => !i.mobileBottom);

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function UserAvatar({ displayName }: { displayName: string | null | undefined }) {
  const letter = displayName?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
      {letter}
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { data: profile } = useProfile();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-gray-950 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-black text-white">
          S
        </div>
        <span className="text-sm font-bold tracking-tight text-white">Solo Income</span>
      </div>

      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar displayName={profile?.display_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {profile?.display_name || "Охотник"}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-gray-400">
                🔥 {profile?.streak_current ?? 0}
              </span>
              <ClassBadge compact />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <XPBar />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-violet-600/20 text-violet-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-5 py-3">
        <p className="text-[10px] text-gray-600">v1.0 · Solo Leveling</p>
      </div>
    </aside>
  );
}

function MobileHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isActive(pathname, item.href));

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-gray-950/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="flex-1 truncate text-sm font-semibold text-white">
          {current?.label || "Solo Income"}
        </span>
        <ClassBadge compact />
      </div>
      <div className="px-4 pb-2">
        <XPBar compact />
      </div>
    </header>
  );
}

function MobileSidebarOverlay({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const { data: profile } = useProfile();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Закрыть меню"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />
      <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-gray-950 shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <span className="text-sm font-bold text-white">Меню</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <UserAvatar displayName={profile?.display_name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {profile?.display_name || "Охотник"}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  🔥 {profile?.streak_current ?? 0}
                </span>
                <ClassBadge compact />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <XPBar />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-violet-600/20 text-violet-400"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}

function BottomBar({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreIsActive = BOTTOM_MORE_ITEMS.some((i) => isActive(pathname, i.href));

  return (
    <>
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-30 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-16 z-40 mx-4 rounded-xl border border-white/10 bg-gray-900 p-2 shadow-2xl lg:hidden">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-gray-400">Ещё</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="text-gray-500 hover:text-white"
                aria-label="Закрыть"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            {BOTTOM_MORE_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-violet-600/20 text-violet-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-950/95 backdrop-blur-sm lg:hidden">
        <ul className="flex h-16 items-center justify-around px-1">
          {BOTTOM_MAIN_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                    active ? "text-violet-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((p) => !p)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                moreIsActive || moreOpen
                  ? "text-violet-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              Ещё
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar pathname={pathname} />
      <MobileHeader onOpenSidebar={() => setMobileSidebarOpen(true)} />
      <MobileSidebarOverlay
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        pathname={pathname}
      />
      <main className="min-h-screen pt-[72px] pb-20 lg:pt-0 lg:pb-0 lg:pl-60">
        <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
      </main>
      <BottomBar pathname={pathname} />
    </div>
  );
}