"use client";

/**
 * Form Analytics Dashboard
 * Comprehensive analytics for form completion, field performance, and user behavior
 */

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from "recharts";

import type {
  FormAnalytics,
  FieldAnalytics,
  FieldValidationAnalytics,
  DropOffAnalytics,
  StepTimeAnalytics
} from "@/lib/form-builder/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Monitor,
  Tablet,
  Target,
  BarChart3,
  Activity,
  Download,
  RefreshCw,
  Calendar
} from "lucide-react";

interface FormAnalyticsProps {
  formId: string;
  analytics: FormAnalytics;
  className?: string;
}

export function FormAnalytics({ formId, analytics, className = "" }: FormAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("completion");

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const completionRate = ((analytics.totalCompletions / analytics.totalStarts) * 100).toFixed(1);
    const avgTime = Math.round(analytics.averageCompletionTime);
    const dropOffRate = ((1 - (analytics.totalCompletions / analytics.totalStarts)) * 100).toFixed(1);

    return {
      completionRate: parseFloat(completionRate),
      avgCompletionTime: avgTime,
      dropOffRate: parseFloat(dropOffRate),
      totalSubmissions: analytics.totalCompletions,
      totalStarts: analytics.totalStarts
    };
  }, [analytics]);

  // Prepare chart data
  const completionTrendData = useMemo(() => {
    // Mock trend data - in real implementation, this would come from the API
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completions: Math.floor(Math.random() * 20) + 5,
        starts: Math.floor(Math.random() * 30) + 10,
        completion_rate: (Math.random() * 30 + 60).toFixed(1)
      };
    });
    return days;
  }, []);

  const fieldPerformanceData = analytics.fieldAnalytics.map(field => ({
    name: field.fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    completion_rate: field.completionRate,
    error_rate: field.validationErrorRate,
    avg_time: field.averageTimeSpent
  }));

  const deviceData = Object.entries(analytics.deviceTypes).map(([device, count]) => ({
    name: device.charAt(0).toUpperCase() + device.slice(1),
    value: count,
    percentage: ((count / analytics.totalStarts) * 100).toFixed(1)
  }));

  const errorData = analytics.validationErrors.slice(0, 10).map(error => ({
    field: error.fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    errors: error.errorCount,
    rate: (error.errorRate * 100).toFixed(1)
  }));

  // Colors for charts
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Analytics</h2>
          <p className="text-gray-600">
            Performance insights for form {formId}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{keyMetrics.completionRate}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+5.4%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{keyMetrics.totalSubmissions.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+12.3%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-gray-900">{keyMetrics.avgCompletionTime}m</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">-2.1m</span>
              <span className="text-gray-500 ml-1">faster</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Drop-off Rate</p>
                <p className="text-2xl font-bold text-gray-900">{keyMetrics.dropOffRate}%</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">-3.2%</span>
              <span className="text-gray-500 ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Mobile Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.mobileOptimizationScore}/100</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Badge
                variant={analytics.mobileOptimizationScore >= 80 ? "default" : "secondary"}
                className={analytics.mobileOptimizationScore >= 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
              >
                {analytics.mobileOptimizationScore >= 80 ? "Excellent" : "Needs Work"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fields">Field Performance</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="devices">Devices & Browsers</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Completion Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Completion Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="starts"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Form Starts"
                    />
                    <Area
                      type="monotone"
                      dataKey="completions"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Completions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Device Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Drop-off Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Drop-off Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.dropOffPoints.slice(0, 5).map((dropOff, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{dropOff.field.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">{dropOff.section}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">{(dropOff.dropOffRate * 100).toFixed(1)}%</p>
                        <p className="text-sm text-gray-500">{dropOff.dropOffCount} users</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          {/* Field Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Field Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fieldPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion_rate" fill="#3b82f6" name="Completion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Field Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Field Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Field</th>
                      <th className="text-center p-3">Completion Rate</th>
                      <th className="text-center p-3">Error Rate</th>
                      <th className="text-center p-3">Avg. Time</th>
                      <th className="text-center p-3">Skip Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.fieldAnalytics.map((field, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{field.fieldName.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-center">
                          <Badge variant={field.completionRate > 80 ? "default" : "secondary"}>
                            {(field.completionRate).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={field.validationErrorRate < 0.1 ? "default" : "destructive"}>
                            {(field.validationErrorRate * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-center">{Math.round(field.averageTimeSpent)}s</td>
                        <td className="p-3 text-center">{(field.skipRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          {/* Step Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Step Completion Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.averageTimePerStep}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="averageTime" fill="#8b5cf6" name="Average Time (seconds)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Journey */}
          <Card>
            <CardHeader>
              <CardTitle>User Journey Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.averageTimePerStep.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{step.step}</span>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{(step.completionRate * 100).toFixed(1)}% completed</span>
                          <span>{Math.round(step.averageTime)}s avg time</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${step.completionRate * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.deviceTypes).map(([device, count]) => {
                    const percentage = ((count / analytics.totalStarts) * 100).toFixed(1);
                    return (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {device === "mobile" ? (
                            <Smartphone className="h-4 w-4 text-gray-600" />
                          ) : device === "tablet" ? (
                            <Tablet className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Monitor className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="capitalize">{device}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{count.toLocaleString()}</span>
                          <span className="text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Browser Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.browsers).map(([browser, count]) => {
                    const percentage = ((count / analytics.totalStarts) * 100).toFixed(1);
                    return (
                      <div key={browser} className="flex items-center justify-between">
                        <span className="capitalize">{browser}</span>
                        <div className="text-right">
                          <span className="font-medium">{count.toLocaleString()}</span>
                          <span className="text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Optimization Score */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Overall Score</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{analytics.mobileOptimizationScore}</span>
                    <span className="text-gray-500">/100</span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      analytics.mobileOptimizationScore >= 80
                        ? "bg-green-500"
                        : analytics.mobileOptimizationScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${analytics.mobileOptimizationScore}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(Object.values(analytics.deviceTypes).find((_, i) => Object.keys(analytics.deviceTypes)[i] === "mobile") || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Mobile Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.fieldAnalytics.filter(f => f.completionRate > 0.8).length}
                    </div>
                    <div className="text-sm text-gray-600">Mobile-Friendly Fields</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(analytics.averageCompletionTime * 0.8)}m
                    </div>
                    <div className="text-sm text-gray-600">Mobile Avg Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          {/* Error Frequency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Most Common Validation Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={errorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="errors" fill="#ef4444" name="Error Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Error Details */}
          <Card>
            <CardHeader>
              <CardTitle>Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.validationErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-gray-900">{error.fieldId.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-600">{error.ruleType} validation</p>
                      <p className="text-sm text-red-600">{error.message}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{error.errorCount} errors</p>
                      <p className="text-sm text-gray-500">{(error.errorRate * 100).toFixed(1)}% error rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FormAnalytics;