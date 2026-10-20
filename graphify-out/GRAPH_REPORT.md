# Graph Report - ordermatrix-internal  (2026-10-18)

## Corpus Check
- 80 files · ~55,855 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 608 nodes · 924 edges · 62 communities (45 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `48acf252`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sales/page.tsx
- auth.ts
- TypeScript & Next.js Types
- tenants/[tenantId]/page.tsx
- dependencies
- Skeleton.tsx
- Enquiries Management
- Subscriptions Management
- TeamPage
- Coupons Management
- billing/page.tsx
- VerticalFormPage
- LeadCapturesPage
- Project Docs & Agent Rules
- Communications Feature
- lifecycle/page.tsx
- support/page.tsx
- Middleware & Security
- Root Layout & Fonts
- Next.js Config
- ESLint Config
- Brand & OG Image
- PostCSS Config
- Dark Theme Icon
- Light Theme Logo
- Android Chrome Icon 192
- Android Chrome Icon 512
- Apple Touch Icon
- Favicon 16px
- Favicon 32px
- Light Theme Icon
- Dark Theme Logo
- TenantDetailPage
- live-activity/page.tsx
- WaAgentDetailPage
- toast
- wa-agent/page.tsx
- Ordermatrix — DESIGN.md
- Topbar.tsx
- OrderMatrixLoader.tsx
- coupons/page.tsx
- (dashboard)/layout.tsx
- SkRows
- Sidebar.tsx
- StatGridSkeleton
- api.ts
- hot-leads/page.tsx
- superadmin/page.tsx
- hasRole
- wa-agent/[tenantId]/page.tsx
- stores/page.tsx
- useTheme.ts
- OrderMatrixSpinner
- funnel/page.tsx
- storefront-plans/page.tsx
- team/page.tsx
- tenants/page.tsx
- loadWaConvAgent
- VerticalsPage
- Button.tsx

## God Nodes (most connected - your core abstractions)
1. `TenantDetailPage()` - 46 edges
2. `api` - 27 edges
3. `TableSkeleton()` - 25 edges
4. `toast()` - 23 edges
5. `SkRows()` - 20 edges
6. `VerticalFormPage()` - 18 edges
7. `WaAgentDetailPage()` - 18 edges
8. `compilerOptions` - 16 edges
9. `getAdmin()` - 15 edges
10. `CommunicationsPage()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Project Bootstrap` --semantically_similar_to--> `Next.js Breaking Changes Warning`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `logout()` --calls--> `clearAuth()`  [EXTRACTED]
  components/layout/Sidebar.tsx → lib/auth.ts
- `logout()` --calls--> `clearAuth()`  [EXTRACTED]
  components/layout/Topbar.tsx → lib/auth.ts
- `DashboardLayout()` --calls--> `isLoggedIn()`  [EXTRACTED]
  app/(dashboard)/layout.tsx → lib/auth.ts
- `SubscriptionsPage()` --calls--> `getAdmin()`  [EXTRACTED]
  app/(dashboard)/superadmin/subscriptions/page.tsx → lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Project Definition and Agent Governance** — readme_nextjs_project, agents_nextjs_breaking_changes, claude_agents_reference [INFERRED 0.85]

## Communities (62 total, 17 thin omitted)

### Community 0 - "sales/page.tsx"
Cohesion: 0.14
Nodes (8): fmt(), fmtDate(), SalesPage(), SortKey, STATUS_OPTIONS, StatusFilter, TrendPoint, TrendTooltip()

### Community 1 - "auth.ts"
Cohesion: 0.25
Nodes (10): LoginPage(), handleSubmit(), AdminUser, clearAuth(), getCookieToken(), getToken(), isLoggedIn(), ROLE_COLOR (+2 more)

### Community 2 - "TypeScript & Next.js Types"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "tenants/[tenantId]/page.tsx"
Cohesion: 0.08
Nodes (23): AddCommentModal(), submit(), ALL_STATUSES, DispatchModal(), submit(), EditCustomerModal(), submit(), fmt() (+15 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (42): axios, eslint, eslint-config-next, lightningcss, lucide-react, next, dependencies, axios (+34 more)

### Community 6 - "Enquiries Management"
Cohesion: 0.15
Nodes (9): EnquiriesPage(), Enquiry, fmtDate(), fmtTime(), Note, Status, STATUS_BADGE, StatusCounts (+1 more)

### Community 7 - "Subscriptions Management"
Cohesion: 0.19
Nodes (13): CYCLES, emptyOverride, fmt(), fmtDate(), OverrideForm, PLANS, STATUS_BADGE, STATUSES (+5 more)

### Community 8 - "TeamPage"
Cohesion: 0.43
Nodes (6): fmtDate(), TeamPage(), doToggle(), handleEditSave(), handleInvite(), toast()

### Community 9 - "Coupons Management"
Cohesion: 0.36
Nodes (8): CouponsPage(), create(), discountLabel(), load(), toast(), toggleActive(), fmt(), fmtDate()

### Community 10 - "billing/page.tsx"
Cohesion: 0.24
Nodes (3): BillingOpsPage(), fmt(), fmtDate()

### Community 11 - "VerticalFormPage"
Cohesion: 0.10
Nodes (17): EMPTY_FIELD_ROW, emptyForm(), FIELD_TYPES, FieldRow, FieldType, FLAG_GROUPS, FormState, statusFlowError() (+9 more)

### Community 13 - "Project Docs & Agent Rules"
Cohesion: 0.25
Nodes (8): Next.js Breaking Changes Warning, Next.js Internal Docs Guide, CLAUDE.md references AGENTS.md, create-next-app, Geist Font Family, next/font Optimization, Next.js Project Bootstrap, Vercel Deployment

### Community 14 - "Communications Feature"
Cohesion: 0.16
Nodes (4): CommunicationsPage(), loadAnnouncements(), saveAnnouncement(), toggleAnnouncement()

### Community 15 - "lifecycle/page.tsx"
Cohesion: 0.29
Nodes (5): HealthBar(), healthColor(), LifecyclePage(), PLAN_BADGE, Tenant

### Community 16 - "support/page.tsx"
Cohesion: 0.38
Nodes (4): fmtDate(), PLAN_BADGE, SupportPage(), timeAgo()

### Community 17 - "Middleware & Security"
Cohesion: 0.36
Nodes (7): buildCsp(), config, middleware(), PUBLIC, redirectToLogin(), ROLE_ROUTES, withNonce()

### Community 18 - "Root Layout & Fonts"
Cohesion: 0.33
Nodes (4): bricolage, dmSans, geistMono, metadata

### Community 33 - "TenantDetailPage"
Cohesion: 0.11
Nodes (8): TenantDetailPage(), handleOverrideChange(), loadStorefront(), loadWaAgent(), patchFeature(), provisionWaAgent(), revercelDomain(), verifyDomainOverride()

### Community 34 - "live-activity/page.tsx"
Cohesion: 0.14
Nodes (14): ActivityBreakdown(), ActivityData, ago(), fmtTs(), msAgo(), OnlineNow(), OnlineSortKey, OnlineUser (+6 more)

### Community 35 - "WaAgentDetailPage"
Cohesion: 0.23
Nodes (13): fmtDate(), WaAgentDetailPage(), createPortalUser(), deleteProduct(), disableUser(), loadPortalUsers(), loadProducts(), resetPassword() (+5 more)

### Community 36 - "toast"
Cohesion: 0.18
Nodes (15): addNote(), extendTrial(), handleConfirm(), impersonate(), load(), loadAnalytics(), loadCustomerDetail(), loadOrderDetail() (+7 more)

### Community 37 - "wa-agent/page.tsx"
Cohesion: 0.14
Nodes (9): AgentSummary, BulkEntry, BulkResult, BulkStep, EMPTY_FORM, fmtDate(), OmTenant, ProvisionForm (+1 more)

### Community 38 - "Ordermatrix — DESIGN.md"
Cohesion: 0.13
Nodes (14): Brand & Accent, Colors, Components, Do's and Don'ts, Elevation, Layout, Ordermatrix — DESIGN.md, Overview (+6 more)

### Community 39 - "Topbar.tsx"
Cohesion: 0.19
Nodes (11): PAGE_TITLES, resolveTitle(), ROLE_COLOR, ROLE_LABEL, Topbar(), logout(), TopbarProps, resolveNavSection() (+3 more)

### Community 40 - "OrderMatrixLoader.tsx"
Cohesion: 0.18
Nodes (10): ALL_DOTS, ANTI_GROUPS, CROSS_GROUPS, EDGES, MAIN_GROUPS, OrderMatrixLoader(), Variant, VARIANTS (+2 more)

### Community 41 - "coupons/page.tsx"
Cohesion: 0.18
Nodes (4): Coupon, EMPTY_FORM, Sk(), TabsSkeleton()

### Community 42 - "(dashboard)/layout.tsx"
Cohesion: 0.27
Nodes (6): DashboardLayout(), getAdmin(), ReactQueryProvider(), getAllowedRoles(), ROLE_DEFAULT_REDIRECT, ROUTE_ROLES

### Community 43 - "SkRows"
Cohesion: 0.20
Nodes (7): TEMPLATE_LABEL, VOLUME_LABEL, Vertical, FilterType, fmtDate(), SupportIssuesPage(), SkRows()

### Community 44 - "Sidebar.tsx"
Cohesion: 0.29
Nodes (8): ROLE_COLOR, SidebarProps, CommandPaletteProps, PALETTE_ITEMS, AdminRole, NAV, NavGroup, NavItem

### Community 46 - "api.ts"
Cohesion: 0.31
Nodes (5): AuditLogPage(), fmtTs(), fmtDate(), UsersPage(), api

### Community 47 - "hot-leads/page.tsx"
Cohesion: 0.24
Nodes (7): fmtDate(), fmtTime(), HotLeadsPage(), Lead, LeadReason, REASON_COLOR, REASON_LABEL

### Community 48 - "superadmin/page.tsx"
Cohesion: 0.24
Nodes (7): fmt(), fmtDate(), PLAN_COLOR, PulseData, PulsePage(), SkCardHeader(), SkStatCard()

### Community 49 - "hasRole"
Cohesion: 0.25
Nodes (6): Sidebar(), logout(), CommandPalette(), navigate(), onKeyDown(), hasRole()

### Community 50 - "wa-agent/[tenantId]/page.tsx"
Cohesion: 0.25
Nodes (5): ConfirmModal(), ConfirmState, CopyButton(), TabId, TABS

### Community 51 - "stores/page.tsx"
Cohesion: 0.38
Nodes (6): fmtDate(), fmtMoney(), PLAN_BADGE, STATUS_BADGE, Store, StoresPage()

### Community 52 - "useTheme.ts"
Cohesion: 0.38
Nodes (5): getSystemMode(), Mode, readStoredPreference(), ThemePreference, useTheme()

### Community 53 - "OrderMatrixSpinner"
Cohesion: 0.33
Nodes (5): Announcement, emptyAnn, PLANS, SEVERITY_BADGE, OrderMatrixSpinner()

### Community 54 - "funnel/page.tsx"
Cohesion: 0.40
Nodes (4): FunnelPage(), FunnelRow, pct(), STAGE_META

### Community 55 - "storefront-plans/page.tsx"
Cohesion: 0.33
Nodes (4): CAP_ROWS, Caps, PLAN_BADGE, PLAN_ORDER

### Community 56 - "team/page.tsx"
Cohesion: 0.33
Nodes (5): AdminMember, ASSIGNABLE_ROLES, AssignableRole, ROLE_BADGE, ROLE_LABEL

### Community 57 - "tenants/page.tsx"
Cohesion: 0.50
Nodes (4): fmtDate(), PLAN_BADGE, Tenant, TenantsPage()

### Community 58 - "loadWaConvAgent"
Cohesion: 0.40
Nodes (5): connectWaConvAgent(), loadWaConvAgent(), loadWaConvAgentConvs(), provisionWaConvAgent(), unsuspendWaConvAgent()

### Community 59 - "VerticalsPage"
Cohesion: 0.67
Nodes (3): VerticalsPage(), toast(), toggleActive()

## Knowledge Gaps
- **189 isolated node(s):** `Announcement`, `SEVERITY_BADGE`, `PLANS`, `emptyAnn`, `Tenant` (+184 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TenantDetailPage()` connect `TenantDetailPage` to `tenants/[tenantId]/page.tsx`, `toast`, `Topbar.tsx`, `(dashboard)/layout.tsx`, `hasRole`, `loadWaConvAgent`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `api` connect `api.ts` to `sales/page.tsx`, `tenants/[tenantId]/page.tsx`, `Enquiries Management`, `Subscriptions Management`, `billing/page.tsx`, `VerticalFormPage`, `lifecycle/page.tsx`, `support/page.tsx`, `live-activity/page.tsx`, `wa-agent/page.tsx`, `coupons/page.tsx`, `SkRows`, `hot-leads/page.tsx`, `superadmin/page.tsx`, `wa-agent/[tenantId]/page.tsx`, `stores/page.tsx`, `OrderMatrixSpinner`, `funnel/page.tsx`, `storefront-plans/page.tsx`, `team/page.tsx`, `tenants/page.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `getAdmin()` connect `(dashboard)/layout.tsx` to `TenantDetailPage`, `auth.ts`, `tenants/[tenantId]/page.tsx`, `WaAgentDetailPage`, `Subscriptions Management`, `Topbar.tsx`, `Sidebar.tsx`, `hasRole`, `wa-agent/[tenantId]/page.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `TenantDetailPage()` (e.g. with `loadAnalytics()` and `loadFeatures()`) actually correct?**
  _`TenantDetailPage()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Announcement`, `SEVERITY_BADGE`, `PLANS` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sales/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `TypeScript & Next.js Types` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._