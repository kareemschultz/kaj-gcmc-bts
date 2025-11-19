"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building,
  CheckCircle,
  FileText,
  MapPin,
  Shield,
  Upload,
  User,
  Users,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
// Note: Using simpler form implementation instead of shadcn form components
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

// Validation schemas for each step
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
  mailingAddress: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingRegion: z.string().optional(),
  mailingPostalCode: z.string().optional(),
  sameAsBusinessAddress: z.boolean().default(true),
});

const complianceNeedsSchema = z.object({
  gra: z.boolean().default(false),
  dcra: z.boolean().default(false),
  nis: z.boolean().default(false),
  epa: z.boolean().default(false),
  customsExcise: z.boolean().default(false),
  specialRequirements: z.string().optional(),
  estimatedAnnualRevenue: z.enum([
    "under_100k",
    "100k_500k",
    "500k_1m",
    "1m_5m",
    "5m_plus",
  ]).optional(),
});

const documentsSchema = z.object({
  identificationDocuments: z.array(z.string()).optional(),
  businessRegistrationDocuments: z.array(z.string()).optional(),
  taxDocuments: z.array(z.string()).optional(),
  bankingDocuments: z.array(z.string()).optional(),
  otherDocuments: z.array(z.string()).optional(),
});

const reviewSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val, "You must accept the terms"),
  privacyPolicyAccepted: z.boolean().refine((val) => val, "You must accept the privacy policy"),
  marketingConsent: z.boolean().default(false),
});

// Step 1: Basic Information
function BasicInfoStep() {
  const [data, setData] = useStepData("basic-info");

  const form = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data,
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setData]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="clientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What type of client are you?</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="sole_proprietorship">
                          Sole Proprietorship
                        </SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="company">Company/Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+592-xxx-xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required for certain compliance services
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}

// Step 2: Business Information
function BusinessInfoStep() {
  const [data, setData] = useStepData("business-info");
  const [basicData] = useStepData("basic-info");

  const form = useForm({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: data,
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setData]);

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
    <Form {...form}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ACME Business Solutions Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incorporationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incorporation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxIdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="TIN123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your business activities..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a brief description of your business activities
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}

// Step 3: Address Information
function AddressInfoStep() {
  const [data, setData] = useStepData("address-info");

  const form = useForm({
    resolver: zodResolver(addressInfoSchema),
    defaultValues: data,
  });

  const sameAsBusinessAddress = form.watch("sameAsBusinessAddress");

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setData]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Business Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="businessCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Georgetown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessRegion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mailing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="sameAsBusinessAddress"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Same as business address
                    </FormLabel>
                    <FormDescription>
                      Check this if your mailing address is the same as your business address
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!sameAsBusinessAddress && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="mailingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mailing Address</FormLabel>
                      <FormControl>
                        <Input placeholder="PO Box 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="mailingCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Georgetown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mailingRegion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="demerara-mahaica">Demerara-Mahaica</SelectItem>
                              <SelectItem value="berbice">Berbice</SelectItem>
                              <SelectItem value="essequibo">Essequibo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mailingPostalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}

// Step 4: Compliance Needs
function ComplianceNeedsStep() {
  const [data, setData] = useStepData("compliance-needs");

  const form = useForm({
    resolver: zodResolver(complianceNeedsSchema),
    defaultValues: data,
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setData]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Select the compliance services you need. We'll help you stay compliant with all relevant Guyanese regulations.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gra"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          GRA Tax Compliance
                        </FormLabel>
                        <FormDescription>
                          Income tax, VAT, and other tax obligations with the Guyana Revenue Authority
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dcra"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          DCRA Registration
                        </FormLabel>
                        <FormDescription>
                          Business registration and corporate compliance with the Department of Cooperatives and Rural Affairs
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nis"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          NIS Contributions
                        </FormLabel>
                        <FormDescription>
                          National Insurance Scheme contributions for employees and self-employed
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="epa"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          EPA Permits
                        </FormLabel>
                        <FormDescription>
                          Environmental permits and compliance with the Environmental Protection Agency
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customsExcise"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          Customs & Excise
                        </FormLabel>
                        <FormDescription>
                          Import/export documentation and customs compliance
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="estimatedAnnualRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Annual Revenue</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    </FormControl>
                    <FormDescription>
                      This helps us recommend the right compliance package
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific compliance needs or industry requirements..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe any industry-specific compliance requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}

// Step 5: Document Upload
function DocumentsStep() {
  const [data, setData] = useStepData("documents");
  const [uploadedFiles, setUploadedFiles] = React.useState<Record<string, File[]>>({});

  const handleFileUpload = (category: string, files: File[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [category]: files
    }));

    setData({
      ...data,
      [`${category}Documents`]: files.map(f => f.name)
    });
  };

  const documentCategories = [
    {
      key: "identification",
      title: "Identification Documents",
      description: "National ID, passport, driver's license",
      required: true,
    },
    {
      key: "businessRegistration",
      title: "Business Registration",
      description: "Certificate of incorporation, business license",
      required: false,
    },
    {
      key: "tax",
      title: "Tax Documents",
      description: "Previous tax returns, TIN certificate",
      required: false,
    },
    {
      key: "banking",
      title: "Banking Information",
      description: "Bank statements, account opening documents",
      required: false,
    },
    {
      key: "other",
      title: "Other Documents",
      description: "Any additional relevant documents",
      required: false,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Upload the required documents to complete your onboarding. All documents are securely stored and encrypted.
          </p>

          <div className="space-y-6">
            {documentCategories.map((category) => (
              <Card key={category.key} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {category.title}
                        {category.required && (
                          <span className="ml-2 text-sm text-red-500">*</span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.description}
                      </p>
                    </div>
                    {uploadedFiles[category.key]?.length > 0 && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label
                        htmlFor={`file-${category.key}`}
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Choose Files
                      </Label>
                      <Input
                        id={`file-${category.key}`}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          handleFileUpload(category.key, files);
                        }}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        PDF, JPG, PNG, DOC, DOCX up to 10MB each
                      </p>
                    </div>
                  </div>

                  {uploadedFiles[category.key]?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Files:</h4>
                      <ul className="space-y-1">
                        {uploadedFiles[category.key].map((file, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 6: Review and Confirmation
function ReviewStep() {
  const [data, setData] = useStepData("review");
  const [basicData] = useStepData("basic-info");
  const [businessData] = useStepData("business-info");
  const [addressData] = useStepData("address-info");
  const [complianceData] = useStepData("compliance-needs");

  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: data,
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setData]);

  const selectedCompliance = Object.entries(complianceData)
    .filter(([key, value]) => value && typeof value === 'boolean')
    .map(([key]) => key);

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span> {basicData.firstName} {basicData.lastName}
                </div>
                <div>
                  <span className="text-gray-600">Email:</span> {basicData.email}
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span> {basicData.phone}
                </div>
                <div>
                  <span className="text-gray-600">Client Type:</span> {basicData.clientType?.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Business Information */}
            {businessData.companyName && (
              <div>
                <h4 className="font-medium mb-2">Business Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Company:</span> {businessData.companyName}
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span> {businessData.businessType}
                  </div>
                  {businessData.registrationNumber && (
                    <div>
                      <span className="text-gray-600">Registration:</span> {businessData.registrationNumber}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            <div>
              <h4 className="font-medium mb-2">Business Address</h4>
              <div className="text-sm">
                {addressData.businessAddress}<br />
                {addressData.businessCity}, {addressData.businessRegion}
                {addressData.businessPostalCode && ` ${addressData.businessPostalCode}`}
              </div>
            </div>

            {/* Compliance Services */}
            {selectedCompliance.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Selected Compliance Services</h4>
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

        {/* Terms and Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I accept the Terms of Service
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to our{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyPolicyAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I accept the Privacy Policy
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to our{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketingConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I would like to receive marketing communications (Optional)
                    </FormLabel>
                    <FormDescription>
                      Receive updates about new services and compliance tips
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}

const wizardSteps: WizardStep[] = [
  {
    id: "basic-info",
    title: "Basic Information",
    description: "Tell us about yourself and your business",
    icon: <User className="h-6 w-6" />,
    validation: basicInfoSchema,
    component: BasicInfoStep,
  },
  {
    id: "business-info",
    title: "Business Details",
    description: "Company information and business type",
    icon: <Building className="h-6 w-6" />,
    validation: businessInfoSchema,
    component: BusinessInfoStep,
    canSkip: true,
  },
  {
    id: "address-info",
    title: "Address Information",
    description: "Business and mailing addresses",
    icon: <MapPin className="h-6 w-6" />,
    validation: addressInfoSchema,
    component: AddressInfoStep,
  },
  {
    id: "compliance-needs",
    title: "Compliance Needs",
    description: "Select your compliance requirements",
    icon: <Shield className="h-6 w-6" />,
    validation: complianceNeedsSchema,
    component: ComplianceNeedsStep,
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload required documents",
    icon: <Upload className="h-6 w-6" />,
    validation: documentsSchema,
    component: DocumentsStep,
    canSkip: true,
  },
  {
    id: "review",
    title: "Review & Confirm",
    description: "Review your information and complete onboarding",
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
    // Save to localStorage and optionally to server
    localStorage.setItem(`wizard-${sessionId}`, JSON.stringify(data));
  };

  const handleLoad = async (sessionId: string) => {
    // Load from localStorage or server
    const saved = localStorage.getItem(`wizard-${sessionId}`);
    return saved ? JSON.parse(saved) : null;
  };

  return (
    <WizardProvider
      steps={wizardSteps}
      onComplete={onComplete}
      onSave={handleSave}
      onLoad={handleLoad}
      autoSave={true}
      autoSaveInterval={30000}
    >
      <WizardLayout
        title="Client Onboarding"
        subtitle="Welcome to GCMC-KAJ Business Tax Services"
        onExit={onExit}
        showSaveIndicator={true}
        enableKeyboardNavigation={true}
        mobileOptimized={true}
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