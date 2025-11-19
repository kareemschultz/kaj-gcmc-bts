"use client";

import {
  Building,
  CheckCircle,
  FileText,
  MapPin,
  Shield,
  Upload,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Validation schemas
const basicInfoSchema = z.object({
  clientType: z.enum(["individual", "sole_proprietorship", "partnership", "company"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().optional(),
});

const businessInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  businessType: z.enum([
    "manufacturing",
    "retail",
    "services",
    "technology",
    "healthcare",
    "finance",
    "real_estate",
    "other",
  ]),
  incorporationDate: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
  businessDescription: z.string().optional(),
});

const addressInfoSchema = z.object({
  businessAddress: z.string().min(1, "Business address is required"),
  businessCity: z.string().min(1, "City is required"),
  businessRegion: z.string().min(1, "Region is required"),
  businessPostalCode: z.string().optional(),
  sameAsBusinessAddress: z.boolean().default(true),
});

const complianceNeedsSchema = z.object({
  gra: z.boolean().default(false),
  dcra: z.boolean().default(false),
  nis: z.boolean().default(false),
  epa: z.boolean().default(false),
  customsExcise: z.boolean().default(false),
  estimatedAnnualRevenue: z.enum([
    "under_100k",
    "100k_500k",
    "500k_1m",
    "1m_5m",
    "5m_plus",
  ]).optional(),
});

const reviewSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val, "You must accept the terms"),
  privacyPolicyAccepted: z.boolean().refine((val) => val, "You must accept the privacy policy"),
  marketingConsent: z.boolean().default(false),
});

// Step 1: Basic Information
function BasicInfoStep() {
  const [data, setData] = useStepData("basic-info");

  const handleChange = (field: string, value: string | boolean) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="clientType">What type of client are you?</Label>
            <Select value={data.clientType || ""} onValueChange={(value) => handleChange("clientType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select client type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="company">Company/Corporation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={data.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={data.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={data.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+592-xxx-xxxx"
                value={data.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth || ""}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            />
            <p className="text-sm text-gray-600">Required for certain compliance services</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 2: Business Information
function BusinessInfoStep() {
  const [data, setData] = useStepData("business-info");
  const [basicData] = useStepData("basic-info");

  const handleChange = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  // Skip this step for individuals
  if (basicData.clientType === "individual") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Building className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">
            Business information not required
          </h3>
          <p className="text-gray-600">
            This step is automatically skipped for individual clients.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Business Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            placeholder="ACME Business Solutions Inc."
            value={data.companyName || ""}
            onChange={(e) => handleChange("companyName", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>
            <Select value={data.businessType || ""} onValueChange={(value) => handleChange("businessType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="real_estate">Real Estate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incorporationDate">Incorporation Date</Label>
            <Input
              id="incorporationDate"
              type="date"
              value={data.incorporationDate || ""}
              onChange={(e) => handleChange("incorporationDate", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              placeholder="123456"
              value={data.registrationNumber || ""}
              onChange={(e) => handleChange("registrationNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxIdNumber">Tax ID Number</Label>
            <Input
              id="taxIdNumber"
              placeholder="TIN123456789"
              value={data.taxIdNumber || ""}
              onChange={(e) => handleChange("taxIdNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessDescription">Business Description</Label>
          <Textarea
            id="businessDescription"
            placeholder="Describe your business activities..."
            rows={3}
            value={data.businessDescription || ""}
            onChange={(e) => handleChange("businessDescription", e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Provide a brief description of your business activities
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Address Information
function AddressInfoStep() {
  const [data, setData] = useStepData("address-info");

  const handleChange = (field: string, value: string | boolean) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Street Address</Label>
            <Input
              id="businessAddress"
              placeholder="123 Main Street"
              value={data.businessAddress || ""}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessCity">City</Label>
              <Input
                id="businessCity"
                placeholder="Georgetown"
                value={data.businessCity || ""}
                onChange={(e) => handleChange("businessCity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegion">Region</Label>
              <Select value={data.businessRegion || ""} onValueChange={(value) => handleChange("businessRegion", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demerara-mahaica">Demerara-Mahaica</SelectItem>
                  <SelectItem value="berbice">Berbice</SelectItem>
                  <SelectItem value="essequibo">Essequibo</SelectItem>
                  <SelectItem value="upper-demerara-berbice">Upper Demerara-Berbice</SelectItem>
                  <SelectItem value="mahaica-berbice">Mahaica-Berbice</SelectItem>
                  <SelectItem value="east-berbice-corentyne">East Berbice-Corentyne</SelectItem>
                  <SelectItem value="cuyuni-mazaruni">Cuyuni-Mazaruni</SelectItem>
                  <SelectItem value="potaro-siparuni">Potaro-Siparuni</SelectItem>
                  <SelectItem value="upper-takutu-upper-essequibo">Upper Takutu-Upper Essequibo</SelectItem>
                  <SelectItem value="barima-waini">Barima-Waini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPostalCode">Postal Code</Label>
              <Input
                id="businessPostalCode"
                placeholder="12345"
                value={data.businessPostalCode || ""}
                onChange={(e) => handleChange("businessPostalCode", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: Compliance Needs
function ComplianceNeedsStep() {
  const [data, setData] = useStepData("compliance-needs");

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setData({ ...data, [field]: checked });
  };

  const handleSelectChange = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-gray-600">
          Select the compliance services you need. We'll help you stay compliant with all relevant Guyanese regulations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.gra || false}
                onCheckedChange={(checked) => handleCheckboxChange("gra", checked as boolean)}
              />
              <div>
                <Label className="font-medium">GRA Tax Compliance</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Income tax, VAT, and other tax obligations with the Guyana Revenue Authority
                </p>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.dcra || false}
                onCheckedChange={(checked) => handleCheckboxChange("dcra", checked as boolean)}
              />
              <div>
                <Label className="font-medium">DCRA Registration</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Business registration and corporate compliance
                </p>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.nis || false}
                onCheckedChange={(checked) => handleCheckboxChange("nis", checked as boolean)}
              />
              <div>
                <Label className="font-medium">NIS Contributions</Label>
                <p className="text-sm text-gray-600 mt-1">
                  National Insurance Scheme contributions for employees and self-employed
                </p>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={data.epa || false}
                onCheckedChange={(checked) => handleCheckboxChange("epa", checked as boolean)}
              />
              <div>
                <Label className="font-medium">EPA Permits</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Environmental permits and compliance
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedAnnualRevenue">Estimated Annual Revenue</Label>
          <Select value={data.estimatedAnnualRevenue || ""} onValueChange={(value) => handleSelectChange("estimatedAnnualRevenue", value)}>
            <SelectTrigger>
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
          <p className="text-sm text-gray-600">
            This helps us recommend the right compliance package
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 5: Review
function ReviewStep() {
  const [data, setData] = useStepData("review");
  const [basicData] = useStepData("basic-info");
  const [businessData] = useStepData("business-info");
  const [addressData] = useStepData("address-info");
  const [complianceData] = useStepData("compliance-needs");

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setData({ ...data, [field]: checked });
  };

  const selectedCompliance = Object.entries(complianceData)
    .filter(([key, value]) => value && typeof value === 'boolean')
    .map(([key]) => key);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-600">Name:</span> {basicData.firstName} {basicData.lastName}</div>
              <div><span className="text-gray-600">Email:</span> {basicData.email}</div>
              <div><span className="text-gray-600">Phone:</span> {basicData.phone}</div>
              <div><span className="text-gray-600">Type:</span> {basicData.clientType?.replace('_', ' ')}</div>
            </div>
          </div>

          {businessData.companyName && (
            <div>
              <h4 className="font-medium mb-2">Business Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-600">Company:</span> {businessData.companyName}</div>
                <div><span className="text-gray-600">Type:</span> {businessData.businessType}</div>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Address</h4>
            <div className="text-sm">
              {addressData.businessAddress}<br />
              {addressData.businessCity}, {addressData.businessRegion}
            </div>
          </div>

          {selectedCompliance.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Selected Services</h4>
              <ul className="text-sm space-y-1">
                {selectedCompliance.map(service => (
                  <li key={service} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {service.toUpperCase()} Compliance
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.termsAccepted || false}
              onCheckedChange={(checked) => handleCheckboxChange("termsAccepted", checked as boolean)}
            />
            <div>
              <Label>I accept the Terms of Service</Label>
              <p className="text-sm text-gray-600 mt-1">
                By checking this box, you agree to our Terms of Service
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.privacyPolicyAccepted || false}
              onCheckedChange={(checked) => handleCheckboxChange("privacyPolicyAccepted", checked as boolean)}
            />
            <div>
              <Label>I accept the Privacy Policy</Label>
              <p className="text-sm text-gray-600 mt-1">
                By checking this box, you agree to our Privacy Policy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const wizardSteps: WizardStep[] = [
  {
    id: "basic-info",
    title: "Basic Information",
    description: "Tell us about yourself",
    icon: <User className="h-6 w-6" />,
    validation: basicInfoSchema,
    component: BasicInfoStep,
  },
  {
    id: "business-info",
    title: "Business Details",
    description: "Company information",
    icon: <Building className="h-6 w-6" />,
    validation: businessInfoSchema,
    component: BusinessInfoStep,
    canSkip: true,
  },
  {
    id: "address-info",
    title: "Address Information",
    description: "Business address",
    icon: <MapPin className="h-6 w-6" />,
    validation: addressInfoSchema,
    component: AddressInfoStep,
  },
  {
    id: "compliance-needs",
    title: "Compliance Needs",
    description: "Select services",
    icon: <Shield className="h-6 w-6" />,
    validation: complianceNeedsSchema,
    component: ComplianceNeedsStep,
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm details",
    icon: <CheckCircle className="h-6 w-6" />,
    validation: reviewSchema,
    component: ReviewStep,
  },
];

interface ClientOnboardingWizardProps {
  onComplete?: (data: any) => Promise<void>;
  onExit?: () => void;
}

export function ClientOnboardingWizard({
  onComplete,
  onExit,
}: ClientOnboardingWizardProps) {
  const handleSave = async (data: any, sessionId: string) => {
    localStorage.setItem(`wizard-${sessionId}`, JSON.stringify(data));
  };

  const handleLoad = async (sessionId: string) => {
    const saved = localStorage.getItem(`wizard-${sessionId}`);
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
        title="Client Onboarding"
        subtitle="Welcome to GCMC-KAJ Business Tax Services"
        onExit={onExit}
      >
        <ClientOnboardingWizardContent />
      </WizardLayout>
    </WizardProvider>
  );
}

function ClientOnboardingWizardContent() {
  const { currentStep } = useWizard();
  const StepComponent = currentStep.component;
  return <StepComponent />;
}