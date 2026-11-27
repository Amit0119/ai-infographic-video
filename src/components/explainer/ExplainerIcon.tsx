import React from "react";
import {
  Award,
  Bell,
  Briefcase,
  Calendar,
  CalendarCheck,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock,
  FileText,
  HeartPulse,
  House,
  Laptop,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "calendar-check": CalendarCheck,
  calendar: Calendar,
  sun: Sun,
  "heart-pulse": HeartPulse,
  send: Send,
  "check-circle": CircleCheck,
  "shield-check": ShieldCheck,
  home: House,
  laptop: Laptop,
  clock: Clock,
  users: Users,
  briefcase: Briefcase,
  "file-text": FileText,
  bell: Bell,
  mail: Mail,
  "alert-circle": CircleAlert,
  award: Award,
  lock: Lock,
  "help-circle": CircleHelp,
  sparkles: Sparkles,
};

interface ExplainerIconProps {
  name?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const ExplainerIcon: React.FC<ExplainerIconProps> = ({
  name,
  size = 48,
  color = "#2563EB",
  strokeWidth = 2.2,
}) => {
  const key = (name || "").trim().toLowerCase().replace(/_/g, "-");
  const IconComponent = ICON_MAP[key] || Sparkles;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
};