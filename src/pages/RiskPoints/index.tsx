import { useState } from 'react';
import { MapPin, AlertTriangle, Shield, CheckCircle, Plus, Search, Eye, Edit, Trash2, Camera, DoorOpen, Zap } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusBgColor, getStatusText, getLevelBgColor, getLevelText, formatTime, cn } from '@/utils';
import type { RiskPoint, HiddenDanger } from '@/types';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import VenueMap from '@/components/Map/VenueMap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function RiskPoints() {
  const { areas, riskPoints, hiddenDangers, getAreaById, getPersonnelById } = useAppStore();
  const [activeTab, setActiveTab] = useState<'areas' | 'points' | 'dangers'>('areas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<RiskPoint | null>(null);
  const [selectedDanger, setSelectedDanger] = useState<HiddenDanger | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);

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
                <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />新增隐患</button>
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
                    <td className="table-cell"><span className={cn(area.currentCount && area.capacity && area.currentCount/area.capacity > 0.8 ? 'text-danger-400' : 'text-success-400')}>{area.currentCount}人</span></td>
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
                <th className="table-header">状态</th><th className="table-header">操作</th>
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
                <th className="table-header">状态</th><th className="table-header">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-700">
                {filteredDangers.map(danger => {
                  const point = useAppStore.getState().getRiskPointById(danger.pointId);
                  const reporter = getPersonnelById(danger.reporterId);
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
                      <td className="table-cell"><span className={`badge ${getStatusBgColor(danger.status)}`}>{getStatusText(danger.status)}</span></td>
                      <td className="table-cell">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setSelectedDanger(danger); setShowDangerModal(true); }} className="text-primary-400 hover:text-primary-300 p-1"><Eye className="w-4 h-4" /></button>
                          {danger.status !== 'resolved' && <button className="text-success-400 hover:text-success-300 p-1"><CheckCircle className="w-4 h-4" /></button>}
                          <button className="text-danger-400 hover:text-danger-300 p-1"><Trash2 className="w-4 h-4" /></button>
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

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="风险点位详情" size="md">
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
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1">登记隐患</button>
              <button className="btn-outline flex-1">编辑点位</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDangerModal} onClose={() => setShowDangerModal(false)} title="隐患详情" size="md">
        {selectedDanger && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white">{selectedDanger.title}</h4>
              <span className={`badge ${getStatusBgColor(selectedDanger.status)}`}>{getStatusText(selectedDanger.status)}</span>
            </div>
            <p className="text-dark-300">{selectedDanger.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">关联点位</p><p className="text-white">{useAppStore.getState().getRiskPointById(selectedDanger.pointId)?.name}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">上报人</p><p className="text-white">{getPersonnelById(selectedDanger.reporterId)?.name}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">上报时间</p><p className="text-white">{formatTime(selectedDanger.reportTime)}</p></div>
              <div className="bg-dark-900 p-3 rounded-lg"><p className="text-xs text-dark-400 mb-1">处理人</p><p className="text-white">{selectedDanger.handlerId ? getPersonnelById(selectedDanger.handlerId)?.name : '未分配'}</p></div>
            </div>
            <div className="flex gap-3 pt-2">
              {selectedDanger.status !== 'resolved' && <button className="btn-success flex-1">标记已解决</button>}
              <button className="btn-outline flex-1">分配处理人</button>
              <button className="btn-outline">关闭</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
