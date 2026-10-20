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

  const livePulse = 0.75 + 0.25 * Math.sin(frame / 8);

  const primary = style.primaryColor || "#38bdf8";
  const accent = style.accentColor || "#34d399";
  const secondary = style.secondaryColor || "#818cf8";
  const textCol = style.textColor || "#ffffff";
  const subtextCol = style.subtextColor || "#94a3b8";

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

  const formatSmartValue = (val: number, maxContext: number) => {
    if (val === 0) return "0";
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(2) + "M";
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + "K";
    return val.toFixed(1) + (maxContext < 100 ? "M" : "");
  };

  const renderMainChart = (chart: MainChartConfig) => {
    const chartProgress = interpolate(frame, [18, 95], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    if (chart.component === "Grouped_Bar_Chart" && chart.categories) {
      const maxVal = Math.max(...chart.categories.flatMap((c) => [c.budget, c.actual]), 1);
      const hasOverspent = chart.categories.some((c) => c.status === "overspent");

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
            <div style={{ display: "flex", gap: 18, fontSize: 14, color: subtextCol }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: secondary, display: "inline-block" }} />
                Baseline / Planned
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: accent, display: "inline-block" }} />
                Projected / Favorable
              </span>
              {hasOverspent && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: "#f87171", display: "inline-block" }} />
                  Overrun
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
            {chart.categories.map((cat, idx) => {
              const rowProgress = interpolate(frame, [20 + idx * 8, 85 + idx * 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const budgetWidth = Math.max(12, Math.pow(cat.budget / maxVal, 0.42) * 82) * rowProgress;
              const actualWidth = Math.max(12, Math.pow(cat.actual / maxVal, 0.42) * 82) * rowProgress;

              // Smart status check: respects explicit "favorable" or "overspent" status first
              const vPct = cat.variance_pct ?? 0;
              const isOver =
                cat.status === "overspent"
                  ? true
                  : cat.status === "favorable"
                  ? false
                  : vPct > 0;
              const barColor = isOver ? "#f87171" : accent;

              return (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "145px 1fr 110px", alignItems: "center", gap: 14 }}>
                  <div style={{ color: textCol, fontSize: 16, fontWeight: 600 }}>{cat.name || (cat as any).label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, background: "rgba(255,255,255,0.04)", padding: "6px 10px", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: `${budgetWidth}%`, height: 10, background: secondary, borderRadius: 4, opacity: 0.75 }} />
                      <span style={{ color: subtextCol, fontSize: 12 }}>{formatSmartValue(cat.budget, maxVal)}</span>
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
                      <span style={{ color: textCol, fontSize: 13, fontWeight: 700 }}>{formatSmartValue(cat.actual, maxVal)}</span>
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
                    {vPct > 0 ? `+${vPct}%` : `${vPct}%`}
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
      const series1 = chart.series[0]?.data || (chart.series[0] as any)?.values || [];
      const series2 = chart.series[1]?.data || (chart.series[1] as any)?.values || [];

      const s1Color = (chart.series[0] as any)?.color || accent;
      const s2Color = (chart.series[1] as any)?.color || primary;

      const maxDataVal = Math.max(...series1, ...series2, 1);
      const minDataVal = Math.min(...series1, ...series2, maxDataVal);
      const padding = (maxDataVal - minDataVal) * 0.22 || maxDataVal * 0.15;
      const maxVal = maxDataVal + padding;
      const minVal = Math.max(0, minDataVal - padding * 0.6);

      const svgW = 820;
      const svgH = 310;
      const padL = 55;
      const padR = 30;
      const padT = 36;
      const padB = 40;
      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;

      const getXY = (idx: number, val: number) => {
        const x = padL + (idx / Math.max(months.length - 1, 1)) * plotW;
        const y = padT + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
        return { x, y };
      };

      const visibleCount = Math.max(1, Math.floor(chartProgress * months.length));
      const s1Pts = series1.slice(0, visibleCount).map((v: number, i: number) => `${getXY(i, v).x},${getXY(i, v).y}`).join(" ");
      const s2Pts = series2.slice(0, visibleCount).map((v: number, i: number) => `${getXY(i, v).x},${getXY(i, v).y}`).join(" ");

      const gridSteps = [minVal, minVal + (maxVal - minVal) / 3, minVal + (2 * (maxVal - minVal)) / 3, maxVal];

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
            <div style={{ display: "flex", gap: 18, fontSize: 14, color: subtextCol }}>
              <span style={{ color: s1Color, fontWeight: 600 }}>● {chart.series[0]?.name || "Series 1"}</span>
              {chart.series[1] && (
                <span style={{ color: s2Color, fontWeight: 600 }}>● {chart.series[1]?.name || "Series 2"}</span>
              )}
            </div>
          </div>

          <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
            {gridSteps.map((gridVal, gIdx) => {
              const y = padT + plotH - ((gridVal - minVal) / (maxVal - minVal)) * plotH;
              return (
                <g key={gIdx}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <text x={padL - 10} y={y + 4} fill={subtextCol} fontSize="12" textAnchor="end">
                    {formatSmartValue(gridVal, maxVal)}
                  </text>
                </g>
              );
            })}

            {s2Pts && (
              <polyline fill="none" stroke={s2Color} strokeWidth="3.5" strokeDasharray="6 4" points={s2Pts} />
            )}
            {s1Pts && (
              <polyline
                fill="none"
                stroke={s1Color}
                strokeWidth="4.5"
                points={s1Pts}
                style={{ filter: `drop-shadow(0 0 ${8 * livePulse}px ${s1Color})` }}
              />
            )}

            {months.map((m, i) => {
              const v1 = series1[i] ?? minVal;
              const v2 = series2[i] ?? minVal;
              const pt1 = getXY(i, v1);
              const pt2 = getXY(i, v2);
              const isRevealed = i < visibleCount;

              const isPeak = (chart as any).peak_callout ? (chart as any).peak_callout.month === m : m === "Oct";
              const peakLabel = (chart as any).peak_callout ? (chart as any).peak_callout.label : "Peak";
              // Place callout on whichever point is higher on the chart (smaller Y coordinate)
              const highPt = pt1.y <= pt2.y ? pt1 : pt2;

              return (
                <g key={m}>
                  <text x={pt1.x} y={svgH - 10} fill={subtextCol} fontSize="13" textAnchor="middle">
                    {m}
                  </text>
                  {isRevealed && (
                    <>
                      {series2.length > 0 && <circle cx={pt2.x} cy={pt2.y} r={4} fill={s2Color} />}
                      <circle
                        cx={pt1.x}
                        cy={pt1.y}
                        r={isPeak ? 7 * livePulse : 5}
                        fill={s1Color}
                      />
                      {isPeak && (
                        <g>
                          <rect x={highPt.x - 95} y={highPt.y - 38} width={190} height={26} rx={6} fill="#0f172a" stroke={s1Color} strokeWidth={1.5} />
                          <text x={highPt.x} y={highPt.y - 21} fill={textCol} fontSize="12" fontWeight="bold" textAnchor="middle">
                            {peakLabel}
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
      const palette = [primary, secondary, accent, "#f59e0b", "#f43f5e", "#a855f7"];
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
                  const percent = seg.percentage || (seg as any).share_pct || 0;
                  const segLength = (percent / 100) * circumference * chartProgress;
                  const offset = -((accumulatedPercent / 100) * circumference);
                  accumulatedPercent += percent;
                  return (
                    <circle
                      key={i}
                      cx={130}
                      cy={130}
                      r={radius}
                      fill="transparent"
                      stroke={(seg as any).color || palette[i % palette.length]}
                      strokeWidth={30}
                      strokeDasharray={`${segLength} ${circumference}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div style={{ position: "absolute", textAlign: "center", width: "160px", padding: "0 10px" }}>
                <div style={{ color: textCol, fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
                  {(chart as any).center_label || "100% Share"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "52%" }}>
              {chart.segments.map((seg, i) => {
                const itemReveal = interpolate(frame, [25 + i * 7, 50 + i * 7], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const percent = seg.percentage || (seg as any).share_pct || 0;
                const segColor = (seg as any).color || palette[i % palette.length];
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
                      borderLeft: `4px solid ${segColor}`,
                    }}
                  >
                    <span style={{ color: textCol, fontSize: 15, fontWeight: 600 }}>{seg.label || (seg as any).name}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: subtextCol, fontSize: 14 }}>
                        {seg.value >= 1000000
                          ? `$${(seg.value / 1000000).toFixed(2)}M`
                          : seg.value >= 1000
                          ? `$${(seg.value / 1000).toFixed(1)}K`
                          : `$${seg.value}`}
                      </span>
                      <span style={{ color: segColor, fontSize: 15, fontWeight: 800 }}>
                        {percent.toFixed(1)}%
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
              {(style.companyWatermark || "DEPTCAST ENTERPRISE") + " • EXECUTIVE PLAYBOOK"}
            </div>
            <h1 style={{ color: textCol, fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              {section_header || title}
            </h1>
          </div>
        </div>

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

      {top_kpi_controls && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 22 }}>
          {top_kpi_controls.map((kpi, idx) => {
            const cardSpring = Math.min(
              1,
              spring({ frame: Math.max(0, frame - idx * 8), fps, config: { damping: 14, stiffness: 85 } })
            );
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
                  opacity: cardSpring,
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

      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 22, flex: 1, minHeight: 0 }}>
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
                  const bulletSpring = Math.min(
                    1,
                    spring({ frame: Math.max(0, frame - (45 + bIdx * 22)), fps, config: { damping: 14, stiffness: 80 } })
                  );
                  return (
                    <div
                      key={bIdx}
                      style={{
                        opacity: bulletSpring,
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