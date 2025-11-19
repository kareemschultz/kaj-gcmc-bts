"use client";

/**
 * Real-Time Compliance Dashboard for Guyanese Regulatory Agencies
 * Provides comprehensive view of compliance status, deadlines, and alerts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Building,
  Users,
  DollarSign,
  Bell,
  Eye,
  Filter
} from 'lucide-react';
import type {
  Authority,
  ComplianceLevel,
  AgencyComplianceStatus,
  AgencyDeadline,
  ComplianceAlert,
  AgencySubmission
} from '@GCMC-KAJ/types';

interface ComplianceDashboardProps {
  clientId?: number;
  showAllClients?: boolean;
}

interface DashboardData {
  summary: {
    totalClients: number;
    greenCompliance: number;
    amberCompliance: number;
    redCompliance: number;
    upcomingDeadlines: number;
    criticalAlerts: number;
    averageComplianceScore: number;
  };
  complianceStatuses: AgencyComplianceStatus[];
  upcomingDeadlines: AgencyDeadline[];
  alerts: ComplianceAlert[];
  recentSubmissions?: AgencySubmission[];
}

export function ComplianceDashboard({ clientId, showAllClients = false }: ComplianceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | 'all'>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'unread' | 'critical'>('unread');

  useEffect(() => {
    loadDashboardData();
  }, [clientId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // This would be replaced with actual API call
      const response = await fetch('/api/agencies/compliance-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      });

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      // API call to acknowledge alert
      await fetch('/api/agencies/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getComplianceColor = (level: ComplianceLevel) => {
    switch (level) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'amber': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAuthorityDisplayName = (authority: Authority) => {
    const names: Record<Authority, string> = {
      'GRA': 'Guyana Revenue Authority',
      'NIS': 'National Insurance Scheme',
      'DCRA': 'Deeds & Commercial Registry Authority',
      'Immigration': 'Immigration Department',
      'MOL': 'Ministry of Labour',
      'EPA': 'Environmental Protection Agency',
      'GSB': 'Guyana Standards Bureau',
      'BOG': 'Bank of Guyana',
      'MOH': 'Ministry of Health',
      'NDIA': 'National Drainage & Irrigation Authority',
      'GWI': 'Guyana Water Inc',
      'GPL': 'Guyana Power & Light',
      'GuyOil': 'GuyOil Company Limited',
      'GGMC': 'Guyana Geology & Mines Commission',
      'MARAD': 'Maritime Administration Department',
      'GCAA': 'Guyana Civil Aviation Authority',
      'CFU': 'Cooperative Financial Union',
      'GoInvest': 'Guyana Office for Investment',
      'GGB': 'Guyana Gaming Board',
      'GPF': 'Guyana Police Force',
      'CARICOM': 'CARICOM Secretariat',
      'CUSTOMS': 'Customs Division',
      'FORESTRY': 'Guyana Forestry Commission',
      'LANDS': 'Lands & Surveys Commission',
      'TRANSPORT': 'Transport & Harbours Department',
      'TOURISM': 'Guyana Tourism Authority',
      'AGRICULTURE': 'Ministry of Agriculture',
      'EDUCATION': 'Ministry of Education',
      'SOCIAL_SERVICES': 'Ministry of Human Services'
    };
    return names[authority] || authority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load dashboard data. Please try again.</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { summary, complianceStatuses, upcomingDeadlines, alerts } = dashboardData;

  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === 'critical') return alert.severity === 'critical';
    if (alertFilter === 'unread') return !alert.acknowledged;
    return true;
  });

  const filteredComplianceStatuses = selectedAuthority === 'all'
    ? complianceStatuses
    : complianceStatuses.filter(status => status.authority === selectedAuthority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {showAllClients ? 'System Compliance Dashboard' : 'Client Compliance Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of Guyanese regulatory compliance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {showAllClients ? 'Total Clients' : 'Compliance Score'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {showAllClients ? summary.totalClients : summary.averageComplianceScore.toFixed(1)}
                  {!showAllClients && '%'}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Green Compliance</p>
                <p className="text-3xl font-bold text-green-600">{summary.greenCompliance}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                <p className="text-3xl font-bold text-yellow-600">{summary.upcomingDeadlines}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-600">{summary.criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>
            Overall compliance distribution across all agencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.greenCompliance}
              </div>
              <div className="text-sm text-gray-600">Green (Compliant)</div>
              <Progress
                value={(summary.greenCompliance / summary.totalClients) * 100}
                className="mt-2 bg-green-100"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.amberCompliance}
              </div>
              <div className="text-sm text-gray-600">Amber (At Risk)</div>
              <Progress
                value={(summary.amberCompliance / summary.totalClients) * 100}
                className="mt-2 bg-yellow-100"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.redCompliance}
              </div>
              <div className="text-sm text-gray-600">Red (Non-Compliant)</div>
              <Progress
                value={(summary.redCompliance / summary.totalClients) * 100}
                className="mt-2 bg-red-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="agencies">Agency Overview</TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Compliance Alerts</CardTitle>
                <div className="flex space-x-2">
                  <select
                    value={alertFilter}
                    onChange={(e) => setAlertFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All Alerts</option>
                    <option value="unread">Unread</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No alerts match the current filter.
                  </p>
                ) : (
                  filteredAlerts.map((alert: any) => (
                    <Alert key={alert.id} className="border-l-4 border-l-current">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                      <div className="flex-1 ml-3">
                        <AlertTitle className="flex items-center justify-between">
                          <span>{alert.title}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {getAuthorityDisplayName(alert.authority)}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getSeverityColor(alert.severity)} text-white`}
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          {alert.message}
                          {alert.actionRequired && (
                            <div className="mt-2 text-sm font-medium text-blue-600">
                              Action Required: {alert.actionRequired}
                            </div>
                          )}
                        </AlertDescription>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Next 30 days of regulatory filing deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No upcoming deadlines in the next 30 days.
                  </p>
                ) : (
                  upcomingDeadlines.map((deadline: any) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium">{deadline.description}</h4>
                            <p className="text-sm text-gray-600">
                              {deadline.client?.name} • {getAuthorityDisplayName(deadline.authority)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(deadline.dueDate).toLocaleDateString()}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            deadline.status === 'overdue'
                              ? 'border-red-200 text-red-800 bg-red-50'
                              : deadline.status === 'due_today'
                              ? 'border-yellow-200 text-yellow-800 bg-yellow-50'
                              : 'border-blue-200 text-blue-800 bg-blue-50'
                          }`}
                        >
                          {deadline.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Status Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compliance Status by Agency</CardTitle>
                <select
                  value={selectedAuthority}
                  onChange={(e) => setSelectedAuthority(e.target.value as Authority | 'all')}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Agencies</option>
                  <option value="GRA">GRA</option>
                  <option value="NIS">NIS</option>
                  <option value="DCRA">DCRA</option>
                  <option value="Immigration">Immigration</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredComplianceStatuses.map((status: any) => (
                  <div
                    key={`${status.clientId}-${status.authority}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium">
                            {status.client?.name || `Client #${status.clientId}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getAuthorityDisplayName(status.authority)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold">{status.score.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">
                          Last updated: {new Date(status.lastAssessment).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getComplianceColor(status.overallStatus)}>
                        {status.overallStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agency Overview Tab */}
        <TabsContent value="agencies">
          <Card>
            <CardHeader>
              <CardTitle>Agency Overview</CardTitle>
              <CardDescription>
                Summary of compliance across all Guyanese regulatory agencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['GRA', 'NIS', 'DCRA', 'Immigration', 'MOL', 'EPA'].map((authority) => {
                  const agencyStatuses = complianceStatuses.filter(
                    (s: any) => s.authority === authority
                  );
                  const avgScore = agencyStatuses.length > 0
                    ? agencyStatuses.reduce((sum: number, s: any) => sum + s.score, 0) / agencyStatuses.length
                    : 0;

                  return (
                    <div key={authority} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">
                        {getAuthorityDisplayName(authority as Authority)}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Avg. Score:</span>
                          <span className="font-medium">{avgScore.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Clients:</span>
                          <span>{agencyStatuses.length}</span>
                        </div>
                        <Progress value={avgScore} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}