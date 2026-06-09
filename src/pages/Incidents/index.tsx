import { useState } from 'react';
import { AlertTriangle, Clock, Radio, MapPin, CheckCircle, UserCheck, MessageSquare, Shield, Package, Users, Zap, Phone, Send, RotateCcw, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import VenueMap from '@/components/Map/VenueMap';
import { getLevelBgColor, getLevelText, getLevelColor, getStatusBgColor, getStatusText, formatTime, getTimeAgo, getDistance, generateId, cn } from '@/utils';
import type { Incident, Personnel, IntercomLog, RiskPoint, Equipment } from '@/types';

const QUICK_COMMANDS = [
  '请报告现场情况',
  '请注意自身安全',
  '请求支援已派出',
  '已收到请回复',
  '请保持警戒等待支援',
  '请拍照上传现场情况',
];

export default function Incidents() {
  const {
    incidents,
    getNearbyPersonnel,
    getNearbyRiskPoints,
    getEquipmentUsageByIncident,
    getIncidentRecords,
    getIntercomLogsByIncident,
    getPersonnelById,
    getRiskPointById,
    getEquipmentById,
    updateIncident,
    addIncidentDispatch,
    addIncidentRecord,
    addIntercomLog,
    addActivityLog,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'normal' | 'command'>('normal');
  const [intercomContent, setIntercomContent] = useState('');
  const [showIntercomModal, setShowIntercomModal] = useState(false);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'red' | 'orange' | 'yellow' | 'blue'>('all');

  const filteredIncidents = activeTab === 'all' ? incidents : incidents.filter((i) => i.level === activeTab);

  const stats = {
    total: incidents.filter((i) => i.status !== 'completed').length,
    red: incidents.filter((i) => i.level === 'red' && i.status !== 'completed').length,
    orange: incidents.filter((i) => i.level === 'orange' && i.status !== 'completed').length,
    yellow: incidents.filter((i) => i.level === 'yellow' && i.status !== 'completed').length,
    blue: incidents.filter((i) => i.level === 'blue' && i.status !== 'completed').length,
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };

  const handleDispatch = (person: Personnel) => {
    if (!selectedIncident) return;
    const dispatchId = generateId();
    addIncidentDispatch({ id: dispatchId, incidentId: selectedIncident.id, personnelId: person.id, dispatchTime: new Date(), status: 'dispatched' });
    addIncidentRecord({ id: generateId(), incidentId: selectedIncident.id, time: new Date(), content: `调度人员 ${person.name} 前往处置`, operatorId: 'system', type: 'dispatch' });
    updateIncident(selectedIncident.id, { status: 'processing', currentHandlerId: person.id });
    
    const intercomId = generateId();
    const intercomContent = `指挥中心呼叫 ${person.name}，请立即前往 ${selectedIncident.title} 现场进行处置，注意安全，保持通讯畅通。`;
    addIntercomLog({
      id: intercomId,
      incidentId: selectedIncident.id,
      fromId: 'p1',
      toId: person.id,
      time: new Date(),
      content: intercomContent,
    });
    addIncidentRecord({
      id: generateId(),
      incidentId: selectedIncident.id,
      time: new Date(),
      content: `对讲记录已发送给 ${person.name}`,
      operatorId: 'p1',
      type: 'intercom',
    });
    
    addActivityLog({
      id: generateId(),
      type: 'incident',
      title: '事件调度',
      description: `${selectedIncident.title} 已调度给 ${person.name}`,
      time: new Date(),
      relatedId: selectedIncident.id,
    });
    
    setSelectedIncident({ ...selectedIncident, status: 'processing', currentHandlerId: person.id });
  };

  const handleComplete = () => {
    if (!selectedIncident) return;
    updateIncident(selectedIncident.id, { status: 'completed' });
    addIncidentRecord({ id: generateId(), incidentId: selectedIncident.id, time: new Date(), content: '事件处置完成', operatorId: 'system', type: 'complete' });
    setShowDetailModal(false);
  };

  const handleSendIntercom = () => {
    if (!selectedIncident || !intercomContent.trim() || !selectedIncident.currentHandlerId) return;
    
    addIntercomLog({
      id: generateId(),
      incidentId: selectedIncident.id,
      fromId: 'p1',
      toId: selectedIncident.currentHandlerId,
      time: new Date(),
      content: intercomContent,
    });
    
    addIncidentRecord({
      id: generateId(),
      incidentId: selectedIncident.id,
      time: new Date(),
      content: `对讲记录已发送`,
      operatorId: 'p1',
      type: 'intercom',
    });
    
    setIntercomContent('');
    setShowIntercomModal(false);
  };

  const nearbyPersonnel = selectedIncident
    ? getNearbyPersonnel(selectedIncident.x, selectedIncident.y, 200)
        .sort((a, b) => getDistance(a.x, a.y, selectedIncident.x, selectedIncident.y) - getDistance(b.x, b.y, selectedIncident.x, selectedIncident.y))
        .slice(0, 5)
    : [];

  const nearbyRiskPoints = selectedIncident
    ? getNearbyRiskPoints(selectedIncident.x, selectedIncident.y, 150)
    : [];

  const equipmentUsage = selectedIncident
    ? getEquipmentUsageByIncident(selectedIncident.id)
    : [];

  const incidentRecords = selectedIncident ? getIncidentRecords(selectedIncident.id) : [];
  const intercomLogs = selectedIncident ? getIntercomLogsByIncident(selectedIncident.id) : [];

  const getLevelDotClass = (level: string) => cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
    level === 'red' ? 'bg-danger-500' : level === 'orange' ? 'bg-warning-500' : level === 'yellow' ? 'bg-caution-500' : 'bg-primary-500'
  );

  const getPersonnelEquipmentCount = (personnelId: string) => {
    return useAppStore.getState().equipmentLogs
      .filter(l => l.personnelId === personnelId && l.type === 'borrow' && l.status === 'completed')
      .reduce((sum, l) => sum + l.quantity, 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="待处置事件" value={stats.total} icon={AlertTriangle} color="red" className="animate-stagger-1" />
        <StatCard title="紧急(红)" value={stats.red} icon={AlertTriangle} color="red" className="animate-stagger-2" />
        <StatCard title="重要(橙)" value={stats.orange} icon={AlertTriangle} color="orange" className="animate-stagger-3" />
        <StatCard title="关注(黄)" value={stats.yellow} icon={AlertTriangle} color="orange" className="animate-stagger-4" />
        <StatCard title="普通(蓝)" value={stats.blue} icon={AlertTriangle} color="blue" className="animate-stagger-5" />
      </div>

      <div className="card animate-fade-in-up opacity-0">
        <div className="p-4 border-b border-dark-700 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">事件处置中心</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('normal')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                viewMode === 'normal' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              常规视图
            </button>
            <button
              onClick={() => setViewMode('command')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                viewMode === 'command' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
              )}
            >
              <Shield className="w-4 h-4" />
              协同指挥视图
            </button>
          </div>
        </div>

        {viewMode === 'normal' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            <div className="lg:col-span-1">
              <div className="bg-dark-900/50 rounded-lg p-3">
                <div className="flex gap-2 flex-wrap mb-3">
                  {(['all', 'red', 'orange', 'yellow', 'blue'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        activeTab === tab
                          ? tab === 'all' ? 'bg-primary-600 text-white' : `${getLevelBgColor(tab)} ${getLevelColor(tab)}`
                          : 'bg-dark-700 text-dark-400 hover:text-white'
                      )}
                    >
                      {tab === 'all' ? '全部' : getLevelText(tab)}
                    </button>
                  ))}
                </div>
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      onClick={() => handleIncidentClick(incident)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer transition-all hover:bg-dark-700/50 border',
                        selectedIncident?.id === incident.id ? 'bg-dark-700/50 border-primary-500/50' : 'bg-dark-800/30 border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={getLevelDotClass(incident.level)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${getLevelBgColor(incident.level)} text-xs`}>{getLevelText(incident.level)}</span>
                            <span className={`badge ${getStatusBgColor(incident.status)} text-xs`}>{getStatusText(incident.status)}</span>
                          </div>
                          <p className="text-sm font-medium text-white truncate">{incident.title}</p>
                          <p className="text-xs text-dark-400 mt-1 line-clamp-1">{incident.description}</p>
                          <p className="text-xs text-dark-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeAgo(incident.reportTime)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-dark-900/50 rounded-lg">
                <div className="p-3 border-b border-dark-700 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">会场事件分布</h4>
                  <span className="flex items-center gap-1 text-xs text-primary-400"><Radio className="w-3 h-3 animate-pulse" />实时更新</span>
                </div>
                <div className="p-4">
                  <VenueMap onIncidentClick={handleIncidentClick} highlightIncidentId={selectedIncident?.id} showPersonnel />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
            <div className="bg-dark-900/50 rounded-lg">
              <div className="p-3 border-b border-dark-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-400" />
                <h4 className="text-sm font-semibold text-white">附近人员</h4>
                <span className="ml-auto text-xs text-dark-400">{nearbyPersonnel.length}人</span>
              </div>
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {selectedIncident ? (
                  <div className="space-y-2">
                    {nearbyPersonnel.map((person) => {
                      const distance = Math.round(getDistance(person.x, person.y, selectedIncident.x, selectedIncident.y));
                      const isHandler = person.id === selectedIncident.currentHandlerId;
                      const equipCount = getPersonnelEquipmentCount(person.id);
                      return (
                        <div key={person.id} className={cn('flex items-center justify-between p-3 rounded-lg transition-colors', isHandler ? 'bg-primary-900/30 border border-primary-500/30' : 'bg-dark-800 hover:bg-dark-700/50')}>
                          <div className="flex items-center gap-3">
                            <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                            <div>
                              <p className="text-white font-medium">{person.name}</p>
                              <p className="text-xs text-dark-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />距离 {distance}m · {person.position}
                              </p>
                              <p className="text-xs text-dark-500 mt-0.5 flex items-center gap-1">
                                <Package className="w-3 h-3" />装备 {equipCount} 件
                              </p>
                            </div>
                          </div>
                          {selectedIncident.status !== 'completed' && (
                            <button onClick={() => handleDispatch(person)} disabled={isHandler} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', isHandler ? 'bg-primary-600 text-white cursor-default' : 'btn-primary text-xs')}>
                              {isHandler ? '处置中' : '调度'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {nearbyPersonnel.length === 0 && <p className="text-center text-dark-500 py-8">附近暂无可用人员</p>}
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先选择事件</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-dark-900/50 rounded-lg">
              <div className="p-3 border-b border-dark-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-400" />
                <h4 className="text-sm font-semibold text-white">周边风险点</h4>
                <span className="ml-auto text-xs text-dark-400">{nearbyRiskPoints.length}个</span>
              </div>
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {selectedIncident ? (
                  <div className="space-y-2">
                    {nearbyRiskPoints.map((point) => {
                      const distance = Math.round(getDistance(point.x, point.y, selectedIncident.x, selectedIncident.y));
                      return (
                        <div key={point.id} className="bg-dark-800 p-3 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`badge ${getLevelBgColor(point.level)} text-xs`}>{getLevelText(point.level)}</span>
                                <span className={`badge ${point.status === 'normal' ? 'badge-green' : 'badge-red'} text-xs`}>
                                  {point.status === 'normal' ? '正常' : '异常'}
                                </span>
                              </div>
                              <p className="text-sm text-white truncate">{point.name}</p>
                              <p className="text-xs text-dark-400 mt-1 truncate">{point.description}</p>
                            </div>
                            <span className="text-xs text-dark-500 flex-shrink-0">{distance}m</span>
                          </div>
                        </div>
                      );
                    })}
                    {nearbyRiskPoints.length === 0 && <p className="text-center text-dark-500 py-8">周边无风险点</p>}
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先选择事件</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-dark-900/50 rounded-lg">
              <div className="p-3 border-b border-dark-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-success-400" />
                <h4 className="text-sm font-semibold text-white">装备占用</h4>
                <span className="ml-auto text-xs text-dark-400">{equipmentUsage.length}项</span>
              </div>
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {selectedIncident ? (
                  <div className="space-y-2">
                    {equipmentUsage.map((item, idx) => (
                      <div key={idx} className="bg-dark-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white">{item.equipment.name}</p>
                          <span className="text-sm font-mono text-primary-400">×{item.quantity}</span>
                        </div>
                        <p className="text-xs text-dark-400">型号: {item.equipment.model}</p>
                        <p className="text-xs text-dark-500 mt-1">使用人: {item.handlerName}</p>
                      </div>
                    ))}
                    {equipmentUsage.length === 0 && <p className="text-center text-dark-500 py-8">暂无装备占用</p>}
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先选择事件</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="事件处置详情" size="xl">
        {selectedIncident && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`badge ${getLevelBgColor(selectedIncident.level)}`}>{getLevelText(selectedIncident.level)}</span>
              <span className={`badge ${getStatusBgColor(selectedIncident.status)}`}>{getStatusText(selectedIncident.status)}</span>
              <span className="text-dark-400 text-sm flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(selectedIncident.reportTime)}</span>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">{selectedIncident.title}</h4>
              <p className="text-dark-300 mt-1">{selectedIncident.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-dark-900 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary-400" />就近人员调度</h5>
                  <div className="space-y-2">
                    {nearbyPersonnel.map((person) => {
                      const distance = Math.round(getDistance(person.x, person.y, selectedIncident.x, selectedIncident.y));
                      const isHandler = person.id === selectedIncident.currentHandlerId;
                      return (
                        <div key={person.id} className={cn('flex items-center justify-between p-3 rounded-lg transition-colors', isHandler ? 'bg-primary-900/30 border border-primary-500/30' : 'bg-dark-800 hover:bg-dark-700/50')}>
                          <div className="flex items-center gap-3">
                            <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                            <div>
                              <p className="text-white font-medium">{person.name}</p>
                              <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin className="w-3 h-3" />距离 {distance}m · {person.position}</p>
                            </div>
                          </div>
                          {selectedIncident.status !== 'completed' && (
                            <button onClick={() => handleDispatch(person)} disabled={isHandler} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', isHandler ? 'bg-primary-600 text-white cursor-default' : 'btn-primary text-xs')}>
                              {isHandler ? '处置中' : '调度'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {nearbyPersonnel.length === 0 && <p className="text-center text-dark-500 py-4">附近暂无可用人员</p>}
                  </div>
                </div>

                <div className="bg-dark-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary-400" />对讲记录</h5>
                    {selectedIncident.currentHandlerId && selectedIncident.status !== 'completed' && (
                      <button
                        onClick={() => setShowIntercomModal(true)}
                        className="text-xs btn-primary flex items-center gap-1 py-1 px-2"
                      >
                        <Phone className="w-3 h-3" />
                        发送对讲
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {intercomLogs.map((log: IntercomLog) => {
                      const fromPerson = getPersonnelById(log.fromId);
                      const toPerson = getPersonnelById(log.toId);
                      return (
                        <div key={log.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0"><Radio className="w-4 h-4 text-primary-400" /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-primary-400 font-medium">{fromPerson?.name}</span>
                              <span className="text-dark-500">→</span>
                              <span className="text-dark-400">{toPerson?.name}</span>
                              <span className="text-dark-500 ml-auto">{formatTime(log.time)}</span>
                            </div>
                            <p className="text-sm text-white mt-1 bg-dark-800 p-2 rounded">{log.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    {intercomLogs.length === 0 && <p className="text-center text-dark-500 py-4">暂无对讲记录</p>}
                  </div>
                </div>
              </div>

              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-400" />处置进度</h5>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-700" />
                  <div className="space-y-4">
                    {incidentRecords.map((record, index) => (
                      <div key={record.id} className="relative pl-10">
                        <div className={cn('absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2', index === 0 ? 'bg-primary-500 border-primary-400' : 'bg-dark-800 border-dark-600')} />
                        <div>
                          <p className="text-sm text-white font-medium">{record.content}</p>
                          <p className="text-xs text-dark-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(record.time)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="relative pl-10">
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-dark-700 border-2 border-dark-600" />
                      <div>
                        <p className="text-sm text-dark-400">事件上报</p>
                        <p className="text-xs text-dark-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(selectedIncident.reportTime)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              {selectedIncident.status !== 'completed' ? (
                <button onClick={handleComplete} className="btn-success flex-1 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" />标记完成</button>
              ) : (
                <div className="flex-1 bg-success-500/20 border border-success-500/30 text-success-400 py-2.5 rounded-lg text-center font-medium flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" />事件已完成</div>
              )}
              <button onClick={() => setShowDetailModal(false)} className="btn-outline">关闭</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showIntercomModal} onClose={() => { setShowIntercomModal(false); setIntercomContent(''); }} title="发送对讲指令" size="md">
        {selectedIncident && selectedIncident.currentHandlerId && (
          <div className="space-y-4">
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <img src={getPersonnelById(selectedIncident.currentHandlerId)?.avatar} alt="" className="w-12 h-12 rounded-full bg-dark-700" />
                <div>
                  <p className="text-white font-medium">发送给: {getPersonnelById(selectedIncident.currentHandlerId)?.name}</p>
                  <p className="text-sm text-dark-400">事件: {selectedIncident.title}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">快捷指令</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setIntercomContent(cmd)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs transition-colors',
                      intercomContent === cmd
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                    )}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">对讲内容</label>
              <textarea
                value={intercomContent}
                onChange={(e) => setIntercomContent(e.target.value)}
                placeholder="请输入对讲内容..."
                rows={3}
                className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={handleSendIntercom}
                disabled={!intercomContent.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
              <button
                onClick={() => { setShowIntercomModal(false); setIntercomContent(''); }}
                className="btn-outline flex-1"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
