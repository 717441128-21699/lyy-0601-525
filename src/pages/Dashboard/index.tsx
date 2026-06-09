import { Users, AlertTriangle, Package, Route, Clock, TrendingUp, Activity, Radio } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import VenueMap from '@/components/Map/VenueMap';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getTimeAgo, getLevelBgColor, getLevelText, getLevelColor, getStatusText, getStatusBgColor, formatTime } from '@/utils';
import type { Alert as AlertType, ActivityLog, Incident } from '@/types';
import { useState } from 'react';
import Modal from '@/components/Modal';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const {
    personnel,
    incidents,
    equipment,
    patrolTasks,
    alerts,
    activityLogs,
    getUnreadAlerts,
    getAreaById,
  } = useAppStore();

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const onDutyCount = personnel.filter((p) => p.status === 'on-duty').length;
  const patrolCount = personnel.filter((p) => p.status === 'patrol').length;
  const activeIncidents = incidents.filter((i) => i.status !== 'completed').length;
  const pendingIncidents = incidents.filter((i) => i.status === 'pending').length;
  const lowStockEquipment = equipment.filter((e) => e.available <= e.warningThreshold).length;
  const completedPatrols = patrolTasks.filter((t) => t.status === 'completed').length;
  const inProgressPatrols = patrolTasks.filter((t) => t.status === 'in-progress').length;

  const incidentByLevel = [
    { name: '紧急(红)', value: incidents.filter((i) => i.level === 'red' && i.status !== 'completed').length, color: '#EF4444' },
    { name: '重要(橙)', value: incidents.filter((i) => i.level === 'orange' && i.status !== 'completed').length, color: '#F59E0B' },
    { name: '关注(黄)', value: incidents.filter((i) => i.level === 'yellow' && i.status !== 'completed').length, color: '#EAB308' },
    { name: '普通(蓝)', value: incidents.filter((i) => i.level === 'blue' && i.status !== 'completed').length, color: '#3B82F6' },
  ];

  const personnelByStatus = [
    { name: '在岗', value: onDutyCount },
    { name: '巡逻', value: patrolCount },
    { name: '调度中', value: personnel.filter((p) => p.status === 'dispatched').length },
    { name: '休息/离岗', value: personnel.filter((p) => p.status === 'rest' || p.status === 'off-duty').length },
  ];

  const areaStats = personnel.reduce((acc, p) => {
    const area = getAreaById(p.areaId);
    if (area) {
      acc[area.name] = (acc[area.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const areaData = Object.entries(areaStats).map(([name, count]) => ({ name, count }));

  const unreadAlerts = getUnreadAlerts();

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowIncidentModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="在岗人员"
          value={`${onDutyCount}/${personnel.length}`}
          icon={Users}
          trend={{ value: 5.2, isPositive: true }}
          color="green"
          className="animate-stagger-1"
        />
        <StatCard
          title="待处置事件"
          value={activeIncidents}
          icon={AlertTriangle}
          color="red"
          className="animate-stagger-2"
        />
        <StatCard
          title="物资预警"
          value={lowStockEquipment}
          icon={Package}
          trend={{ value: 2, isPositive: false }}
          color="orange"
          className="animate-stagger-3"
        />
        <StatCard
          title="巡逻完成率"
          value={`${Math.round((completedPatrols / patrolTasks.length) * 100)}%`}
          icon={Route}
          color="blue"
          className="animate-stagger-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-1">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">会场实时态势</h3>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-primary-400">
                  <Radio className="w-3 h-3 animate-pulse" />
                  实时更新中
                </span>
              </div>
            </div>
            <div className="p-4">
              <VenueMap
                onIncidentClick={handleIncidentClick}
                showRoutes
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-2">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">告警通知</h3>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 5).map((alert: AlertType) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all hover:bg-dark-700/50 ${!alert.isRead ? 'bg-dark-700/30 border-l-2 border-primary-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.level === 'high' ? 'bg-danger-500' :
                      alert.level === 'medium' ? 'bg-warning-500' : 'bg-primary-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{alert.title}</p>
                      <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{alert.description}</p>
                      <p className="text-xs text-dark-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(alert.time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {unreadAlerts.length > 0 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">
                    查看全部 {unreadAlerts.length} 条未读告警
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-3">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">实时动态</h3>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              {activityLogs.slice(0, 6).map((log: ActivityLog, index: number) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-700/30 transition-colors animate-slide-in opacity-0"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    log.type === 'incident' ? 'bg-danger-500' :
                    log.type === 'alert' ? 'bg-warning-500' :
                    log.type === 'patrol' ? 'bg-primary-500' :
                    'bg-success-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{log.title}</p>
                    <p className="text-xs text-dark-400">{log.description}</p>
                    <p className="text-xs text-dark-500 mt-0.5">{getTimeAgo(log.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-1">
          <div className="p-4 border-b border-dark-700">
            <h3 className="text-lg font-semibold text-white">事件分级统计</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentByLevel}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {incidentByLevel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-2">
          <div className="p-4 border-b border-dark-700">
            <h3 className="text-lg font-semibold text-white">人员状态分布</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={personnelByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {personnelByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-3">
          <div className="p-4 border-b border-dark-700">
            <h3 className="text-lg font-semibold text-white">区域人员分布</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card card-hover animate-fade-in-up opacity-0">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">待处置事件</h3>
          <span className="text-sm text-dark-400">
            共 {pendingIncidents} 条待处理
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-800/50">
                <th className="table-header">级别</th>
                <th className="table-header">事件标题</th>
                <th className="table-header">类型</th>
                <th className="table-header">状态</th>
                <th className="table-header">上报时间</th>
                <th className="table-header">处置人员</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {incidents
                .filter((i) => i.status !== 'completed')
                .slice(0, 5)
                .map((incident) => (
                  <tr key={incident.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="table-cell">
                      <span className={`badge ${getLevelBgColor(incident.level)}`}>
                        {getLevelText(incident.level)}
                      </span>
                    </td>
                    <td className="table-cell font-medium text-white">{incident.title}</td>
                    <td className="table-cell">{incident.type}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBgColor(incident.status)}`}>
                        {getStatusText(incident.status)}
                      </span>
                    </td>
                    <td className="table-cell text-dark-400">
                      {formatTime(incident.reportTime)}
                    </td>
                    <td className="table-cell">
                      {incident.currentHandlerId ? (
                        <span className="text-primary-400">
                          {useAppStore.getState().getPersonnelById(incident.currentHandlerId)?.name}
                        </span>
                      ) : (
                        <span className="text-dark-500">未分配</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleIncidentClick(incident)}
                        className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        title="事件详情"
        size="lg"
      >
        {selectedIncident && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`badge ${getLevelBgColor(selectedIncident.level)}`}>
                {getLevelText(selectedIncident.level)}
              </span>
              <span className={`badge ${getStatusBgColor(selectedIncident.status)}`}>
                {getStatusText(selectedIncident.status)}
              </span>
              <span className="text-dark-400 text-sm">
                {formatTime(selectedIncident.reportTime)}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">{selectedIncident.title}</h4>
              <p className="text-dark-300 mt-1">{selectedIncident.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-3 rounded-lg">
                <p className="text-xs text-dark-400">事件类型</p>
                <p className="text-white">{selectedIncident.type}</p>
              </div>
              <div className="bg-dark-900 p-3 rounded-lg">
                <p className="text-xs text-dark-400">上报人</p>
                <p className="text-white">
                  {useAppStore.getState().getPersonnelById(selectedIncident.reporterId)?.name}
                </p>
              </div>
            </div>
            {selectedIncident.currentHandlerId && (
              <div className="bg-primary-900/30 border border-primary-700/50 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-1">当前处置人员</p>
                <div className="flex items-center gap-3">
                  <img
                    src={useAppStore.getState().getPersonnelById(selectedIncident.currentHandlerId)?.avatar}
                    alt="handler"
                    className="w-10 h-10 rounded-full bg-dark-700"
                  />
                  <div>
                    <p className="text-white font-medium">
                      {useAppStore.getState().getPersonnelById(selectedIncident.currentHandlerId)?.name}
                    </p>
                    <p className={`text-sm ${getLevelColor(selectedIncident.level)}`}>
                      处置中
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button className="btn-primary flex-1">调度人员</button>
              <button className="btn-success flex-1">标记完成</button>
              <button className="btn-outline">关闭</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
