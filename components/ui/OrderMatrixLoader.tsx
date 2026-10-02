'use client';

import { useState, useEffect, useMemo } from 'react';
import { getDailyFact } from '../../lib/getDailyFact';

const VARIANTS = ['main', 'anti', 'cross'] as const;
type Variant = typeof VARIANTS[number];

const MAIN_GROUPS: [number, number][][] = [
  [[83.322, 83.322]],
  [[83.322, 120.000], [120.000, 83.322]],
  [[83.322, 156.678], [120.000, 120.000], [156.678, 83.322]],
  [[120.000, 156.678], [156.678, 120.000]],
  [[156.678, 156.678]],
];
const ANTI_GROUPS: [number, number][][] = [
  [[156.678, 83.322]],
  [[120.000, 83.322], [156.678, 120.000]],
  [[83.322, 83.322], [120.000, 120.000], [156.678, 156.678]],
  [[83.322, 120.000], [120.000, 156.678]],
  [[83.322, 156.678]],
];
const CROSS_GROUPS: [number, number][][] = [...MAIN_GROUPS, ...ANTI_GROUPS];

const EDGES: [[number, number], [number, number]][] = [
  [[83.322, 83.322], [120.000, 83.322]], [[120.000, 83.322], [156.678, 83.322]],
  [[83.322, 120.000], [120.000, 120.000]], [[120.000, 120.000], [156.678, 120.000]],
  [[83.322, 156.678], [120.000, 156.678]], [[120.000, 156.678], [156.678, 156.678]],
  [[83.322, 83.322], [83.322, 120.000]], [[83.322, 120.000], [83.322, 156.678]],
  [[120.000, 83.322], [120.000, 120.000]], [[120.000, 120.000], [120.000, 156.678]],
  [[156.678, 83.322], [156.678, 120.000]], [[156.678, 120.000], [156.678, 156.678]],
];

const ALL_DOTS: [number, number, boolean?][] = [
  [83.322, 83.322], [120.000, 83.322], [156.678, 83.322, true],
  [83.322, 120.000], [120.000, 120.000], [156.678, 120.000],
  [83.322, 156.678], [120.000, 156.678], [156.678, 156.678],
];

function OmSweepSVG({
  groups,
  stepMs,
  size,
}: {
  groups: [number, number][][];
  stepMs: number;
  size: number;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % (groups.length + 1)), stepMs);
    return () => clearInterval(id);
  }, [groups, stepMs]);

  const active = step < groups.length ? groups[step] : [];
  const isActive = (x: number, y: number) =>
    active.some(([ax, ay]) => Math.abs(ax - x) < 0.5 && Math.abs(ay - y) < 0.5);
  const edgeActive = ([[x1, y1], [x2, y2]]: [[number, number], [number, number]]) =>
    isActive(x1, y1) && isActive(x2, y2);

  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="img" aria-label="Loading">
      <circle className="om-ring" cx="120" cy="120" r="88.800" />
      {EDGES.map((edge, i) => (
        <line
          key={i}
          className={`om-mesh-line${edgeActive(edge) ? ' om-line-active' : ''}`}
          x1={edge[0][0]} y1={edge[0][1]} x2={edge[1][0]} y2={edge[1][1]}
        />
      ))}
      {ALL_DOTS.map(([x, y, accent], i) => (
        <circle
          key={i}
          className={`${accent ? 'om-dot-accent' : 'om-dot'}${isActive(x, y) ? ' om-active' : ''}`}
          cx={x} cy={y} r={accent ? 10.617 : 6.757}
        />
      ))}
    </svg>
  );
}

export default function OrderMatrixLoader({
  label,
  showFact = true,
  size = 140,
}: {
  label?: string;
  showFact?: boolean;
  size?: number;
}) {
  const variant = useMemo<Variant>(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)], []);
  const fact = useMemo(() => (showFact ? getDailyFact() : null), [showFact]);
  const groups = variant === 'main' ? MAIN_GROUPS : variant === 'anti' ? ANTI_GROUPS : CROSS_GROUPS;
  const stepMs = variant === 'cross' ? 190 : 220;

  return (
    <div className="om-loader">
      <OmSweepSVG groups={groups} stepMs={stepMs} size={size} />
      {label && <p className="om-loader-label">{label}</p>}
      {fact && <p className="om-loader-fact">{fact}</p>}
    </div>
  );
}

export function OrderMatrixSpinner({ size = 28 }: { size?: number }) {
  const variant = useMemo<Variant>(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)], []);
  const groups = variant === 'main' ? MAIN_GROUPS : variant === 'anti' ? ANTI_GROUPS : CROSS_GROUPS;
  const stepMs = variant === 'cross' ? 190 : 220;
  return <OmSweepSVG groups={groups} stepMs={stepMs} size={size} />;
}
