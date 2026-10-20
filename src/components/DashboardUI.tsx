import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from "remotion";
import type { DashboardUISceneProps, MainChartConfig } from "../types";

export const DashboardUI: React.FC<DashboardUISceneProps & { data_points?: string[] }> = ({
  title,
  section_header,
  chart_data,
  top_kpi_controls,
  main_chart,
  side_insight_panel,
  style,
  data_points,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const headerY = interpolate(headerSpring, [0, 1], [-25, 0]);

  // Continuous live pulse so the screen NEVER looks static
  const livePulse = 0.75 + 0.25 * Math.sin(frame / 8);
  const scanlineX = interpolate(frame % 180, [0, 180], [0, 100]);

  const primary = style.primaryColor || "#38bdf8";
  const accent = style.accentColor || "#34d399";
  const secondary = style.secondaryColor || "#818cf8";
  const textCol = style.textColor || "#ffffff";
  const subtextCol = style.subtextColor || "#94a3b8";

  // Helper to format animated numbers
  const formatCounter = (kpi: any, progress: number) => {
    if (typeof kpi.value === "number") {
      const current = kpi.value * progress;
      if (Math.abs(kpi.value) >= 1000000) {
        return `${kpi.prefix || ""}${(current / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(kpi.value) >= 1000) {
        return `${kpi.prefix || ""}${(current / 1000).toFixed(1)}K`;
      }
      return `${kpi.prefix || ""}${current.toFixed(1)}${kpi.unit || ""}`;
    }
    return kpi.display_value || String(kpi.value);
  };

  // Render Center Chart based on main_chart.component
  const renderMainChart = (chart: MainChartConfig) => {
    const chartProgress = interpolate(frame, [18, 95], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    if (chart.component === "Grouped_Bar_Chart" && chart.categories) {
      const maxVal = Math.max(...chart.categories.flatMap((c) => [c.budget, c.actual]), 1);
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
            <div style={{ display: "flex", gap: 18, fontSize: 14, color: subtextCol }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: secondary, display: "inline-block" }} />
                Planned Budget
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: primary, display: "inline-block" }} />
                Actual Spend
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
            {chart.categories.map((cat, idx) => {
              const rowProgress = interpolate(frame, [20 + idx * 8, 85 + idx * 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              // Log/sqrt scale boost so smaller categories (48K vs 1.3M) are clearly visible on dashboard
              const budgetWidth = Math.max(12, Math.pow(cat.budget / maxVal, 0.42) * 82) * rowProgress;
              const actualWidth = Math.max(12, Math.pow(cat.actual / maxVal, 0.42) * 82) * rowProgress;
              const isOver = cat.status === "overspent" || cat.variance_pct > 0;
              const barColor = isOver ? "#f87171" : accent;

              return (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "130px 1fr 110px", alignItems: "center", gap: 14 }}>
                  <div style={{ color: textCol, fontSize: 16, fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, background: "rgba(255,255,255,0.04)", padding: "6px 10px", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: `${budgetWidth}%`, height: 10, background: secondary, borderRadius: 4, opacity: 0.75 }} />
                      <span style={{ color: subtextCol, fontSize: 12 }}>{(cat.budget / 1000).toFixed(0)}K</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: `${actualWidth}%`,
                          height: 12,
                          background: barColor,
                          borderRadius: 4,
                          boxShadow: `0 0 ${12 * livePulse}px ${barColor}90`,
                        }}
                      />
                      <span style={{ color: textCol, fontSize: 13, fontWeight: 700 }}>{(cat.actual / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                  <div
                    style={{
                      justifySelf: "end",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      background: isOver ? "rgba(248,113,113,0.18)" : "rgba(52,211,153,0.18)",
                      color: isOver ? "#fca5a5" : "#6ee7b7",
                      border: `1px solid ${isOver ? "#f87171" : "#34d399"}60`,
                    }}
                  >
                    {cat.variance_pct > 0 ? `+${cat.variance_pct}%` : `${cat.variance_pct}%`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (chart.component === "Multi_Line_Trend_Chart" && chart.series && chart.x_axis) {
      const months = chart.x_axis;
      const budgetSeries = chart.series[0]?.data || [];
      const actualSeries = chart.series[1]?.data || [];
      const maxVal = Math.max(...budgetSeries, ...actualSeries, 20000);
      const minVal = 8000;
      const svgW = 820;
      const svgH = 310;
      const padL = 50;
      const padR = 30;
      const padT = 30;
      const padB = 40;
      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;

      const getXY = (idx: number, val: number) => {
        const x = padL + (idx / Math.max(months.length - 1, 1)) * plotW;
        const y = padT + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
        return { x, y };
      };

      const visibleCount = Math.max(1, Math.floor(chartProgress * months.length));
      const budgetPts = budgetSeries.slice(0, visibleCount).map((v, i) => `${getXY(i, v).x},${getXY(i, v).y}`).join(" ");
      const actualPts = actualSeries.slice(0, visibleCount).map((v, i) => `${getXY(i, v).x},${getXY(i, v).y}`).join(" ");

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
            <div style={{ display: "flex", gap: 18, fontSize: 14, color: subtextCol }}>
              <span style={{ color: secondary }}>● Planned Budget</span>
              <span style={{ color: "#f87171" }}>● Actual Operational Spend</span>
            </div>
          </div>

          <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
            {[10000, 12500, 15000, 17500].map((gridVal, gIdx) => {
              const y = padT + plotH - ((gridVal - minVal) / (maxVal - minVal)) * plotH;
              return (
                <g key={gIdx}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <text x={padL - 10} y={y + 4} fill={subtextCol} fontSize="12" textAnchor="end">
                    {(gridVal / 1000).toFixed(1)}K
                  </text>
                </g>
              );
            })}

            {budgetPts && (
              <polyline fill="none" stroke={secondary} strokeWidth="3.5" strokeDasharray="6 4" points={budgetPts} />
            )}
            {actualPts && (
              <polyline
                fill="none"
                stroke="#f87171"
                strokeWidth="4.5"
                points={actualPts}
                style={{ filter: `drop-shadow(0 0 ${8 * livePulse}px #f87171)` }}
              />
            )}

            {months.map((m, i) => {
              const bPt = getXY(i, budgetSeries[i] || minVal);
              const aPt = getXY(i, actualSeries[i] || minVal);
              const isRevealed = i < visibleCount;
              const isPeak = m === "Oct";
              return (
                <g key={m}>
                  <text x={bPt.x} y={svgH - 10} fill={subtextCol} fontSize="13" textAnchor="middle">
                    {m}
                  </text>
                  {isRevealed && (
                    <>
                      <circle cx={bPt.x} cy={bPt.y} r={4} fill={secondary} />
                      <circle
                        cx={aPt.x}
                        cy={aPt.y}
                        r={isPeak ? 8 * livePulse : 5}
                        fill={isPeak ? "#ef4444" : "#f87171"}
                      />
                      {isPeak && (
                        <g>
                          <rect x={aPt.x - 58} y={aPt.y - 38} width={116} height={26} rx={6} fill="#ef4444" />
                          <text x={aPt.x} y={aPt.y - 21} fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
                            Peak: 17.8K
                          </text>
                        </g>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    if (chart.component === "Donut_Chart" && chart.segments) {
      const palette = [primary, "#f87171", secondary, accent, "#fbbf24", "#a78bfa"];
      const radius = 105;
      const circumference = 2 * Math.PI * radius;
      let accumulatedPercent = 0;

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flex: 1 }}>
            <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={260} height={260} viewBox="0 0 260 260" style={{ transform: "rotate(-90deg)" }}>
                {chart.segments.map((seg, i) => {
                  const segLength = (seg.percentage / 100) * circumference * chartProgress;
                  const offset = -((accumulatedPercent / 100) * circumference);
                  accumulatedPercent += seg.percentage;
                  return (
                    <circle
                      key={i}
                      cx={130}
                      cy={130}
                      r={radius}
                      fill="transparent"
                      stroke={palette[i % palette.length]}
                      strokeWidth={30}
                      strokeDasharray={`${segLength} ${circumference}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ color: subtextCol, fontSize: 13, textTransform: "uppercase" }}>Total Actual</div>
                <div style={{ color: textCol, fontSize: 30, fontWeight: 800 }}>$1.72M</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "52%" }}>
              {chart.segments.map((seg, i) => {
                const itemReveal = interpolate(frame, [25 + i * 7, 50 + i * 7], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={i}
                    style={{
                      opacity: itemReveal,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.04)",
                      padding: "8px 14px",
                      borderRadius: 8,
                      borderLeft: `4px solid ${palette[i % palette.length]}`,
                    }}
                  >
                    <span style={{ color: textCol, fontSize: 15, fontWeight: 600 }}>{seg.label}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: subtextCol, fontSize: 14 }}>${(seg.value / 1000).toFixed(1)}K</span>
                      <span style={{ color: palette[i % palette.length], fontSize: 15, fontWeight: 800 }}>
                        {seg.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Fallback for legacy simple chart_data scenes
  if (!top_kpi_controls && !main_chart) {
    const safeData = chart_data?.length
      ? chart_data
      : (data_points || []).map((dp) => ({ label: String(dp).substring(0, 18), value: 75 }));
    return (
      <AbsoluteFill style={{ padding: "70px 100px", fontFamily: style.fontFamily }}>
        <h1 style={{ color: textCol, fontSize: 48, marginBottom: 40 }}>{title}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {safeData.map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.06)", padding: 28, borderRadius: 14 }}>
              <div style={{ color: subtextCol, fontSize: 18 }}>{item.label}</div>
              <div style={{ color: primary, fontSize: 42, fontWeight: 800 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        padding: "44px 64px 86px 64px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: style.fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* Top Executive Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transform: `translateY(${headerY}px)`,
          opacity: Math.min(1, headerSpring),
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 6,
              height: 42,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${primary}, ${accent})`,
              boxShadow: `0 0 14px ${primary}`,
            }}
          />
          <div>
            <div style={{ color: primary, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              ENTERPRISE ANNUAL BUDGET ANALYTICS • FY 2023
            </div>
            <h1 style={{ color: textCol, fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              {section_header || title}
            </h1>
          </div>
        </div>

        {/* Live Active Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(15, 23, 42, 0.75)",
            border: `1px solid ${primary}50`,
            padding: "8px 18px",
            borderRadius: 30,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 ${10 * livePulse}px ${accent}`,
            }}
          />
          <span style={{ color: textCol, fontSize: 13, fontWeight: 600 }}>LIVE TELEMETRY SYNC</span>
        </div>
      </div>

      {/* ZONE 1: Top KPI Controls Row (3 Cards) */}
      {top_kpi_controls && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 22 }}>
          {top_kpi_controls.map((kpi, idx) => {
            const cardSpring = spring({
              frame: Math.max(0, frame - idx * 8),
              fps,
              config: { damping: 14, stiffness: 85 },
            });
            const countProgress = interpolate(frame, [idx * 8, 55 + idx * 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isRed = kpi.traffic_light === "red";
            const badgeColor = isRed ? "#f87171" : accent;

            return (
              <div
                key={idx}
                style={{
                  opacity: Math.min(1, cardSpring),
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [20, 0])}px)`,
                  background: "rgba(15, 23, 42, 0.78)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderTop: `3px solid ${isRed ? "#f87171" : primary}`,
                  borderRadius: 14,
                  padding: "18px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: subtextCol, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {kpi.label}
                  </span>
                  {(kpi.status_badge || kpi.traffic_light) && (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                        background: `${badgeColor}22`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}60`,
                      }}
                    >
                      {kpi.status_badge || (isRed ? "OVERRUN" : "FAVORABLE")}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
                  <span
                    style={{
                      color: isRed ? "#fca5a5" : textCol,
                      fontSize: 38,
                      fontWeight: 800,
                      textShadow: `0 0 18px ${isRed ? "#f8717150" : primary + "50"}`,
                    }}
                  >
                    {formatCounter(kpi, countProgress)}
                  </span>
                  {kpi.variance_pct !== undefined && (
                    <span style={{ color: badgeColor, fontSize: 16, fontWeight: 700 }}>
                      ({kpi.variance_pct > 0 ? `+${kpi.variance_pct}%` : `${kpi.variance_pct}%`})
                    </span>
                  )}
                </div>

                {/* Animated Progress / Scanner Line */}
                <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", marginTop: 12, borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, countProgress * 100)}%`,
                      height: "100%",
                      background: isRed ? "#f87171" : primary,
                      boxShadow: `0 0 10px ${isRed ? "#f87171" : primary}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOWER SPLIT: ZONE 2 (Main Animated Chart 63%) + ZONE 3 (AI Insight Panel 37%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 22, flex: 1, minHeight: 0 }}>
        {/* ZONE 2: Center Main Chart */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.78)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "22px 28px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {main_chart && renderMainChart(main_chart)}
        </div>

        {/* ZONE 3: Side AI Insight Panel */}
        {side_insight_panel && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(16px)",
              border: `1px solid ${primary}35`,
              borderRadius: 16,
              padding: "22px 26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: `${primary}25`,
                    color: primary,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  AI INSIGHT ENGINE
                </span>
                <span style={{ color: textCol, fontSize: 20, fontWeight: 700 }}>{side_insight_panel.headline}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {side_insight_panel.bullets.map((bullet, bIdx) => {
                  const bulletSpring = spring({
                    frame: Math.max(0, frame - (45 + bIdx * 22)),
                    fps,
                    config: { damping: 14, stiffness: 80 },
                  });
                  return (
                    <div
                      key={bIdx}
                      style={{
                        opacity: Math.min(1, bulletSpring),
                        transform: `translateX(${interpolate(bulletSpring, [0, 1], [25, 0])}px)`,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        background: "rgba(255,255,255,0.04)",
                        padding: "12px 14px",
                        borderRadius: 10,
                        borderLeft: `3px solid ${bIdx === 0 ? primary : accent}`,
                      }}
                    >
                      <span style={{ color: primary, fontWeight: 800, fontSize: 16 }}>▸</span>
                      <span style={{ color: textCol, fontSize: 15, lineHeight: 1.45 }}>{bullet}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {side_insight_panel.recommendation_badge && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: `linear-gradient(90deg, ${accent}20, ${primary}15)`,
                  border: `1px solid ${accent}70`,
                  boxShadow: `0 0 ${14 * livePulse}px ${accent}30`,
                }}
              >
                <div style={{ color: accent, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  STRATEGIC RECOMMENDATION
                </div>
                <div style={{ color: textCol, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
                  {side_insight_panel.recommendation_badge}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};