"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Shield,
  Building,
  Plane,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Target,
  Activity,
  BarChart3,
  Zap,
  Eye,
  AlertCircle,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for agency-specific data
export interface GRAData {
  taxFilingStatus: { status: string; count: number; color: string }[];
  vatTrends: { month: string; vat: number; penalties: number; payments: number }[];
  paymentHistory: { date: string; amount: number; type: string }[];
  complianceScore: number;
}

export interface NISData {
  contributionSchedules: { month: string; contributions: number; employees: number }[];
  employeeCoverage: { department: string; covered: number; total: number }[];
  complianceScores: { metric: string; score: number; target: number }[];
  overallScore: number;
}

export interface DCRAData {
  registrationRenewals: { status: string; count: number; dueDate: string }[];
  filingDeadlines: { type: string; deadline: string; completed: boolean }[];
  corporateChanges: { month: string; changes: number; approved: number }[];
  complianceHealth: number;
}

export interface ImmigrationData {
  permitStatus: { type: string; approved: number; pending: number; rejected: number }[];
  applicationTimelines: { month: string; applications: number; avgProcessingTime: number }[];
  renewalTracking: { status: string; count: number; daysUntilExpiry: number }[];
  complianceRate: number;
}

// Mock data generators
const generateGRAData = (): GRAData => ({
  taxFilingStatus: [
    { status: 'Filed', count: 245, color: '#10B981' },
    { status: 'Pending', count: 89, color: '#F59E0B' },
    { status: 'Overdue', count: 23, color: '#EF4444' },
    { status: 'Under Review', count: 45, color: '#3B82F6' },
  ],
  vatTrends: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
    vat: Math.floor(Math.random() * 50000) + 100000,
    penalties: Math.floor(Math.random() * 5000),
    payments: Math.floor(Math.random() * 45000) + 95000,
  })),
  paymentHistory: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: Math.floor(Math.random() * 20000) + 5000,
    type: ['VAT', 'Income Tax', 'Corporate Tax'][Math.floor(Math.random() * 3)],
  })),
  complianceScore: 87,
});

const generateNISData = (): NISData => ({
  contributionSchedules: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
    contributions: Math.floor(Math.random() * 50000) + 200000,
    employees: Math.floor(Math.random() * 50) + 150,
  })),
  employeeCoverage: [
    { department: 'Accounting', covered: 45, total: 50 },
    { department: 'Tax Services', covered: 32, total: 35 },
    { department: 'Compliance', covered: 28, total: 30 },
    { department: 'Administration', covered: 18, total: 20 },
    { department: 'IT Support', covered: 12, total: 15 },
  ],
  complianceScores: [
    { metric: 'Timely Contributions', score: 94, target: 95 },
    { metric: 'Employee Registration', score: 98, target: 100 },
    { metric: 'Record Keeping', score: 89, target: 90 },
    { metric: 'Reporting Accuracy', score: 92, target: 95 },
  ],
  overallScore: 93,
});

const generateDCRAData = (): DCRAData => ({
  registrationRenewals: [
    { status: 'Current', count: 156, dueDate: '2024-12-31' },
    { status: 'Due in 30 days', count: 43, dueDate: '2024-12-19' },
    { status: 'Due in 60 days', count: 27, dueDate: '2025-01-19' },
    { status: 'Overdue', count: 8, dueDate: '2024-10-15' },
  ],
  filingDeadlines: [
    { type: 'Annual Returns', deadline: '2024-12-31', completed: false },
    { type: 'Financial Statements', deadline: '2024-12-15', completed: true },
    { type: 'Director Changes', deadline: '2024-11-30', completed: true },
    { type: 'Share Transfers', deadline: '2025-01-15', completed: false },
  ],
  corporateChanges: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
    changes: Math.floor(Math.random() * 20) + 5,
    approved: Math.floor(Math.random() * 18) + 3,
  })),
  complianceHealth: 91,
});

const generateImmigrationData = (): ImmigrationData => ({
  permitStatus: [
    { type: 'Work Permits', approved: 89, pending: 23, rejected: 5 },
    { type: 'Business Visas', approved: 45, pending: 12, rejected: 2 },
    { type: 'Residence Permits', approved: 67, pending: 18, rejected: 3 },
    { type: 'Investment Visas', approved: 34, pending: 8, rejected: 1 },
  ],
  applicationTimelines: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
    applications: Math.floor(Math.random() * 30) + 20,
    avgProcessingTime: Math.floor(Math.random() * 20) + 15,
  })),
  renewalTracking: [
    { status: 'Renewed', count: 78, daysUntilExpiry: 365 },
    { status: 'Due in 90 days', count: 23, daysUntilExpiry: 90 },
    { status: 'Due in 30 days', count: 15, daysUntilExpiry: 30 },
    { status: 'Expired', count: 4, daysUntilExpiry: -10 },
  ],
  complianceRate: 88,
});

// GRA Compliance Charts
export function GRAComplianceCharts({ data }: { data?: GRAData }) {
  const [graData] = useState(data || generateGRAData());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/10 ring-1 ring-green-500/20">
          <Shield className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">GRA Compliance Dashboard</h2>
          <p className="text-sm text-muted-foreground">Guyana Revenue Authority tax compliance tracking</p>
        </div>
        <Badge variant={graData.complianceScore > 85 ? "default" : "secondary"} className="ml-auto">
          {graData.complianceScore}% Compliant
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tax Filing Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Filing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graData.taxFilingStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {graData.taxFilingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* VAT Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              VAT & Payment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graData.vatTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="vat"
                    fill="#3B82F6"
                    stroke="#3B82F6"
                    fillOpacity={0.3}
                    name="VAT Collected"
                  />
                  <Bar dataKey="penalties" fill="#EF4444" name="Penalties" />
                  <Line
                    type="monotone"
                    dataKey="payments"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Payments Made"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graData.paymentHistory.slice(-15)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Brush dataKey="date" height={30} stroke="#3B82F6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// NIS Performance Charts
export function NISPerformanceCharts({ data }: { data?: NISData }) {
  const [nisData] = useState(data || generateNISData());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">NIS Performance Dashboard</h2>
          <p className="text-sm text-muted-foreground">National Insurance Scheme compliance and contributions</p>
        </div>
        <Badge variant={nisData.overallScore > 90 ? "default" : "secondary"} className="ml-auto">
          {nisData.overallScore}% Performance
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contribution Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={nisData.contributionSchedules}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="contributions"
                    fill="#3B82F6"
                    name="Contributions (GYD)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="employees"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Employees"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employee Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Employee Coverage by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nisData.employeeCoverage} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="department" width={100} />
                  <Tooltip />
                  <Bar dataKey="covered" fill="#10B981" name="Covered" />
                  <Bar dataKey="total" fill="#E5E7EB" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Scores Radial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Compliance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={nisData.complianceScores}>
                <RadialBar dataKey="score" cornerRadius={10} fill="#3B82F6" />
                <RadialBar dataKey="target" cornerRadius={10} fill="#E5E7EB" />
                <Tooltip />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// DCRA Status Charts
export function DCRAStatusCharts({ data }: { data?: DCRAData }) {
  const [dcraData] = useState(data || generateDCRAData());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
          <Building className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">DCRA Status Dashboard</h2>
          <p className="text-sm text-muted-foreground">Deeds and Commercial Registry Authority tracking</p>
        </div>
        <Badge variant={dcraData.complianceHealth > 85 ? "default" : "secondary"} className="ml-auto">
          {dcraData.complianceHealth}% Health
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Registration Renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Registration Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dcraData.registrationRenewals}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill={(entry: any) =>
                      entry.status === 'Current' ? '#10B981' :
                      entry.status === 'Overdue' ? '#EF4444' : '#F59E0B'
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Corporate Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Corporate Changes Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dcraData.corporateChanges}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="changes"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Total Changes"
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Approved Changes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filing Deadlines Table/Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Upcoming Filing Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dcraData.filingDeadlines.map((filing, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {filing.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-medium">{filing.type}</p>
                    <p className="text-sm text-muted-foreground">{filing.deadline}</p>
                  </div>
                </div>
                <Badge variant={filing.completed ? "default" : "secondary"}>
                  {filing.completed ? 'Completed' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Immigration Analytics Charts
export function ImmigrationAnalyticsCharts({ data }: { data?: ImmigrationData }) {
  const [immigrationData] = useState(data || generateImmigrationData());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">
          <Plane className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Immigration Analytics</h2>
          <p className="text-sm text-muted-foreground">Immigration permit and application tracking</p>
        </div>
        <Badge variant={immigrationData.complianceRate > 85 ? "default" : "secondary"} className="ml-auto">
          {immigrationData.complianceRate}% Compliance
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Permit Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Permit Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={immigrationData.permitStatus}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                  <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Application Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Processing Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={immigrationData.applicationTimelines}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="applications"
                    fill="#3B82F6"
                    name="Applications"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgProcessingTime"
                    stroke="#EF4444"
                    strokeWidth={3}
                    name="Avg Processing Days"
                  />
                  <ReferenceLine yAxisId="right" y={30} stroke="#10B981" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Permit Renewal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={immigrationData.renewalTracking}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {immigrationData.renewalTracking.map((entry, index) => {
                    const colors = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];
                    return <Cell key={`cell-${index}`} fill={colors[index]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Agency Compliance Dashboard
export function AgencyComplianceCharts() {
  const [activeAgency, setActiveAgency] = useState('gra');

  const agencies = [
    { id: 'gra', name: 'GRA', icon: Shield, description: 'Guyana Revenue Authority' },
    { id: 'nis', name: 'NIS', icon: Users, description: 'National Insurance Scheme' },
    { id: 'dcra', name: 'DCRA', icon: Building, description: 'Deeds & Commercial Registry' },
    { id: 'immigration', name: 'Immigration', icon: Plane, description: 'Immigration Department' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Agency Compliance Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive compliance tracking across all Guyanese regulatory agencies
        </p>
      </div>

      <Tabs value={activeAgency} onValueChange={setActiveAgency} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          {agencies.map((agency) => {
            const Icon = agency.icon;
            return (
              <TabsTrigger
                key={agency.id}
                value={agency.id}
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{agency.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="gra" className="space-y-6">
          <GRAComplianceCharts />
        </TabsContent>

        <TabsContent value="nis" className="space-y-6">
          <NISPerformanceCharts />
        </TabsContent>

        <TabsContent value="dcra" className="space-y-6">
          <DCRAStatusCharts />
        </TabsContent>

        <TabsContent value="immigration" className="space-y-6">
          <ImmigrationAnalyticsCharts />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}