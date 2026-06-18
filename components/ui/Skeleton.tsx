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
