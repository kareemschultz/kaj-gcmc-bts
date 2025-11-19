"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  FileCheck,
  FileText,
  Send,
  Shield,
  Upload,
} from "lucide-react";
import React, { useState } from "react";
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

// Filing types and requirements
interface FilingType {
  id: string;
  name: string;
  description: string;
  category: "tax" | "regulatory" | "compliance";
  deadline: string;
  requiredDocuments: string[];
  estimatedTime: string;
  priority: "high" | "medium" | "low";
  filingFee: number;
}

const availableFilings: FilingType[] = [
  {
    id: "individual_income_tax",
    name: "Individual Income Tax Return",
    description: "Annual personal income tax filing with GRA",
    category: "tax",
    deadline: "April 30th",
    requiredDocuments: [
      "Employment income statements",
      "Investment income statements",
      "Previous year tax return",
      "Bank statements",
      "Receipt for deductible expenses"
    ],
    estimatedTime: "5-7 business days",
    priority: "high",
    filingFee: 0,
  },
  {
    id: "company_income_tax",
    name: "Company Income Tax Return",
    description: "Annual corporate income tax filing",
    category: "tax",
    deadline: "April 30th",
    requiredDocuments: [
      "Audited financial statements",
      "Trial balance",
      "General ledger",
      "Bank statements",
      "Previous year tax return",
      "Depreciation schedule"
    ],
    estimatedTime: "10-15 business days",
    priority: "high",
    filingFee: 5000,
  },
  {
    id: "vat_return",
    name: "VAT Return",
    description: "Monthly/Quarterly VAT return filing",
    category: "tax",
    deadline: "21st of following month",
    requiredDocuments: [
      "Sales invoices",
      "Purchase invoices",
      "VAT input/output records",
      "Bank statements",
      "Previous VAT returns"
    ],
    estimatedTime: "3-5 business days",
    priority: "high",
    filingFee: 0,
  },
  {
    id: "withholding_tax",
    name: "Withholding Tax Return",
    description: "Monthly withholding tax filing",
    category: "tax",
    deadline: "15th of following month",
    requiredDocuments: [
      "Payment vouchers",
      "Invoices with WHT",
      "Employee payroll records",
      "Contractor payment records"
    ],
    estimatedTime: "2-3 business days",
    priority: "medium",
    filingFee: 0,
  },
  {
    id: "nis_contributions",
    name: "NIS Contributions",
    description: "Monthly NIS contribution filing",
    category: "regulatory",
    deadline: "15th of following month",
    requiredDocuments: [
      "Payroll records",
      "Employee NIS numbers",
      "Previous NIS returns",
      "Changes in employment"
    ],
    estimatedTime: "2-3 business days",
    priority: "high",
    filingFee: 0,
  },
  {
    id: "annual_return",
    name: "Company Annual Return",
    description: "Annual return filing with DCRA",
    category: "regulatory",
    deadline: "Anniversary of incorporation",
    requiredDocuments: [
      "Current list of directors",
      "Share register",
      "Registered office address",
      "Current memorandum and articles"
    ],
    estimatedTime: "5-7 business days",
    priority: "medium",
    filingFee: 2500,
  },
];

// Validation schemas
const filingSelectionSchema = z.object({
  selectedFilings: z.array(z.string()).min(1, "Please select at least one filing"),
  taxYear: z.string().min(1, "Tax year is required"),
  filingPeriod: z.string().optional(),
  urgency: z.enum(["standard", "urgent", "emergency"]).default("standard"),
  specialInstructions: z.string().optional(),
});

const documentsSchema = z.object({
  documentChecklist: z.record(z.boolean()),
  additionalDocuments: z.array(z.string()).optional(),
  documentNotes: z.string().optional(),
  documentsComplete: z.boolean().refine(val => val, "Please confirm documents are complete"),
});

const reviewSchema = z.object({
  dataAccurate: z.boolean().refine(val => val, "Please confirm data accuracy"),
  authorizedToFile: z.boolean().refine(val => val, "Authorization required"),
  understoodDeadlines: z.boolean().refine(val => val, "Please acknowledge deadlines"),
  agreedToTerms: z.boolean().refine(val => val, "Must agree to terms"),
});

const submissionSchema = z.object({
  submissionMethod: z.enum(["online", "paper", "both"]),
  deliveryMethod: z.enum(["electronic", "mail", "pickup", "courier"]).optional(),
  contactForQuestions: z.string().optional(),
  backupContact: z.string().optional(),
});

// Step 1: Filing Selection
function FilingSelectionStep() {
  const [data, setData] = useStepData("filing-selection");
  const [selectedFilings, setSelectedFilings] = useState<string[]>(data.selectedFilings || []);

  const handleFilingToggle = (filingId: string) => {
    const updated = selectedFilings.includes(filingId)
      ? selectedFilings.filter(id => id !== filingId)
      : [...selectedFilings, filingId];

    setSelectedFilings(updated);
    setData({ ...data, selectedFilings: updated });
  };

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  const calculateTotalFees = () => {
    return selectedFilings.reduce((total, filingId) => {
      const filing = availableFilings.find(f => f.id === filingId);
      return total + (filing?.filingFee || 0);
    }, 0);
  };

  const getEstimatedTimeframe = () => {
    if (selectedFilings.length === 0) return "N/A";

    const maxDays = Math.max(...selectedFilings.map(filingId => {
      const filing = availableFilings.find(f => f.id === filingId);
      const timeStr = filing?.estimatedTime || "1 day";
      const match = timeStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : 1;
    }));

    return `${maxDays}-${maxDays + 5} business days`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Filings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["tax", "regulatory", "compliance"].map(category => (
              <div key={category}>
                <h3 className="font-semibold capitalize mb-3">{category} Filings</h3>
                <div className="grid grid-cols-1 gap-3">
                  {availableFilings
                    .filter(filing => filing.category === category)
                    .map(filing => (
                      <Card
                        key={filing.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedFilings.includes(filing.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                        }`}
                        onClick={() => handleFilingToggle(filing.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{filing.name}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  filing.priority === "high" ? "bg-red-100 text-red-800" :
                                  filing.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-green-100 text-green-800"
                                }`}>
                                  {filing.priority} priority
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{filing.description}</p>
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div>
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  {filing.estimatedTime}
                                </div>
                                <div>
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  Due: {filing.deadline}
                                </div>
                                {filing.filingFee > 0 && (
                                  <div className="col-span-2">
                                    Fee: ${filing.filingFee.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              checked={selectedFilings.includes(filing.id)}
                              onChange={() => {}} // Handled by card click
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {selectedFilings.length > 0 && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-green-900 mb-3">Filing Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Selected filings:</span>
                    <span>{selectedFilings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated timeframe:</span>
                    <span>{getEstimatedTimeframe()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total filing fees:</span>
                    <span>${calculateTotalFees().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxYear">Tax Year / Period</Label>
              <Select value={data.taxYear || ""} onValueChange={(value) => handleChange("taxYear", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select tax year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filing Urgency</Label>
              <Select value={data.urgency || "standard"} onValueChange={(value) => handleChange("urgency", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Processing</SelectItem>
                  <SelectItem value="urgent">Urgent (+25% fee)</SelectItem>
                  <SelectItem value="emergency">Emergency (+50% fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="filingPeriod">Specific Filing Period (if applicable)</Label>
            <Input
              id="filingPeriod"
              placeholder="e.g., January 2024, Q1 2024"
              value={data.filingPeriod || ""}
              onChange={(e) => handleChange("filingPeriod", e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              placeholder="Any special requirements or instructions..."
              value={data.specialInstructions || ""}
              onChange={(e) => handleChange("specialInstructions", e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 2: Document Checklist
function DocumentsStep() {
  const [data, setData] = useStepData("documents");
  const [filingData] = useStepData("filing-selection");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(data.additionalDocuments || []);

  const handleChecklistChange = (document: string, checked: boolean) => {
    const checklist = data.documentChecklist || {};
    setData({
      ...data,
      documentChecklist: { ...checklist, [document]: checked }
    });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      setData({ ...data, additionalDocuments: [...uploadedFiles, ...fileNames] });
    }
  };

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  // Get all required documents for selected filings
  const getRequiredDocuments = () => {
    const selectedFilings = filingData.selectedFilings || [];
    const documents = new Set<string>();

    selectedFilings.forEach((filingId: string) => {
      const filing = availableFilings.find(f => f.id === filingId);
      filing?.requiredDocuments.forEach(doc => documents.add(doc));
    });

    return Array.from(documents);
  };

  const requiredDocuments = getRequiredDocuments();
  const checklist = data.documentChecklist || {};
  const completionPercentage = requiredDocuments.length > 0
    ? Math.round((Object.values(checklist).filter(Boolean).length / requiredDocuments.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Document Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Document Completion</span>
              <span className="text-sm text-gray-600">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />

            <div className="space-y-3">
              {requiredDocuments.map(document => (
                <div key={document} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={checklist[document] || false}
                    onCheckedChange={(checked) => handleChecklistChange(document, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{document}</Label>
                    <div className="text-xs text-gray-500 mt-1">
                      Required for: {filingData.selectedFilings
                        ?.filter((id: string) => {
                          const filing = availableFilings.find(f => f.id === id);
                          return filing?.requiredDocuments.includes(document);
                        })
                        .map((id: string) => availableFilings.find(f => f.id === id)?.name)
                        .join(", ")}
                    </div>
                  </div>
                  {checklist[document] && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  checked={data.documentsComplete || false}
                  onCheckedChange={(checked) => handleChange("documentsComplete", checked)}
                />
                <Label className="font-medium">
                  I confirm that all required documents are available and complete
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Additional Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <Label htmlFor="additionalFiles" className="cursor-pointer">
              <span className="text-blue-600 hover:underline">Upload additional documents</span>
              <span className="text-gray-500"> or drag and drop</span>
            </Label>
            <Input
              id="additionalFiles"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG, PNG (max 10MB each)</p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded Files:</h4>
              <ul className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Label htmlFor="documentNotes">Document Notes</Label>
            <Textarea
              id="documentNotes"
              placeholder="Any notes about the documents or special considerations..."
              value={data.documentNotes || ""}
              onChange={(e) => handleChange("documentNotes", e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 3: Review & Authorization
function ReviewStep() {
  const [data, setData] = useStepData("review");
  const [filingData] = useStepData("filing-selection");
  const [documentsData] = useStepData("documents");

  const handleChange = (field: string, value: boolean) => {
    setData({ ...data, [field]: value });
  };

  const selectedFilings = filingData.selectedFilings || [];
  const requiredDocuments = selectedFilings.flatMap((filingId: string) => {
    const filing = availableFilings.find(f => f.id === filingId);
    return filing?.requiredDocuments || [];
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Filing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tax Year:</span>
              <div className="font-medium">{filingData.taxYear}</div>
            </div>
            <div>
              <span className="text-gray-600">Urgency:</span>
              <div className="font-medium capitalize">{filingData.urgency}</div>
            </div>
            {filingData.filingPeriod && (
              <div className="col-span-2">
                <span className="text-gray-600">Period:</span>
                <div className="font-medium">{filingData.filingPeriod}</div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Selected Filings:</h4>
            <ul className="space-y-1">
              {selectedFilings.map((filingId: string) => {
                const filing = availableFilings.find(f => f.id === filingId);
                return filing ? (
                  <li key={filingId} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {filing.name}
                  </li>
                ) : null;
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Document Status:</h4>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                {documentsData.documentsComplete ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">All documents confirmed complete</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-700">Documents pending confirmation</span>
                  </>
                )}
              </div>
              <div className="mt-1 text-gray-600">
                {requiredDocuments.length} required document types
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authorization & Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.dataAccurate || false}
                onCheckedChange={(checked) => handleChange("dataAccurate", checked as boolean)}
              />
              <div>
                <Label>I confirm that all information provided is accurate and complete</Label>
                <p className="text-sm text-gray-600 mt-1">
                  All data and documents provided are true and complete to the best of my knowledge
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.authorizedToFile || false}
                onCheckedChange={(checked) => handleChange("authorizedToFile", checked as boolean)}
              />
              <div>
                <Label>I am authorized to submit these filings on behalf of the entity</Label>
                <p className="text-sm text-gray-600 mt-1">
                  I have the legal authority to file these returns and make declarations
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.understoodDeadlines || false}
                onCheckedChange={(checked) => handleChange("understoodDeadlines", checked as boolean)}
              />
              <div>
                <Label>I understand the filing deadlines and consequences of late filing</Label>
                <p className="text-sm text-gray-600 mt-1">
                  I acknowledge the deadlines and potential penalties for late or inaccurate filings
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.agreedToTerms || false}
                onCheckedChange={(checked) => handleChange("agreedToTerms", checked as boolean)}
              />
              <div>
                <Label>I agree to the terms of service and professional engagement</Label>
                <p className="text-sm text-gray-600 mt-1">
                  I agree to the terms and conditions of professional services
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Important Notice</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Ensure all information is accurate before submission</li>
              <li>• Keep copies of all filed returns for your records</li>
              <li>• You will receive confirmation once filings are submitted</li>
              <li>• Contact us immediately if you discover any errors</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: Submission Options
function SubmissionStep() {
  const [data, setData] = useStepData("submission");

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submission Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Submission Method</Label>
            <Select value={data.submissionMethod || ""} onValueChange={(value) => handleChange("submissionMethod", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select submission method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online Filing (Preferred)</SelectItem>
                <SelectItem value="paper">Paper Filing</SelectItem>
                <SelectItem value="both">Both Online and Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.submissionMethod && (
            <div>
              <Label>Delivery Method</Label>
              <Select value={data.deliveryMethod || ""} onValueChange={(value) => handleChange("deliveryMethod", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronic">Electronic Delivery</SelectItem>
                  <SelectItem value="mail">Regular Mail</SelectItem>
                  <SelectItem value="pickup">Client Pickup</SelectItem>
                  <SelectItem value="courier">Courier Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactForQuestions">Primary Contact for Questions</Label>
              <Input
                id="contactForQuestions"
                placeholder="Email or phone number"
                value={data.contactForQuestions || ""}
                onChange={(e) => handleChange("contactForQuestions", e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="backupContact">Backup Contact</Label>
              <Input
                id="backupContact"
                placeholder="Alternative contact method"
                value={data.backupContact || ""}
                onChange={(e) => handleChange("backupContact", e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">After Submission</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We will review your filings within 1-2 business days</li>
                <li>• You'll receive confirmation when filings are submitted to authorities</li>
                <li>• Copies of all filed returns will be provided</li>
                <li>• We'll notify you of any follow-up actions required</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Your Filing Package Includes</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Professional preparation and review</li>
                <li>• Electronic and/or paper filing as requested</li>
                <li>• Confirmation of successful submission</li>
                <li>• Copies for your records</li>
                <li>• Follow-up support for any queries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const wizardSteps: WizardStep[] = [
  {
    id: "filing-selection",
    title: "Select Filings",
    description: "Choose the filings you need",
    icon: <FileText className="h-6 w-6" />,
    validation: filingSelectionSchema,
    component: FilingSelectionStep,
  },
  {
    id: "documents",
    title: "Document Checklist",
    description: "Confirm required documents",
    icon: <FileCheck className="h-6 w-6" />,
    validation: documentsSchema,
    component: DocumentsStep,
  },
  {
    id: "review",
    title: "Review & Authorize",
    description: "Review and authorize filing",
    icon: <Shield className="h-6 w-6" />,
    validation: reviewSchema,
    component: ReviewStep,
  },
  {
    id: "submission",
    title: "Submission Options",
    description: "Choose submission preferences",
    icon: <Send className="h-6 w-6" />,
    validation: submissionSchema,
    component: SubmissionStep,
  },
];

interface FilingPreparationWizardProps {
  onComplete?: (data: any) => Promise<void>;
  onExit?: () => void;
}

export function FilingPreparationWizard({
  onComplete,
  onExit,
}: FilingPreparationWizardProps) {
  const handleSave = async (data: any, sessionId: string) => {
    localStorage.setItem(`filing-wizard-${sessionId}`, JSON.stringify(data));
  };

  const handleLoad = async (sessionId: string) => {
    const saved = localStorage.getItem(`filing-wizard-${sessionId}`);
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
        title="Filing Preparation"
        subtitle="Streamlined tax and regulatory filing process"
        onExit={onExit}
      >
        <FilingPreparationWizardContent />
      </WizardLayout>
    </WizardProvider>
  );
}

function FilingPreparationWizardContent() {
  const { currentStep } = useWizard();
  const StepComponent = currentStep.component;
  return <StepComponent />;
}