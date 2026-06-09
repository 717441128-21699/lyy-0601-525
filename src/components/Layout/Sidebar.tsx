import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Route,
  AlertTriangle,
  Package,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '总览大屏' },
  { path: '/personnel', icon: Users, label: '人员管理' },
  { path: '/risk-points', icon: MapPin, label: '风险点位' },
  { path: '/patrol', icon: Route, label: '巡逻任务' },
  { path: '/incidents', icon: AlertTriangle, label: '事件处置' },
  { path: '/equipment', icon: Package, label: '物资装备' },
  { path: '/review', icon: FileBarChart, label: '复盘报告' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, getUnreadAlerts } = useAppStore();
  const unreadCount = getUnreadAlerts().length;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-dark-900 border-r border-dark-700 transition-all duration-300 z-50',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary-500" />
            <span className="font-bold text-lg font-mono text-white">安保指挥</span>
          </div>
        )}
        {sidebarCollapsed && (
          <ShieldAlert className="w-8 h-8 text-primary-500 mx-auto" />
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800 border border-transparent'
              )
            }
          >
            <item.icon className={cn('w-5 h-5 flex-shrink-0', sidebarCollapsed && 'mx-auto')} />
            {!sidebarCollapsed && (
              <>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.path === '/incidents' && unreadCount > 0 && (
                  <span className="bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse-fast">
                    {unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!sidebarCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center gap-3">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
              alt="Admin"
              className="w-10 h-10 rounded-full bg-dark-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">系统管理员</p>
              <p className="text-xs text-dark-400 truncate">admin@security.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
