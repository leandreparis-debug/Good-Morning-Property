"use client";

import { useEffect, useRef, useState } from "react";
import type { MemberColor } from "@/lib/memberColors";

export interface WheelMember {
  id: string;
  label: string;
  color: MemberColor;
}

const SPIN_MS = 3600;
const R = 100;

function point(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

function slicePath(start: number, end: number): string {
  if (end - start >= 360) return `M 0 ${-R} A ${R} ${R} 0 1 1 0 ${R} A ${R} ${R} 0 1 1 0 ${-R} Z`;
  const [x0, y0] = point(start, R);
  const [x1, y1] = point(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M 0 0 L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
}

/**
 * The wheel: one slice per present member, in their badge colour, first names readable.
 * When `target` changes (with a new `spinKey`), it spins 3–4 s and stops with the target's
 * slice under the pointer, then calls `onSpinEnd`. With reduced motion it jumps there at once.
 */
export function Wheel({
  members,
  target,
  spinKey,
  reducedMotion,
  onSpinEnd,
}: {
  members: WheelMember[];
  target: string | null;
  spinKey: number;
  reducedMotion: boolean;
  onSpinEnd: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const rotationRef = useRef(0);
  const slice = members.length > 0 ? 360 / members.length : 360;

  useEffect(() => {
    if (spinKey === 0 || !target) return;
    const index = members.findIndex((member) => member.id === target);
    if (index < 0) return;
    const center = (index + 0.5) * slice;
    const base = rotationRef.current + (reducedMotion ? 0 : 4 * 360);
    const final = base + ((((360 - ((base + center) % 360)) % 360) + 360) % 360);
    rotationRef.current = final;
    setRotation(final);
    if (reducedMotion) {
      onSpinEnd();
      return;
    }
    setSpinning(true);
    const timeout = window.setTimeout(() => {
      setSpinning(false);
      onSpinEnd();
    }, SPIN_MS + 50);
    return () => {
      window.clearTimeout(timeout);
    };
    // onSpinEnd is intentionally not a dependency: only a new spinKey starts a spin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  const fontSize = members.length > 8 ? 9 : members.length > 5 ? 11 : 13;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(56vh,560px)]">
      <svg
        viewBox="-110 -118 220 228"
        role="img"
        aria-label={`Roue de tirage : ${members.map((member) => member.label).join(", ")}`}
        className="h-full w-full drop-shadow-[0_12px_32px_rgba(30,60,90,0.18)]"
      >
        <g
          data-testid="wheel"
          data-spinning={spinning}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "0 0",
            transition:
              spinning && !reducedMotion
                ? `transform ${SPIN_MS}ms cubic-bezier(0.17, 0.67, 0.21, 1)`
                : "none",
          }}
        >
          {members.map((member, index) => {
            const start = index * slice;
            const mid = start + slice / 2;
            const [lx, ly] = point(mid, members.length === 1 ? 0 : 62);
            const textColor = member.color === "ink" ? "#FFFFFF" : "var(--color-ink)";
            return (
              <g key={member.id} data-member={member.id}>
                <path
                  d={slicePath(start, start + slice)}
                  fill={`var(--color-${member.color})`}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <text
                  x={lx}
                  y={ly}
                  transform={members.length === 1 ? undefined : `rotate(${mid} ${lx} ${ly})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fontWeight="700"
                  fill={textColor}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {member.label}
                </text>
              </g>
            );
          })}
        </g>
        <circle r="16" fill="var(--color-ink)" />
        <circle r="7" fill="var(--color-sun)" />
        <path d="M -9 -116 L 9 -116 L 0 -98 Z" fill="var(--color-ink)" />
      </svg>
    </div>
  );
}
