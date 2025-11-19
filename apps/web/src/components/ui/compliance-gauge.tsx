import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { complianceColors, brandColors } from '@/styles/brand';

interface ComplianceGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

export function ComplianceGauge({
  score,
  size = 'md',
  showLabel = true,
  className,
  animated = true
}: ComplianceGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));

  // Determine compliance level and color
  const getComplianceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: complianceColors.excellent };
    if (score >= 70) return { level: 'Good', color: complianceColors.good };
    if (score >= 50) return { level: 'Fair', color: complianceColors.fair };
    return { level: 'Poor', color: complianceColors.poor };
  };

  const compliance = getComplianceLevel(normalizedScore);

  // Chart data for semi-circle gauge
  const data = [
    { name: 'Score', value: normalizedScore, color: compliance.color },
    { name: 'Remaining', value: 100 - normalizedScore, color: '#f3f4f6' }
  ];

  // Size configurations
  const sizeConfig = {
    sm: { width: 120, height: 80, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { width: 160, height: 100, strokeWidth: 12, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { width: 200, height: 120, strokeWidth: 16, fontSize: 'text-3xl', labelSize: 'text-base' }
  };

  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={index === 0 ? 2 : 0}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Score display in center */}
        <motion.div
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-end pb-2"
        >
          <motion.span
            initial={animated ? { y: 10 } : {}}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className={cn("font-bold", config.fontSize)}
            style={{ color: compliance.color }}
          >
            {normalizedScore}%
          </motion.span>
          {showLabel && (
            <motion.span
              initial={animated ? { opacity: 0 } : {}}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className={cn("font-medium text-muted-foreground", config.labelSize)}
            >
              {compliance.level}
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Compliance scale indicator */}
      {size !== 'sm' && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="mt-3 w-full max-w-[180px]"
        >
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div className="flex-1 bg-red-500"></div>
              <div className="flex-1 bg-orange-500"></div>
              <div className="flex-1 bg-lime-500"></div>
              <div className="flex-1 bg-green-500"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Specialized compliance gauges for different use cases
export function ClientComplianceGauge({
  clientId,
  score,
  trend
}: {
  clientId: string;
  score: number;
  trend?: { value: number; positive: boolean; period: string }
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Compliance Score</h3>
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            <span>{trend.positive ? "↗" : "↘"}</span>
            {Math.abs(trend.value)}% vs {trend.period}
          </motion.div>
        )}
      </div>

      <ComplianceGauge score={score} size="lg" />

      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Overall compliance rating for all active requirements
        </p>
      </div>
    </div>
  );
}

export function AgencyComplianceGauge({
  agency,
  score,
  requirements
}: {
  agency: string;
  score: number;
  requirements: { total: number; completed: number; overdue: number }
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center gap-3 mb-3">
        <ComplianceGauge score={score} size="sm" showLabel={false} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{agency}</h4>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{requirements.completed}/{requirements.total} completed</span>
            {requirements.overdue > 0 && (
              <span className="text-red-600 font-medium">
                {requirements.overdue} overdue
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardComplianceOverview({
  overallScore,
  agencies
}: {
  overallScore: number;
  agencies: Array<{
    name: string;
    score: number;
    requirements: { total: number; completed: number; overdue: number };
  }>
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Compliance Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Overall Score</h3>
          <ComplianceGauge score={overallScore} size="lg" />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-700 mb-4">By Agency</h3>
          {agencies.map((agency, index) => (
            <motion.div
              key={agency.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <AgencyComplianceGauge
                agency={agency.name}
                score={agency.score}
                requirements={agency.requirements}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}