"use client";

import {
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  WizardProvider,
  useStepData,
  type WizardStep,
} from "@/lib/wizard/wizard-context";
import { WizardLayout } from "./wizard-layout";

// Compliance areas and questions
interface ComplianceQuestion {
  id: string;
  question: string;
  description?: string;
  required: boolean;
  type: "boolean" | "select" | "number" | "text";
  options?: Array<{ value: string; label: string; score: number }>;
  weight: number; // Weight for scoring
  category: "critical" | "important" | "standard";
}

interface ComplianceArea {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  questions: ComplianceQuestion[];
  maxScore: number;
}

const complianceAreas: ComplianceArea[] = [
  {
    id: "tax_compliance",
    name: "Tax Compliance",
    description: "Assessment of tax filing and payment obligations",
    icon: <FileCheck className="h-5 w-5" />,
    maxScore: 100,
    questions: [
      {
        id: "tax_returns_current",
        question: "Are all tax returns filed up to current date?",
        description: "Including personal and corporate income tax returns",
        required: true,
        type: "select",
        options: [
          { value: "yes", label: "Yes, all current", score: 20 },
          { value: "mostly", label: "Mostly current (1-2 periods behind)", score: 15 },
          { value: "behind", label: "Behind by 3+ periods", score: 5 },
          { value: "never", label: "Never filed", score: 0 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "tax_payments_current",
        question: "Are all tax payments up to date?",
        description: "Including PAYE, advance tax, and other tax obligations",
        required: true,
        type: "select",
        options: [
          { value: "yes", label: "Yes, all paid", score: 20 },
          { value: "mostly", label: "Minor arrears (under 30 days)", score: 15 },
          { value: "behind", label: "Significant arrears (over 30 days)", score: 5 },
          { value: "major", label: "Major arrears (over 90 days)", score: 0 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "withholding_tax",
        question: "Is withholding tax properly deducted and remitted?",
        required: true,
        type: "select",
        options: [
          { value: "yes", label: "Always", score: 15 },
          { value: "usually", label: "Usually", score: 10 },
          { value: "sometimes", label: "Sometimes", score: 5 },
          { value: "no", label: "Never/Not applicable", score: 0 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "vat_registration",
        question: "If required, is VAT registration current?",
        required: false,
        type: "select",
        options: [
          { value: "registered_current", label: "Registered and current", score: 15 },
          { value: "registered_behind", label: "Registered but behind", score: 8 },
          { value: "should_register", label: "Should be registered but not", score: 2 },
          { value: "not_required", label: "Not required", score: 15 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "tax_planning",
        question: "Is there a formal tax planning strategy?",
        required: false,
        type: "select",
        options: [
          { value: "comprehensive", label: "Comprehensive strategy", score: 15 },
          { value: "basic", label: "Basic planning", score: 10 },
          { value: "minimal", label: "Minimal planning", score: 5 },
          { value: "none", label: "No planning", score: 0 },
        ],
        weight: 1,
        category: "standard",
      },
    ],
  },
  {
    id: "business_registration",
    name: "Business Registration & Licensing",
    description: "Business registration and license compliance status",
    icon: <Users className="h-5 w-5" />,
    maxScore: 100,
    questions: [
      {
        id: "business_registered",
        question: "Is the business properly registered?",
        description: "With DCRA or other relevant authorities",
        required: true,
        type: "select",
        options: [
          { value: "yes", label: "Yes, fully registered", score: 25 },
          { value: "partial", label: "Partially registered", score: 15 },
          { value: "expired", label: "Registration expired", score: 5 },
          { value: "no", label: "Not registered", score: 0 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "trade_license",
        question: "Is the trade license current and valid?",
        required: true,
        type: "select",
        options: [
          { value: "current", label: "Current and valid", score: 20 },
          { value: "expiring", label: "Expiring soon (within 60 days)", score: 15 },
          { value: "expired", label: "Expired", score: 5 },
          { value: "none", label: "No trade license", score: 0 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "professional_licenses",
        question: "Are professional licenses (if required) current?",
        required: false,
        type: "select",
        options: [
          { value: "current", label: "All current", score: 20 },
          { value: "some_expired", label: "Some expired", score: 10 },
          { value: "all_expired", label: "All expired", score: 0 },
          { value: "not_required", label: "Not required", score: 20 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "annual_returns",
        question: "Are annual returns filed with DCRA?",
        required: true,
        type: "select",
        options: [
          { value: "current", label: "Current", score: 15 },
          { value: "late", label: "Late but filed", score: 10 },
          { value: "overdue", label: "Overdue", score: 2 },
          { value: "never", label: "Never filed", score: 0 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "ownership_changes",
        question: "Have ownership changes been properly reported?",
        required: false,
        type: "select",
        options: [
          { value: "reported", label: "All changes reported", score: 20 },
          { value: "some_unreported", label: "Some unreported", score: 10 },
          { value: "none_reported", label: "Changes not reported", score: 0 },
          { value: "no_changes", label: "No ownership changes", score: 20 },
        ],
        weight: 1,
        category: "standard",
      },
    ],
  },
  {
    id: "nis_compliance",
    name: "NIS Compliance",
    description: "National Insurance Scheme compliance",
    icon: <Shield className="h-5 w-5" />,
    maxScore: 100,
    questions: [
      {
        id: "nis_registered",
        question: "Is the business registered with NIS?",
        required: true,
        type: "select",
        options: [
          { value: "yes", label: "Yes, registered", score: 20 },
          { value: "pending", label: "Application pending", score: 10 },
          { value: "no", label: "Not registered", score: 0 },
          { value: "not_required", label: "Not required", score: 20 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "employee_contributions",
        question: "Are employee NIS contributions current?",
        required: true,
        type: "select",
        options: [
          { value: "current", label: "All current", score: 25 },
          { value: "minor_arrears", label: "Minor arrears (1-2 months)", score: 15 },
          { value: "major_arrears", label: "Major arrears (3+ months)", score: 5 },
          { value: "no_employees", label: "No employees", score: 25 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "employer_contributions",
        question: "Are employer NIS contributions current?",
        required: true,
        type: "select",
        options: [
          { value: "current", label: "All current", score: 25 },
          { value: "minor_arrears", label: "Minor arrears", score: 15 },
          { value: "major_arrears", label: "Major arrears", score: 5 },
          { value: "no_obligation", label: "No obligation", score: 25 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "nis_forms",
        question: "Are NIS forms submitted regularly?",
        required: true,
        type: "select",
        options: [
          { value: "regular", label: "Regular and timely", score: 15 },
          { value: "occasional", label: "Occasional delays", score: 10 },
          { value: "irregular", label: "Irregular submission", score: 5 },
          { value: "never", label: "Never submitted", score: 0 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "nis_records",
        question: "Are proper NIS records maintained?",
        required: false,
        type: "select",
        options: [
          { value: "comprehensive", label: "Comprehensive records", score: 15 },
          { value: "basic", label: "Basic records", score: 10 },
          { value: "minimal", label: "Minimal records", score: 5 },
          { value: "none", label: "No records", score: 0 },
        ],
        weight: 1,
        category: "standard",
      },
    ],
  },
  {
    id: "environmental_compliance",
    name: "Environmental Compliance",
    description: "EPA and environmental regulation compliance",
    icon: <TrendingUp className="h-5 w-5" />,
    maxScore: 100,
    questions: [
      {
        id: "epa_permits",
        question: "Are required EPA permits current?",
        required: false,
        type: "select",
        options: [
          { value: "current", label: "All permits current", score: 30 },
          { value: "expiring", label: "Some expiring soon", score: 20 },
          { value: "expired", label: "Some expired", score: 10 },
          { value: "not_required", label: "No permits required", score: 30 },
        ],
        weight: 1,
        category: "critical",
      },
      {
        id: "environmental_impact",
        question: "Has environmental impact been assessed?",
        required: false,
        type: "select",
        options: [
          { value: "assessed", label: "Formally assessed", score: 25 },
          { value: "informal", label: "Informal assessment", score: 15 },
          { value: "planned", label: "Assessment planned", score: 10 },
          { value: "not_done", label: "Not assessed", score: 0 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "waste_management",
        question: "Is waste management compliant?",
        required: false,
        type: "select",
        options: [
          { value: "compliant", label: "Fully compliant", score: 20 },
          { value: "mostly", label: "Mostly compliant", score: 15 },
          { value: "some_issues", label: "Some compliance issues", score: 8 },
          { value: "non_compliant", label: "Non-compliant", score: 0 },
        ],
        weight: 1,
        category: "important",
      },
      {
        id: "environmental_monitoring",
        question: "Is environmental monitoring in place?",
        required: false,
        type: "select",
        options: [
          { value: "regular", label: "Regular monitoring", score: 15 },
          { value: "periodic", label: "Periodic monitoring", score: 10 },
          { value: "minimal", label: "Minimal monitoring", score: 5 },
          { value: "none", label: "No monitoring", score: 0 },
        ],
        weight: 1,
        category: "standard",
      },
      {
        id: "environmental_training",
        question: "Is environmental training provided to staff?",
        required: false,
        type: "select",
        options: [
          { value: "regular", label: "Regular training", score: 10 },
          { value: "initial", label: "Initial training only", score: 6 },
          { value: "informal", label: "Informal training", score: 3 },
          { value: "none", label: "No training", score: 0 },
        ],
        weight: 1,
        category: "standard",
      },
    ],
  },
];

// Validation schemas
const businessInfoSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.enum(["sole_proprietorship", "partnership", "company", "other"]),
  industry: z.string().min(1, "Industry is required"),
  employees: z.number().min(0, "Number of employees must be positive"),
  annualRevenue: z.enum(["under_100k", "100k_500k", "500k_1m", "1m_5m", "5m_plus"]),
  operatingYears: z.number().min(0, "Operating years must be positive"),
});

const assessmentSchema = z.object({
  responses: z.record(z.any()).refine(
    (data) => Object.keys(data).length > 0,
    "Please answer at least one question"
  ),
});

// Step 1: Business Information
function BusinessInfoStep() {
  const [data, setData] = useStepData("business-info");

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            placeholder="Enter your business name"
            value={data.businessName || ""}
            onChange={(e) => handleChange("businessName", e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Business Type</Label>
            <Select value={data.businessType || ""} onValueChange={(value) => handleChange("businessType", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="company">Company/Corporation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., Manufacturing, Retail, Services"
              value={data.industry || ""}
              onChange={(e) => handleChange("industry", e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employees">Number of Employees</Label>
            <Input
              id="employees"
              type="number"
              min="0"
              value={data.employees || ""}
              onChange={(e) => handleChange("employees", parseInt(e.target.value) || 0)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="operatingYears">Years in Operation</Label>
            <Input
              id="operatingYears"
              type="number"
              min="0"
              value={data.operatingYears || ""}
              onChange={(e) => handleChange("operatingYears", parseInt(e.target.value) || 0)}
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label>Annual Revenue Range</Label>
          <Select value={data.annualRevenue || ""} onValueChange={(value) => handleChange("annualRevenue", value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select revenue range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under_100k">Under $100,000</SelectItem>
              <SelectItem value="100k_500k">$100,000 - $500,000</SelectItem>
              <SelectItem value="500k_1m">$500,000 - $1,000,000</SelectItem>
              <SelectItem value="1m_5m">$1,000,000 - $5,000,000</SelectItem>
              <SelectItem value="5m_plus">Over $5,000,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 2: Compliance Assessment
function AssessmentStep() {
  const [data, setData] = useStepData("assessment");
  const [activeArea, setActiveArea] = useState(complianceAreas[0].id);
  const responses = data.responses || {};

  const handleResponseChange = (questionId: string, value: any) => {
    const updatedResponses = { ...responses, [questionId]: value };
    setData({ ...data, responses: updatedResponses });
  };

  const getAreaScore = (areaId: string) => {
    const area = complianceAreas.find(a => a.id === areaId);
    if (!area) return 0;

    let score = 0;
    let totalPossible = 0;

    area.questions.forEach(question => {
      const response = responses[question.id];
      if (response && question.type === "select") {
        const option = question.options?.find(opt => opt.value === response);
        if (option) score += option.score;
      }

      const maxQuestionScore = Math.max(...(question.options?.map(opt => opt.score) || [0]));
      totalPossible += maxQuestionScore;
    });

    return totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
  };

  const getOverallProgress = () => {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    complianceAreas.forEach(area => {
      area.questions.forEach(question => {
        totalQuestions++;
        if (responses[question.id]) answeredQuestions++;
      });
    });

    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  const currentArea = complianceAreas.find(area => area.id === activeArea) || complianceAreas[0];

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{getOverallProgress()}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {complianceAreas.map(area => (
                <div key={area.id} className="text-center">
                  <div className="text-lg font-semibold">{getAreaScore(area.id)}%</div>
                  <div className="text-sm text-gray-600">{area.name}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Area Selection */}
      <div className="flex flex-wrap gap-2">
        {complianceAreas.map(area => (
          <Button
            key={area.id}
            variant={activeArea === area.id ? "default" : "outline"}
            onClick={() => setActiveArea(area.id)}
            className="flex items-center gap-2"
          >
            {area.icon}
            {area.name}
          </Button>
        ))}
      </div>

      {/* Current Area Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentArea.icon}
            {currentArea.name}
          </CardTitle>
          <p className="text-sm text-gray-600">{currentArea.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentArea.questions.map(question => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    {question.question}
                    {question.required && <span className="text-red-500">*</span>}
                    {question.category === "critical" && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Critical</span>
                    )}
                    {question.category === "important" && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Important</span>
                    )}
                  </Label>
                  {question.description && (
                    <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                  )}
                </div>
              </div>

              {question.type === "select" && question.options && (
                <Select
                  value={responses[question.id] || ""}
                  onValueChange={(value) => handleResponseChange(question.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <span className="text-xs text-gray-500 ml-2">({option.score} pts)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {question.type === "text" && (
                <Textarea
                  placeholder="Enter details..."
                  value={responses[question.id] || ""}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  rows={3}
                />
              )}

              {question.type === "number" && (
                <Input
                  type="number"
                  placeholder="Enter number..."
                  value={responses[question.id] || ""}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                />
              )}

              {question.type === "boolean" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={responses[question.id] === "yes"}
                      onCheckedChange={(checked) => handleResponseChange(question.id, checked ? "yes" : "no")}
                    />
                    <Label>Yes</Label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Step 3: Results and Recommendations
function ResultsStep() {
  const [assessmentData] = useStepData("assessment");
  const [businessData] = useStepData("business-info");

  const responses = assessmentData.responses || {};

  const calculateResults = useMemo(() => {
    const results = complianceAreas.map(area => {
      let score = 0;
      let maxScore = 0;
      let criticalIssues = 0;
      let importantIssues = 0;

      area.questions.forEach(question => {
        const response = responses[question.id];
        let questionScore = 0;

        if (question.type === "select" && response && question.options) {
          const option = question.options.find(opt => opt.value === response);
          if (option) {
            questionScore = option.score;
            const maxQuestionScore = Math.max(...question.options.map(opt => opt.score));

            // Check for issues
            const scorePercentage = (questionScore / maxQuestionScore) * 100;
            if (scorePercentage < 50) {
              if (question.category === "critical") criticalIssues++;
              else if (question.category === "important") importantIssues++;
            }
          }
        }

        score += questionScore;
        const maxQuestionScore = question.options ? Math.max(...question.options.map(opt => opt.score)) : 0;
        maxScore += maxQuestionScore;
      });

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      return {
        ...area,
        score,
        maxScore,
        percentage,
        criticalIssues,
        importantIssues,
        status: percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : percentage >= 40 ? "fair" : "poor"
      };
    });

    const overallScore = results.reduce((sum, result) => sum + result.score, 0);
    const overallMaxScore = results.reduce((sum, result) => sum + result.maxScore, 0);
    const overallPercentage = overallMaxScore > 0 ? Math.round((overallScore / overallMaxScore) * 100) : 0;

    return { areas: results, overall: overallPercentage };
  }, [responses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "good": return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "fair": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "poor": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-700 bg-green-50 border-green-200";
      case "good": return "text-blue-700 bg-blue-50 border-blue-200";
      case "fair": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "poor": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getRecommendations = () => {
    const recs: string[] = [];

    calculateResults.areas.forEach(area => {
      if (area.criticalIssues > 0) {
        recs.push(`Address ${area.criticalIssues} critical issue(s) in ${area.name}`);
      }
      if (area.percentage < 60) {
        recs.push(`Improve overall compliance in ${area.name} (currently ${area.percentage}%)`);
      }
    });

    if (calculateResults.overall < 70) {
      recs.push("Schedule comprehensive compliance review with our experts");
    }

    return recs;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div>
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {calculateResults.overall}%
              </div>
              <div className="text-xl text-gray-600">Overall Compliance Score</div>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(
              calculateResults.overall >= 80 ? "excellent" :
              calculateResults.overall >= 60 ? "good" :
              calculateResults.overall >= 40 ? "fair" : "poor"
            )}`}>
              {getStatusIcon(
                calculateResults.overall >= 80 ? "excellent" :
                calculateResults.overall >= 60 ? "good" :
                calculateResults.overall >= 40 ? "fair" : "poor"
              )}
              <span className="font-medium">
                {calculateResults.overall >= 80 ? "Excellent Compliance" :
                 calculateResults.overall >= 60 ? "Good Compliance" :
                 calculateResults.overall >= 40 ? "Fair Compliance" : "Needs Improvement"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Area Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {calculateResults.areas.map(area => (
          <Card key={area.id} className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {area.icon}
                {area.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{area.percentage}%</span>
                {getStatusIcon(area.status)}
              </div>
              <Progress value={area.percentage} className="h-2" />
              <div className="text-sm space-y-1">
                {area.criticalIssues > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {area.criticalIssues} critical issue(s)
                  </div>
                )}
                {area.importantIssues > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-3 w-3" />
                    {area.importantIssues} important issue(s)
                  </div>
                )}
                <div className="text-gray-600">
                  {area.score} / {area.maxScore} points
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getRecommendations().length > 0 ? (
            <ul className="space-y-2">
              {getRecommendations().map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
              <p className="text-green-700 font-medium">Excellent compliance!</p>
              <p className="text-gray-600">No immediate action required.</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Schedule a consultation to discuss these results</li>
              <li>• Receive a detailed compliance action plan</li>
              <li>• Get assistance with priority compliance issues</li>
              <li>• Set up ongoing compliance monitoring</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Business Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Business:</span>
              <div className="font-medium">{businessData.businessName}</div>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <div className="font-medium">{businessData.businessType?.replace('_', ' ')}</div>
            </div>
            <div>
              <span className="text-gray-600">Industry:</span>
              <div className="font-medium">{businessData.industry}</div>
            </div>
            <div>
              <span className="text-gray-600">Assessment Date:</span>
              <div className="font-medium">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const wizardSteps: WizardStep[] = [
  {
    id: "business-info",
    title: "Business Information",
    description: "Tell us about your business",
    icon: <Users className="h-6 w-6" />,
    validation: businessInfoSchema,
    component: BusinessInfoStep,
  },
  {
    id: "assessment",
    title: "Compliance Assessment",
    description: "Answer compliance questions",
    icon: <Shield className="h-6 w-6" />,
    validation: assessmentSchema,
    component: AssessmentStep,
  },
  {
    id: "results",
    title: "Results & Recommendations",
    description: "Your compliance score and next steps",
    icon: <TrendingUp className="h-6 w-6" />,
    component: ResultsStep,
  },
];

interface ComplianceAssessmentWizardProps {
  onComplete?: (data: any) => Promise<void>;
  onExit?: () => void;
}

export function ComplianceAssessmentWizard({
  onComplete,
  onExit,
}: ComplianceAssessmentWizardProps) {
  const handleSave = async (data: any, sessionId: string) => {
    localStorage.setItem(`compliance-wizard-${sessionId}`, JSON.stringify(data));
  };

  const handleLoad = async (sessionId: string) => {
    const saved = localStorage.getItem(`compliance-wizard-${sessionId}`);
    return saved ? JSON.parse(saved) : null;
  };

  return (
    <WizardProvider
      steps={wizardSteps}
      onComplete={onComplete}
      onSave={handleSave}
      onLoad={handleLoad}
    >
      <WizardLayout
        title="Compliance Assessment"
        subtitle="Comprehensive compliance review for your business"
        onExit={onExit}
      >
        <ComplianceAssessmentWizardContent />
      </WizardLayout>
    </WizardProvider>
  );
}

function ComplianceAssessmentWizardContent() {
  const { currentStep } = useWizard();
  const StepComponent = currentStep.component;
  return <StepComponent />;
}