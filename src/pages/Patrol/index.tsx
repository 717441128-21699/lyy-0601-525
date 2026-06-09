import { useState } from 'react';
import { Route, MapPin, Clock, CheckCircle, AlertCircle, Users, Play, Eye, Plus, UserPlus, X, GripVertical, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import VenueMap from '@/components/Map/VenueMap';
import Modal from '@/components/Modal';
import { getStatusBgColor, getStatusText, formatTime, formatDate, cn, generateId } from '@/utils';
import type { PatrolTask, PatrolRoute, RiskPoint, Personnel } from '@/types';

export default function Patrol() {
  const {
    patrolRoutes,
    patrolTasks,
    patrolCheckins,
    riskPoints,
    personnel,
    getPersonnelById,
    getPatrolRouteById,
    getRiskPointById,
    getTaskCheckins,
    addPatrolRoute,
    addPatrolTask,
    updatePersonnel,
    addActivityLog,
    getAreaById,
  } = useAppStore();

  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null);
  const [selectedTask, setSelectedTask] = useState<PatrolTask | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'routes' | 'tasks' | 'checkins'>('routes');

  const [newRoute, setNewRoute] = useState({
    name: '',
    estimatedTime: 30,
    selectedPointIds: [] as string[],
  });

  const [newTask, setNewTask] = useState({
    routeId: '',
    personnelId: '',
    startTime: '',
    frequency: 1,
  });

  const availablePersonnel = personnel.filter(p => p.status === 'on-duty');

  const togglePointSelection = (pointId: string) => {
    setNewRoute(prev => ({
      ...prev,
      selectedPointIds: prev.selectedPointIds.includes(pointId)
        ? prev.selectedPointIds.filter(id => id !== pointId)
        : [...prev.selectedPointIds, pointId]
    }));
  };

  const movePointUp = (index: number) => {
    if (index === 0) return;
    setNewRoute(prev => {
      const newIds = [...prev.selectedPointIds];
      [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
      return { ...prev, selectedPointIds: newIds };
    });
  };

  const movePointDown = (index: number) => {
    if (index === newRoute.selectedPointIds.length - 1) return;
    setNewRoute(prev => {
      const newIds = [...prev.selectedPointIds];
      [newIds[index + 1], newIds[index]] = [newIds[index], newIds[index + 1]];
      return { ...prev, selectedPointIds: newIds };
    });
  };

  const removePoint = (pointId: string) => {
    setNewRoute(prev => ({
      ...prev,
      selectedPointIds: prev.selectedPointIds.filter(id => id !== pointId)
    }));
  };

  const handleAddRoute = () => {
    if (!newRoute.name || newRoute.selectedPointIds.length < 2) return;

    const route: PatrolRoute = {
      id: generateId(),
      name: newRoute.name,
      pointIds: newRoute.selectedPointIds,
      estimatedTime: newRoute.estimatedTime,
    };

    addPatrolRoute(route);
    addActivityLog({
      id: generateId(),
      type: 'patrol',
      title: '新增巡逻路线',
      description: `路线 "${route.name}" 已创建，包含 ${route.pointIds.length} 个打卡点`,
      time: new Date(),
      relatedId: route.id,
    });

    setNewRoute({ name: '', estimatedTime: 30, selectedPointIds: [] });
    setShowAddRouteModal(false);
  };

  const handleAddTask = () => {
    if (!newTask.routeId || !newTask.personnelId || !newTask.startTime) return;

    const route = getPatrolRouteById(newTask.routeId);
    const person = getPersonnelById(newTask.personnelId);
    const startTime = new Date(newTask.startTime);
    const endTime = new Date(startTime.getTime() + (route?.estimatedTime || 30) * 60000);

    const task: PatrolTask = {
      id: generateId(),
      routeId: newTask.routeId,
      personnelId: newTask.personnelId,
      startTime,
      endTime,
      status: 'pending',
      frequency: newTask.frequency,
      currentPointIndex: 0,
    };

    addPatrolTask(task);
    updatePersonnel(newTask.personnelId, { status: 'patrol' });
    addActivityLog({
      id: generateId(),
      type: 'patrol',
      title: '派发巡逻任务',
      description: `路线 "${route?.name}" 已派发给 ${person?.name}`,
      time: new Date(),
      relatedId: task.id,
    });

    setNewTask({ routeId: '', personnelId: '', startTime: '', frequency: 1 });
    setShowAddTaskModal(false);
  };

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

      <div className="flex flex-wrap gap-3 animate-fade-in-up opacity-0">
        <button
          onClick={() => setShowAddRouteModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建巡逻路线
        </button>
        <button
          onClick={() => setShowAddTaskModal(true)}
          className="btn-success flex items-center gap-2"
          disabled={patrolRoutes.length === 0 || availablePersonnel.length === 0}
        >
          <UserPlus className="w-4 h-4" />
          派发巡逻任务
        </button>
        {patrolRoutes.length === 0 && (
          <span className="text-xs text-warning-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            请先创建巡逻路线
          </span>
        )}
        {availablePersonnel.length === 0 && (
          <span className="text-xs text-warning-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            暂无在岗人员可派发
          </span>
        )}
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

      <Modal isOpen={showAddRouteModal} onClose={() => { setShowAddRouteModal(false); setNewRoute({ name: '', estimatedTime: 30, selectedPointIds: [] }); }} title="新建巡逻路线" size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">路线名称 *</label>
              <input
                type="text"
                value={newRoute.name}
                onChange={e => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入路线名称"
                className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">预计时间（分钟）*</label>
              <input
                type="number"
                min="5"
                max="480"
                value={newRoute.estimatedTime}
                onChange={e => setNewRoute(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              选择打卡点 * <span className="text-xs text-dark-500">(至少选择2个，点击选择或取消)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {riskPoints.map(point => {
                const isSelected = newRoute.selectedPointIds.includes(point.id);
                return (
                  <label
                    key={point.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                      isSelected
                        ? 'bg-primary-500/20 border-primary-500/50'
                        : 'bg-dark-800 border-transparent hover:bg-dark-700'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePointSelection(point.id)}
                      className="hidden"
                    />
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-primary-500 border-primary-500' : 'border-dark-500'
                    )}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{point.name}</p>
                      <p className="text-xs text-dark-400 truncate">{getAreaById(point.areaId)?.name} · {point.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {newRoute.selectedPointIds.length > 0 && (
            <div className="bg-dark-900 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-white">打卡点顺序 <span className="text-xs text-dark-400">(可拖拽调整)</span></h5>
                <span className="text-xs text-primary-400">{newRoute.selectedPointIds.length} 个点</span>
              </div>
              <div className="space-y-2">
                {newRoute.selectedPointIds.map((pointId, index) => {
                  const point = getRiskPointById(pointId);
                  return (
                    <div
                      key={pointId}
                      className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg group"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{point?.name}</p>
                        <p className="text-xs text-dark-500 truncate">{point?.description}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => movePointUp(index)}
                          disabled={index === 0}
                          className="p-1 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => movePointDown(index)}
                          disabled={index === newRoute.selectedPointIds.length - 1}
                          className="p-1 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removePoint(pointId)}
                          className="p-1 text-danger-400 hover:text-danger-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={handleAddRoute}
              disabled={!newRoute.name || newRoute.selectedPointIds.length < 2}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建路线
            </button>
            <button
              onClick={() => { setShowAddRouteModal(false); setNewRoute({ name: '', estimatedTime: 30, selectedPointIds: [] }); }}
              className="btn-outline flex-1"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddTaskModal} onClose={() => { setShowAddTaskModal(false); setNewTask({ routeId: '', personnelId: '', startTime: '', frequency: 1 }); }} title="派发巡逻任务" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">选择巡逻路线 *</label>
            <select
              value={newTask.routeId}
              onChange={e => setNewTask(prev => ({ ...prev, routeId: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择巡逻路线</option>
              {patrolRoutes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name} ({route.pointIds.length}个打卡点 · 预计{route.estimatedTime}分钟)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">选择巡逻人员 *</label>
            {availablePersonnel.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availablePersonnel.map(person => (
                  <label
                    key={person.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                      newTask.personnelId === person.id
                        ? 'bg-primary-500/20 border-primary-500/50'
                        : 'bg-dark-800 border-transparent hover:bg-dark-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="taskPersonnel"
                      value={person.id}
                      checked={newTask.personnelId === person.id}
                      onChange={e => setNewTask(prev => ({ ...prev, personnelId: e.target.value }))}
                      className="hidden"
                    />
                    <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{person.name}</p>
                      <p className="text-xs text-dark-400">{person.position} · {getAreaById(person.areaId)?.name}</p>
                    </div>
                    {newTask.personnelId === person.id && <UserPlus className="w-5 h-5 text-primary-400" />}
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-dark-900 rounded-lg text-center">
                <AlertCircle className="w-8 h-8 text-warning-400 mx-auto mb-2" />
                <p className="text-dark-400 text-sm">暂无在岗人员可分配</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">开始时间 *</label>
              <input
                type="datetime-local"
                value={newTask.startTime}
                onChange={e => setNewTask(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">巡逻频率</label>
              <select
                value={newTask.frequency}
                onChange={e => setNewTask(prev => ({ ...prev, frequency: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1次</option>
                <option value={2}>2次</option>
                <option value={3}>3次</option>
                <option value={4}>4次</option>
              </select>
            </div>
          </div>

          {newTask.routeId && (
            <div className="bg-dark-900 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-3">路线预览</h5>
              <div className="space-y-2">
                {getPatrolRouteById(newTask.routeId)?.pointIds.map((pointId, index) => {
                  const point = getRiskPointById(pointId);
                  return (
                    <div key={pointId} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <p className="text-white text-sm">{point?.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={handleAddTask}
              disabled={!newTask.routeId || !newTask.personnelId || !newTask.startTime}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认派发
            </button>
            <button
              onClick={() => { setShowAddTaskModal(false); setNewTask({ routeId: '', personnelId: '', startTime: '', frequency: 1 }); }}
              className="btn-outline flex-1"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
