"use client";

import {
  CheckCircle,
  FileCheck,
  FileText,
  Play,
  Settings,
  Shield,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClientOnboardingWizard,
  DocumentUploadWizard,
  ServiceRequestWizard,
  ComplianceAssessmentWizard,
  FilingPreparationWizard,
} from "@/components/wizards";
import {
  DynamicTaxForm,
  TaxFormTemplateSelector,
  SmartComplianceChecklist,
} from "@/components/templates";

interface WizardDemo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "wizards" | "templates";
  features: string[];
  component: React.ComponentType<any>;
  estimatedTime: string;
  complexity: "Simple" | "Moderate" | "Advanced";
}

const wizardDemos: WizardDemo[] = [
  {
    id: "client-onboarding",
    title: "Client Onboarding Wizard",
    description: "Multi-step guided client registration and onboarding process with conditional logic and document collection.",
    icon: <Users className="h-6 w-6" />,
    category: "wizards",
    features: [
      "Conditional step visibility",
      "Real-time validation",
      "Auto-save functionality",
      "Progress tracking",
      "Mobile responsive"
    ],
    component: ClientOnboardingWizard,
    estimatedTime: "10-15 minutes",
    complexity: "Moderate",
  },
  {
    id: "document-upload",
    title: "Document Upload Wizard",
    description: "Secure document management with categorization, metadata, and compliance tracking.",
    icon: <Upload className="h-6 w-6" />,
    category: "wizards",
    features: [
      "File categorization",
      "Metadata assignment",
      "Access control",
      "Batch upload support",
      "Document validation"
    ],
    component: DocumentUploadWizard,
    estimatedTime: "5-10 minutes",
    complexity: "Simple",
  },
  {
    id: "service-request",
    title: "Service Request Wizard",
    description: "Comprehensive service booking system with pricing calculation and scheduling integration.",
    icon: <Settings className="h-6 w-6" />,
    category: "wizards",
    features: [
      "Dynamic pricing",
      "Service bundling",
      "Payment integration",
      "Meeting scheduling",
      "Requirements checklist"
    ],
    component: ServiceRequestWizard,
    estimatedTime: "15-20 minutes",
    complexity: "Advanced",
  },
  {
    id: "compliance-assessment",
    title: "Compliance Assessment Wizard",
    description: "Interactive compliance evaluation with scoring, recommendations, and action plans.",
    icon: <Shield className="h-6 w-6" />,
    category: "wizards",
    features: [
      "Smart questionnaire",
      "Risk assessment",
      "Compliance scoring",
      "Action recommendations",
      "Progress tracking"
    ],
    component: ComplianceAssessmentWizard,
    estimatedTime: "20-30 minutes",
    complexity: "Advanced",
  },
  {
    id: "filing-preparation",
    title: "Filing Preparation Wizard",
    description: "Step-by-step tax and regulatory filing process with document checklist and submission options.",
    icon: <FileText className="h-6 w-6" />,
    category: "wizards",
    features: [
      "Multi-filing support",
      "Document tracking",
      "Deadline management",
      "Submission options",
      "Fee calculation"
    ],
    component: FilingPreparationWizard,
    estimatedTime: "15-25 minutes",
    complexity: "Moderate",
  },
];

const templateDemos: WizardDemo[] = [
  {
    id: "dynamic-tax-form",
    title: "Dynamic Tax Form Template",
    description: "Intelligent tax forms that adapt based on client type with auto-calculations and validation.",
    icon: <FileCheck className="h-6 w-6" />,
    category: "templates",
    features: [
      "Conditional fields",
      "Auto-calculations",
      "Real-time validation",
      "Multiple tax types",
      "Save & resume"
    ],
    component: DynamicTaxForm,
    estimatedTime: "30-45 minutes",
    complexity: "Advanced",
  },
  {
    id: "smart-compliance-checklist",
    title: "Smart Compliance Checklist",
    description: "Adaptive compliance tracking that personalizes based on business profile and requirements.",
    icon: <Zap className="h-6 w-6" />,
    category: "templates",
    features: [
      "Business profiling",
      "Adaptive checklists",
      "Progress tracking",
      "Resource links",
      "Deadline alerts"
    ],
    component: SmartComplianceChecklist,
    estimatedTime: "20-30 minutes",
    complexity: "Moderate",
  },
];

export default function WizardsDemo() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleWizardComplete = (data: any) => {
    console.log("Wizard completed with data:", data);
    toast.success("Wizard completed successfully!");
    setActiveDemo(null);
  };

  const handleWizardExit = () => {
    setActiveDemo(null);
    toast.info("Wizard closed");
  };

  const renderDemo = (demo: WizardDemo) => {
    if (!activeDemo || activeDemo !== demo.id) return null;

    const DemoComponent = demo.component;

    // Special handling for different component types
    switch (demo.id) {
      case "dynamic-tax-form":
        return (
          <div className="fixed inset-0 bg-white z-50 overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Dynamic Tax Form Demo</h2>
                <Button onClick={handleWizardExit} variant="outline">
                  Close Demo
                </Button>
              </div>
              {!selectedTemplate ? (
                <TaxFormTemplateSelector
                  onTemplateSelect={setSelectedTemplate}
                />
              ) : (
                <DemoComponent
                  template={selectedTemplate}
                  onSubmit={(data: any) => {
                    console.log("Form submitted:", data);
                    toast.success("Tax form submitted successfully!");
                    setSelectedTemplate(null);
                    setActiveDemo(null);
                  }}
                  onSave={(data: any) => {
                    console.log("Form saved:", data);
                    toast.success("Progress saved");
                  }}
                />
              )}
            </div>
          </div>
        );

      case "smart-compliance-checklist":
        return (
          <div className="fixed inset-0 bg-white z-50 overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Smart Compliance Checklist Demo</h2>
                <Button onClick={handleWizardExit} variant="outline">
                  Close Demo
                </Button>
              </div>
              <DemoComponent
                onTaskComplete={(itemId: string, taskId: string, completed: boolean) => {
                  console.log("Task updated:", { itemId, taskId, completed });
                }}
                onSaveProgress={(progress: any) => {
                  console.log("Progress saved:", progress);
                }}
              />
            </div>
          </div>
        );

      default:
        return (
          <DemoComponent
            onComplete={handleWizardComplete}
            onExit={handleWizardExit}
          />
        );
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Simple": return "bg-green-100 text-green-800";
      case "Moderate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Render active demo */}
      {activeDemo && renderDemo([...wizardDemos, ...templateDemos].find(d => d.id === activeDemo)!)}

      {/* Main content */}
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GCMC-KAJ Wizard & Template Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive collection of interactive wizards and smart templates
            designed to streamline business tax services and compliance workflows.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart & Adaptive</h3>
              <p className="text-gray-600">
                Forms and workflows that adapt based on user inputs and business requirements
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Compliance Focused</h3>
              <p className="text-gray-600">
                Built-in validation and compliance checks for Guyanese business regulations
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User-Friendly</h3>
              <p className="text-gray-600">
                Intuitive interfaces with progress tracking and mobile optimization
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demos */}
        <Tabs defaultValue="wizards" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="wizards">Interactive Wizards</TabsTrigger>
            <TabsTrigger value="templates">Smart Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="wizards" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interactive Wizards</h2>
              <p className="text-gray-600">
                Multi-step guided processes for complex business workflows
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wizardDemos.map((demo) => (
                <Card key={demo.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {demo.icon}
                        <CardTitle className="text-lg">{demo.title}</CardTitle>
                      </div>
                      <Badge className={getComplexityColor(demo.complexity)}>
                        {demo.complexity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{demo.description}</p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {demo.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Est. Time: {demo.estimatedTime}</span>
                      </div>

                      <Button
                        onClick={() => setActiveDemo(demo.id)}
                        className="w-full mt-4"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Templates</h2>
              <p className="text-gray-600">
                Adaptive forms and interfaces that customize based on user needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templateDemos.map((demo) => (
                <Card key={demo.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {demo.icon}
                        <CardTitle className="text-lg">{demo.title}</CardTitle>
                      </div>
                      <Badge className={getComplexityColor(demo.complexity)}>
                        {demo.complexity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{demo.description}</p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {demo.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Est. Time: {demo.estimatedTime}</span>
                      </div>

                      <Button
                        onClick={() => setActiveDemo(demo.id)}
                        className="w-full mt-4"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Technical Features */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Features</h2>
            <p className="text-gray-600">
              Built with modern technologies for optimal performance and user experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">State Management</h3>
                <p className="text-sm text-gray-600">React Context for wizard state with auto-save</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Validation</h3>
                <p className="text-sm text-gray-600">Zod schemas for type-safe form validation</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Storage</h3>
                <p className="text-sm text-gray-600">Local & server storage with sync capabilities</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Customizable</h3>
                <p className="text-sm text-gray-600">Configurable steps, validation, and styling</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}