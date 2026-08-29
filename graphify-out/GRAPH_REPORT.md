# Graph Report - ordermatrix-internal  (2026-08-29)

## Corpus Check
- Corpus is ~27,954 words - fits in a single context window. You may not need a graph.

## Summary
- 323 nodes · 461 edges · 33 communities (20 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Shared Dashboard Components
- App Layout & Auth Shell
- TypeScript & Next.js Types
- Tenant Detail Page
- Runtime Dependencies
- Dev Tooling & Config
- Enquiries Management
- Subscriptions Management
- Team & Role Management
- Coupons Management
- Billing Operations
- Sales Pipeline
- Lead Captures
- Project Docs & Agent Rules
- Communications Feature
- Tenant Lifecycle Health
- Support Tickets
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

## God Nodes (most connected - your core abstractions)
1. `api` - 19 edges
2. `TenantDetailPage()` - 18 edges
3. `SkRows()` - 17 edges
4. `compilerOptions` - 16 edges
5. `BillingOpsPage()` - 9 edges
6. `SalesPage()` - 9 edges
7. `getAdmin()` - 9 edges
8. `CommunicationsPage()` - 8 edges
9. `EnquiriesPage()` - 8 edges
10. `SubscriptionsPage()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Project Bootstrap` --semantically_similar_to--> `Next.js Breaking Changes Warning`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `DashboardLayout()` --calls--> `isLoggedIn()`  [EXTRACTED]
  app/(dashboard)/layout.tsx → lib/auth.ts
- `SubscriptionsPage()` --calls--> `getAdmin()`  [EXTRACTED]
  app/(dashboard)/superadmin/subscriptions/page.tsx → lib/auth.ts
- `SubscriptionsPage()` --calls--> `hasRole()`  [EXTRACTED]
  app/(dashboard)/superadmin/subscriptions/page.tsx → lib/auth.ts
- `TenantDetailPage()` --calls--> `getAdmin()`  [EXTRACTED]
  app/(dashboard)/superadmin/tenants/[tenantId]/page.tsx → lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Project Definition and Agent Governance** — readme_nextjs_project, agents_nextjs_breaking_changes, claude_agents_reference [INFERRED 0.85]

## Communities (33 total, 13 thin omitted)

### Community 0 - "Shared Dashboard Components"
Cohesion: 0.07
Nodes (31): Announcement, emptyAnn, PLANS, SEVERITY_BADGE, fmt(), fmtDate(), SalesPage(), TrendPoint (+23 more)

### Community 1 - "App Layout & Auth Shell"
Cohesion: 0.12
Nodes (26): DashboardLayout(), LoginPage(), handleSubmit(), NAV, ROLE_COLOR, Sidebar(), logout(), PAGE_TITLES (+18 more)

### Community 2 - "TypeScript & Next.js Types"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "Tenant Detail Page"
Cohesion: 0.15
Nodes (16): ALL_STATUSES, fmt(), fmtDate(), PLAN_BADGE, STATUS_COLOR, STATUS_LABEL, TenantDetailPage(), addNote() (+8 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.09
Nodes (21): axios, lucide-react, next, dependencies, axios, lucide-react, next, react (+13 more)

### Community 5 - "Dev Tooling & Config"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 6 - "Enquiries Management"
Cohesion: 0.15
Nodes (9): EnquiriesPage(), Enquiry, fmtDate(), fmtTime(), Note, Status, STATUS_BADGE, StatusCounts (+1 more)

### Community 7 - "Subscriptions Management"
Cohesion: 0.19
Nodes (13): CYCLES, emptyOverride, fmt(), fmtDate(), OverrideForm, PLANS, STATUS_BADGE, STATUSES (+5 more)

### Community 8 - "Team & Role Management"
Cohesion: 0.21
Nodes (12): AdminMember, ASSIGNABLE_ROLES, AssignableRole, fmtDate(), ROLE_BADGE, ROLE_LABEL, TeamPage(), handleEditSave() (+4 more)

### Community 9 - "Coupons Management"
Cohesion: 0.27
Nodes (10): Coupon, CouponsPage(), create(), discountLabel(), load(), toast(), toggleActive(), EMPTY_FORM (+2 more)

### Community 10 - "Billing Operations"
Cohesion: 0.24
Nodes (3): BillingOpsPage(), fmt(), fmtDate()

### Community 11 - "Sales Pipeline"
Cohesion: 0.22
Nodes (5): fmtDate(), SalesPipelinePage(), SortKey, STATUS_OPTIONS, StatusFilter

### Community 12 - "Lead Captures"
Cohesion: 0.25
Nodes (4): fmtDate(), LeadCapturesPage(), TEMPLATE_LABEL, VOLUME_LABEL

### Community 13 - "Project Docs & Agent Rules"
Cohesion: 0.25
Nodes (8): Next.js Breaking Changes Warning, Next.js Internal Docs Guide, CLAUDE.md references AGENTS.md, create-next-app, Geist Font Family, next/font Optimization, Next.js Project Bootstrap, Vercel Deployment

### Community 14 - "Communications Feature"
Cohesion: 0.32
Nodes (4): CommunicationsPage(), loadAnnouncements(), saveAnnouncement(), toggleAnnouncement()

### Community 15 - "Tenant Lifecycle Health"
Cohesion: 0.29
Nodes (5): HealthBar(), healthColor(), LifecyclePage(), PLAN_BADGE, Tenant

### Community 16 - "Support Tickets"
Cohesion: 0.36
Nodes (4): fmtDate(), PLAN_BADGE, SupportPage(), timeAgo()

### Community 17 - "Middleware & Security"
Cohesion: 0.36
Nodes (7): buildCsp(), config, middleware(), PUBLIC, redirectToLogin(), ROLE_ROUTES, withNonce()

### Community 18 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **118 isolated node(s):** `Announcement`, `SEVERITY_BADGE`, `PLANS`, `emptyAnn`, `Tenant` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api` connect `Shared Dashboard Components` to `App Layout & Auth Shell`, `Tenant Detail Page`, `Enquiries Management`, `Subscriptions Management`, `Team & Role Management`, `Coupons Management`, `Billing Operations`, `Sales Pipeline`, `Lead Captures`, `Tenant Lifecycle Health`, `Support Tickets`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `SkRows()` connect `Shared Dashboard Components` to `Enquiries Management`, `Subscriptions Management`, `Team & Role Management`, `Coupons Management`, `Billing Operations`, `Sales Pipeline`, `Lead Captures`, `Tenant Lifecycle Health`, `Support Tickets`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `TenantDetailPage()` connect `Tenant Detail Page` to `App Layout & Auth Shell`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `Announcement`, `SEVERITY_BADGE`, `PLANS` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shared Dashboard Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `App Layout & Auth Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._
- **Should `TypeScript & Next.js Types` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._