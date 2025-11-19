"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import {
  Activity,
  Zap,
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Monitor,
  Clock,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

// Real-time data simulation
const generateMetrics = () => ({
  cpu: Math.floor(Math.random() * 30) + 45, // 45-75%
  memory: Math.floor(Math.random() * 25) + 60, // 60-85%
  disk: Math.floor(Math.random() * 20) + 40, // 40-60%
  network: Math.floor(Math.random() * 100) + 150, // 150-250 MB/s
  responseTime: Math.floor(Math.random() * 50) + 120, // 120-170ms
  activeUsers: Math.floor(Math.random() * 100) + 450, // 450-550
  throughput: Math.floor(Math.random() * 500) + 1200, // 1200-1700 req/min
  errorRate: (Math.random() * 1.5).toFixed(2), // 0-1.5%
});

const generateTimeSeriesData = (points = 20) => {
  const now = new Date();
  return Array.from({ length: points }, (_, i) => {
    const time = new Date(now.getTime() - (points - 1 - i) * 30000); // 30-second intervals
    return {
      time: time.toLocaleTimeString(),
      cpu: Math.floor(Math.random() * 40) + 40,
      memory: Math.floor(Math.random() * 30) + 50,
      responseTime: Math.floor(Math.random() * 100) + 100,
      throughput: Math.floor(Math.random() * 800) + 800,
      activeUsers: Math.floor(Math.random() * 200) + 300,
    };
  });
};

interface RealTimeMetricProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<any>;
  status: "excellent" | "good" | "warning" | "critical";
  trend?: number;
  delay?: number;
  onToggleDetails?: () => void;
  showDetails?: boolean;
}

function RealTimeMetric({
  title,
  value,
  unit = "",
  icon: Icon,
  status,
  trend,
  delay = 0,
  onToggleDetails,
  showDetails = false
}: RealTimeMetricProps) {
  const statusConfig = {
    excellent: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-600",
      badge: "bg-green-100 text-green-800",
      dot: "bg-green-500"
    },
    good: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-600",
      badge: "bg-blue-100 text-blue-800",
      dot: "bg-blue-500"
    },
    warning: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-600",
      badge: "bg-orange-100 text-orange-800",
      dot: "bg-orange-500"
    },
    critical: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-600",
      badge: "bg-red-100 text-red-800",
      dot: "bg-red-500"
    }
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay,
        type: "spring",
        bounce: 0.2
      }}
    >
      <Card className={cn(
        "transition-all duration-300 hover:shadow-lg cursor-pointer",
        config.bg,
        config.border
      )}
      onClick={onToggleDetails}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: delay + 0.1,
                  type: "spring",
                  bounce: 0.4
                }}
                className={cn("p-2 rounded-lg", config.text)}
                style={{ backgroundColor: `${config.text.replace('text-', '')}20` }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.2, duration: 0.5 }}
                  className={cn("text-2xl font-bold", config.text)}
                >
                  {value}{unit}
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Status indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.3, duration: 0.3 }}
                className="flex items-center gap-1"
              >
                <div className={cn("w-2 h-2 rounded-full", config.dot)} />
                <Badge variant="secondary" className={cn("text-xs", config.badge)}>
                  {status}
                </Badge>
              </motion.div>

              {/* Trend indicator */}
              {trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.4, duration: 0.3 }}
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    trend >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend).toFixed(1)}%</span>
                </motion.div>
              )}

              {/* Toggle details button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5, duration: 0.3 }}
              >
                {showDetails ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SystemOverviewChart({ data, delay = 0 }: { data: any[]; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#cpuGradient)"
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#memoryGradient)"
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ThroughputChart({ data, delay = 0 }: { data: any[]; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Request Throughput & Response Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey="throughput"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  name="Requests/min"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PerformanceMonitoring() {
  const [metrics, setMetrics] = useState(generateMetrics());
  const [timeSeriesData, setTimeSeriesData] = useState(generateTimeSeriesData());
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
      setTimeSeriesData(prev => {
        const newData = [...prev.slice(1), generateTimeSeriesData(1)[0]];
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMetrics(generateMetrics());
    setTimeSeriesData(generateTimeSeriesData());
    setIsRefreshing(false);
  };

  const toggleDetails = (metric: string) => {
    setShowDetails(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const getStatus = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
    if (value <= thresholds.excellent) return "excellent";
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.warning) return "warning";
    return "critical";
  };

  const systemMetrics = [
    {
      title: "CPU Usage",
      value: metrics.cpu,
      unit: "%",
      icon: Cpu,
      status: getStatus(metrics.cpu, { excellent: 60, good: 75, warning: 85 }),
      trend: Math.random() * 10 - 5,
    },
    {
      title: "Memory Usage",
      value: metrics.memory,
      unit: "%",
      icon: HardDrive,
      status: getStatus(metrics.memory, { excellent: 70, good: 80, warning: 90 }),
      trend: Math.random() * 8 - 4,
    },
    {
      title: "Disk Usage",
      value: metrics.disk,
      unit: "%",
      icon: Database,
      status: getStatus(metrics.disk, { excellent: 50, good: 70, warning: 85 }),
      trend: Math.random() * 6 - 3,
    },
    {
      title: "Network I/O",
      value: metrics.network,
      unit: " MB/s",
      icon: Wifi,
      status: "good" as const,
      trend: Math.random() * 15 - 7.5,
    },
    {
      title: "Response Time",
      value: metrics.responseTime,
      unit: "ms",
      icon: Clock,
      status: getStatus(metrics.responseTime, { excellent: 100, good: 150, warning: 200 }),
      trend: Math.random() * 12 - 6,
    },
    {
      title: "Active Users",
      value: metrics.activeUsers,
      unit: "",
      icon: Users,
      status: "excellent" as const,
      trend: Math.random() * 20 - 10,
    },
    {
      title: "Throughput",
      value: metrics.throughput,
      unit: " req/min",
      icon: Activity,
      status: "good" as const,
      trend: Math.random() * 15 - 7.5,
    },
    {
      title: "Error Rate",
      value: metrics.errorRate,
      unit: "%",
      icon: AlertTriangle,
      status: getStatus(parseFloat(metrics.errorRate), { excellent: 0.5, good: 1.0, warning: 2.0 }),
      trend: Math.random() * 8 - 4,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Performance Monitoring
          </h2>
          <p className="text-muted-foreground">
            Real-time system metrics and performance indicators
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Monitoring
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </motion.div>

      {/* Real-time Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemMetrics.map((metric, index) => (
          <RealTimeMetric
            key={metric.title}
            {...metric}
            delay={index * 0.05}
            onToggleDetails={() => toggleDetails(metric.title)}
            showDetails={showDetails[metric.title]}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SystemOverviewChart data={timeSeriesData} delay={0.5} />
        <ThroughputChart data={timeSeriesData} delay={0.6} />
      </div>

      {/* System Health Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              System Health: Excellent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-sm text-muted-foreground">Critical Issues</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-orange-600">2</div>
                <div className="text-sm text-muted-foreground">Minor Alerts</div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}