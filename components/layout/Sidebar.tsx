"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getAdmin,
  clearAuth,
  hasRole,
  ROLE_LABEL,
  type AdminRole,
} from "../../lib/auth";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  FileText,
  TrendingUp,
  Headphones,
  LogOut,
  ChevronRight,
  Activity,
  AlertTriangle,
  Megaphone,
  Mail,
  ShieldCheck,
  Tag,
  UserPlus,
  PanelLeftOpen,
  PanelLeftClose,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

const NAV = [
  {
    section: "Super Admin",
    roles: ["superadmin", "ops_admin"],
    items: [
      { href: "/superadmin", label: "Platform Pulse", icon: LayoutDashboard },
      { href: "/superadmin/tenants", label: "Tenants", icon: Building2 },
      {
        href: "/superadmin/subscriptions",
        label: "Subscriptions",
        icon: CreditCard,
      },
      { href: "/superadmin/users", label: "All Users", icon: Users },
      { href: "/superadmin/audit-log", label: "Audit Log", icon: FileText },
      { href: "/superadmin/coupons", label: "Coupons", icon: Tag },
      {
        href: "/superadmin/team",
        label: "Team",
        icon: ShieldCheck,
        roles: ["superadmin"] as const,
      },
      {
        href: "/superadmin/wa-agent",
        label: "WA Agent",
        icon: MessageCircle,
        roles: ["superadmin"] as const,
      },
      {
        href: "/superadmin/enquiries",
        label: "Enquiries",
        icon: Mail,
        roles: ["superadmin", "ops_admin", "support"] as const,
      },
    ],
  },
  {
    section: "Growth",
    roles: ["superadmin", "ops_admin", "sales"],
    items: [
      { href: "/sales", label: "Sales", icon: TrendingUp },
      { href: "/sales/leads", label: "Lead Captures", icon: UserPlus },
      { href: "/lifecycle", label: "Lifecycle", icon: Activity },
      { href: "/billing", label: "Billing Ops", icon: AlertTriangle },
      { href: "/communications", label: "Comms", icon: Megaphone },
    ],
  },
  {
    section: "Support",
    roles: ["superadmin", "ops_admin", "support"],
    items: [
      { href: "/support", label: "Support", icon: Headphones },
      { href: "/support/issues", label: "Issues", icon: AlertCircle },
    ],
  },
];

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
  const admin = getAdmin();

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
            width: 64,
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
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--sidebar-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                color: "#fff",
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-heading)",
              }}
            >
              OM
            </div>
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="btn btn-icon"
            style={{
              marginTop: 8,
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
                    onMouseEnter={(e) => showFlyout(item.label, e)}
                    onMouseLeave={hideFlyout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 34,
                      borderRadius: active ? "0 8px 8px 0" : 8,
                      flexShrink: 0,
                      background: active
                        ? "var(--sidebar-active-bg)"
                        : "transparent",
                      color: active
                        ? "var(--sidebar-accent)"
                        : "var(--sidebar-text)",
                      transition: "all 0.15s",
                      textDecoration: "none",
                      borderLeft: `3px solid ${active ? "var(--sidebar-accent)" : "transparent"}`,
                    }}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
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
            width: expanded ? 200 : 0,
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
              width: 200,
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
                borderBottom: "1px solid var(--sidebar-border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--sidebar-accent)",
                  letterSpacing: "0.01em",
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
                    {gi > 0 && (
                      <div
                        style={{
                          borderTop: "1px solid var(--sidebar-border)",
                          margin: "4px 8px 6px",
                        }}
                      />
                    )}
                    {/* Section header — DM Mono, sentence case, muted */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        fontWeight: 500,
                        color: "var(--sidebar-section-label)",
                        letterSpacing: "0.08em",
                        padding: "0 14px",
                        marginBottom: 2,
                        marginTop: gi === 0 ? 6 : 0,
                      }}
                    >
                      {group.section}
                    </div>
                    {/* Divider under header */}
                    <div
                      style={{
                        borderTop: "1px solid var(--sidebar-border)",
                        margin: "3px 8px 2px",
                      }}
                    />

                    <div style={{ padding: "0 8px" }}>
                      {visible.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              padding: "6px 7px",
                              borderRadius: 7,
                              marginBottom: 1,
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                              background: active
                                ? "var(--sidebar-active-bg)"
                                : "transparent",
                              color: active
                                ? "var(--sidebar-accent)"
                                : "var(--sidebar-text)",
                              fontSize: 12,
                              fontWeight: active ? 600 : 400,
                              transition: "all 0.15s",
                              borderLeft: `3px solid ${active ? "var(--sidebar-accent)" : "transparent"}`,
                              borderTopLeftRadius: active ? 2 : 7,
                              borderBottomLeftRadius: active ? 2 : 7,
                            }}
                          >
                            <Icon
                              size={13}
                              strokeWidth={active ? 2.2 : 1.7}
                              style={{ flexShrink: 0 }}
                            />
                            {item.label}
                            {active && (
                              <ChevronRight
                                size={10}
                                style={{ marginLeft: "auto", opacity: 0.5 }}
                              />
                            )}
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
                      marginBottom: 4,
                    }}
                  >
                    {admin.name}
                  </div>
                  <span className="badge badge-neutral">
                    {ROLE_LABEL[admin.role]}
                  </span>
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
            left: 70,
            top: flyout.y,
            transform: "translateY(-50%)",
            background: "var(--surface)",
            border: "1px solid var(--line-2)",
            borderRadius: 7,
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-2)",
            zIndex: 60,
            boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
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
