"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data generators for real-time simulation
const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    revenue: Math.floor(Math.random() * 50000) + 100000,
    clients: Math.floor(Math.random() * 50) + 150,
    filings: Math.floor(Math.random() * 100) + 200,
  }));
};

const generateComplianceData = () => {
  return [
    { name: 'Tax Filings', value: 85, color: '#10B981' },
    { name: 'Document Review', value: 92, color: '#3B82F6' },
    { name: 'Client Onboarding', value: 78, color: '#F59E0B' },
    { name: 'Regulatory Updates', value: 95, color: '#8B5CF6' },
    { name: 'Compliance Checks', value: 88, color: '#EF4444' },
  ];
};

const generateActivityData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.map(hour => ({
    hour: `${hour}:00`,
    activity: Math.floor(Math.random() * 100) + 20,
  }));
};

interface AnimatedChartContainerProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function AnimatedChartContainer({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  delay = 0
}: AnimatedChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay,
        type: "spring",
        bounce: 0.2
      }}
    >
      <Card className={cn(
        "bg-gradient-to-br from-white to-gray-50/50",
        "dark:from-gray-900 dark:to-gray-800/50",
        "border-0 shadow-lg ring-1 ring-gray-200/50",
        "dark:ring-gray-700/50 overflow-hidden",
        className
      )}>
        <CardHeader className="pb-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 ring-1 ring-blue-500/20">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4, duration: 0.6 }}
          >
            {children}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RevenueAreaChart({ delay = 0 }: { delay?: number }) {
  const [data, setData] = useState(generateRevenueData());

  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateRevenueData());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatedChartContainer
      title="Revenue Analytics"
      subtitle="Monthly revenue and client growth trends"
      icon={TrendingUp}
      delay={delay}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="clientsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
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
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="clients"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#clientsGradient)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChartContainer>
  );
}

export function CompliancePieChart({ delay = 0 }: { delay?: number }) {
  const [data, setData] = useState(generateComplianceData());

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <AnimatedChartContainer
      title="Compliance Overview"
      subtitle="Department compliance scores and performance metrics"
      icon={PieChartIcon}
      delay={delay}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChartContainer>
  );
}

export function ActivityLineChart({ delay = 0 }: { delay?: number }) {
  const [data, setData] = useState(generateActivityData());

  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateActivityData());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatedChartContainer
      title="Real-time Activity"
      subtitle="System activity and user engagement over 24 hours"
      icon={Activity}
      delay={delay}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="activity"
              stroke="url(#activityGradient)"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChartContainer>
  );
}

export function PerformanceBarChart({ delay = 0 }: { delay?: number }) {
  const [data] = useState([
    { category: 'Filing Speed', current: 92, target: 95 },
    { category: 'Client Response', current: 88, target: 90 },
    { category: 'Document Processing', current: 95, target: 98 },
    { category: 'Compliance Rate', current: 97, target: 99 },
    { category: 'System Uptime', current: 99.5, target: 99.9 },
  ]);

  return (
    <AnimatedChartContainer
      title="Performance Metrics"
      subtitle="Current performance vs. targets across key areas"
      icon={BarChart3}
      delay={delay}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="horizontal" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              width={90}
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
              dataKey="current"
              fill="#3B82F6"
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
            />
            <Bar
              dataKey="target"
              fill="#E5E7EB"
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChartContainer>
  );
}

export function ComplianceRadialChart({ delay = 0 }: { delay?: number }) {
  const data = [
    { name: 'Overall Compliance', value: 94, fill: '#10B981' },
    { name: 'Document Compliance', value: 87, fill: '#3B82F6' },
    { name: 'Filing Compliance', value: 96, fill: '#F59E0B' },
    { name: 'Regulatory Compliance', value: 92, fill: '#8B5CF6' },
  ];

  return (
    <AnimatedChartContainer
      title="Compliance Health"
      subtitle="Multi-dimensional compliance scoring system"
      icon={TrendingUp}
      delay={delay}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="80%"
            data={data}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill="#8884d8"
              animationDuration={2000}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChartContainer>
  );
}

export function RealTimeChartsGrid() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-2"
    >
      <div className="lg:col-span-2">
        <RevenueAreaChart delay={0.1} />
      </div>
      <CompliancePieChart delay={0.2} />
      <ActivityLineChart delay={0.3} />
      <PerformanceBarChart delay={0.4} />
      <ComplianceRadialChart delay={0.5} />
    </motion.div>
  );
}