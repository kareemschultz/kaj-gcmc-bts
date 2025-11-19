import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Upload, Download, Settings, AlertTriangle,
  CheckCircle, Clock, Eye, Edit, Trash2, Shield, UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandColors, businessColors } from '@/styles/brand';

interface ActivityItem {
  id: string;
  type: 'user' | 'document' | 'compliance' | 'system' | 'security';
  action: string;
  description: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string | Date;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'success' | 'error';
  relatedEntity?: {
    type: 'client' | 'document' | 'filing' | 'user';
    id: string;
    name: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  showTimestamp?: boolean;
  showUser?: boolean;
  groupByDate?: boolean;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

export function ActivityFeed({
  activities,
  showTimestamp = true,
  showUser = true,
  groupByDate = true,
  maxItems,
  className,
  compact = false
}: ActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getActivityIcon = (type: string, action: string, severity?: string) => {
    const iconClass = "w-4 h-4";

    switch (type) {
      case 'user':
        if (action.includes('login')) return <UserCheck className={iconClass} />;
        if (action.includes('logout')) return <User className={iconClass} />;
        return <User className={iconClass} />;
      case 'document':
        if (action.includes('upload')) return <Upload className={iconClass} />;
        if (action.includes('download')) return <Download className={iconClass} />;
        if (action.includes('view')) return <Eye className={iconClass} />;
        if (action.includes('edit')) return <Edit className={iconClass} />;
        if (action.includes('delete')) return <Trash2 className={iconClass} />;
        return <FileText className={iconClass} />;
      case 'compliance':
        if (severity === 'error') return <AlertTriangle className={iconClass} />;
        if (severity === 'success') return <CheckCircle className={iconClass} />;
        return <Shield className={iconClass} />;
      case 'system':
        return <Settings className={iconClass} />;
      case 'security':
        return <Shield className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getActivityColor = (type: string, severity?: string) => {
    if (severity) {
      switch (severity) {
        case 'error': return 'text-red-600 bg-red-50 border-red-200';
        case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'success': return 'text-green-600 bg-green-50 border-green-200';
        default: return 'text-blue-600 bg-blue-50 border-blue-200';
      }
    }

    switch (type) {
      case 'user': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'document': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'compliance': return 'text-green-600 bg-green-50 border-green-200';
      case 'system': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'security': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const groupedActivities = groupByDate
    ? displayActivities.reduce((groups, activity) => {
        const date = typeof activity.timestamp === 'string'
          ? new Date(activity.timestamp)
          : activity.timestamp;
        const dateKey = date.toDateString();

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(activity);
        return groups;
      }, {} as Record<string, ActivityItem[]>)
    : { 'All Activities': displayActivities };

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(groupedActivities).map(([dateGroup, groupActivities]) => (
        <div key={dateGroup} className="space-y-3">
          {groupByDate && dateGroup !== 'All Activities' && (
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {dateGroup === new Date().toDateString() ? 'Today' : dateGroup}
            </h3>
          )}

          <div className="space-y-2">
            <AnimatePresence>
              {groupActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
                    "hover:shadow-sm",
                    compact ? "p-2" : "p-3"
                  )}
                >
                  {/* Activity Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.1, duration: 0.2 }}
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center",
                      getActivityColor(activity.type, activity.severity)
                    )}
                  >
                    {getActivityIcon(activity.type, activity.action, activity.severity)}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium text-gray-900",
                          compact ? "text-sm" : "text-sm"
                        )}>
                          {activity.action}
                        </p>
                        <p className={cn(
                          "text-gray-600 mt-1",
                          compact ? "text-xs" : "text-sm"
                        )}>
                          {activity.description}
                        </p>

                        {/* User Information */}
                        {showUser && activity.user && (
                          <div className="flex items-center gap-2 mt-2">
                            {activity.user.avatar ? (
                              <img
                                src={activity.user.avatar}
                                alt={activity.user.name}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {activity.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {activity.user.name}
                            </span>
                          </div>
                        )}

                        {/* Related Entity */}
                        {activity.relatedEntity && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.2 }}
                            className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                          >
                            <span className="capitalize">{activity.relatedEntity.type}:</span>
                            <span className="font-medium">{activity.relatedEntity.name}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Timestamp */}
                      {showTimestamp && (
                        <span className={cn(
                          "text-gray-500 flex-shrink-0 ml-2",
                          compact ? "text-xs" : "text-xs"
                        )}>
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 text-gray-500"
        >
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No recent activity</p>
        </motion.div>
      )}

      {maxItems && activities.length > maxItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pt-2"
        >
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View all {activities.length} activities
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Specialized activity feed for dashboard
export function DashboardActivityFeed({
  activities,
  className
}: {
  activities: ActivityItem[];
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-lg border p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          View all
        </motion.button>
      </div>

      <ActivityFeed
        activities={activities}
        maxItems={5}
        compact
        groupByDate={false}
      />
    </div>
  );
}

// Real-time activity notifications
export function ActivityNotifications({
  activities,
  onMarkAsRead
}: {
  activities: ActivityItem[];
  onMarkAsRead?: (activityId: string) => void;
}) {
  const unreadActivities = activities.filter(a =>
    a.metadata?.unread &&
    (a.severity === 'warning' || a.severity === 'error')
  );

  return (
    <AnimatePresence>
      {unreadActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: -50, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 100 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className={cn(
            "fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border",
            "bg-white border-l-4",
            activity.severity === 'error' ? "border-l-red-500" : "border-l-orange-500"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center",
              getActivityColor(activity.type, activity.severity)
            )}>
              {getActivityIcon(activity.type, activity.action, activity.severity)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
              <p className="text-gray-600 text-xs mt-1">{activity.description}</p>
              <span className="text-xs text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>

            {onMarkAsRead && (
              <button
                onClick={() => onMarkAsRead(activity.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}