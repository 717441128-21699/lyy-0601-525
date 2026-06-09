import { Bell, Search, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDateTime } from '@/utils';

export default function Header({ title }: { title: string }) {
  const { currentTime, getUnreadAlerts, markAlertRead, alerts } = useAppStore();
  const unreadAlerts = getUnreadAlerts();

  return (
    <header className="h-16 bg-dark-800/50 backdrop-blur-sm border-b border-dark-700 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white font-mono">{title}</h1>
        <div className="flex items-center gap-2 text-primary-400 bg-primary-900/30 px-3 py-1.5 rounded-lg border border-primary-700/50">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatDateTime(currentTime)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 pl-10 pr-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative">
          <button className="relative p-2 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse-fast">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {unreadAlerts.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-dark-700">
                <h3 className="font-medium text-white">告警通知</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-4 py-3 border-b border-dark-700 last:border-0 hover:bg-dark-700/50 cursor-pointer transition-colors ${!alert.isRead ? 'bg-dark-700/30' : ''}`}
                    onClick={() => markAlertRead(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        alert.level === 'high' ? 'bg-danger-500' :
                        alert.level === 'medium' ? 'bg-warning-500' : 'bg-primary-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{alert.title}</p>
                        <p className="text-xs text-dark-400 mt-0.5">{alert.description}</p>
                        <p className="text-xs text-dark-500 mt-1">
                          {new Date(alert.time).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
