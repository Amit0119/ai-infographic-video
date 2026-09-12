// ============================================================
// Storyboard & Scene Type Definitions
// ============================================================
// These types define the contract between the AI-generated
// storyboard JSON and the Remotion visual component library.
// ============================================================

/** Shared style/theme configuration passed to every scene.
 *  Keys match the backend JSON output exactly — no mapping needed.
 */
export interface SceneStyle {
  backgroundColor: string; // e.g. "#0f172a"
  primaryColor: string;    // e.g. "#38bdf8"
  secondaryColor: string;  // e.g. "#818cf8"
  accentColor: string;     // e.g. "#34d399"
  textColor: string;       // e.g. "#ffffff"
  subtextColor: string;    // e.g. "#94a3b8"
  fontFamily: string;      // e.g. "Inter"
  currencySymbol?: string; // e.g. "₹", "$", "€" — used by HighlightCard
  companyWatermark?: string; // e.g. "ACME Corp"
}

// ── Scene Prop Interfaces ────────────────────────────────────

export interface TitleSceneProps {
  title: string;
  subtitle?: string;
  style: SceneStyle;
}

export interface KPISceneProps {
  metric: string;
  value: number;
  unit: string;
  prefix?: string;
  growth: number;
  growthLabel?: string;
  style: SceneStyle;
}

export interface BarChartItem {
  name: string;
  value: number;
}

export interface BarChartSceneProps {
  title: string;
  items: BarChartItem[];
  color?: string;
  style: SceneStyle;
}

export interface LineChartItem {
  name: string;
  value: number;
}

export interface LineChartSceneProps {
  title: string;
  items: LineChartItem[];
  targetItems?: LineChartItem[];
  color?: string;
  style: SceneStyle;
}

export interface HighlightSceneProps {
  metric: string;
  value: number;
  unit: string;
  prefix?: string;
  badge: string;
  achievement: number;
  variance: number;
  sentiment: "positive" | "negative";
  style: SceneStyle;
}

export interface ComparisonItem {
  name: string;
  actual: number;
  target: number;
}

export interface ComparisonSceneProps {
  title: string;
  items: ComparisonItem[];
  style: SceneStyle;
}

// ── Storyboard Scene Definitions ─────────────────────────────

export interface TitleSceneData {
  id: number;
  type: "title";
  durationInSeconds: number;
  title: string;
  subtitle?: string;
}

export interface KPISceneData {
  id: number;
  type: "kpi";
  durationInSeconds: number;
  metric: string;
  value: number;
  unit: string;
  prefix?: string;
  growth: number;
  growthLabel?: string;
}

export interface BarChartSceneData {
  id: number;
  type: "bar_chart";
  durationInSeconds: number;
  title: string;
  items: BarChartItem[];
  color?: string;
}

export interface LineChartSceneData {
  id: number;
  type: "line_chart";
  durationInSeconds: number;
  title: string;
  items: LineChartItem[];
  targetItems?: LineChartItem[];
  color?: string;
}

export interface HighlightSceneData {
  id: number;
  type: "highlight";
  durationInSeconds: number;
  metric: string;
  value: number;
  unit: string;
  prefix?: string;
  badge: string;
  achievement: number;
  variance: number;
  sentiment: "positive" | "negative";
}

export interface ComparisonSceneData {
  id: number;
  type: "comparison";
  durationInSeconds: number;
  title: string;
  items: ComparisonItem[];
}

/** Union of all possible scene types in a storyboard. */
export type StoryboardScene = (
  | TitleSceneData
  | KPISceneData
  | BarChartSceneData
  | LineChartSceneData
  | HighlightSceneData
  | ComparisonSceneData
) & { narration?: string; };

// ── Root Storyboard Type ─────────────────────────────────────

export interface Storyboard {
  video: {
    title: string;
    duration: number;
    audience: string;
    fps: number;
    width: number;
    height: number;
  };
  style: SceneStyle;
  scenes: StoryboardScene[];
}
