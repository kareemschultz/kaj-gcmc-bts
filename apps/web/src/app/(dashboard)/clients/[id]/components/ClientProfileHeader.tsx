"use client";

import {
  Badge,
  Building,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ClientProfile,
  ClientAnalytics,
  ClientProfileStatus,
  RiskLevel,
} from "@gcmc-kaj/types";

interface ClientProfileHeaderProps {
  client: ClientProfile;
  analytics?: ClientAnalytics;
  onEdit?: () => void;
  onStatusChange?: (status: ClientProfileStatus) => void;
}

const getStatusColor = (status: ClientProfileStatus): string => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "suspended":
      return "bg-red-100 text-red-800 border-red-200";
    case "archived":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getRiskLevelColor = (level: RiskLevel): string => {
  switch (level) {
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export function ClientProfileHeader({
  client,
  analytics,
  onEdit,
  onStatusChange,
}: ClientProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getClientInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date?: Date): string => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const getTimeSinceLastActivity = (lastActivity?: Date): string => {
    if (!lastActivity) return "No recent activity";

    const now = new Date();
    const diff = now.getTime() - new Date(lastActivity).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Active today";
    if (days === 1) return "Active yesterday";
    if (days < 7) return `Active ${days} days ago`;
    if (days < 30) return `Active ${Math.floor(days / 7)} weeks ago`;
    return `Active ${Math.floor(days / 30)} months ago`;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-0">
        {/* Header Banner */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <div className="absolute inset-0 bg-black/20 rounded-t-lg" />
          <div className="absolute top-4 right-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={onEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit client profile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Profile Section */}
        <div className="relative px-6 pb-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-6 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getClientInitials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 mt-12">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {client.name}
                    {client.type === "company" ? (
                      <Building className="h-5 w-5 text-gray-500" />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </h1>
                  <p className="text-gray-600 mt-1">{client.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <UIBadge
                      variant="secondary"
                      className={cn("text-xs", getStatusColor(client.status))}
                    >
                      {client.status.toUpperCase()}
                    </UIBadge>
                    <UIBadge variant="outline" className="text-xs capitalize">
                      {client.type}
                    </UIBadge>
                    {client.sector && (
                      <UIBadge variant="outline" className="text-xs">
                        {client.sector}
                      </UIBadge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Risk Level Indicator */}
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Risk Level</div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          getRiskLevelColor(client.riskLevel)
                        )}
                      />
                      <span className="text-sm font-medium capitalize">
                        {client.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Compliance Score */}
                  {analytics && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        Compliance Score
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={analytics.complianceScore}
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-medium">
                          {analytics.complianceScore}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
            )}

            {client.website && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {client.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {client.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {[
                    client.address.city,
                    client.address.state,
                    client.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{getTimeSinceLastActivity(client.lastActivity)}</span>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {client.incorporationDate && (
              <div className="text-sm">
                <span className="text-gray-500">Incorporated:</span>
                <span className="ml-2 font-medium">
                  {formatDate(client.incorporationDate)}
                </span>
              </div>
            )}

            {client.employeeCount && (
              <div className="text-sm">
                <span className="text-gray-500">Employees:</span>
                <span className="ml-2 font-medium">
                  {client.employeeCount.toLocaleString()}
                </span>
              </div>
            )}

            {client.annualRevenue && (
              <div className="text-sm">
                <span className="text-gray-500">Annual Revenue:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(client.annualRevenue)}
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {analytics && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.totalDocuments}
                  </div>
                  <div className="text-sm text-gray-500">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.totalFilings}
                  </div>
                  <div className="text-sm text-gray-500">Filings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.totalServiceRequests}
                  </div>
                  <div className="text-sm text-gray-500">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(analytics.revenueGenerated)}
                  </div>
                  <div className="text-sm text-gray-500">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.outstandingFees > 0
                      ? formatCurrency(analytics.outstandingFees)
                      : "—"}
                  </div>
                  <div className="text-sm text-gray-500">Outstanding</div>
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {client.tags && client.tags.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <UIBadge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: `${tag.color}40`,
                    }}
                  >
                    {tag.name}
                  </UIBadge>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}