import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  className?: string;
}

const colorClasses = {
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
  green: 'from-green-500/20 to-green-600/5 border-green-500/30 text-green-400',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400',
  red: 'from-red-500/20 to-red-600/5 border-red-500/30 text-red-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
};

const iconBgClasses = {
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
  orange: 'bg-orange-500/20 text-orange-400',
  red: 'bg-red-500/20 text-red-400',
  purple: 'bg-purple-500/20 text-purple-400',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-current/10 animate-fade-in-up opacity-0',
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-400 mb-1">{title}</p>
          <p className="text-3xl font-bold font-mono text-white">{value}</p>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-dark-500">较昨日</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconBgClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
