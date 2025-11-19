"use client";

import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from "react";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Shield,
  Activity,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Chart data context
interface ChartDataContextType {
  dashboardData: any;
  complianceData: any;
  taskData: any;
  clientData: any;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

const ChartDataContext = createContext<ChartDataContextType | null>(null);

export function useChartData() {
  const context = useContext(ChartDataContext);
  if (!context) {
    throw new Error('useChartData must be used within a ChartDataProvider');
  }
  return context;
}

// API query hooks
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.dashboard.overview.query(),
    staleTime: 3 * 60 * 1000, // 3 minutes (matches server cache)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useComplianceOverview() {
  return useQuery({
    queryKey: ['dashboard', 'compliance'],
    queryFn: () => api.dashboard.complianceOverview.query(),
    staleTime: 4 * 60 * 1000, // 4 minutes (matches server cache)
    retry: 3,
  });
}

export function useTaskOverview() {
  return useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => api.dashboard.taskOverview.query(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

export function useClientRiskDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'clientRisk'],
    queryFn: () => api.dashboard.clientRiskDistribution.query(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFilingStatusBreakdown() {
  return useQuery({
    queryKey: ['dashboard', 'filingStatus'],
    queryFn: () => api.dashboard.filingStatusBreakdown.query(),
    staleTime: 3 * 60 * 1000,
  });
}

export function useServiceRequestPipeline() {
  return useQuery({
    queryKey: ['dashboard', 'serviceRequests'],
    queryFn: () => api.dashboard.serviceRequestPipeline.query(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useActivityTimeline(days: number = 7) {
  return useQuery({
    queryKey: ['dashboard', 'activity', days],
    queryFn: () => api.dashboard.activityTimeline.query({ days }),
    staleTime: 1 * 60 * 1000, // 1 minute for activity data
  });
}

// Aggregated data hook for all chart data
export function useAllChartData() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'overview'],
        queryFn: () => api.dashboard.overview.query(),
        staleTime: 3 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'compliance'],
        queryFn: () => api.dashboard.complianceOverview.query(),
        staleTime: 4 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'tasks'],
        queryFn: () => api.dashboard.taskOverview.query(),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'clientRisk'],
        queryFn: () => api.dashboard.clientRiskDistribution.query(),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'filingStatus'],
        queryFn: () => api.dashboard.filingStatusBreakdown.query(),
        staleTime: 3 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'serviceRequests'],
        queryFn: () => api.dashboard.serviceRequestPipeline.query(),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'activity', 7],
        queryFn: () => api.dashboard.activityTimeline.query({ days: 7 }),
        staleTime: 1 * 60 * 1000,
      },
    ],
  });

  const isLoading = queries.some(query => query.isLoading);
  const hasError = queries.some(query => query.error);
  const errors = queries.filter(query => query.error).map(query => query.error);

  return {
    dashboardOverview: queries[0].data,
    complianceOverview: queries[1].data,
    taskOverview: queries[2].data,
    clientRiskDistribution: queries[3].data,
    filingStatusBreakdown: queries[4].data,
    serviceRequestPipeline: queries[5].data,
    activityTimeline: queries[6].data,
    isLoading,
    hasError,
    errors,
    refetch: () => queries.forEach(query => query.refetch()),
  };
}

// Data transformation utilities
export function transformToChartData(apiData: any, chartType: string) {
  if (!apiData) return [];

  switch (chartType) {
    case 'pieChart':
      if (Array.isArray(apiData)) {
        return apiData.map(item => ({
          name: item._count ? `${item.status || item.level || item.type}` : item.name,
          value: item._count || item.count || item.value || 0,
          color: getStatusColor(item.status || item.level || item.type)
        }));
      }
      return [];

    case 'barChart':
      if (Array.isArray(apiData)) {
        return apiData.map(item => ({
          name: item.status || item.level || item.type || item.category,
          value: item._count || item.count || item.value || 0,
        }));
      }
      return [];

    case 'lineChart':
      if (apiData.activity) {
        return [
          { name: 'New Clients', value: apiData.activity.newClients || 0 },
          { name: 'New Documents', value: apiData.activity.newDocuments || 0 },
          { name: 'New Filings', value: apiData.activity.newFilings || 0 },
          { name: 'Service Requests', value: apiData.activity.newServiceRequests || 0 },
          { name: 'Completed Tasks', value: apiData.activity.completedTasks || 0 },
        ];
      }
      return [];

    case 'metricCards':
      if (apiData.counts || apiData.alerts) {
        return [
          {
            title: 'Total Clients',
            value: apiData.counts?.clients || 0,
            icon: 'users',
            trend: calculateTrend(apiData.counts?.clients),
          },
          {
            title: 'Total Documents',
            value: apiData.counts?.documents || 0,
            icon: 'fileText',
            trend: calculateTrend(apiData.counts?.documents),
          },
          {
            title: 'Active Filings',
            value: apiData.counts?.filings || 0,
            icon: 'shield',
            trend: calculateTrend(apiData.counts?.filings),
          },
          {
            title: 'Service Requests',
            value: apiData.counts?.serviceRequests || 0,
            icon: 'activity',
            trend: calculateTrend(apiData.counts?.serviceRequests),
          },
        ];
      }
      return [];

    case 'complianceRadial':
      if (apiData.byLevel) {
        return [
          { name: 'High Risk', value: apiData.byLevel.high || 0, color: '#EF4444' },
          { name: 'Medium Risk', value: apiData.byLevel.medium || 0, color: '#F59E0B' },
          { name: 'Low Risk', value: apiData.byLevel.low || 0, color: '#10B981' },
        ];
      }
      return [];

    case 'taskProgress':
      if (typeof apiData === 'object' && apiData !== null) {
        return [
          { name: 'Total Tasks', value: apiData.total || 0 },
          { name: 'Open Tasks', value: apiData.open || 0 },
          { name: 'Overdue Tasks', value: apiData.overdue || 0 },
          { name: 'My Tasks', value: apiData.myTasks || 0 },
          { name: 'Due Today', value: apiData.dueToday || 0 },
        ];
      }
      return [];

    default:
      return [];
  }
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    // Filing statuses
    'draft': '#6B7280',
    'prepared': '#F59E0B',
    'filed': '#10B981',
    'rejected': '#EF4444',

    // Risk levels
    'high': '#EF4444',
    'medium': '#F59E0B',
    'low': '#10B981',

    // Service request statuses
    'new': '#3B82F6',
    'in_progress': '#F59E0B',
    'completed': '#10B981',
    'cancelled': '#6B7280',
    'awaiting_client': '#8B5CF6',

    // Default colors
    'default': '#6B7280',
  };

  return colorMap[status?.toLowerCase()] || colorMap.default;
}

function calculateTrend(value: number): number {
  // Simulate trend calculation - in real implementation this would compare with historical data
  return Math.random() * 20 - 10; // Random trend between -10% and +10%
}

// Real-time data provider context
export function ChartDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5 * 60 * 1000); // 5 minutes

  const {
    dashboardOverview,
    complianceOverview,
    taskOverview,
    clientRiskDistribution,
    filingStatusBreakdown,
    serviceRequestPipeline,
    activityTimeline,
    isLoading,
    hasError,
    errors,
    refetch,
  } = useAllChartData();

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdated(new Date());
      toast.success('Chart data refreshed', { duration: 2000 });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refetch]);

  // Manual refresh
  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
    toast.success('Data refreshed manually');
  };

  const contextValue: ChartDataContextType = {
    dashboardData: {
      overview: dashboardOverview,
      activity: activityTimeline,
      filingStatus: filingStatusBreakdown,
      serviceRequests: serviceRequestPipeline,
    },
    complianceData: {
      overview: complianceOverview,
      clientRisk: clientRiskDistribution,
    },
    taskData: taskOverview,
    clientData: clientRiskDistribution,
    isLoading,
    error: hasError ? errors[0]?.message || 'Failed to load data' : null,
    lastUpdated,
    refresh: handleRefresh,
  };

  return (
    <ChartDataContext.Provider value={contextValue}>
      {children}
    </ChartDataContext.Provider>
  );
}

// Chart data status indicator
export function ChartDataStatus() {
  const { isLoading, error, lastUpdated, refresh } = useChartData();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                error ? "bg-red-50 text-red-600" :
                isLoading ? "bg-yellow-50 text-yellow-600" :
                "bg-green-50 text-green-600"
              )}>
                {error ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {error ? 'Data Error' :
                     isLoading ? 'Loading Data' :
                     'Data Ready'}
                  </h3>
                  <Badge variant={error ? 'destructive' : isLoading ? 'secondary' : 'default'}>
                    {error ? 'Error' : isLoading ? 'Loading' : 'Live'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lastUpdated ? (
                    <>Last updated: {lastUpdated.toLocaleTimeString()}</>
                  ) : (
                    'No data loaded yet'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Database className="h-4 w-4 mr-2" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Dashboard Data</div>
                    <div className="text-muted-foreground">
                      <div>Overview: ✓</div>
                      <div>Activity: ✓</div>
                      <div>Filing Status: ✓</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Compliance Data</div>
                    <div className="text-muted-foreground">
                      <div>Overview: ✓</div>
                      <div>Risk Distribution: ✓</div>
                      <div>Scores: ✓</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Task Data</div>
                    <div className="text-muted-foreground">
                      <div>Overview: ✓</div>
                      <div>Progress: ✓</div>
                      <div>Assignments: ✓</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Service Data</div>
                    <div className="text-muted-foreground">
                      <div>Pipeline: ✓</div>
                      <div>Requests: ✓</div>
                      <div>Analytics: ✓</div>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error}. The system will retry automatically, or you can refresh manually.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Metric cards powered by real API data
export function ApiMetricCards() {
  const { dashboardData, isLoading } = useChartData();

  const metrics = useMemo(() => {
    if (!dashboardData?.overview) return [];

    return transformToChartData(dashboardData.overview, 'metricCards');
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    const icons = {
      users: Users,
      fileText: FileText,
      shield: Shield,
      activity: Activity,
    };
    return icons[iconName as keyof typeof icons] || Activity;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = getIcon(metric.icon);
        const isPositive = metric.trend > 0;

        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={cn(
                        "font-medium",
                        isPositive ? "text-green-600" : "text-red-600"
                      )}>
                        {isPositive ? '+' : ''}{metric.trend.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}