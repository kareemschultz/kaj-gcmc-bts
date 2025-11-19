"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
  ComposedChart,
  Scatter,
  ScatterChart,
  ReferenceLine,
  Brush,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Users,
  Target,
  Activity,
  BarChart3,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Timer,
  Settings,
  RefreshCw,
  Filter,
  Calendar,
  Gauge,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Monitor,
  FileText,
  UserCheck,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// Performance Metrics Data Types
export interface ProcessingTimesData {
  processes: {
    name: string;
    currentTime: number;
    targetTime: number;
    improvement: number;
    volume: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  }[];
  timeTrends: { month: string; avgTime: number; target: number; volume: number }[];
}

export interface StaffProductivityData {
  departments: {
    name: string;
    productivity: number;
    utilization: number;
    efficiency: number;
    headcount: number;
    tasksCompleted: number;
  }[];
  productivityTrends: { month: string; productivity: number; utilization: number; efficiency: number }[];
  individualMetrics: { employee: string; tasks: number; quality: number; speed: number }[];
}

export interface ServiceMetricsData {
  metrics: {
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  }[];
  slaPerformance: { service: string; slaTarget: number; actualTime: number; compliance: number }[];
  qualityScores: { metric: string; score: number; benchmark: number }[];
}

export interface ResourceUtilizationData {
  systemResources: {
    resource: string;
    utilization: number;
    capacity: number;
    available: number;
    status: 'healthy' | 'warning' | 'critical';
  }[];
  capacityTrends: { hour: string; cpu: number; memory: number; storage: number; network: number }[];
  performanceMetrics: { metric: string; value: number; threshold: number; alert: boolean }[];
}

// Mock data generators
const generateProcessingTimes = (): ProcessingTimesData => ({
  processes: [
    { name: 'Tax Filing Review', currentTime: 4.2, targetTime: 4.0, improvement: -5.5, volume: 234, status: 'warning' },
    { name: 'Document Verification', currentTime: 2.8, targetTime: 3.0, improvement: 6.7, volume: 567, status: 'excellent' },
    { name: 'Compliance Assessment', currentTime: 6.5, targetTime: 6.0, improvement: -8.3, volume: 123, status: 'critical' },
    { name: 'Client Onboarding', currentTime: 3.2, targetTime: 4.0, improvement: 20.0, volume: 89, status: 'excellent' },
    { name: 'Service Request Processing', currentTime: 1.8, targetTime: 2.0, improvement: 10.0, volume: 445, status: 'good' },
    { name: 'Report Generation', currentTime: 0.8, targetTime: 1.0, improvement: 20.0, volume: 678, status: 'excellent' },
  ],
  timeTrends: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
    avgTime: Math.random() * 2 + 3,
    target: 4.0,
    volume: Math.floor(Math.random() * 200) + 400,
  })),
});

const generateStaffProductivity = (): StaffProductivityData => ({
  departments: [
    { name: 'Tax Services', productivity: 94, utilization: 87, efficiency: 91, headcount: 12, tasksCompleted: 1234 },
    { name: 'Compliance', productivity: 89, utilization: 92, efficiency: 85, headcount: 8, tasksCompleted: 876 },
    { name: 'Corporate Services', productivity: 91, utilization: 85, efficiency: 88, headcount: 6, tasksCompleted: 654 },
    { name: 'Immigration', productivity: 87, utilization: 89, efficiency: 83, headcount: 5, tasksCompleted: 432 },
    { name: 'Administration', productivity: 85, utilization: 78, efficiency: 89, headcount: 4, tasksCompleted: 321 },
  ],
  productivityTrends: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
    productivity: Math.random() * 15 + 80,
    utilization: Math.random() * 20 + 75,
    efficiency: Math.random() * 15 + 80,
  })),
  individualMetrics: [
    { employee: 'John Smith', tasks: 145, quality: 96, speed: 92 },
    { employee: 'Sarah Johnson', tasks: 132, quality: 94, speed: 89 },
    { employee: 'Mike Davis', tasks: 156, quality: 91, speed: 95 },
    { employee: 'Lisa Brown', tasks: 128, quality: 98, speed: 87 },
    { employee: 'Alex Wilson', tasks: 141, quality: 93, speed: 91 },
  ],
});

const generateServiceMetrics = (): ServiceMetricsData => ({
  metrics: [
    { name: 'Client Satisfaction', value: 4.7, target: 4.5, unit: '/5', trend: 4.2, status: 'excellent' },
    { name: 'First Call Resolution', value: 87, target: 85, unit: '%', trend: 3.5, status: 'good' },
    { name: 'Response Time', value: 2.3, target: 4.0, unit: 'hours', trend: -15.2, status: 'excellent' },
    { name: 'Task Completion Rate', value: 94, target: 90, unit: '%', trend: 2.8, status: 'excellent' },
    { name: 'Error Rate', value: 1.2, target: 2.0, unit: '%', trend: -23.1, status: 'excellent' },
    { name: 'Rework Rate', value: 3.4, target: 5.0, unit: '%', trend: -12.8, status: 'good' },
  ],
  slaPerformance: [
    { service: 'Tax Filing', slaTarget: 48, actualTime: 32, compliance: 98.5 },
    { service: 'Document Review', slaTarget: 24, actualTime: 18, compliance: 96.2 },
    { service: 'Compliance Check', slaTarget: 72, actualTime: 68, compliance: 89.3 },
    { service: 'Immigration Processing', slaTarget: 120, actualTime: 98, compliance: 92.1 },
  ],
  qualityScores: [
    { metric: 'Accuracy', score: 96.8, benchmark: 95.0 },
    { metric: 'Completeness', score: 94.2, benchmark: 90.0 },
    { metric: 'Timeliness', score: 92.5, benchmark: 85.0 },
    { metric: 'Client Feedback', score: 4.6, benchmark: 4.0 },
  ],
});

const generateResourceUtilization = (): ResourceUtilizationData => ({
  systemResources: [
    { resource: 'CPU Usage', utilization: 68, capacity: 100, available: 32, status: 'healthy' },
    { resource: 'Memory Usage', utilization: 74, capacity: 100, available: 26, status: 'healthy' },
    { resource: 'Storage Usage', utilization: 45, capacity: 100, available: 55, status: 'healthy' },
    { resource: 'Network Bandwidth', utilization: 82, capacity: 100, available: 18, status: 'warning' },
    { resource: 'Database Connections', utilization: 34, capacity: 50, available: 16, status: 'healthy' },
    { resource: 'Active Sessions', utilization: 156, capacity: 200, available: 44, status: 'healthy' },
  ],
  capacityTrends: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    cpu: Math.random() * 30 + 50,
    memory: Math.random() * 25 + 60,
    storage: Math.random() * 20 + 40,
    network: Math.random() * 40 + 40,
  })),
  performanceMetrics: [
    { metric: 'Response Time', value: 234, threshold: 500, alert: false },
    { metric: 'Throughput (req/s)', value: 1567, threshold: 1000, alert: false },
    { metric: 'Error Rate', value: 0.8, threshold: 2.0, alert: false },
    { metric: 'Availability', value: 99.97, threshold: 99.5, alert: false },
  ],
});

// Gauge Chart Component
function GaugeChart({
  value,
  target,
  title,
  suffix = '',
  size = 120
}: {
  value: number;
  target: number;
  title: string;
  suffix?: string;
  size?: number;
}) {
  const percentage = (value / target) * 100;
  const strokeColor = percentage >= 100 ? '#10B981' : percentage >= 80 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${2 * Math.PI * (size / 2 - 10)}`}
            strokeDashoffset={`${2 * Math.PI * (size / 2 - 10) * (1 - percentage / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{value}{suffix}</div>
            <div className="text-xs text-muted-foreground">Target: {target}{suffix}</div>
          </div>
        </div>
      </div>
      <div className="text-sm font-medium text-center">{title}</div>
    </div>
  );
}

// Performance Score Card
function PerformanceScoreCard({
  metric,
  delay = 0
}: {
  metric: {
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  delay?: number;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return Target;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const Icon = getStatusIcon(metric.status);
  const percentage = (metric.value / metric.target) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2 rounded-full", getStatusColor(metric.status))}>
              <Icon className="h-4 w-4" />
            </div>
            <Badge variant={metric.trend > 0 ? 'default' : 'secondary'} className="text-xs">
              {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">{metric.name}</h4>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold">{metric.value}</span>
              <span className="text-sm text-muted-foreground">{metric.unit}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-1" />
              <div className="text-xs text-muted-foreground">
                Target: {metric.target}{metric.unit}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Processing Times Tab
function ProcessingTimesTab({ data }: { data: ProcessingTimesData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.processes.map((process, index) => (
          <motion.div
            key={process.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={
                    process.status === 'excellent' ? 'default' :
                    process.status === 'good' ? 'secondary' :
                    process.status === 'warning' ? 'outline' : 'destructive'
                  }>
                    {process.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs">
                    {process.improvement > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={process.improvement > 0 ? 'text-green-600' : 'text-red-600'}>
                      {process.improvement > 0 ? '+' : ''}{process.improvement.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <h4 className="font-medium mb-2">{process.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="font-semibold">{process.currentTime}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="text-sm">{process.targetTime}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Volume</span>
                    <span className="text-sm">{process.volume}</span>
                  </div>
                  <Progress
                    value={(process.targetTime / process.currentTime) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Processing Time Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.timeTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgTime"
                  fill="#3B82F6"
                  stroke="#3B82F6"
                  fillOpacity={0.3}
                  name="Avg Processing Time (hours)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="target"
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  name="Target Time"
                />
                <Bar
                  yAxisId="right"
                  dataKey="volume"
                  fill="#F59E0B"
                  fillOpacity={0.7}
                  name="Volume"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Staff Productivity Tab
function StaffProductivityTab({ data }: { data: StaffProductivityData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.departments.map((dept, index) => (
          <Card key={dept.name}>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{dept.name}</h4>
                  <Badge>{dept.headcount} staff</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <GaugeChart
                    value={dept.productivity}
                    target={100}
                    title="Productivity"
                    suffix="%"
                    size={80}
                  />
                  <GaugeChart
                    value={dept.utilization}
                    target={100}
                    title="Utilization"
                    suffix="%"
                    size={80}
                  />
                  <GaugeChart
                    value={dept.efficiency}
                    target={100}
                    title="Efficiency"
                    suffix="%"
                    size={80}
                  />
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dept.tasksCompleted}</div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Productivity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.productivityTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="productivity"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Productivity %"
                  />
                  <Line
                    type="monotone"
                    dataKey="utilization"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Utilization %"
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Efficiency %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.individualMetrics.map((employee, index) => (
                <div key={employee.employee} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{employee.employee}</p>
                    <p className="text-sm text-muted-foreground">{employee.tasks} tasks completed</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{employee.quality}% Quality</Badge>
                    <Badge variant="outline">{employee.speed}% Speed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Service Metrics Tab
function ServiceMetricsTab({ data }: { data: ServiceMetricsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.metrics.map((metric, index) => (
          <PerformanceScoreCard
            key={metric.name}
            metric={metric}
            delay={index * 0.1}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              SLA Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slaPerformance}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="slaTarget" fill="#E5E7EB" name="SLA Target (hours)" />
                  <Bar dataKey="actualTime" fill="#3B82F6" name="Actual Time (hours)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quality Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data.qualityScores}>
                  <RadialBar dataKey="score" cornerRadius={10} fill="#3B82F6" />
                  <RadialBar dataKey="benchmark" cornerRadius={10} fill="#E5E7EB" />
                  <Tooltip />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// System Resources Tab
function SystemResourcesTab({ data }: { data: ResourceUtilizationData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.systemResources.map((resource, index) => (
          <Card key={resource.resource}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{resource.resource}</h4>
                  <Badge variant={
                    resource.status === 'healthy' ? 'default' :
                    resource.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {resource.status}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">{resource.utilization}%</div>
                  <div className="text-sm text-muted-foreground">Utilized</div>
                </div>

                <Progress value={resource.utilization} className="h-2" />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available: {resource.available}</span>
                  <span>Capacity: {resource.capacity}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            24-Hour Resource Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.capacityTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stackId="2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Memory %"
                />
                <Area
                  type="monotone"
                  dataKey="storage"
                  stackId="3"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name="Storage %"
                />
                <Area
                  type="monotone"
                  dataKey="network"
                  stackId="4"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                  name="Network %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Performance Metrics Panel
export function PerformanceMetricsPanel() {
  const [activeTab, setActiveTab] = useState('processing');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const processingTimes = useMemo(() => generateProcessingTimes(), []);
  const staffProductivity = useMemo(() => generateStaffProductivity(), []);
  const serviceMetrics = useMemo(() => generateServiceMetrics(), []);
  const resourceUtilization = useMemo(() => generateResourceUtilization(), []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Metrics Panel</h1>
          <p className="text-gray-600 mt-2">
            Operational efficiency tracking and system performance monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Processing Times
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Productivity
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Service Metrics
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processing">
          <ProcessingTimesTab data={processingTimes} />
        </TabsContent>

        <TabsContent value="staff">
          <StaffProductivityTab data={staffProductivity} />
        </TabsContent>

        <TabsContent value="service">
          <ServiceMetricsTab data={serviceMetrics} />
        </TabsContent>

        <TabsContent value="resources">
          <SystemResourcesTab data={resourceUtilization} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}