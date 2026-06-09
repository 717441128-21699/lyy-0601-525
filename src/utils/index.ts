export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

export function getDuration(start: Date, end: Date): string {
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'on-duty': 'text-success-500',
    'off-duty': 'text-dark-400',
    'rest': 'text-caution-500',
    'patrol': 'text-primary-400',
    'dispatched': 'text-warning-500',
    'pending': 'text-caution-500',
    'processing': 'text-primary-400',
    'completed': 'text-success-500',
    'in-progress': 'text-primary-400',
    'abnormal': 'text-danger-500',
    'normal': 'text-success-500',
    'warning': 'text-warning-500',
    'danger': 'text-danger-500',
    'accepted': 'text-primary-400',
    'arrived': 'text-warning-500',
    'approved': 'text-success-500',
    'rejected': 'text-danger-500',
  };
  return colorMap[status] || 'text-dark-400';
}

export function getStatusBgColor(status: string): string {
  const colorMap: Record<string, string> = {
    'on-duty': 'bg-success-500/20 border-success-500/30',
    'off-duty': 'bg-dark-600/50 border-dark-600',
    'rest': 'bg-caution-500/20 border-caution-500/30',
    'patrol': 'bg-primary-500/20 border-primary-500/30',
    'dispatched': 'bg-warning-500/20 border-warning-500/30',
    'pending': 'bg-caution-500/20 border-caution-500/30',
    'processing': 'bg-primary-500/20 border-primary-500/30',
    'completed': 'bg-success-500/20 border-success-500/30',
    'in-progress': 'bg-primary-500/20 border-primary-500/30',
    'abnormal': 'bg-danger-500/20 border-danger-500/30',
  };
  return colorMap[status] || 'bg-dark-600/50 border-dark-600';
}

export function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    'on-duty': '在岗',
    'off-duty': '离岗',
    'rest': '休息',
    'patrol': '巡逻中',
    'dispatched': '已调度',
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'in-progress': '进行中',
    'abnormal': '异常',
    'normal': '正常',
    'warning': '警告',
    'danger': '危险',
    'accepted': '已接收',
    'arrived': '已到达',
    'approved': '已批准',
    'rejected': '已拒绝',
    'borrow': '领用',
    'return': '归还',
  };
  return textMap[status] || status;
}

export function getLevelColor(level: string): string {
  const colorMap: Record<string, string> = {
    'red': 'text-danger-500',
    'orange': 'text-warning-500',
    'yellow': 'text-caution-500',
    'blue': 'text-primary-400',
    'high': 'text-danger-500',
    'medium': 'text-warning-500',
    'low': 'text-primary-400',
  };
  return colorMap[level] || 'text-dark-400';
}

export function getLevelBgColor(level: string): string {
  const colorMap: Record<string, string> = {
    'red': 'bg-danger-500/20 border-danger-500/30',
    'orange': 'bg-warning-500/20 border-warning-500/30',
    'yellow': 'bg-caution-500/20 border-caution-500/30',
    'blue': 'bg-primary-500/20 border-primary-500/30',
    'high': 'bg-danger-500/20 border-danger-500/30',
    'medium': 'bg-warning-500/20 border-warning-500/30',
    'low': 'bg-primary-500/20 border-primary-500/30',
  };
  return colorMap[level] || 'bg-dark-600/50 border-dark-600';
}

export function getLevelText(level: string): string {
  const textMap: Record<string, string> = {
    'red': '紧急',
    'orange': '重要',
    'yellow': '关注',
    'blue': '普通',
    'high': '高',
    'medium': '中',
    'low': '低',
  };
  return textMap[level] || level;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
