"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  RotateCcw,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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
import type {
  ClientComplianceHistory,
  ComplianceLevel,
  ComplianceBreakdown,
} from "@gcmc-kaj/types";

interface ClientComplianceTrackingProps {
  clientId: number;
  complianceHistory: ClientComplianceHistory[];
  currentCompliance?: ClientComplianceHistory;
  onRefreshCompliance?: () => void;
  className?: string;
}

interface ComplianceCategory {
  name: string;
  score: number;
  maxScore: number;
  status: "excellent" | "good" | "warning" | "critical";
  items: ComplianceItem[];
}

interface ComplianceItem {
  id: string;
  name: string;
  status: "compliant" | "pending" | "overdue" | "expired";
  dueDate?: Date;
  lastUpdated: Date;
  description?: string;
}

const COMPLIANCE_COLORS = {
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    chart: "#22c55e",
  },
  amber: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
    chart: "#f59e0b",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    chart: "#ef4444",
  },
};

const STATUS_COLORS = {
  excellent: "text-green-600",
  good: "text-blue-600",
  warning: "text-yellow-600",
  critical: "text-red-600",
};

const ITEM_STATUS_COLORS = {
  compliant: "bg-green-100 text-green-800",
  pending: "bg-blue-100 text-blue-800",
  overdue: "bg-orange-100 text-orange-800",
  expired: "bg-red-100 text-red-800",
};

export function ClientComplianceTracking({
  clientId,
  complianceHistory,
  currentCompliance,
  onRefreshCompliance,
  className,
}: ClientComplianceTrackingProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"3m" | "6m" | "1y" | "all">("6m");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["overview"]));
  const [searchQuery, setSearchQuery] = useState("");

  // Generate mock compliance categories for demonstration
  const complianceCategories: ComplianceCategory[] = useMemo(() => {
    return [
      {
        name: "Tax Compliance",
        score: 85,
        maxScore: 100,
        status: "good",
        items: [
          {
            id: "1",
            name: "VAT Returns",
            status: "compliant",
            dueDate: new Date("2024-01-31"),
            lastUpdated: new Date("2024-01-15"),
            description: "Monthly VAT returns filed on time",
          },
          {
            id: "2",
            name: "Corporate Tax",
            status: "pending",
            dueDate: new Date("2024-03-31"),
            lastUpdated: new Date("2024-02-01"),
            description: "Annual corporate tax return in progress",
          },
        ],
      },
      {
        name: "Regulatory Compliance",
        score: 92,
        maxScore: 100,
        status: "excellent",
        items: [
          {
            id: "3",
            name: "Business License",
            status: "compliant",
            dueDate: new Date("2024-12-31"),
            lastUpdated: new Date("2024-01-01"),
            description: "Business license renewed annually",
          },
          {
            id: "4",
            name: "EPA Permits",
            status: "compliant",
            dueDate: new Date("2024-06-30"),
            lastUpdated: new Date("2024-01-15"),
            description: "Environmental permits up to date",
          },
        ],
      },
      {
        name: "Labor Compliance",
        score: 78,
        maxScore: 100,
        status: "warning",
        items: [
          {
            id: "5",
            name: "NIS Contributions",
            status: "overdue",
            dueDate: new Date("2024-01-15"),
            lastUpdated: new Date("2024-01-01"),
            description: "National Insurance contributions overdue",
          },
          {
            id: "6",
            name: "Work Permits",
            status: "compliant",
            dueDate: new Date("2024-08-31"),
            lastUpdated: new Date("2024-01-10"),
            description: "Employee work permits valid",
          },
        ],
      },
      {
        name: "Financial Compliance",
        score: 65,
        maxScore: 100,
        status: "critical",
        items: [
          {
            id: "7",
            name: "Audit Reports",
            status: "expired",
            dueDate: new Date("2023-12-31"),
            lastUpdated: new Date("2023-11-15"),
            description: "Annual audit report overdue",
          },
          {
            id: "8",
            name: "Financial Statements",
            status: "pending",
            dueDate: new Date("2024-03-31"),
            lastUpdated: new Date("2024-02-01"),
            description: "Annual financial statements in preparation",
          },
        ],
      },
    ];
  }, []);

  // Filter compliance history based on selected period
  const filteredHistory = useMemo(() => {
    if (selectedPeriod === "all") return complianceHistory;

    const now = new Date();
    let cutoffDate: Date;

    switch (selectedPeriod) {
      case "3m":
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "6m":
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case "1y":
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        cutoffDate = new Date(0);
    }

    return complianceHistory.filter(
      (item) => new Date(item.assessmentDate) >= cutoffDate
    );
  }, [complianceHistory, selectedPeriod]);

  // Chart data for trends
  const trendData = useMemo(() => {
    return filteredHistory.map((item) => ({
      date: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(new Date(item.assessmentDate)),
      score: item.score,
      level: item.level,
    }));
  }, [filteredHistory]);

  // Category breakdown data for chart
  const categoryData = useMemo(() => {
    return complianceCategories.map((category) => ({
      name: category.name,
      score: category.score,
      maxScore: category.maxScore,
      percentage: (category.score / category.maxScore) * 100,
    }));
  }, [complianceCategories]);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const getComplianceLevelColor = (level: ComplianceLevel): keyof typeof COMPLIANCE_COLORS => {
    switch (level) {
      case "green":
        return "green";
      case "amber":
        return "amber";
      case "red":
        return "red";
      default:
        return "amber";
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const getStatusIcon = (status: ComplianceItem["status"]) => {
    switch (status) {
      case "compliant":
        return CheckCircle;
      case "pending":
        return Clock;
      case "overdue":
        return AlertCircle;
      case "expired":
        return XCircle;
      default:
        return Clock;
    }
  };

  const calculateOverallScore = (): number => {
    const totalScore = complianceCategories.reduce((sum, cat) => sum + cat.score, 0);
    const totalMaxScore = complianceCategories.reduce((sum, cat) => sum + cat.maxScore, 0);
    return Math.round((totalScore / totalMaxScore) * 100);
  };

  const overallScore = calculateOverallScore();
  const currentLevel = currentCompliance?.level ||
    (overallScore >= 80 ? "green" : overallScore >= 60 ? "amber" : "red");

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header and Controls */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-lg font-semibold">Compliance Tracking</h2>
            <p className="text-sm text-muted-foreground">
              Monitor compliance status with visual progress indicators and alerts
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
            {onRefreshCompliance && (
              <Button variant="outline" size="sm" onClick={onRefreshCompliance}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Overall Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Compliance Score</span>
              <Badge
                variant="secondary"
                className={cn(
                  COMPLIANCE_COLORS[getComplianceLevelColor(currentLevel)].bg,
                  COMPLIANCE_COLORS[getComplianceLevelColor(currentLevel)].text,
                  COMPLIANCE_COLORS[getComplianceLevelColor(currentLevel)].border
                )}
              >
                {currentLevel.toUpperCase()} LEVEL
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{overallScore}%</div>
                <p className="text-sm text-muted-foreground">Current Score</p>
              </div>
              <div className="flex-1">
                <Progress
                  value={overallScore}
                  className="h-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center text-sm">
                  {overallScore >= (currentCompliance?.score || 0) ? (
                    <>
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-green-600">Improving</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                      <span className="text-red-600">Declining</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Trend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score Trend</CardTitle>
            <CardDescription>
              Historical compliance performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: any) => [`${value}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Categories</CardTitle>
            <CardDescription>
              Detailed breakdown by compliance area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, "Score"]}
                />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Categories */}
        <div className="space-y-4">
          {complianceCategories.map((category) => (
            <Card key={category.name}>
              <Collapsible
                open={expandedCategories.has(category.name)}
                onOpenChange={() => toggleCategory(category.name)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {expandedCategories.has(category.name) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div>
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          <CardDescription>
                            {category.items.length} compliance items
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">
                            {category.score}/{category.maxScore}
                          </div>
                          <div className={cn("text-sm font-medium", STATUS_COLORS[category.status])}>
                            {category.status.toUpperCase()}
                          </div>
                        </div>
                        <Progress
                          value={(category.score / category.maxScore) * 100}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      {category.items
                        .filter((item) =>
                          !searchQuery ||
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => {
                          const StatusIcon = getStatusIcon(item.status);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <StatusIcon
                                  className={cn(
                                    "h-5 w-5",
                                    item.status === "compliant" && "text-green-600",
                                    item.status === "pending" && "text-blue-600",
                                    item.status === "overdue" && "text-orange-600",
                                    item.status === "expired" && "text-red-600"
                                  )}
                                />
                                <div>
                                  <h4 className="font-medium">{item.name}</h4>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <Badge
                                  variant="secondary"
                                  className={ITEM_STATUS_COLORS[item.status]}
                                >
                                  {item.status.replace("_", " ").toUpperCase()}
                                </Badge>
                                {item.dueDate && (
                                  <div className="text-xs text-muted-foreground">
                                    Due: {formatDate(item.dueDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common compliance management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Run Assessment</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Calendar className="h-6 w-6 text-green-600" />
                <span className="text-sm">Schedule Review</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <span className="text-sm">View Alerts</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <CheckCircle className="h-6 w-6 text-purple-600" />
                <span className="text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}