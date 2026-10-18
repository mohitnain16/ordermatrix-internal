'use client';

// Deterministic widths — avoids hydration mismatch from Math.random()
const W = ['72%', '58%', '64%', '48%', '66%', '52%', '70%', '44%', '76%', '54%', '60%', '68%'];

export function Sk({
  w = '100%',
  h = 14,
  r = 4,
  mb = 0,
  className,
  style: extraStyle,
}: {
  w?: string | number;
  h?: number;
  r?: number;
  mb?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`sk${className ? ` ${className}` : ''}`}
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb, display: 'block', ...extraStyle }}
    />
  );
}

export function SkStatCard() {
  return (
    <div className="stat-card">
      <Sk w="42%" h={10} r={3} mb={10} />
      <Sk w="56%" h={28} r={5} mb={8} />
      <Sk w="38%" h={10} r={3} />
    </div>
  );
}

export function SkRows({ rows = 7, cols = 5, n }: { rows?: number; cols?: number; n?: number }) {
  const rowCount = n ?? rows;
  return (
    <>
      {Array.from({ length: rowCount }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: cols }, (_, col) => (
            <td key={col} style={{ padding: '13px 14px' }}>
              {col === 0 ? (
                <div>
                  <Sk w="68%" h={13} mb={5} />
                  <Sk w="46%" h={10} />
                </div>
              ) : col === cols - 1 ? (
                <Sk w={44} h={24} r={6} />
              ) : (
                <Sk w={W[(row * 3 + col * 7) % W.length]} h={13} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkDetailCard({ rows = 6 }: { rows?: number }) {
  return (
    <div className="admin-card">
      <div className="card-body">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: i < rows - 1 ? 12 : 0,
              paddingBottom: i < rows - 1 ? 12 : 0,
              borderBottom: i < rows - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <Sk w="32%" h={13} />
            <Sk w="28%" h={13} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkCardHeader() {
  return (
    <div className="card-header">
      <Sk w={120} h={14} />
    </div>
  );
}

// ─── New composite skeletons ──────────────────────────────────────────────────

/** Full card shell with thead + SkRows body. Heights match real table. */
export function TableSkeleton({
  rows = 8,
  cols = 5,
  headers,
}: {
  rows?: number;
  cols?: number;
  headers?: string[];
}) {
  const colCount = headers ? headers.length : cols;
  return (
    <div className="admin-card">
      <div className="table-shell">
        <table className="admin-table">
          <thead>
            <tr>
              {(headers ?? Array.from({ length: colCount })).map((h, i) => (
                <th key={i}>{h ?? <Sk w="60%" h={10} />}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkRows rows={rows} cols={colCount} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Grid of N stat cards. Collapses to 1-col ≤600px via CSS grid. */
export function StatGridSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {Array.from({ length: n }, (_, i) => (
        <SkStatCard key={i} />
      ))}
    </div>
  );
}

/** Recharts-compatible area-chart placeholder. Height must match actual chart container. */
export function ChartSkeleton({ height = 260, label }: { height?: number; label?: string }) {
  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      {label && (
        <div className="card-header">
          <Sk w={120} h={14} />
        </div>
      )}
      <div
        className="card-body"
        style={{ height, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}
      >
        {/* y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: height - 56, marginBottom: 6 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Sk key={i} w={36} h={9} />
          ))}
        </div>
        {/* x-axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <Sk key={i} w={36} h={9} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Generic card with a few text lines. */
export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="admin-card">
      <div className="card-header">
        <Sk w="45%" h={14} />
        <Sk w={64} h={26} r={6} />
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: lines }, (_, i) => (
          <Sk key={i} w={W[i % W.length]} h={13} />
        ))}
      </div>
    </div>
  );
}

/** Form with N labeled inputs. Heights match real admin-input (36px) + label (12px). */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="admin-card">
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="input-group">
            <Sk w="28%" h={12} mb={6} />
            <Sk w="100%" h={36} r={8} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Sk w={80} h={34} r={8} />
          <Sk w={96} h={34} r={8} />
        </div>
      </div>
    </div>
  );
}

/** 3-col kanban with 3 cards per column. */
export function KanbanSkeleton({ cols = 3, cardsPerCol = 3 }: { cols?: number; cardsPerCol?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {Array.from({ length: cols }, (_, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Column header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
            <Sk w="55%" h={13} />
          </div>
          {Array.from({ length: cardsPerCol }, (_, ri) => (
            <div
              key={ri}
              className="admin-card"
              style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}
            >
              <Sk w={W[(ci * 4 + ri) % W.length]} h={13} />
              <Sk w="48%" h={10} />
              <Sk w={56} h={22} r={6} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Tab strip + body placeholder. Tab body defaults to TableSkeleton. */
export function TabsSkeleton({
  tabs = 4,
  bodyRows = 6,
  bodyCols = 5,
}: {
  tabs?: number;
  bodyRows?: number;
  bodyCols?: number;
}) {
  return (
    <>
      {/* Tab strip */}
      <div className="tab-bar" style={{ marginBottom: 0 }}>
        {Array.from({ length: tabs }, (_, i) => (
          <div key={i} style={{ padding: '10px 14px' }}>
            <Sk w={64 + (i % 3) * 16} h={13} />
          </div>
        ))}
      </div>
      {/* Tab body */}
      <div style={{ marginTop: 16 }}>
        <TableSkeleton rows={bodyRows} cols={bodyCols} />
      </div>
    </>
  );
}
