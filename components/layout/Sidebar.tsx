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
import { NAV } from "../../lib/nav";
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

  const isActive = (href: string) =>
    href === "/superadmin" || href === "/sales"
      ? pathname === href
      : pathname.startsWith(href);

  const initials = admin?.name?.charAt(0).toUpperCase() || "?";
  const roleColor = ROLE_COLOR[admin?.role || ""] || "var(--ink-3)";

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
      <aside
        className="sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          display: "flex",
          background: "var(--sidebar-bg)",
        }}
      >
        {/* Rail — always 64px */}
        <div
          style={{
            width: "var(--sidebar-rail-width)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 14,
            paddingBottom: 14,
            borderRight: "1px solid var(--sidebar-border)",
          }}
        >
          {/* Logo mark — links to home */}
          <Link
            href="/superadmin"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--sidebar-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--accent-ink)",
                letterSpacing: "-0.02em",
                fontFamily: "var(--font)",
              }}
            >
              OM
            </div>
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="btn btn-icon btn-ghost"
            style={{
              marginTop: 8,
              background: "transparent",
              boxShadow: "none",
              color: "var(--sidebar-text)",
              transition: "color 0.15s",
            }}
          >
            {expanded ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeftOpen size={16} />
            )}
          </button>

          {/* Icons — visible when collapsed */}
          {!expanded ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: "100%",
                padding: "8px 10px 0",
                overflowY: "auto",
              }}
            >
              {allItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onMouseEnter={(e) => showFlyout(item.label, e)}
                    onMouseLeave={hideFlyout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 40,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: active
                        ? "var(--sidebar-active-bg)"
                        : "transparent",
                      color: active
                        ? "var(--sidebar-text-active)"
                        : "var(--sidebar-text)",
                      transition: "all 0.15s",
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Role-colored avatar — pinned to bottom */}
          <div
            title={admin?.name || ""}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: roleColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              flexShrink: 0,
              cursor: "default",
            }}
          >
            {initials}
          </div>
        </div>

        {/* Panel — slides in/out */}
        <div
          style={{
            width: expanded ? "var(--sidebar-panel-width)" : 0,
            overflow: "hidden",
            transition: "width 0.2s ease",
            borderRight: "1px solid var(--sidebar-border)",
            display: "flex",
            flexDirection: "column",
            background: "var(--sidebar-bg)",
          }}
        >
          <div
            style={{
              width: "var(--sidebar-panel-width)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "16px 14px 10px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                Admin Console
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "6px 0 8px" }}>
              {visibleGroups.map((group, gi) => {
                const visible = group.items.filter(
                  (item) =>
                    !item.roles ||
                    hasRole(admin!, ...(item.roles as readonly AdminRole[])),
                );
                return (
                  <div key={group.section}>

                    {/* Section header — DM Mono, sentence case, muted */}
                    <div
                      style={{
                        fontFamily: "var(--font)",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--sidebar-section-label)",
                        letterSpacing: "0.08em",
                        padding: "0 18px",
                        marginBottom: 6,
                        marginTop: gi === 0 ? 8 : 18,
                      }}
                    >
                      {group.section}
                    </div>

                    <div style={{ padding: "0 8px" }}>
                      {visible.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "9px 12px",
                              borderRadius: 12,
                              marginBottom: 2,
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                              background: active
                                ? "var(--sidebar-active-bg)"
                                : "transparent",
                              color: active
                                ? "var(--sidebar-text-active)"
                                : "var(--ink-2)",
                              fontSize: 14,
                              fontWeight: 600,
                              transition: "all 0.15s",
                            }}
                          >
                            <Icon
                              size={17}
                              strokeWidth={active ? 2.2 : 1.8}
                              style={{ flexShrink: 0 }}
                            />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* User block */}
            <div
              style={{
                borderTop: "1px solid var(--sidebar-border)",
                padding: 14,
                flexShrink: 0,
              }}
            >
              {admin && (
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--sidebar-text-active)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {admin.name}
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  padding: "6px 6px",
                  background: "none",
                  border: "none",
                  color: "var(--sidebar-text)",
                  fontSize: 12,
                  cursor: "pointer",
                  borderRadius: 6,
                  fontFamily: "inherit",
                }}
              >
                <LogOut size={12} />
                Sign out
              </button>
            </div>
          </div>
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
