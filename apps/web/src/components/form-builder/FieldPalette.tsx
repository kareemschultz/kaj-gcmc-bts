"use client";

/**
 * Field Palette Component
 * Provides draggable field types for the form builder
 */

import React from "react";
import { useDraggable } from "@dnd-kit/core";

import type { FormFieldType } from "@/lib/form-builder/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  List,
  Radio,
  Upload,
  DollarSign,
  Percent,
  CreditCard,
  FileText,
  Calculator,
  Separator,
  Users,
  Building,
  MapPin,
  Lock,
  Link,
  Image as ImageIcon,
  BarChart3
} from "lucide-react";

interface FieldType {
  type: FormFieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "basic" | "advanced" | "guyanese" | "layout";
  premium?: boolean;
}

const FIELD_TYPES: FieldType[] = [
  // Basic Fields
  {
    type: "text",
    label: "Text Input",
    description: "Single line text input",
    icon: <Type className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "textarea",
    label: "Text Area",
    description: "Multi-line text input",
    icon: <FileText className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "email",
    label: "Email",
    description: "Email address input with validation",
    icon: <Mail className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "phone",
    label: "Phone Number",
    description: "Phone number with Guyanese format",
    icon: <Phone className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric input",
    icon: <Hash className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "date",
    label: "Date",
    description: "Date picker",
    icon: <Calendar className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "checkbox",
    label: "Checkbox",
    description: "Single checkbox",
    icon: <CheckSquare className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "select",
    label: "Select Dropdown",
    description: "Single selection dropdown",
    icon: <List className="h-4 w-4" />,
    category: "basic"
  },
  {
    type: "radio",
    label: "Radio Buttons",
    description: "Single selection from multiple options",
    icon: <Radio className="h-4 w-4" />,
    category: "basic"
  },

  // Advanced Fields
  {
    type: "multiselect",
    label: "Multi-Select",
    description: "Multiple selection dropdown",
    icon: <List className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "checkboxGroup",
    label: "Checkbox Group",
    description: "Multiple checkboxes",
    icon: <CheckSquare className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "file",
    label: "File Upload",
    description: "File upload with validation",
    icon: <Upload className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "image",
    label: "Image Upload",
    description: "Image upload with preview",
    icon: <ImageIcon className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "signature",
    label: "Digital Signature",
    description: "Capture digital signature",
    icon: <Users className="h-4 w-4" />,
    category: "advanced",
    premium: true
  },
  {
    type: "datetime",
    label: "Date & Time",
    description: "Date and time picker",
    icon: <Calendar className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "time",
    label: "Time",
    description: "Time picker",
    icon: <Calendar className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "password",
    label: "Password",
    description: "Password input field",
    icon: <Lock className="h-4 w-4" />,
    category: "advanced"
  },
  {
    type: "url",
    label: "URL",
    description: "Website URL input",
    icon: <Link className="h-4 w-4" />,
    category: "advanced"
  },

  // Guyanese Specific Fields
  {
    type: "tax_id",
    label: "Tax ID (TIN)",
    description: "Guyanese Tax Identification Number",
    icon: <CreditCard className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "business_reg",
    label: "Business Registration",
    description: "DCRA business registration number",
    icon: <Building className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "nis_number",
    label: "NIS Number",
    description: "National Insurance Scheme number",
    icon: <Users className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "passport",
    label: "Passport Number",
    description: "Guyanese passport number format",
    icon: <CreditCard className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "id_card",
    label: "National ID",
    description: "National identification card number",
    icon: <CreditCard className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "currency",
    label: "Currency (GYD)",
    description: "Guyanese dollar amount",
    icon: <DollarSign className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "percentage",
    label: "Percentage",
    description: "Percentage value (tax rates, etc.)",
    icon: <Percent className="h-4 w-4" />,
    category: "guyanese"
  },
  {
    type: "calculated",
    label: "Calculated Field",
    description: "Auto-calculated values (tax, fees)",
    icon: <Calculator className="h-4 w-4" />,
    category: "guyanese",
    premium: true
  },

  // Layout Fields
  {
    type: "section",
    label: "Section Header",
    description: "Organize fields into sections",
    icon: <BarChart3 className="h-4 w-4" />,
    category: "layout"
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator line",
    icon: <Separator className="h-4 w-4" />,
    category: "layout"
  }
];

interface DraggableFieldProps {
  fieldType: FieldType;
  onAddField: (type: FormFieldType) => void;
  readonly?: boolean;
}

function DraggableField({ fieldType, onAddField, readonly }: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `palette-${fieldType.type}`,
    data: {
      type: "field-type",
      fieldType: fieldType.type
    },
    disabled: readonly
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative p-3 border rounded-lg transition-all cursor-pointer
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${readonly ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-blue-300"}
        bg-white border-gray-200
      `}
      onClick={() => !readonly && onAddField(fieldType.type)}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          p-2 rounded-md flex-shrink-0
          ${fieldType.category === "basic" ? "bg-blue-100 text-blue-600" :
            fieldType.category === "advanced" ? "bg-purple-100 text-purple-600" :
            fieldType.category === "guyanese" ? "bg-green-100 text-green-600" :
            "bg-gray-100 text-gray-600"}
        `}>
          {fieldType.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {fieldType.label}
            </h4>
            {fieldType.premium && (
              <Badge variant="outline" className="text-xs ml-2">
                Pro
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {fieldType.description}
          </p>
        </div>
      </div>
    </div>
  );
}

interface FieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
  readonly?: boolean;
}

export function FieldPalette({ onAddField, readonly }: FieldPaletteProps) {
  const categories = [
    { key: "basic", label: "Basic Fields", color: "blue" },
    { key: "advanced", label: "Advanced Fields", color: "purple" },
    { key: "guyanese", label: "Guyanese Specific", color: "green" },
    { key: "layout", label: "Layout Elements", color: "gray" }
  ] as const;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Field Palette</h2>
        <p className="text-sm text-gray-600">
          Drag fields onto the canvas or click to add them
        </p>
      </div>

      {categories.map(category => {
        const fields = FIELD_TYPES.filter(field => field.category === category.key);

        return (
          <div key={category.key}>
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {category.label}
              </h3>
              <Badge
                variant="secondary"
                className={`text-xs bg-${category.color}-100 text-${category.color}-700 border-${category.color}-200`}
              >
                {fields.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {fields.map(fieldType => (
                <DraggableField
                  key={fieldType.type}
                  fieldType={fieldType}
                  onAddField={onAddField}
                  readonly={readonly}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-2">
          <p>• Drag fields from the palette to add them to your form</p>
          <p>• Click on a field to select and edit its properties</p>
          <p>• Use sections to organize related fields</p>
          <p>• Guyanese-specific fields include built-in validation</p>
          <p>• Calculated fields automatically compute values</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default FieldPalette;