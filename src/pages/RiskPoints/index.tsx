import { useState } from 'react';
import { MapPin, AlertTriangle, Shield, CheckCircle, Plus, Search, Eye, Edit, Trash2, Camera, DoorOpen, Zap, Upload, X, UserPlus, RefreshCw, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusBgColor, getStatusText, getLevelBgColor, getLevelText, formatTime, generateId, cn } from '@/utils';
import type { RiskPoint, HiddenDanger, Personnel } from '@/types';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import VenueMap from '@/components/Map/VenueMap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function RiskPoints() {
  const {
    areas,
    riskPoints,
    hiddenDangers,
    personnel,
    getAreaById,
    getPersonnelById,
    addHiddenDanger,
    updateHiddenDanger,
    addActivityLog,
    transferDangerHandler,
    changeDangerStatus,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'areas' | 'points' | 'dangers'>('areas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<RiskPoint | null>(null);
  const [selectedDanger, setSelectedDanger] = useState<HiddenDanger | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [showAddDangerModal, setShowAddDangerModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [newDanger, setNewDanger] = useState({
    title: '',
    description: '',
    pointId: '',
    level: 'yellow' as 'red' | 'orange' | 'yellow' | 'blue',
    photos: [] as string[],
  });

  const [selectedHandler, setSelectedHandler] = useState('');
  const [newHandlerId, setNewHandlerId] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'processing' | 'resolved'>('pending');
  const [statusRemark, setStatusRemark] = useState('');
  const [transferRemark, setTransferRemark] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const levelStats = [
    { name: '高风险', value: riskPoints.filter(p => p.level === 'high').length, color: '#EF4444' },
    { name: '中风险', value: riskPoints.filter(p => p.level === 'medium').length, color: '#F59E0B' },
    { name: '低风险', value: riskPoints.filter(p => p.level === 'low').length, color: '#3B82F6' },
  ];

  const filteredPoints = riskPoints.filter(p =>
    p.name.includes(searchTerm) || p.description.includes(searchTerm)
  );

  const filteredDangers = hiddenDangers.filter(d => {
    const point = useAppStore.getState().getRiskPointById(d.pointId);
    return d.title.includes(searchTerm) || point?.name.includes(searchTerm);
  });

  const getPointIcon = (type: string) => {
    const Icon = type === 'entrance' || type === 'exit' ? DoorOpen :
      type === 'cordon' ? Zap : type === 'camera' ? Camera : MapPin;
    return <Icon className="w-4 h-4" />;
  };

  const getDangersByPoint = (pointId: string) => {
    return hiddenDangers.filter(d => d.pointId === pointId);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPhotoPreview(dataUrl);
        setNewDanger(prev => ({ ...prev, photos: [dataUrl] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDanger = () => {
    if (!newDanger.title || !newDanger.pointId) return;

    const point = useAppStore.getState().getRiskPointById(newDanger.pointId);
    const danger: HiddenDanger = {
      id: generateId(),
      title: newDanger.title,
      description: newDanger.description,
      pointId: newDanger.pointId,
      areaId: point?.areaId || '',
      level: newDanger.level,
      photos: newDanger.photos,
      reporterId: 'p1',
      reportTime: new Date(),
      status: 'pending',
      transferHistory: [],
      statusChangeHistory: [],
    };

    addHiddenDanger(danger);
    addActivityLog({
      id: generateId(),
      type: 'alert',
      title: '新增隐患登记',
      description: `${useAppStore.getState().getRiskPointById(newDanger.pointId)?.name}: ${newDanger.title}`,
      time: new Date(),
      relatedId: danger.id,
    });

    setNewDanger({ title: '', description: '', pointId: '', level: 'yellow', photos: [] });
    setPhotoPreview(null);
    setShowAddDangerModal(false);
  };

  const handleMarkResolved = (danger: HiddenDanger) => {
    changeDangerStatus(danger.id, danger.status, 'resolved', 'p1', '已解决');
    addActivityLog({
      id: generateId(),
      type: 'alert',
      title: '隐患已解决',
      description: `${danger.title} 已标记为已解决`,
      time: new Date(),
      relatedId: danger.id,
    });
    const updatedDanger = hiddenDangers.find(d => d.id === danger.id);
    if (updatedDanger) {
      setSelectedDanger(updatedDanger);
    }
  };

  const handleAssignHandler = (danger: HiddenDanger) => {
    if (!selectedHandler) return;
    updateHiddenDanger(danger.id, { handlerId: selectedHandler, status: 'processing' });
    changeDangerStatus(danger.id, danger.status, 'processing', 'p1', '分配处理人');
    addActivityLog({
      id: generateId(),
      type: 'alert',
      title: '分配隐患处理人',
      description: `${danger.title} 已分配给 ${getPersonnelById(selectedHandler)?.name}`,
      time: new Date(),
      relatedId: danger.id,
    });
    const updatedDanger = hiddenDangers.find(d => d.id === danger.id);
    if (updatedDanger) {
      setSelectedDanger(updatedDanger);
    }
    setSelectedHandler('');
    setShowAssignModal(false);
  };

  const handleTransferHandler = (danger: HiddenDanger) => {
    if (!newHandlerId || !danger.handlerId) return;
    transferDangerHandler(danger.id, danger.handlerId, newHandlerId, 'p1', transferRemark);
    addActivityLog({
      id: generateId(),
      type: 'alert',
      title: '改派隐患处理人',
      description: `${danger.title} 已从 ${getPersonnelById(danger.handlerId)?.name} 改派给 ${getPersonnelById(newHandlerId)?.name}`,
      time: new Date(),
      relatedId: danger.id,
    });
    const updatedDanger = hiddenDangers.find(d => d.id === danger.id);
    if (updatedDanger) {
      setSelectedDanger(updatedDanger);
    }
    setNewHandlerId('');
    setTransferRemark('');
    setShowTransferModal(false);
  };

  const handleChangeStatus = (danger: HiddenDanger) => {
    if (danger.status === newStatus) return;
    changeDangerStatus(danger.id, danger.status, newStatus, 'p1', statusRemark);
    addActivityLog({
      id: generateId(),
      type: 'alert',
      title: '隐患状态变更',
      description: `${danger.title} 状态从 ${getStatusText(danger.status)} 变更为 ${getStatusText(newStatus)}`,
      time: new Date(),
      relatedId: danger.id,
    });
    const updatedDanger = hiddenDangers.find(d => d.id === danger.id);
    if (updatedDanger) {
      setSelectedDanger(updatedDanger);
    }
    setStatusRemark('');
    setShowStatusModal(false);
  };

  const handleDeleteDanger = (danger: HiddenDanger) => {
    useAppStore.setState(state => ({
      hiddenDangers: state.hiddenDangers.filter(d => d.id !== danger.id),
    }));
    setShowDangerModal(false);
  };

  const onDutyPersonnel = personnel.filter(p => p.status === 'on-duty');
  const pointDangers = selectedPoint ? getDangersByPoint(selectedPoint.id) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="风险点位总数" value={riskPoints.length} icon={MapPin} color="blue" className="animate-stagger-1" />
        <StatCard title="高风险点数" value={riskPoints.filter(p => p.level === 'high').length} icon={AlertTriangle} color="red" className="animate-stagger-2" />
        <StatCard title="待处理隐患" value={hiddenDangers.filter(d => d.status !== 'resolved').length} icon={Shield} color="orange" className="animate-stagger-3" />
        <StatCard title="已处理隐患" value={hiddenDangers.filter(d => d.status === 'resolved').length} icon={CheckCircle} color="green" className="animate-stagger-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card animate-fade-in-up opacity-0">
            <div className="p-4 border-b border-dark-700"><h3 className="text-lg font-semibold text-white">会场风险点位分布</h3></div>
            <div className="p-4">
              <VenueMap showPersonnel={false} showIncidents={false} showRiskPoints showAreas
                onAreaClick={() => {}} onPersonnelClick={() => {}} onIncidentClick={() => {}} className="h-96" />
            </div>
          </div>
        </div>
        <div className="card animate-fade-in-up opacity-0 animate-stagger-2">
          <div className="p-4 border-b border-dark-700"><h3 className="text-lg font-semibold text-white">风险等级分布</h3></div>
          <div className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={levelStats} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                  {levelStats.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', color: '#F8FAFC' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {levelStats.map(stat => (
              <div key={stat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-dark-300">{stat.name}</span>
                </div>
                <span className="text-white font-medium">{stat.value}个</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up opacity-0">
        <div className="p-4 border-b border-dark-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {(['areas', 'points', 'dangers'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-3 py-1.5 rounded-lg text-sm transition-colors',
                    activeTab === tab ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:text-white')}>
                  {tab === 'areas' ? '会场区域' : tab === 'points' ? '风险点位' : '隐患登记'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input type="text" placeholder="搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-48 pl-9 pr-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {activeTab === 'dangers' && (
                <button onClick={() => setShowAddDangerModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />新增隐患</button>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'areas' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-dark-800/50">
                <th className="table-header">区域名称</th><th className="table-header">类型</th>
                <th className="table-header">容量</th><th className="table-header">当前人数</th>
                <th className="table-header">风险点数</th><th className="table-header">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-700">
                {areas.map(area => (
                  <tr key={area.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: area.color }} />
                        <span className="font-medium text-white">{area.name}</span>
                      </div>
                    </td>
                    <td className="table-cell"><span className="badge bg-primary-500/20 border-primary-500/30 text-primary-400">{area.type}</span></td>
                    <td className="table-cell text-dark-300">{area.capacity}人</td>
                    <td className="table-cell"><span className={cn(area.currentCount && area.capacity && area.currentCount / area.capacity > 0.8 ? 'text-danger-400' : 'text-success-400')}>{area.currentCount}人</span></td>
                    <td className="table-cell text-dark-300">{riskPoints.filter(p => p.areaId === area.id).length}个</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button className="text-primary-400 hover:text-primary-300 p-1"><Eye className="w-4 h-4" /></button>
                        <button className="text-warning-400 hover:text-warning-300 p-1"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'points' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-dark-800/50">
                <th className="table-header">点位名称</th><th className="table-header">类型</th>
                <th className="table-header">所属区域</th><th className="table-header">风险等级</th>
                <th className="table-header">隐患数</th><th className="table-header">状态</th><th className="table-header">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-700">
                {filteredPoints.map(point => (
                  <tr key={point.id} className="hover:bg-dark-700/30 transition-colors cursor-pointer" onClick={() => { setSelectedPoint(point); setShowDetailModal(true); }}>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-1.5 rounded-lg', point.status === 'danger' ? 'bg-danger-500/20 text-danger-400' : point.status === 'warning' ? 'bg-warning-500/20 text-warning-400' : 'bg-primary-500/20 text-primary-400')}>
                          {getPointIcon(point.type)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{point.name}</p>
                          <p className="text-xs text-dark-400">{point.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-dark-300">{point.type}</td>
                    <td className="table-cell text-dark-300">{getAreaById(point.areaId)?.name}</td>
                    <td className="table-cell"><span className={`badge ${getLevelBgColor(point.level)}`}>{getLevelText(point.level)}</span></td>
                    <td className="table-cell">
                      <span className={cn('font-mono', getDangersByPoint(point.id).filter(d => d.status !== 'resolved').length > 0 ? 'text-danger-400' : 'text-success-400')}>
                        {getDangersByPoint(point.id).length}
                      </span>
                    </td>
                    <td className="table-cell"><span className={`badge ${getStatusBgColor(point.status)}`}>{getStatusText(point.status)}</span></td>
                    <td className="table-cell">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setSelectedPoint(point); setShowDetailModal(true); }} className="text-primary-400 hover:text-primary-300 p-1"><Eye className="w-4 h-4" /></button>
                        <button className="text-warning-400 hover:text-warning-300 p-1"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'dangers' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-dark-800/50">
                <th className="table-header">隐患标题</th><th className="table-header">关联点位</th>
                <th className="table-header">上报人</th><th className="table-header">上报时间</th>
                <th className="table-header">处理人</th><th className="table-header">状态</th><th className="table-header">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-700">
                {filteredDangers.map(danger => {
                  const point = useAppStore.getState().getRiskPointById(danger.pointId);
                  const reporter = getPersonnelById(danger.reporterId);
                  const handler = danger.handlerId ? getPersonnelById(danger.handlerId) : null;
                  return (
                    <tr key={danger.id} className="hover:bg-dark-700/30 transition-colors cursor-pointer" onClick={() => { setSelectedDanger(danger); setShowDangerModal(true); }}>
                      <td className="table-cell">
                        <p className="font-medium text-white">{danger.title}</p>
                        <p className="text-xs text-dark-400 line-clamp-1">{danger.description}</p>
                      </td>
                      <td className="table-cell text-dark-300">{point?.name}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <img src={reporter?.avatar} alt="" className="w-6 h-6 rounded-full bg-dark-700" />
                          <span className="text-white text-sm">{reporter?.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-dark-300">{formatTime(danger.reportTime)}</td>
                      <td className="table-cell">
                        {handler ? (
                          <div className="flex items-center gap-2">
                            <img src={handler.avatar} alt="" className="w-6 h-6 rounded-full bg-dark-700" />
                            <span className="text-white text-sm">{handler.name}</span>
                          </div>
                        ) : <span className="text-dark-500">未分配</span>}
                      </td>
                      <td className="table-cell"><span className={`badge ${getStatusBgColor(danger.status)}`}>{getStatusText(danger.status)}</span></td>
                      <td className="table-cell">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setSelectedDanger(danger); setShowDangerModal(true); }} className="text-primary-400 hover:text-primary-300 p-1" title="查看详情"><Eye className="w-4 h-4" /></button>
                          {danger.status !== 'resolved' && <button onClick={() => handleMarkResolved(danger)} className="text-success-400 hover:text-success-300 p-1" title="标记已解决"><CheckCircle className="w-4 h-4" /></button>}
                          {danger.handlerId && <button onClick={() => { setSelectedDanger(danger); setNewHandlerId(''); setShowTransferModal(true); }} className="text-warning-400 hover:text-warning-300 p-1" title="改派处理人"><RefreshCw className="w-4 h-4" /></button>}
                          <button onClick={() => { setSelectedDanger(danger); setNewStatus(danger.status); setStatusRemark(''); setShowStatusModal(true); }} className="text-info-400 hover:text-info-300 p-1" title="调整状态"><ArrowRight className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDanger(danger)} className="text-danger-400 hover:text-danger-300 p-1" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="风险点位详情" size="lg">
        {selectedPoint && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-xl', selectedPoint.status === 'danger' ? 'bg-danger-500/20 text-danger-400' : selectedPoint.status === 'warning' ? 'bg-warning-500/20 text-warning-400' : 'bg-primary-500/20 text-primary-400')}>
                {getPointIcon(selectedPoint.type)}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white">{selectedPoint.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${getLevelBgColor(selectedPoint.level)}`}>{getLevelText(selectedPoint.level)}风险</span>
                  <span className={`badge ${getStatusBgColor(selectedPoint.status)}`}>{getStatusText(selectedPoint.status)}</span>
                </div>
              </div>
            </div>
            <p className="text-dark-300">{selectedPoint.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">所属区域</p><p className="text-white">{getAreaById(selectedPoint.areaId)?.name}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">点位类型</p><p className="text-white">{selectedPoint.type}</p></div>
            </div>

            <div className="bg-dark-900 p-4 rounded-lg">
              <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-400" />
                关联隐患 ({pointDangers.length})
              </h5>
              {pointDangers.length === 0 ? (
                <p className="text-center text-dark-500 py-4">暂无关联隐患</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pointDangers.map(danger => (
                    <div key={danger.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{danger.title}</p>
                        <p className="text-xs text-dark-400">{formatTime(danger.reportTime)}</p>
                      </div>
                      <span className={`badge ${getStatusBgColor(danger.status)}`}>{getStatusText(danger.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowDetailModal(false); setNewDanger(prev => ({ ...prev, pointId: selectedPoint.id })); setShowAddDangerModal(true); }} className="btn-primary flex-1">登记隐患</button>
              <button className="btn-outline flex-1">编辑点位</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDangerModal} onClose={() => setShowDangerModal(false)} title="隐患详情" size="lg">
        {selectedDanger && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white">{selectedDanger.title}</h4>
              <span className={`badge ${getStatusBgColor(selectedDanger.status)}`}>{getStatusText(selectedDanger.status)}</span>
            </div>
            <p className="text-dark-300">{selectedDanger.description}</p>

            {selectedDanger.photos.length > 0 && (
              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3">现场照片</h5>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDanger.photos.map((photo, i) => (
                    <img key={i} src={photo} alt="" className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">关联点位</p><p className="text-white">{useAppStore.getState().getRiskPointById(selectedDanger.pointId)?.name}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">上报人</p><p className="text-white">{getPersonnelById(selectedDanger.reporterId)?.name}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">上报时间</p><p className="text-white">{formatTime(selectedDanger.reportTime)}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">处理人</p><p className="text-white">{selectedDanger.handlerId ? getPersonnelById(selectedDanger.handlerId)?.name : '未分配'}</p></div>
            </div>

            {selectedDanger.statusChangeHistory && selectedDanger.statusChangeHistory.length > 0 && (
              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3">状态流转历史</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedDanger.statusChangeHistory.map((record, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-dark-800 rounded">
                      <ArrowRight className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className={`badge ${getStatusBgColor(record.from)} mr-1`}>{getStatusText(record.from)}</span>
                          <ArrowRight className="w-3 h-3 inline mx-1 text-dark-500" />
                          <span className={`badge ${getStatusBgColor(record.to)}`}>{getStatusText(record.to)}</span>
                        </p>
                        <p className="text-xs text-dark-400 mt-1">
                          操作人: {getPersonnelById(record.operatorId)?.name || '未知'} · {formatTime(record.time)}
                          {record.remark && ` · ${record.remark}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDanger.transferHistory && selectedDanger.transferHistory.length > 0 && (
              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3">处理人变更记录</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedDanger.transferHistory.map((record) => (
                    <div key={record.id} className="flex items-start gap-3 p-2 bg-dark-800 rounded">
                      <RefreshCw className="w-4 h-4 text-warning-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          {getPersonnelById(record.fromHandlerId)?.name || '未知'}
                          <ArrowRight className="w-3 h-3 inline mx-1 text-dark-500" />
                          {getPersonnelById(record.toHandlerId)?.name || '未知'}
                        </p>
                        <p className="text-xs text-dark-400 mt-1">
                          {formatTime(record.transferTime)}
                          {record.remark && ` · ${record.remark}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 flex-wrap">
              {selectedDanger.status !== 'resolved' && <button onClick={() => handleMarkResolved(selectedDanger)} className="btn-success flex-1 min-w-[120px]">标记已解决</button>}
              {!selectedDanger.handlerId && <button onClick={() => { setShowAssignModal(true); }} className="btn-primary flex-1 min-w-[120px]">分配处理人</button>}
              {selectedDanger.handlerId && <button onClick={() => { setNewHandlerId(''); setShowTransferModal(true); }} className="btn-warning flex-1 min-w-[120px]">改派处理人</button>}
              <button onClick={() => { setNewStatus(selectedDanger.status); setStatusRemark(''); setShowStatusModal(true); }} className="btn-outline flex-1 min-w-[120px]">调整状态</button>
              <button onClick={() => setShowDangerModal(false)} className="btn-outline min-w-[80px]">关闭</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAddDangerModal} onClose={() => { setShowAddDangerModal(false); setPhotoPreview(null); }} title="新增隐患登记" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">隐患标题 *</label>
            <input
              type="text"
              value={newDanger.title}
              onChange={e => setNewDanger(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入隐患标题"
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">关联点位 *</label>
            <select
              value={newDanger.pointId}
              onChange={e => setNewDanger(prev => ({ ...prev, pointId: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择关联点位</option>
              {riskPoints.map(point => (
                <option key={point.id} value={point.id}>{point.name} ({getAreaById(point.areaId)?.name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">隐患等级</label>
            <div className="grid grid-cols-4 gap-2">
              {(['red', 'orange', 'yellow', 'blue'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewDanger(prev => ({ ...prev, level }))}
                  className={cn(
                    'py-2 px-3 rounded-lg border transition-colors text-sm font-medium',
                    newDanger.level === level
                      ? getLevelBgColor(level) + ' border-transparent text-white'
                      : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500'
                  )}
                >
                  {getLevelText(level)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">隐患描述</label>
            <textarea
              value={newDanger.description}
              onChange={e => setNewDanger(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请详细描述隐患情况..."
              rows={3}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">现场照片</label>
            <div className="flex gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="" className="w-32 h-32 object-cover rounded-lg" />
                  <button onClick={() => { setPhotoPreview(null); setNewDanger(prev => ({ ...prev, photos: [] })); }} className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed border-dark-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                  <Camera className="w-8 h-8 text-dark-500 mb-2" />
                  <span className="text-xs text-dark-500">点击上传照片</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
                  <Upload className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-white">选择图片文件</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <p className="text-xs text-dark-500 mt-2">支持 JPG、PNG 格式，单张图片</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={handleAddDanger} disabled={!newDanger.title || !newDanger.pointId} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">提交登记</button>
            <button onClick={() => { setShowAddDangerModal(false); setPhotoPreview(null); setNewDanger({ title: '', description: '', pointId: '', level: 'yellow', photos: [] }); }} className="btn-outline flex-1">取消</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setSelectedHandler(''); }} title="分配处理人" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">选择处理人员</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {onDutyPersonnel.map(person => (
                <label key={person.id} className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                  selectedHandler === person.id
                    ? 'bg-primary-500/20 border-primary-500/50'
                    : 'bg-dark-800 border-transparent hover:bg-dark-700'
                )}>
                  <input type="radio" name="handler" value={person.id} checked={selectedHandler === person.id} onChange={e => setSelectedHandler(e.target.value)} className="hidden" />
                  <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{person.name}</p>
                    <p className="text-xs text-dark-400">{person.position} · {getAreaById(person.areaId)?.name}</p>
                  </div>
                  {selectedHandler === person.id && <UserPlus className="w-5 h-5 text-primary-400" />}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={() => selectedDanger && handleAssignHandler(selectedDanger)} disabled={!selectedHandler} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">确认分配</button>
            <button onClick={() => { setShowAssignModal(false); setSelectedHandler(''); }} className="btn-outline flex-1">取消</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTransferModal} onClose={() => { setShowTransferModal(false); setNewHandlerId(''); setTransferRemark(''); }} title="改派处理人" size="md">
        {selectedDanger && (
          <div className="space-y-4">
            <div className="bg-dark-900 p-4 rounded-lg">
              <p className="text-sm text-dark-400">当前隐患</p>
              <p className="text-white font-medium">{selectedDanger.title}</p>
              <p className="text-sm text-dark-300 mt-1">
                当前处理人: {selectedDanger.handlerId ? getPersonnelById(selectedDanger.handlerId)?.name : '未分配'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">选择新处理人员</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {onDutyPersonnel.filter(p => p.id !== selectedDanger.handlerId).map(person => (
                  <label key={person.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                    newHandlerId === person.id
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-dark-800 border-transparent hover:bg-dark-700'
                  )}>
                    <input type="radio" name="newHandler" value={person.id} checked={newHandlerId === person.id} onChange={e => setNewHandlerId(e.target.value)} className="hidden" />
                    <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{person.name}</p>
                      <p className="text-xs text-dark-400">{person.position} · {getAreaById(person.areaId)?.name}</p>
                    </div>
                    {newHandlerId === person.id && <UserPlus className="w-5 h-5 text-primary-400" />}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">改派备注</label>
              <textarea
                value={transferRemark}
                onChange={e => setTransferRemark(e.target.value)}
                placeholder="请输入改派原因..."
                className="input-field min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => selectedDanger && handleTransferHandler(selectedDanger)} disabled={!newHandlerId} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">确认改派</button>
              <button onClick={() => { setShowTransferModal(false); setNewHandlerId(''); setTransferRemark(''); }} className="btn-outline flex-1">取消</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showStatusModal} onClose={() => { setShowStatusModal(false); setStatusRemark(''); }} title="调整隐患状态" size="md">
        {selectedDanger && (
          <div className="space-y-4">
            <div className="bg-dark-900 p-4 rounded-lg">
              <p className="text-sm text-dark-400">当前隐患</p>
              <p className="text-white font-medium">{selectedDanger.title}</p>
              <p className="text-sm text-dark-300 mt-1">
                当前状态: <span className={`badge ${getStatusBgColor(selectedDanger.status)}`}>{getStatusText(selectedDanger.status)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">选择新状态</label>
              <div className="grid grid-cols-3 gap-3">
                {(['pending', 'processing', 'resolved'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setNewStatus(status)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-center',
                      newStatus === status
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                    )}
                  >
                    <span className={`badge ${getStatusBgColor(status)} mb-2`}>{getStatusText(status)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">状态变更备注</label>
              <textarea
                value={statusRemark}
                onChange={e => setStatusRemark(e.target.value)}
                placeholder="请输入状态变更原因..."
                className="input-field min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => selectedDanger && handleChangeStatus(selectedDanger)} disabled={selectedDanger.status === newStatus} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">确认调整</button>
              <button onClick={() => { setShowStatusModal(false); setStatusRemark(''); }} className="btn-outline flex-1">取消</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
