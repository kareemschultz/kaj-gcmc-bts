"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Brain,
  Zap,
  Camera,
  Eye,
  Shield,
  Star,
  CheckCircle,
  Building,
  Users,
  TrendingUp,
  Layers,
  Target,
  Award,
  Globe,
  Book,
  HeadphonesIcon,
  PlayCircle,
  ArrowRight,
  FileCheck,
  ScanLine,
  Workflow,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import SmartDocumentManagement, { type SmartDocument } from '@/components/documents/smart-document-management';
import { SmartDocumentUploader } from '@/components/documents/smart-document-uploader';
import { AgencyDocumentSelector } from '@/components/documents/agency-document-selector';
import DocumentPreviewGallery from '@/components/documents/document-preview-gallery';
import MobileDocumentScanner from '@/components/documents/mobile-document-scanner';
import { DocumentValidation } from '@/components/documents/document-validation';
import { brandColors, gcmcKajBrand } from '@/styles/brand';
import { toast } from 'sonner';

export default function SmartDocumentsDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string>('overview');
  const [demoDocuments, setDemoDocuments] = useState<SmartDocument[]>([]);

  // Mock data for demo
  const demoStats = {
    totalDocuments: 1247,
    processedToday: 89,
    avgComplianceScore: 94,
    timesSaved: '15 hours',
    agenciesSupported: 4,
    validationRules: 25,
    successRate: 98.7,
    userSatisfaction: 4.9
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Categorization",
      description: "Automatically categorizes documents using intelligent analysis",
      color: brandColors.primary[600]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Guyanese Compliance",
      description: "Built-in validation for GRA, NIS, DCRA, and Immigration requirements",
      color: gcmcKajBrand.emerald[600]
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Mobile Document Scanner",
      description: "Capture documents using your mobile device camera",
      color: brandColors.warning[600]
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Rich Preview Gallery",
      description: "Preview, annotate, and edit documents with advanced tools",
      color: brandColors.danger[600]
    },
    {
      icon: <FileCheck className="w-6 h-6" />,
      title: "Smart Validation",
      description: "Comprehensive validation with auto-fix capabilities",
      color: brandColors.primary[700]
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: "Workflow Automation",
      description: "Automated approval workflows for different document types",
      color: gcmcKajBrand.emerald[700]
    }
  ];

  const agencies = [
    {
      id: 'GRA',
      name: 'Guyana Revenue Authority',
      description: 'Tax returns, VAT certificates, income statements',
      documents: 524,
      compliance: 96,
      color: brandColors.primary[600]
    },
    {
      id: 'NIS',
      name: 'National Insurance Scheme',
      description: 'Contribution schedules, employee reports',
      documents: 312,
      compliance: 94,
      color: gcmcKajBrand.emerald[600]
    },
    {
      id: 'DCRA',
      name: 'Deeds & Commercial Registry',
      description: 'Registration certificates, annual returns',
      documents: 287,
      compliance: 92,
      color: brandColors.warning[600]
    },
    {
      id: 'IMMIGRATION',
      name: 'Immigration Department',
      description: 'Work permits, visa applications',
      documents: 124,
      compliance: 98,
      color: brandColors.danger[600]
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "95% Faster Processing",
      description: "Dramatically reduce document processing time with AI automation",
      metric: "15 hours saved daily"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "99.2% Accuracy",
      description: "Near-perfect accuracy in document categorization and validation",
      metric: "99.2% success rate"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "100% Compliant",
      description: "Built-in compliance checks for all Guyanese regulatory requirements",
      metric: "Zero violations"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "500+ Satisfied Users",
      description: "Trusted by businesses across Guyana for their document needs",
      metric: "4.9/5 rating"
    }
  ];

  const handleDemoSubmit = async (documents: SmartDocument[]) => {
    setDemoDocuments(documents);
    toast.success(`Demo: ${documents.length} documents submitted successfully!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Document Upload
              </h1>
            </div>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Intelligent, agency-aware document management system with AI-powered categorization,
              compliance validation, and automated workflows for Guyanese regulatory requirements.
            </p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Globe className="w-4 h-4 mr-2 text-green-500" />
                Guyana Compliant
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Star className="w-4 h-4 mr-2 text-purple-500" />
                Enterprise Ready
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{demoStats.totalDocuments.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Documents Processed</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">{demoStats.avgComplianceScore}%</div>
                  <div className="text-sm text-gray-600">Avg Compliance Score</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{demoStats.timesSaved}</div>
                  <div className="text-sm text-gray-600">Time Saved Daily</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{demoStats.successRate}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Intelligent Document Management Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need for efficient, compliant document processing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Interactive Demo
            </h2>
            <p className="text-lg text-gray-600">
              Try out the smart document management system
            </p>
          </div>

          <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="uploader">Smart Upload</TabsTrigger>
              <TabsTrigger value="categorize">Categorization</TabsTrigger>
              <TabsTrigger value="scanner">Mobile Scanner</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="preview">Preview Gallery</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="overview" className="space-y-6">
                <SmartDocumentManagement
                  onDocumentSubmit={handleDemoSubmit}
                  layoutMode="fullscreen"
                  className="h-[600px] rounded-lg border shadow-lg"
                />
              </TabsContent>

              <TabsContent value="uploader" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Smart Document Uploader Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SmartDocumentUploader
                      multiple={true}
                      enableOCR={true}
                      enableMobileCapture={true}
                      onUpload={async (files) => {
                        toast.success(`Demo: ${files.length} files uploaded!`);
                      }}
                      className="h-[400px]"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categorize" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-green-600" />
                      Agency Document Selector Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AgencyDocumentSelector
                      showTemplates={true}
                      showSuggestions={true}
                      showStatistics={true}
                      onTemplateSelect={(template) => {
                        toast.info(`Template selected: ${template.name}`);
                      }}
                      className="h-[500px]"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scanner" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-purple-600" />
                      Mobile Document Scanner Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[600px] bg-black rounded-lg overflow-hidden">
                      <div className="h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-xl font-semibold mb-2">Camera Scanner</h3>
                          <p className="text-gray-400 mb-4">Click to enable camera access</p>
                          <Button variant="outline" className="text-white border-white">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Scanner
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="validation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      Document Validation Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] flex items-center justify-center text-center">
                      <div>
                        <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Document Validation</h3>
                        <p className="text-gray-600 mb-4">
                          Upload documents to see comprehensive validation with Guyanese compliance checks
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">25</div>
                            <div className="text-gray-600">Validation Rules</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">4</div>
                            <div className="text-gray-600">Agencies Covered</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-600" />
                      Document Preview Gallery Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Eye className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h3>
                        <p className="text-gray-600">
                          Rich document viewer with annotation and editing capabilities
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workflow" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="w-5 h-5 text-orange-600" />
                      Workflow Management Demo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] flex items-center justify-center text-center">
                      <div>
                        <Workflow className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Automated Workflows</h3>
                        <p className="text-gray-600 mb-4">
                          Smart workflows automatically adapt to document types and agency requirements
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xl font-bold text-blue-600">Auto</div>
                            <div className="text-gray-600">Routing</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600">Smart</div>
                            <div className="text-gray-600">Approvals</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-purple-600">Real-time</div>
                            <div className="text-gray-600">Updates</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Agencies Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Supported Guyanese Agencies
            </h2>
            <p className="text-lg text-gray-600">
              Built-in support for all major regulatory bodies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agencies.map((agency, index) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 text-center">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${agency.color}15` }}
                    >
                      <Building className="w-6 h-6" style={{ color: agency.color }} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{agency.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{agency.description}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Documents:</span>
                        <span className="font-medium">{agency.documents}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Compliance:</span>
                        <span className="font-medium text-green-600">{agency.compliance}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our System?</h2>
            <p className="text-lg text-gray-300">
              Measurable benefits that transform your document workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-300 mb-4">{benefit.description}</p>
                <div className="text-2xl font-bold text-yellow-400">{benefit.metric}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of Guyanese businesses already using our intelligent document management system
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <PlayCircle className="w-5 h-5 mr-2" />
              Try Live Demo
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              <Book className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              <HeadphonesIcon className="w-5 h-5 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}