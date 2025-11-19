"use client";

/**
 * Forms Management Page
 * Central hub for managing all forms, templates, and form-related activities
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FormConfiguration, AgencyFormTemplate, Authority } from "@/lib/form-builder/types";
import { AGENCY_FORM_TEMPLATES, getTemplateStats } from "@/lib/form-builder/agency-templates";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  BarChart3,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Building,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// Mock data for existing forms
const mockForms: FormConfiguration[] = [
  {
    id: "form-1",
    name: "VAT Return Q1 2024",
    title: "Quarterly VAT Return",
    description: "Submit quarterly VAT return for Q1 2024",
    version: "1.2",
    authority: "GRA",
    documentType: "vat_return",
    category: "tax_filing",
    applicableClientTypes: ["company"],
    fields: [
      {
        id: "field-1",
        type: "text",
        name: "business_name",
        label: "Business Name",
        order: 1,
        required: true
      }
    ],
    sections: [],
    submissionConfig: {
      method: "api",
      endpoint: "/api/gra/vat-return"
    },
    isActive: true,
    createdBy: "user-123",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-10")
  },
  {
    id: "form-2",
    name: "Company Registration",
    title: "New Company Registration",
    description: "Register a new company with DCRA",
    version: "2.0",
    authority: "DCRA",
    documentType: "company_incorporation",
    category: "incorporation",
    applicableClientTypes: ["company"],
    fields: [
      {
        id: "field-1",
        type: "text",
        name: "company_name",
        label: "Company Name",
        order: 1,
        required: true
      }
    ],
    sections: [],
    submissionConfig: {
      method: "api",
      endpoint: "/api/dcra/company-registration"
    },
    isActive: true,
    createdBy: "user-456",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-05")
  }
];

export default function FormsPage() {
  const router = useRouter();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthority, setSelectedAuthority] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [forms, setForms] = useState<FormConfiguration[]>(mockForms);
  const [templates] = useState<AgencyFormTemplate[]>(
    Object.values(AGENCY_FORM_TEMPLATES).flat()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get template statistics
  const templateStats = getTemplateStats();

  // Filter forms
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAuthority = !selectedAuthority || form.authority === selectedAuthority;
    const matchesCategory = !selectedCategory || form.category === selectedCategory;

    return matchesSearch && matchesAuthority && matchesCategory;
  });

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAuthority = !selectedAuthority || template.authority === selectedAuthority;
    const matchesCategory = !selectedCategory || template.category === selectedCategory;

    return matchesSearch && matchesAuthority && matchesCategory;
  });

  // Handle form actions
  const handleEditForm = (formId: string) => {
    router.push(`/forms/builder?id=${formId}`);
  };

  const handleDuplicateForm = async (form: FormConfiguration) => {
    try {
      const duplicatedForm: FormConfiguration = {
        ...form,
        id: `form-${Date.now()}`,
        name: `${form.name} (Copy)`,
        title: `${form.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setForms(prev => [...prev, duplicatedForm]);
      toast.success("Form duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate form");
      console.error("Duplicate error:", error);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      setForms(prev => prev.filter(f => f.id !== formId));
      toast.success("Form deleted successfully");
    } catch (error) {
      toast.error("Failed to delete form");
      console.error("Delete error:", error);
    } finally {
      setShowDeleteDialog(false);
      setFormToDelete(null);
    }
  };

  const handleViewAnalytics = (formId: string) => {
    router.push(`/forms/builder?id=${formId}&mode=analytics`);
  };

  const handleUseTemplate = (templateId: string) => {
    router.push(`/forms/builder?template=${templateId}`);
  };

  // Authority options
  const authorities: Array<{ value: string; label: string }> = [
    { value: "", label: "All Authorities" },
    { value: "GRA", label: "GRA - Guyana Revenue Authority" },
    { value: "NIS", label: "NIS - National Insurance Scheme" },
    { value: "DCRA", label: "DCRA - Deeds & Commercial Registry" },
    { value: "Immigration", label: "Immigration Department" },
    { value: "MOL", label: "MOL - Ministry of Labour" },
    { value: "EPA", label: "EPA - Environmental Protection Agency" }
  ];

  // Category options
  const categories = [
    { value: "", label: "All Categories" },
    { value: "tax_filing", label: "Tax Filing" },
    { value: "incorporation", label: "Business Incorporation" },
    { value: "compliance", label: "Compliance" },
    { value: "permits_licenses", label: "Permits & Licenses" },
    { value: "application_form", label: "Application Forms" }
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
          <p className="text-gray-600 mt-2">
            Create, manage, and analyze forms for Guyanese regulatory compliance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => router.push("/forms/builder")}>
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+3</span>
              <span className="text-gray-500 ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templateStats.totalTemplates}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Across {Object.keys(templateStats.templatesByAuthority).length} authorities</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Monthly Submissions</p>
                <p className="text-2xl font-bold text-gray-900">2,347</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+18.2%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                <p className="text-2xl font-bold text-gray-900">84.3%</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+2.1%</span>
              <span className="text-gray-500 ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search forms and templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Select value={selectedAuthority} onValueChange={setSelectedAuthority}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by authority" />
                </SelectTrigger>
                <SelectContent>
                  {authorities.map(auth => (
                    <SelectItem key={auth.value} value={auth.value}>
                      {auth.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="forms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="forms">My Forms ({filteredForms.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({filteredTemplates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-6">
          {filteredForms.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedAuthority || selectedCategory
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first form or using a template."
                  }
                </p>
                <div className="flex justify-center space-x-3">
                  <Button onClick={() => router.push("/forms/builder")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Form
                  </Button>
                  <Button variant="outline">
                    Browse Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map(form => (
                <Card key={form.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{form.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {form.description}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditForm(form.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Form
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateForm(form)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewAnalytics(form.id)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setFormToDelete(form.id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <Badge variant="outline">{form.authority}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {form.category.replace('_', ' ')}
                      </Badge>
                      {form.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{form.fields.length} fields</span>
                        <span>v{form.version}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Updated {form.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditForm(form.id)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAnalytics(form.id)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">
                  Try adjusting your filters to see more templates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      {template.isOfficial && (
                        <Badge variant="default" className="bg-blue-100 text-blue-700">
                          <Shield className="h-3 w-3 mr-1" />
                          Official
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <Badge variant="outline">{template.authority}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{template.configuration.fields.length} fields</span>
                        <span>v{template.version}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>Used {template.usageCount} times</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Preview template
                            toast.info("Template preview coming soon");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? This action cannot be undone.
              All form data and analytics will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formToDelete && handleDeleteForm(formToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}