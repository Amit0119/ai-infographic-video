import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from "remotion";
import type { DashboardUISceneProps, MainChartConfig } from "../types";

export const DashboardUI: React.FC<
  DashboardUISceneProps & {
    data_points?: string[];
    blueprint_meta?: any;
    blueprint_steps?: any[];
  }
> = ({
  title,
  section_header,
  chart_data,
  top_kpi_controls,
  main_chart,
  side_insight_panel,
  blueprint_meta,
  blueprint_steps,
  style,
  data_points,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
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
      const isWhole = Number.isInteger(kpi.value) && progress > 0.96;
      return `${kpi.prefix || ""}${isWhole ? Math.round(current) : current.toFixed(1)}${kpi.unit || ""}`;
    }
    return kpi.display_value || String(kpi.value);
  };

  const formatSmartValue = (val: number, maxContext: number, chartTitle?: string) => {
    if (val === 0) return "0";
    const t = (chartTitle || "").toLowerCase();
    if (t.includes("(%)") || t.includes("accuracy") || t.includes("adherence") || t.includes("share")) {
      return `${Number.isInteger(val) ? val : val.toFixed(1)}%`;
    }
    if (t.includes("($k)")) {
      return `$${Number.isInteger(val) ? val : val.toFixed(0)}K`;
    }
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return Number.isInteger(val) ? String(val) : val.toFixed(1);
  };

  const renderMainChart = (chart: MainChartConfig) => {
    const chartEndFrame = Math.max(150, Math.floor(durationInFrames * 0.55));
    const chartProgress = interpolate(frame, [20, chartEndFrame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    if (chart.component === "Grouped_Bar_Chart" && chart.categories) {
      const maxVal = Math.max(...chart.categories.flatMap((c) => [c.budget, c.actual]), 1);
      const hasOverspent = chart.categories.some((c) => c.status === "overspent");

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
            <div style={{ display: "flex", gap: 18, fontSize: 15, color: subtextCol }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: secondary, display: "inline-block" }} />
                Draft / Static Baseline
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: accent, display: "inline-block" }} />
                Approved / Rolling Target
              </span>
              {hasOverspent && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 13, height: 13, borderRadius: 3, background: "#f87171", display: "inline-block" }} />
                  Overrun
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
            {chart.categories.map((cat, idx) => {
              const rowProgress = interpolate(frame, [25 + idx * 28, 165 + idx * 28], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const budgetWidth = Math.max(14, Math.pow(cat.budget / maxVal, 0.45) * 80) * rowProgress;
              const actualWidth = Math.max(14, Math.pow(cat.actual / maxVal, 0.45) * 80) * rowProgress;

              const vPct = cat.variance_pct ?? 0;
              const isOver = cat.status === "overspent" ? true : cat.status === "favorable" ? false : vPct > 0;
              const barColor = isOver ? "#f87171" : accent;

              return (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "185px 1fr 115px", alignItems: "center", gap: 16 }}>
                  <div style={{ color: textCol, fontSize: 17, fontWeight: 600 }}>{cat.name || (cat as any).label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, background: "rgba(255,255,255,0.04)", padding: "9px 14px", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: `${budgetWidth}%`, height: 12, background: secondary, borderRadius: 4, opacity: 0.8 }} />
                      <span style={{ color: subtextCol, fontSize: 14, fontWeight: 600 }}>
                        {formatSmartValue(cat.budget, maxVal, chart.title)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: `${actualWidth}%`,
                          height: 14,
                          background: barColor,
                          borderRadius: 4,
                          boxShadow: `0 0 ${12 * livePulse}px ${barColor}90`,
                        }}
                      />
                      <span style={{ color: textCol, fontSize: 15, fontWeight: 700 }}>
                        {formatSmartValue(cat.actual, maxVal, chart.title)}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      justifySelf: "end",
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 15,
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
      const padding = (maxDataVal - minDataVal) * 0.2 || maxDataVal * 0.15;
      const maxVal = maxDataVal + padding;
      const minVal = Math.max(0, minDataVal - padding * 0.5);

      const svgW = 860;
      const svgH = 385;
      const padL = 68;
      const padR = 38;
      const padT = 44;
      const padB = 46;
      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;

      const getXY = (idx: number, val: number) => {
        const x = padL + (idx / Math.max(months.length - 1, 1)) * plotW;
        const y = padT + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
        return { x, y };
      };

      const visibleCount = Math.max(1, Math.floor(chartProgress * months.length));
      const s1Coords = series1.slice(0, visibleCount).map((v: number, i: number) => getXY(i, v));
      const s1Pts = s1Coords.map((pt) => `${pt.x},${pt.y}`).join(" ");
      const s2Pts = series2.slice(0, visibleCount).map((v: number, i: number) => `${getXY(i, v).x},${getXY(i, v).y}`).join(" ");

      const areaPts =
        s1Coords.length > 1
          ? `${s1Coords[0].x},${padT + plotH} ${s1Pts} ${s1Coords[s1Coords.length - 1].x},${padT + plotH}`
          : "";

      const gridSteps = [minVal, minVal + (maxVal - minVal) / 3, minVal + (2 * (maxVal - minVal)) / 3, maxVal];

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
            <div style={{ display: "flex", gap: 18, fontSize: 15, color: subtextCol }}>
              <span style={{ color: s1Color, fontWeight: 700 }}>● {chart.series[0]?.name || "Series 1"}</span>
              {chart.series[1] && (
                <span style={{ color: s2Color, fontWeight: 700 }}>● {chart.series[1]?.name || "Series 2"}</span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s1Color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s1Color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {gridSteps.map((gridVal, gIdx) => {
                const y = padT + plotH - ((gridVal - minVal) / (maxVal - minVal)) * plotH;
                return (
                  <g key={gIdx}>
                    <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                    <text x={padL - 12} y={y + 5} fill={subtextCol} fontSize="14" fontWeight="600" textAnchor="end">
                      {formatSmartValue(gridVal, maxVal, chart.title)}
                    </text>
                  </g>
                );
              })}

              {areaPts && <polygon points={areaPts} fill="url(#lineAreaGrad)" />}

              {s2Pts && (
                <polyline fill="none" stroke={s2Color} strokeWidth="4" strokeDasharray="7 5" points={s2Pts} />
              )}
              {s1Pts && (
                <polyline
                  fill="none"
                  stroke={s1Color}
                  strokeWidth="5"
                  points={s1Pts}
                  style={{ filter: `drop-shadow(0 0 ${10 * livePulse}px ${s1Color})` }}
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
                const highPt = pt1.y <= pt2.y ? pt1 : pt2;

                return (
                  <g key={m}>
                    <text x={pt1.x} y={svgH - 8} fill={subtextCol} fontSize="14" fontWeight="600" textAnchor="middle">
                      {m}
                    </text>
                    {isRevealed && (
                      <>
                        {series2.length > 0 && <circle cx={pt2.x} cy={pt2.y} r={5.5} fill={s2Color} />}
                        <circle cx={pt1.x} cy={pt1.y} r={isPeak ? 8 * livePulse : 6} fill={s1Color} />
                        {isPeak && (
                          <g>
                            <rect
                              x={Math.min(svgW - 220, Math.max(padL, highPt.x - 105))}
                              y={highPt.y - 44}
                              width={210}
                              height={30}
                              rx={7}
                              fill="#0f172a"
                              stroke={s1Color}
                              strokeWidth={1.8}
                            />
                            <text
                              x={Math.min(svgW - 115, Math.max(padL + 105, highPt.x))}
                              y={highPt.y - 24}
                              fill={textCol}
                              fontSize="13.5"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
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
        </div>
      );
    }

    if (chart.component === "Donut_Chart" && chart.segments) {
      const palette = [primary, secondary, accent, "#f59e0b", "#f43f5e", "#a855f7"];
      const radius = 108;
      const circumference = 2 * Math.PI * radius;
      let accumulatedPercent = 0;

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <span style={{ color: textCol, fontSize: 22, fontWeight: 700 }}>{chart.title}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flex: 1 }}>
            <div style={{ position: "relative", width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={280} height={280} viewBox="0 0 280 280" style={{ transform: "rotate(-90deg)" }}>
                {chart.segments.map((seg, i) => {
                  const percent = seg.percentage || (seg as any).share_pct || 0;
                  const segLength = (percent / 100) * circumference * chartProgress;
                  const offset = -((accumulatedPercent / 100) * circumference);
                  accumulatedPercent += percent;
                  return (
                    <circle
                      key={i}
                      cx={140}
                      cy={140}
                      r={radius}
                      fill="transparent"
                      stroke={(seg as any).color || palette[i % palette.length]}
                      strokeWidth={34}
                      strokeDasharray={`${segLength} ${circumference}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div style={{ position: "absolute", textAlign: "center", width: "180px", padding: "0 10px" }}>
                <div style={{ color: textCol, fontSize: 23, fontWeight: 800, lineHeight: 1.25 }}>
                  {(chart as any).center_label || "100% Share"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 13, width: "54%" }}>
              {chart.segments.map((seg, i) => {
                const itemReveal = interpolate(frame, [30 + i * 24, 95 + i * 24], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const percent = seg.percentage || (seg as any).share_pct || 0;
                const segColor = (seg as any).color || palette[i % palette.length];
                const showDollarVal = seg.value >= 1000;
                return (
                  <div
                    key={i}
                    style={{
                      opacity: itemReveal,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.04)",
                      padding: "11px 16px",
                      borderRadius: 9,
                      borderLeft: `5px solid ${segColor}`,
                    }}
                  >
                    <span style={{ color: textCol, fontSize: 16.5, fontWeight: 600 }}>{seg.label || (seg as any).name}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {showDollarVal ? (
                        <span style={{ color: subtextCol, fontSize: 15 }}>
                          {seg.value >= 1000000
                            ? `$${(seg.value / 1000000).toFixed(2)}M`
                            : `$${(seg.value / 1000).toFixed(1)}K`}
                        </span>
                      ) : (
                        <span style={{ color: subtextCol, fontSize: 13, fontWeight: 600 }}>TARGET SHARE</span>
                      )}
                      <span style={{ color: segColor, fontSize: 17, fontWeight: 800 }}>{percent.toFixed(1)}%</span>
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

  if (!top_kpi_controls && !main_chart && !blueprint_steps) {
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
        padding: "38px 58px 46px 58px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: style.fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* TOP HEADER BAR */}
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
              height: 46,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${primary}, ${accent})`,
              boxShadow: `0 0 16px ${primary}`,
            }}
          />
          <div>
            <div style={{ color: primary, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {(style.companyWatermark || "DEPTCAST ENTERPRISE") + " • PREDETERMINED PLAYBOOK"}
            </div>
            <h1 style={{ color: textCol, fontSize: 33, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
              {section_header || title}
            </h1>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(15, 23, 42, 0.85)",
            border: `1px solid ${primary}55`,
            padding: "10px 20px",
            borderRadius: 30,
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 ${12 * livePulse}px ${accent}`,
            }}
          />
          <span style={{ color: textCol, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.04em" }}>
            {blueprint_meta?.blueprint_code ? `BLUEPRINT ID: ${blueprint_meta.blueprint_code}` : "LIVE TELEMETRY SYNC"}
          </span>
        </div>
      </div>

      {/* ZONE 1: TOP KPI GUARDRAILS */}
      {top_kpi_controls && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 22 }}>
          {top_kpi_controls.map((kpi, idx) => {
            const cardSpring = Math.min(
              1,
              spring({ frame: Math.max(0, frame - idx * 12), fps, config: { damping: 14, stiffness: 85 } })
            );
            const countProgress = interpolate(frame, [10 + idx * 18, 135 + idx * 18], [0, 1], {
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
                  background: "rgba(15, 23, 42, 0.82)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderTop: `4px solid ${isRed ? "#f87171" : primary}`,
                  borderRadius: 16,
                  padding: "18px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: subtextCol, fontSize: 14.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {kpi.label}
                  </span>
                  {(kpi.status_badge || kpi.traffic_light) && (
                    <span
                      style={{
                        padding: "4px 11px",
                        borderRadius: 12,
                        fontSize: 11.5,
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
                      fontSize: 40,
                      fontWeight: 800,
                      textShadow: `0 0 18px ${isRed ? "#f8717150" : primary + "50"}`,
                    }}
                  >
                    {formatCounter(kpi, countProgress)}
                  </span>
                  {kpi.variance_pct !== undefined && kpi.variance_pct !== 0 && (
                    <span style={{ color: badgeColor, fontSize: 17, fontWeight: 700 }}>
                      ({kpi.variance_pct > 0 ? `+${kpi.variance_pct}%` : `${kpi.variance_pct}%`})
                    </span>
                  )}
                </div>

                <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.08)", marginTop: 12, borderRadius: 3, overflow: "hidden" }}>
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

      {/* ZONE 2 & ZONE 3: MAIN CHART + PREDETERMINED BLUEPRINT PANEL */}
      <div style={{ display: "grid", gridTemplateColumns: "1.52fr 1fr", gap: 22, flex: 1, minHeight: 0 }}>
        <div
          style={{
            background: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: "24px 28px",
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

        {blueprint_steps ? (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.86)",
              backdropFilter: "blur(16px)",
              border: `1px solid ${primary}40`,
              borderRadius: 18,
              padding: "22px 26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    background: `${accent}25`,
                    color: accent,
                    fontSize: 12.5,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  {blueprint_meta?.phase_badge || "PREDETERMINED BLUEPRINT"}
                </span>
                <span style={{ color: subtextCol, fontSize: 13, fontWeight: 700 }}>
                  MANDATORY STEPS
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {blueprint_steps.map((step, sIdx) => {
                  const stepRevealFrame = Math.floor(durationInFrames * 0.14) + sIdx * Math.floor(durationInFrames * 0.22);
                  const stepSpring = Math.min(
                    1,
                    spring({ frame: Math.max(0, frame - stepRevealFrame), fps, config: { damping: 14, stiffness: 75 } })
                  );
                  return (
                    <div
                      key={sIdx}
                      style={{
                        opacity: stepSpring,
                        transform: `translateX(${interpolate(stepSpring, [0, 1], [28, 0])}px)`,
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        background: "rgba(255,255,255,0.045)",
                        padding: "13px 16px",
                        borderRadius: 12,
                        borderLeft: `4px solid ${sIdx === 0 ? accent : primary}`,
                      }}
                    >
                      <div
                        style={{
                          minWidth: 32,
                          height: 32,
                          borderRadius: 8,
                          background: sIdx === 0 ? `${accent}25` : `${primary}25`,
                          color: sIdx === 0 ? accent : primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 15,
                          marginTop: 2,
                        }}
                      >
                        {step.step_no}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <span style={{ color: textCol, fontSize: 16.5, fontWeight: 700 }}>{step.title}</span>
                          {step.tag && (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: "rgba(255,255,255,0.08)",
                                color: primary,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {step.tag}
                            </span>
                          )}
                        </div>
                        <span style={{ color: subtextCol, fontSize: 14, lineHeight: 1.38 }}>{step.detail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {blueprint_meta?.sla_timeline && (
              <div
                style={{
                  marginTop: 14,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: `linear-gradient(90deg, ${primary}22, ${accent}15)`,
                  border: `1px solid ${primary}65`,
                  boxShadow: `0 0 ${14 * livePulse}px ${primary}25`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ color: primary, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    BLUEPRINT SLA TIMELINE
                  </div>
                  <div style={{ color: textCol, fontSize: 15.5, fontWeight: 700 }}>{blueprint_meta.sla_timeline}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: subtextCol, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    GOVERNANCE OWNER
                  </div>
                  <div style={{ color: accent, fontSize: 15, fontWeight: 700 }}>{blueprint_meta.owner_role}</div>
                </div>
              </div>
            )}
          </div>
        ) : side_insight_panel ? (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(16px)",
              border: `1px solid ${primary}35`,
              borderRadius: 18,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: `${primary}25`,
                    color: primary,
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  AI INSIGHT ENGINE
                </span>
                <span style={{ color: textCol, fontSize: 21, fontWeight: 700 }}>{side_insight_panel.headline}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {side_insight_panel.bullets.map((bullet, bIdx) => {
                  const bulletRevealFrame = Math.floor(durationInFrames * 0.15) + bIdx * Math.floor(durationInFrames * 0.22);
                  const bulletSpring = Math.min(
                    1,
                    spring({ frame: Math.max(0, frame - bulletRevealFrame), fps, config: { damping: 14, stiffness: 70 } })
                  );
                  return (
                    <div
                      key={bIdx}
                      style={{
                        opacity: bulletSpring,
                        transform: `translateX(${interpolate(bulletSpring, [0, 1], [30, 0])}px)`,
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        background: "rgba(255,255,255,0.04)",
                        padding: "14px 16px",
                        borderRadius: 12,
                        borderLeft: `4px solid ${bIdx === 0 ? primary : accent}`,
                      }}
                    >
                      <span style={{ color: primary, fontWeight: 800, fontSize: 18 }}>▸</span>
                      <span style={{ color: textCol, fontSize: 16.5, lineHeight: 1.42 }}>{bullet}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {side_insight_panel.recommendation_badge && (
              <div
                style={{
                  marginTop: 18,
                  padding: "15px 18px",
                  borderRadius: 14,
                  background: `linear-gradient(90deg, ${accent}20, ${primary}15)`,
                  border: `1px solid ${accent}70`,
                  boxShadow: `0 0 ${14 * livePulse}px ${accent}30`,
                }}
              >
                <div style={{ color: accent, fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  STRATEGIC RECOMMENDATION
                </div>
                <div style={{ color: textCol, fontSize: 15.5, fontWeight: 600, lineHeight: 1.35 }}>
                  {side_insight_panel.recommendation_badge}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};