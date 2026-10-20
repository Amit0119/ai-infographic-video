// ============================================================
// Storyboard & Scene Type Definitions
// ============================================================
export interface SceneStyle {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  fontFamily: string;
  currencySymbol?: string;
  companyWatermark?: string;
  videoOverlayColor?: string;
}

// ── 3-Zone Executive Dashboard Sub-Types ─────────────────────

export interface TopKPIControl {
  component: string;
  label: string;
  value: number | string;
  display_value?: string;
  prefix?: string;
  unit?: string;
  variance_pct?: number;
  status_badge?: string;
  traffic_light?: "green" | "red" | "amber";
}

export interface MainChartConfig {
  component: "Grouped_Bar_Chart" | "Multi_Line_Trend_Chart" | "Donut_Chart" | string;
  title: string;
  animation_style?: string;
  categories?: {
    name: string;
    budget: number;
    actual: number;
    variance_pct: number;
    status: "favorable" | "overspent";
  }[];
  x_axis?: string[];
  series?: {
    name: string;
    data: number[];
  }[];
  annotations?: {
    month: string;
    value: number;
    label: string;
  }[];
  segments?: {
    label: string;
    value: number;
    percentage: number;
  }[];
}

export interface SideInsightPanel {
  component?: string;
  headline: string;
  bullets: string[];
  recommendation_badge?: string;
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

export interface ChartData {
  label: string;
  value: number;
}

export interface BarChartSceneProps {
  title: string;
  chart_data: ChartData[];
  color?: string;
  style: SceneStyle;
}

export interface LineChartSceneProps {
  title: string;
  chart_data: ChartData[];
  targetItems?: ChartData[];
  color?: string;
  style: SceneStyle;
}

export interface PieChartSceneProps {
  title: string;
  chart_data: ChartData[];
  style: SceneStyle;
}

export interface TimelineSceneProps {
  title: string;
  chart_data: ChartData[];
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

export interface BulletPointsSceneProps {
  heading: string;
  content_points: string[];
  style: SceneStyle;
}

export interface NumberedStepsSceneProps {
  heading: string;
  content_points: string[];
  style: SceneStyle;
}

export interface HeatMapSceneProps {
  heading: string;
  chart_data: { label: string; value: number }[];
  style: SceneStyle;
}

export interface HierarchyPyramidSceneProps {
  heading: string;
  content_points: string[];
  style: SceneStyle;
}

export interface SplitScreenSceneProps {
  title: string;
  left_content: string;
  right_content: string;
  style: SceneStyle;
}

export interface DashboardUISceneProps {
  title: string;
  section_header?: string;
  chart_data?: { label: string; value: number }[];
  top_kpi_controls?: TopKPIControl[];
  main_chart?: MainChartConfig;
  side_insight_panel?: SideInsightPanel;
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
  data_points?: string[];
}

export interface BarChartSceneData {
  id: number;
  type: "bar_chart";
  durationInSeconds: number;
  title: string;
  chart_data: ChartData[];
  color?: string;
}

export interface LineChartSceneData {
  id: number;
  type: "line_chart";
  durationInSeconds: number;
  title: string;
  chart_data: ChartData[];
  targetItems?: ChartData[];
  color?: string;
}

export interface PieChartSceneData {
  id: number;
  type: "pie_chart";
  durationInSeconds: number;
  title: string;
  chart_data: ChartData[];
}

export interface TimelineSceneData {
  id: number;
  type: "timeline";
  durationInSeconds: number;
  title: string;
  chart_data: ChartData[];
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
  data_points?: string[];
}

export interface BulletPointsSceneData {
  id: number;
  type: "bullet_points";
  durationInSeconds: number;
  heading: string;
  content_points: string[];
}

export interface NumberedStepsSceneData {
  id: number;
  type: "numbered_steps";
  durationInSeconds: number;
  heading: string;
  content_points: string[];
}

export interface DashboardUISceneData {
  id: number;
  type: "dashboard_ui";
  durationInSeconds: number;
  title: string;
  section_header?: string;
  chart_data?: { label: string; value: number }[];
  top_kpi_controls?: TopKPIControl[];
  main_chart?: MainChartConfig;
  side_insight_panel?: SideInsightPanel;
  data_points?: string[];
}

export interface HeatMapSceneData {
  id: number;
  type: "heat_map";
  durationInSeconds: number;
  heading: string;
  chart_data: { label: string; value: number }[];
  data_points?: string[];
}

export interface HierarchyPyramidSceneData {
  id: number;
  type: "hierarchy_pyramid";
  durationInSeconds: number;
  heading: string;
  content_points: string[];
  data_points?: string[];
}

export interface SplitScreenSceneData {
  id: number;
  type: "split_screen";
  durationInSeconds: number;
  title: string;
  left_content: string;
  right_content: string;
  data_points?: string[];
}

export type StoryboardScene = (
  | TitleSceneData
  | KPISceneData
  | BarChartSceneData
  | LineChartSceneData
  | PieChartSceneData
  | TimelineSceneData
  | HighlightSceneData
  | ComparisonSceneData
  | BulletPointsSceneData
  | NumberedStepsSceneData
  | DashboardUISceneData
  | HeatMapSceneData
  | HierarchyPyramidSceneData
  | SplitScreenSceneData
) & {
  narration?: string;
  captions?: { word: string; start: number; end: number }[];
  chart_data?: { label: string; value: number | string }[];
  brollUrl?: string;
  left_content?: string;
  right_content?: string;
};

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