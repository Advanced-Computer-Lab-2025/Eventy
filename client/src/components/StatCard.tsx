import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  valueColor?: string;
  iconColor?: string;
  titleColor?: string;
  themed?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  valueColor = "text-gray-900",
  iconColor = "text-gray-600",
  titleColor,
  themed = false,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <div>
            <p
              className={`text-sm ${titleColor || "text-muted-foreground"} mb-1 dark:text-muted-foreground`}
            >
              {title}
            </p>
            <p
              className={`text-3xl font-bold mb-1 ${themed ? "text-foreground" : valueColor}`}
              data-testid="text-stat-value"
            >
              {value}
            </p>
            {description && (
              <p
                className={`text-xs ${themed ? "text-muted-foreground" : "text-gray-500"}`}
              >
                {description}
              </p>
            )}
            {trend && (
              <p
                className={`text-sm mt-2 flex items-center gap-1 ${
                  trend.isPositive
                    ? "text-green-500 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </p>
            )}
          </div>
          <div className="absolute top-0 right-0">
            <Icon
              className={`h-4 w-4 ${themed ? "text-muted-foreground" : iconColor}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
