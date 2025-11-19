"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  FileCheck,
  AlertCircle,
  Zap,
  Target,
  Award,
  BarChart3,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  delay?: number;
  label?: string;
  subtitle?: string;
  showPercentage?: boolean;
}

function ComplianceCircle({
  score,
  size = 160,
  strokeWidth = 12,
  delay = 0,
  label,
  subtitle,
  showPercentage = true
}: ComplianceCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * (size / 2 - strokeWidth);
  const offset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 95) return "#10B981"; // Green
    if (score >= 85) return "#3B82F6"; // Blue
    if (score >= 70) return "#F59E0B"; // Orange
    return "#EF4444"; // Red
  };

  const getGlowColor = (score: number) => {
    if (score >= 95) return "#10B98140";
    if (score >= 85) return "#3B82F640";
    if (score >= 70) return "#F59E0B40";
    return "#EF444440";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(0, score, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (latest) => setAnimatedScore(latest),
      });

      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.8,
        delay: delay,
        type: "spring",
        bounce: 0.3
      }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            backgroundColor: getGlowColor(score),
            transform: "scale(1.1)",
          }}
        />

        {/* SVG Circle */}
        <svg
          width={size}
          height={size}
          className="relative transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - strokeWidth}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - strokeWidth}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              strokeDashoffset: offset,
              transition: `stroke-dashoffset 2s ease-out`,
              filter: `drop-shadow(0 0 6px ${getColor(score)}40)`,
            }}
          />

          {/* Inner glow circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - strokeWidth - 4}
            stroke={getColor(score)}
            strokeWidth={2}
            fill="none"
            opacity={0.3}
            strokeDasharray="4 4"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 1, duration: 0.5 }}
              className="text-4xl font-bold"
              style={{ color: getColor(score) }}
            >
              {Math.round(animatedScore)}%
            </motion.span>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 1.2, duration: 0.3 }}
            className="mt-1"
          >
            {score >= 95 ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : score >= 85 ? (
              <Shield className="h-6 w-6 text-blue-600" />
            ) : score >= 70 ? (
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </motion.div>
        </div>
      </div>

      {/* Label */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 1.4, duration: 0.3 }}
          className="mt-4 text-center"
        >
          <h3 className="font-semibold text-lg">{label}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

interface ComplianceMetricProps {
  title: string;
  score: number;
  trend?: number;
  icon: React.ComponentType<any>;
  details: string[];
  delay?: number;
}

function ComplianceMetricCard({
  title,
  score,
  trend,
  icon: Icon,
  details,
  delay = 0
}: ComplianceMetricProps) {
  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 85) return "text-blue-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 95) return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    if (score >= 85) return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
    if (score >= 70) return "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800";
    return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay,
        type: "spring",
        bounce: 0.2
      }}
    >
      <Card className={cn(
        "transition-all duration-300 hover:shadow-lg",
        getScoreBg(score)
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: delay + 0.1,
                  type: "spring",
                  bounce: 0.4
                }}
                className={cn(
                  "p-2 rounded-lg",
                  score >= 95 ? "bg-green-100 dark:bg-green-900/30" :
                  score >= 85 ? "bg-blue-100 dark:bg-blue-900/30" :
                  score >= 70 ? "bg-orange-100 dark:bg-orange-900/30" :
                  "bg-red-100 dark:bg-red-900/30"
                )}
              >
                <Icon className={cn("h-5 w-5", getScoreColor(score))} />
              </motion.div>
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
              </div>
            </div>

            <div className="text-right">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.2, duration: 0.5 }}
                className={cn("text-2xl font-bold", getScoreColor(score))}
              >
                {score}%
              </motion.div>
              {trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3, duration: 0.3 }}
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium justify-end",
                    trend >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend).toFixed(1)}%</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: delay + 0.4, duration: 0.8 }}
            className="mb-4"
          >
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: delay + 0.5, duration: 1 }}
                className={cn(
                  "h-2 rounded-full transition-all duration-1000",
                  score >= 95 ? "bg-green-500" :
                  score >= 85 ? "bg-blue-500" :
                  score >= 70 ? "bg-orange-500" :
                  "bg-red-500"
                )}
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6, duration: 0.5 }}
            className="space-y-2"
          >
            {details.map((detail, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.7 + index * 0.1, duration: 0.3 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  score >= 95 ? "bg-green-500" :
                  score >= 85 ? "bg-blue-500" :
                  score >= 70 ? "bg-orange-500" :
                  "bg-red-500"
                )} />
                <span>{detail}</span>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ComplianceVisualization() {
  const overallScore = 92.3;

  const complianceMetrics = [
    {
      title: "Tax Filing Compliance",
      score: 96,
      trend: 2.1,
      icon: FileCheck,
      details: [
        "Annual returns: 98% on time",
        "Monthly filings: 95% compliant",
        "Amendment rate: 2% (excellent)",
        "Documentation: Complete"
      ]
    },
    {
      title: "Regulatory Compliance",
      score: 89,
      trend: 1.8,
      icon: Shield,
      details: [
        "GRA requirements: Fully met",
        "Financial reporting: Current",
        "Audit compliance: 91%",
        "Record keeping: Excellent"
      ]
    },
    {
      title: "Client Documentation",
      score: 94,
      trend: -0.5,
      icon: FileText,
      details: [
        "KYC documentation: 96%",
        "Contract compliance: 93%",
        "Data protection: GDPR compliant",
        "Archive management: Optimal"
      ]
    },
    {
      title: "Process Compliance",
      score: 87,
      trend: 4.2,
      icon: Activity,
      details: [
        "SOP adherence: 89%",
        "Quality checks: Regular",
        "Training compliance: 85%",
        "Certification: Up to date"
      ]
    },
    {
      title: "Security Compliance",
      score: 98,
      trend: 1.2,
      icon: Shield,
      details: [
        "Data encryption: AES-256",
        "Access controls: Multi-factor",
        "Backup systems: Redundant",
        "Incident response: Immediate"
      ]
    },
    {
      title: "Deadline Management",
      score: 91,
      trend: -1.1,
      icon: Clock,
      details: [
        "Filing deadlines: 93% met",
        "Client deadlines: 89% met",
        "Internal targets: 92% met",
        "Emergency response: Ready"
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold mb-2">Compliance Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive view of organizational compliance across all departments
        </p>
      </motion.div>

      {/* Overall Compliance Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex justify-center"
      >
        <Card className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl ring-1 ring-gray-200/50 dark:ring-gray-700/50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Overall Compliance Score</h3>
              <p className="text-muted-foreground">
                Aggregated compliance rating across all areas
              </p>
            </div>

            <ComplianceCircle
              score={overallScore}
              size={200}
              strokeWidth={16}
              delay={0.5}
              showPercentage={true}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="mt-6 flex justify-center"
            >
              <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="font-medium">Excellent Performance</span>
              </Badge>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {complianceMetrics.map((metric, index) => (
          <ComplianceMetricCard
            key={metric.title}
            {...metric}
            delay={0.8 + index * 0.1}
          />
        ))}
      </div>

      {/* Quick Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6, duration: 0.3 }}
                className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
              >
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">3 Pending Reviews</p>
                  <p className="text-xs text-muted-foreground">Due this week</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7, duration: 0.3 }}
                className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
              >
                <FileCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">8 Files Updated</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8, duration: 0.3 }}
                className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
              >
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">95% Target</p>
                  <p className="text-xs text-muted-foreground">Q4 Goal</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}