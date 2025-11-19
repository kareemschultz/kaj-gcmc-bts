"use client";

import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Download,
  FileCheck,
  Filter,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ClientAnalytics } from "@gcmc-kaj/types";

interface ClientPerformanceAnalyticsProps {
  clientId: number;
  analytics: ClientAnalytics;
  onExportReport?: (format: "pdf" | "excel" | "csv") => void;
  className?: string;
}

interface KPIMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  target?: number;
  format: "number" | "percentage" | "currency" | "days";
  trend: "up" | "down" | "neutral";
  status: "excellent" | "good" | "warning" | "critical";
  icon: React.ComponentType<{ className?: string }>;
}

const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  gray: "#6b7280",
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
];

export function ClientPerformanceAnalytics({
  clientId,
  analytics,
  onExportReport,
  className,
}: ClientPerformanceAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"3m" | "6m" | "1y" | "all">("6m");
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "compliance" | "efficiency">("revenue");

  // Generate KPI metrics based on analytics data
  const kpiMetrics: KPIMetric[] = useMemo(() => {
    return [
      {
        id: "revenue",
        label: "Revenue Generated",
        value: analytics.revenueGenerated,
        previousValue: analytics.revenueGenerated * 0.85, // Simulate previous period
        target: analytics.revenueGenerated * 1.2,
        format: "currency",
        trend: "up",
        status: "excellent",
        icon: DollarSign,
      },
      {
        id: "compliance",
        label: "Compliance Score",
        value: analytics.complianceScore,
        previousValue: analytics.complianceScore - 5,
        target: 95,
        format: "percentage",
        trend: "up",
        status: analytics.complianceScore >= 90 ? "excellent" : analytics.complianceScore >= 80 ? "good" : "warning",
        icon: FileCheck,
      },
      {
        id: "response_time",
        label: "Avg Response Time",
        value: analytics.averageResponseTime,
        previousValue: analytics.averageResponseTime + 0.5,
        target: 2,
        format: "days",
        trend: "down",
        status: analytics.averageResponseTime <= 2 ? "excellent" : analytics.averageResponseTime <= 4 ? "good" : "warning",
        icon: Clock,
      },
      {
        id: "on_time_filings",
        label: "On-Time Filings",
        value: analytics.performance.onTimeFilings,
        previousValue: analytics.performance.onTimeFilings - 5,
        target: 100,
        format: "percentage",
        trend: "up",
        status: analytics.performance.onTimeFilings >= 95 ? "excellent" : analytics.performance.onTimeFilings >= 85 ? "good" : "warning",
        icon: Calendar,
      },
      {
        id: "satisfaction",
        label: "Satisfaction Score",
        value: analytics.satisfactionScore || 85,
        previousValue: (analytics.satisfactionScore || 85) - 3,
        target: 90,
        format: "percentage",
        trend: "up",
        status: (analytics.satisfactionScore || 85) >= 90 ? "excellent" : (analytics.satisfactionScore || 85) >= 80 ? "good" : "warning",
        icon: Star,
      },
      {
        id: "outstanding_fees",
        label: "Outstanding Fees",
        value: analytics.outstandingFees,
        previousValue: analytics.outstandingFees * 1.2,
        target: 0,
        format: "currency",
        trend: "down",
        status: analytics.outstandingFees === 0 ? "excellent" : analytics.outstandingFees < 1000 ? "good" : "warning",
        icon: Target,
      },
    ];
  }, [analytics]);

  // Generate time-series data for charts
  const timeSeriesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.slice(0, 6).map((month, index) => ({
      month,
      revenue: analytics.revenueGenerated * (0.8 + Math.random() * 0.4),
      compliance: Math.max(60, analytics.complianceScore - 10 + Math.random() * 20),
      filings: Math.max(5, analytics.totalFilings * (0.8 + Math.random() * 0.4)),
      responseTime: Math.max(1, analytics.averageResponseTime * (0.8 + Math.random() * 0.4)),
    }));
  }, [analytics]);

  // Service distribution data
  const serviceDistributionData = useMemo(() => {
    return [
      { name: "Tax Services", value: 35, color: CHART_COLORS.primary },
      { name: "Compliance", value: 25, color: CHART_COLORS.secondary },
      { name: "Consulting", value: 20, color: CHART_COLORS.success },
      { name: "Documentation", value: 15, color: CHART_COLORS.warning },
      { name: "Other", value: 5, color: CHART_COLORS.info },
    ];
  }, []);

  // Risk assessment data
  const riskAssessmentData = useMemo(() => {
    return [
      {
        category: "Financial",
        score: analytics.riskAssessment.score,
        maxScore: 100,
        status: analytics.riskAssessment.score >= 80 ? "low" : analytics.riskAssessment.score >= 60 ? "medium" : "high",
      },
      {
        category: "Compliance",
        score: analytics.complianceScore,
        maxScore: 100,
        status: analytics.complianceScore >= 80 ? "low" : analytics.complianceScore >= 60 ? "medium" : "high",
      },
      {
        category: "Operational",
        score: analytics.performance.serviceQuality,
        maxScore: 100,
        status: analytics.performance.serviceQuality >= 80 ? "low" : analytics.performance.serviceQuality >= 60 ? "medium" : "high",
      },
    ];
  }, [analytics]);

  const formatValue = (value: number, format: KPIMetric["format"]): string => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "days":
        return `${value.toFixed(1)} days`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateTrend = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change > 0,
    };
  };

  const getStatusColor = (status: KPIMetric["status"]): string => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header and Controls */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-lg font-semibold">Performance Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod as any}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            {onExportReport && (
              <Button variant="outline" size="sm" onClick={() => onExportReport("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiMetrics.map((metric) => {
            const Icon = metric.icon;
            const trend = calculateTrend(metric.value, metric.previousValue);
            const TrendIcon = trend.isPositive ? TrendingUp : TrendingDown;

            return (
              <Card key={metric.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatValue(metric.value, metric.format)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <TrendIcon
                          className={cn(
                            "h-4 w-4",
                            trend.isPositive && metric.trend === "up" ? "text-green-600" :
                            trend.isPositive && metric.trend === "down" ? "text-red-600" :
                            !trend.isPositive && metric.trend === "up" ? "text-red-600" :
                            "text-green-600"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            trend.isPositive && metric.trend === "up" ? "text-green-600" :
                            trend.isPositive && metric.trend === "down" ? "text-red-600" :
                            !trend.isPositive && metric.trend === "up" ? "text-red-600" :
                            "text-green-600"
                          )}
                        >
                          {trend.percentage.toFixed(1)}%
                        </span>
                        <span className="text-sm text-muted-foreground">vs previous</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Icon className={cn("h-8 w-8", getStatusColor(metric.status))} />
                      <Badge
                        variant={metric.status === "excellent" ? "default" :
                               metric.status === "good" ? "secondary" :
                               metric.status === "warning" ? "outline" : "destructive"}
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                  {metric.target && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress to target</span>
                        <span>{formatValue(metric.target, metric.format)}</span>
                      </div>
                      <Progress
                        value={Math.min((metric.value / metric.target) * 100, 100)}
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Key metrics over time
                </CardDescription>
              </div>
              <Select value={selectedMetric} onValueChange={setSelectedMetric as any}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              {selectedMetric === "revenue" && (
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [formatValue(value, "currency"), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              )}
              {selectedMetric === "compliance" && (
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)}%`, "Compliance Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="compliance"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.secondary, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              )}
              {selectedMetric === "efficiency" && (
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)} days`, "Response Time"]}
                  />
                  <Bar dataKey="responseTime" fill={CHART_COLORS.info} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution and Risk Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Service Distribution</CardTitle>
              <CardDescription>
                Breakdown of services provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={serviceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {serviceDistributionData.map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: service.color }}
                      />
                      <span className="text-sm">{service.name}</span>
                    </div>
                    <span className="text-sm font-medium">{service.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Risk levels across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {riskAssessmentData.map((risk) => (
                  <div key={risk.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{risk.category} Risk</span>
                      <Badge
                        variant={
                          risk.status === "low" ? "default" :
                          risk.status === "medium" ? "secondary" : "destructive"
                        }
                      >
                        {risk.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Progress
                        value={(risk.score / risk.maxScore) * 100}
                        className={cn(
                          "h-3",
                          risk.status === "low" && "[&>*]:bg-green-500",
                          risk.status === "medium" && "[&>*]:bg-yellow-500",
                          risk.status === "high" && "[&>*]:bg-red-500"
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{risk.score}/{risk.maxScore}</span>
                        <span>{((risk.score / risk.maxScore) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Overall assessment and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {analytics.complianceScore >= 80 && (
                    <li>• High compliance score indicates strong regulatory adherence</li>
                  )}
                  {analytics.performance.onTimeFilings >= 90 && (
                    <li>• Excellent on-time filing record</li>
                  )}
                  {analytics.averageResponseTime <= 3 && (
                    <li>• Quick response times demonstrate efficiency</li>
                  )}
                  {analytics.outstandingFees === 0 && (
                    <li>• No outstanding fees shows good financial management</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {analytics.complianceScore < 80 && (
                    <li>• Compliance score could be improved with better documentation</li>
                  )}
                  {analytics.averageResponseTime > 5 && (
                    <li>• Response time should be reduced for better service</li>
                  )}
                  {analytics.outstandingFees > 0 && (
                    <li>• Outstanding fees should be addressed promptly</li>
                  )}
                  {analytics.performance.overdueItems > 0 && (
                    <li>• Focus on reducing overdue items</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}