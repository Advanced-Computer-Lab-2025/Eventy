import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  valueColor?: string;
  iconColor?: string;
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
  valueColor = "text-foreground", 
  iconColor = "text-muted-foreground",
  trend 
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <div>
            <p className="text-sm text-foreground mb-1">{title}</p>
            <p className={`text-3xl font-bold mb-1 ${valueColor}`} data-testid="text-stat-value">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${
                trend.isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
              }`}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </p>
            )}
          </div>
          <div className="absolute top-0 right-0">
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
