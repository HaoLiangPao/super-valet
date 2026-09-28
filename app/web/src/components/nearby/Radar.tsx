'use client';

import { bearingDeg, formatRingKm, polarToScreen } from './geo';
import styles from './Radar.module.css';

/**
 * SVG 雷达图——design/0009 §4.1 的结论：不做真地图，同心距离环 + 方位角打点。
 * 列表才是主体（§4.5），这里只负责「扫描时的反馈」与「池子的空间感」。
 */
export interface RadarDot {
  placeId: string;
  name: string;
  distanceKm: number;
  bearing: number;
  colorBg: string;
  kind: 'pool' | 'discovered';
}

interface RadarProps {
  dots: RadarDot[];
  /** 雷达刻度的最大半径（km）——来自 `geo.ts` 的 `radarScaleKm()`，与半径过滤无关，只管画多大 */
  scaleKm: number;
  scanning: boolean;
  reducedMotion: boolean;
  selectedPlaceId: string | null;
  onSelect: (placeId: string) => void;
  northLabel: string;
  youLabel: string;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const OUTER_R = 118;
const RING_COUNT = 4;

export default function Radar({
  dots,
  scaleKm,
  scanning,
  reducedMotion,
  selectedPlaceId,
  onSelect,
  northLabel,
  youLabel,
}: RadarProps) {
  const animate = scanning && !reducedMotion;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={northLabel}
      className="w-full"
      style={{ maxWidth: 300, margin: '0 auto', display: 'block' }}
    >
      {/* 同心距离环 + 公里数 */}
      {Array.from({ length: RING_COUNT }, (_, i) => {
        const frac = (i + 1) / RING_COUNT;
        const r = frac * OUTER_R;
        const labelKm = scaleKm * frac;
        const labelPos = polarToScreen(38, frac, OUTER_R, CENTER);
        return (
          <g key={i}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke="var(--color-divider)"
              strokeWidth={1}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              fontSize={9}
              fill="var(--color-neutral-500)"
              textAnchor="middle"
            >
              {formatRingKm(labelKm)}
            </text>
          </g>
        );
      })}

      {/* 正上方标「北」 */}
      <text
        x={CENTER}
        y={CENTER - OUTER_R - 8}
        fontSize={11}
        fontWeight={700}
        fill="var(--color-neutral-700)"
        textAnchor="middle"
      >
        {northLabel}
      </text>

      {/* 扫描线：绕圈，纯装饰，reduced-motion 下不渲染 */}
      {animate && (
        <g className={styles.sweepLine}>
          <line
            x1={CENTER}
            y1={CENTER}
            x2={CENTER}
            y2={CENTER - OUTER_R}
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.55}
          />
          <path
            d={`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - OUTER_R} A ${OUTER_R} ${OUTER_R} 0 0 1 ${
              CENTER + OUTER_R * Math.sin(toRad(28))
            } ${CENTER - OUTER_R * Math.cos(toRad(28))} Z`}
            fill="var(--color-accent)"
            opacity={0.12}
          />
        </g>
      )}

      {/* 中心：你在这里 */}
      <circle cx={CENTER} cy={CENTER} r={4} fill="var(--color-accent-700)">
        <title>{youLabel}</title>
      </circle>

      {/* 餐厅打点 */}
      {dots.map((dot) => {
        const frac = dot.distanceKm / scaleKm;
        const pos = polarToScreen(dot.bearing, frac, OUTER_R, CENTER);
        const selected = dot.placeId === selectedPlaceId;
        const isDiscovered = dot.kind === 'discovered';
        return (
          <g key={dot.placeId}>
            {animate && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={7}
                fill={dot.colorBg}
                className={styles.dotPing}
                style={{ animationDelay: `${(dot.bearing / 360) * 2.4}s` }}
              />
            )}
            {selected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={9}
                fill="none"
                stroke="var(--color-accent-700)"
                strokeWidth={2}
              />
            )}
            {/* 视觉圆点（纯展示，不挂点击）画在下面；上面盖一层透明的命中圆，
                半径更大、单一职责，避免两个圆都注册 onClick 时互相挡住彼此
                （Playwright 走查发现的真实问题：两个同心圆各自可点会互相截获事件）。 */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={5.5}
              fill={isDiscovered ? 'var(--color-bg)' : dot.colorBg}
              stroke={isDiscovered ? 'var(--color-accent-700)' : 'none'}
              strokeWidth={isDiscovered ? 1.6 : 0}
              strokeDasharray={isDiscovered ? '2.4 2' : undefined}
              pointerEvents="none"
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={8.5}
              fill="transparent"
              className={styles.dotHit}
              onClick={() => onSelect(dot.placeId)}
              role="button"
              aria-label={dot.name}
            />
          </g>
        );
      })}
    </svg>
  );
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 页面层拼装每个点用的小工具：算方位角、按 swatch 上色（避免页面里手写公式） */
export function buildRadarDot(
  from: { lat: number; lng: number },
  target: { lat: number; lng: number; placeId: string; name: string; distanceKm: number },
  colorBg: string,
  kind: 'pool' | 'discovered',
): RadarDot {
  return {
    placeId: target.placeId,
    name: target.name,
    distanceKm: target.distanceKm,
    bearing: bearingDeg(from.lat, from.lng, target.lat, target.lng),
    colorBg,
    kind,
  };
}
