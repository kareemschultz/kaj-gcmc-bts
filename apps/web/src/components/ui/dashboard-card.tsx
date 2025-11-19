import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { brandColors } from '@/styles/brand';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  loading?: boolean;
  href?: string;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  loading = false,
  href,
}: DashboardCardProps) {
  const CardComponent = href ? 'a' : 'div';

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02]",
        href && "cursor-pointer hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>

          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight mb-1">
                {value}
              </p>

              {trend && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className={cn(
                    "text-sm font-medium flex items-center gap-1",
                    trend.positive ? "text-green-600" : "text-red-600"
                  )}
                >
                  <span className={cn(
                    "text-lg",
                    trend.positive ? "text-green-500" : "text-red-500"
                  )}>
                    {trend.positive ? "↗" : "↘"}
                  </span>
                  {Math.abs(trend.value)}%
                  <span className="text-xs text-muted-foreground ml-1">
                    vs last period
                  </span>
                </motion.div>
              )}
            </>
          )}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            "ring-1 ring-primary/10"
          )}
        >
          <Icon className="h-6 w-6 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <CardComponent href={href} className="block text-inherit no-underline">
        {content}
      </CardComponent>
    );
  }

  return content;
}

// Specialized dashboard cards for different metrics
export function ClientCountCard({ count, trend }: { count: number; trend?: { value: number; positive: boolean } }) {
  return (
    <DashboardCard
      title="Total Clients"
      value={count}
      icon={() => (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )}
      trend={trend}
      href="/clients"
    />
  );
}

export function DocumentCountCard({ count, trend }: { count: number; trend?: { value: number; positive: boolean } }) {
  return (
    <DashboardCard
      title="Active Documents"
      value={count}
      icon={() => (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      trend={trend}
      href="/documents"
    />
  );
}

export function FilingCountCard({ count, trend }: { count: number; trend?: { value: number; positive: boolean } }) {
  return (
    <DashboardCard
      title="Upcoming Filings"
      value={count}
      icon={() => (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m6-4V7a2 2 0 00-2-2h-4a2 2 0 00-2 2v4m-6 4h12" />
        </svg>
      )}
      trend={trend}
      href="/filings"
    />
  );
}

export function ComplianceScoreCard({ score, trend }: { score: number; trend?: { value: number; positive: boolean } }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-lime-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <DashboardCard
      title="Compliance Score"
      value={`${score}%`}
      icon={() => (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      trend={trend}
      href="/compliance"
      className={cn("relative overflow-hidden")}
    />
  );
}