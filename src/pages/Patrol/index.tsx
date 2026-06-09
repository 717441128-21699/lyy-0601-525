import { useState } from 'react';
import { Route, MapPin, Clock, CheckCircle, AlertCircle, Users, Play, Eye } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import VenueMap from '@/components/Map/VenueMap';
import Modal from '@/components/Modal';
import { getStatusBgColor, getStatusText, formatTime, formatDate, cn } from '@/utils';
import type { PatrolTask, PatrolRoute } from '@/types';

export default function Patrol() {
  const {
    patrolRoutes,
    patrolTasks,
    patrolCheckins,
    getPersonnelById,
    getPatrolRouteById,
    getRiskPointById,
    getTaskCheckins,
  } = useAppStore();

  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null);
  const [selectedTask, setSelectedTask] = useState<PatrolTask | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'routes' | 'tasks' | 'checkins'>('routes');

  const completedTasks = patrolTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = patrolTasks.filter((t) => t.status === 'in-progress').length;
  const pendingTasks = patrolTasks.filter((t) => t.status === 'pending').length;
  const completionRate = patrolTasks.length > 0 ? Math.round((completedTasks / patrolTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="巡逻路线" value={patrolRoutes.length} icon={Route} color="blue" className="animate-stagger-1" />
        <StatCard title="进行中任务" value={inProgressTasks} icon={Play} color="green" className="animate-stagger-2" />
        <StatCard title="待执行任务" value={pendingTasks} icon={Clock} color="orange" className="animate-stagger-3" />
        <StatCard title="任务完成率" value={`${completionRate}%`} icon={CheckCircle} color="purple" className="animate-stagger-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card card-hover animate-fade-in-up opacity-0">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">巡逻路线地图</h3>
              <span className="text-xs text-primary-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 实时显示
              </span>
            </div>
            <div className="p-4">
              <VenueMap showRoutes showRiskPoints showPersonnel={false} showIncidents={false} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card animate-fade-in-up opacity-0">
            <div className="p-4 border-b border-dark-700">
              <div className="flex gap-2">
                {(['routes', 'tasks', 'checkins'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors flex-1',
                      activeTab === tab ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                    )}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'routes' ? '路线列表' : tab === 'tasks' ? '任务列表' : '打卡记录'}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {activeTab === 'routes' && (
                <div className="divide-y divide-dark-700">
                  {patrolRoutes.map((route) => (
                    <div key={route.id} className="p-4 hover:bg-dark-700/30 transition-colors cursor-pointer" onClick={() => { setSelectedRoute(route); setShowRouteModal(true); }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white">{route.name}</h4>
                          <p className="text-xs text-dark-400 mt-1">{route.pointIds.length} 个打卡点 · 预计 {route.estimatedTime} 分钟</p>
                        </div>
                        <Eye className="w-4 h-4 text-primary-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="divide-y divide-dark-700">
                  {patrolTasks.slice(0, 10).map((task) => {
                    const route = getPatrolRouteById(task.routeId);
                    const person = getPersonnelById(task.personnelId);
                    return (
                      <div key={task.id} className="p-4 hover:bg-dark-700/30 transition-colors cursor-pointer" onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white truncate">{route?.name}</h4>
                              <span className={`badge ${getStatusBgColor(task.status)} text-xs`}>{getStatusText(task.status)}</span>
                            </div>
                            <p className="text-xs text-dark-400 mt-1">{person?.name}</p>
                            <p className="text-xs text-dark-500 mt-1">{formatDate(task.startTime)} {formatTime(task.startTime)}</p>
                          </div>
                          <Eye className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'checkins' && (
                <div className="divide-y divide-dark-700">
                  {[...patrolCheckins].sort((a, b) => b.checkinTime.getTime() - a.checkinTime.getTime()).slice(0, 15).map((checkin) => {
                    const point = getRiskPointById(checkin.pointId);
                    const task = patrolTasks.find((t) => t.id === checkin.taskId);
                    const person = task ? getPersonnelById(task.personnelId) : null;
                    return (
                      <div key={checkin.id} className="p-4 hover:bg-dark-700/30 transition-colors">
                        <div className="flex items-start gap-3">
                          {checkin.isAbnormal ? (
                            <AlertCircle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">{point?.name}</p>
                            <p className="text-xs text-dark-400 mt-0.5">{person?.name}</p>
                            <p className="text-xs text-dark-500 mt-0.5">{formatDate(checkin.checkinTime)} {formatTime(checkin.checkinTime)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up opacity-0">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">巡逻任务概览</h3>
          <span className="text-sm text-dark-400">共 {patrolTasks.length} 条任务</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-800/50">
                <th className="table-header">任务路线</th>
                <th className="table-header">巡逻人员</th>
                <th className="table-header">开始时间</th>
                <th className="table-header">打卡进度</th>
                <th className="table-header">状态</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {patrolTasks.slice(0, 8).map((task) => {
                const route = getPatrolRouteById(task.routeId);
                const person = getPersonnelById(task.personnelId);
                const checkinCount = getTaskCheckins(task.id).length;
                const totalPoints = route?.pointIds.length || 0;
                return (
                  <tr key={task.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="table-cell font-medium text-white">{route?.name}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <img src={person?.avatar} alt="" className="w-6 h-6 rounded-full bg-dark-700" />
                        <span>{person?.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-dark-400">{formatDate(task.startTime)} {formatTime(task.startTime)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${totalPoints > 0 ? (checkinCount / totalPoints) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-dark-400">{checkinCount}/{totalPoints}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBgColor(task.status)}`}>{getStatusText(task.status)}</span>
                    </td>
                    <td className="table-cell">
                      <button onClick={() => { setSelectedTask(task); setShowTaskModal(true); }} className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showRouteModal} onClose={() => setShowRouteModal(false)} title="路线详情" size="lg">
        {selectedRoute && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-semibold text-white">{selectedRoute.name}</h4>
              <p className="text-dark-400 mt-1">{selectedRoute.pointIds.length} 个打卡点 · 预计 {selectedRoute.estimatedTime} 分钟</p>
            </div>
            <div className="bg-dark-900 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-3">打卡点顺序</h5>
              <div className="space-y-2">
                {selectedRoute.pointIds.map((pointId, index) => {
                  const point = getRiskPointById(pointId);
                  return (
                    <div key={pointId} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-medium">{index + 1}</div>
                      <div>
                        <p className="text-white text-sm">{point?.name}</p>
                        <p className="text-xs text-dark-500">{point?.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="任务详情" size="lg">
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`badge ${getStatusBgColor(selectedTask.status)}`}>{getStatusText(selectedTask.status)}</span>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">{getPatrolRouteById(selectedTask.routeId)?.name}</h4>
              <div className="flex items-center gap-4 mt-2 text-sm text-dark-400">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{getPersonnelById(selectedTask.personnelId)?.name}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDate(selectedTask.startTime)} {formatTime(selectedTask.startTime)}</span>
              </div>
            </div>
            <div className="bg-dark-900 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-3">打卡记录</h5>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getTaskCheckins(selectedTask.id).map((checkin) => {
                  const point = getRiskPointById(checkin.pointId);
                  return (
                    <div key={checkin.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800">
                      {checkin.isAbnormal ? <AlertCircle className="w-4 h-4 text-danger-500" /> : <CheckCircle className="w-4 h-4 text-success-500" />}
                      <div className="flex-1">
                        <p className="text-white text-sm">{point?.name}</p>
                        <p className="text-xs text-dark-500">{formatTime(checkin.checkinTime)}</p>
                      </div>
                    </div>
                  );
                })}
                {getTaskCheckins(selectedTask.id).length === 0 && <p className="text-center text-dark-500 py-4">暂无打卡记录</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
