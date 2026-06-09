import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/store';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/utils';

const pageTitles: Record<string, string> = {
  '/': '总览大屏 - 指挥中心',
  '/personnel': '人员管理',
  '/risk-points': '风险点位管理',
  '/patrol': '巡逻任务管理',
  '/incidents': '事件处置中心',
  '/equipment': '物资装备管理',
  '/review': '复盘报告',
};

export default function Layout() {
  const { sidebarCollapsed } = useAppStore();
  const location = useLocation();
  
  useRealtime();

  const title = pageTitles[location.pathname] || '安保指挥系统';

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header title={title} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
