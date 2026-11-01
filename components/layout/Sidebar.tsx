"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getAdmin,
  clearAuth,
  hasRole,
  type AdminRole,
} from "../../lib/auth";
import { NAV, isNavActive } from "../../lib/nav";
import {
  LogOut,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

const ROLE_COLOR: Record<string, string> = {
  superadmin: "var(--purple-text)",
  ops_admin: "var(--blue-text)",
  sales: "var(--green-text)",
  support: "var(--amber-text)",
};

interface SidebarProps {
  expanded: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function Sidebar({ expanded, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<ReturnType<typeof getAdmin>>(null);
  useEffect(() => { setAdmin(getAdmin()); }, []);

  const [flyout, setFlyout] = useState<{ label: string; y: number } | null>(
    null,
  );
  const flyoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(flyoutTimer.current), []);

  function showFlyout(label: string, e: React.MouseEvent<HTMLElement>) {
    clearTimeout(flyoutTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ label, y: rect.top + rect.height / 2 });
  }

  function hideFlyout() {
    flyoutTimer.current = setTimeout(() => setFlyout(null), 80);
  }

  function keepFlyout() {
    clearTimeout(flyoutTimer.current);
  }

  function logout() {
    clearAuth();
    document.cookie = "om_admin_token=; path=/; max-age=0";
    router.push("/login");
  }

  const isActive = (href: string) => isNavActive(pathname, href);

  const initials = admin?.name?.charAt(0).toUpperCase() || "?";
  const roleColor = ROLE_COLOR[admin?.role || ""] || "var(--ink-3)";

  const homeHref = admin?.role === "superadmin" ? "/superadmin" : "/superadmin/tenants";
  const visibleGroups = NAV.filter(
    (g) => admin && hasRole(admin, ...(g.roles as readonly AdminRole[])),
  );

  const allItems = visibleGroups.flatMap((g) =>
    g.items.filter(
      (item) =>
        !item.roles || hasRole(admin!, ...(item.roles as readonly AdminRole[])),
    ),
  );

  return (
    <>
      <aside className={`sidebar${expanded ? " is-open" : ""}`}>
        {/* Header: logo + (title) + toggle */}
        <div className="sb-head">
          <Link href={homeHref} className="sb-logo" aria-label="Home">OM</Link>
          <div className="sb-title">
            <b>Admin Console</b>
            <small>Ordermatrix</small>
          </div>
          <button
            onClick={onToggle}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="sb-toggle"
          >
            {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>

        <nav className="sb-nav">
          {visibleGroups.map((group, gi) => (
            <div key={group.section} className="sb-group">
              {gi > 0 && !expanded && <hr className="sb-sep" />}
              {expanded && <div className="sb-label">{group.section}</div>}
              {group.items
                .filter((item) => !item.roles || hasRole(admin!, ...(item.roles as readonly AdminRole[])))
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      className={`sb-item${active ? " active" : ""}`}
                      onMouseEnter={expanded ? undefined : (e) => showFlyout(item.label, e)}
                      onMouseLeave={expanded ? undefined : hideFlyout}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="sb-foot">
          <div className="sb-avatar" title={admin?.name || ""} style={{ background: roleColor }}>{initials}</div>
          <div className="sb-user">
            <b>{admin?.name}</b>
            <small>{(admin?.role || "").replace("_", " ")}</small>
          </div>
          <button onClick={logout} className="sb-out" title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* Hover flyout — appears right of rail when collapsed, dismisses on mouse-leave */}
      {!expanded && flyout && (
        <div
          onMouseEnter={keepFlyout}
          onMouseLeave={hideFlyout}
          style={{
            position: "fixed",
            left: "calc(var(--sidebar-rail-width) + 6px)",
            top: flyout.y,
            transform: "translateY(-50%)",
            background: "var(--card)",
            borderRadius: 10,
            padding: "7px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            zIndex: 60,
            boxShadow: "var(--shadow-lg), inset 0 0 0 1px var(--line-2)",
            pointerEvents: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {flyout.label}
        </div>
      )}
    </>
  );
}
