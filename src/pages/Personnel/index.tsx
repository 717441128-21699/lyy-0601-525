import { useState } from 'react';
import { Users, Search, Filter, Plus, Phone, MapPin, Clock, CheckCircle, XCircle, UserPlus, LogIn, ArrowRightLeft, AlertTriangle, Shield, Package, Handshake, UserCheck, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusColor, getStatusBgColor, getStatusText, formatTime, formatDate, generateId, cn, getLevelBgColor, getLevelText } from '@/utils';
import type { Personnel, ShiftHandover, HiddenDanger, Incident } from '@/types';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EAB308', '#64748B'];

export default function Personnel() {
  const {
    personnel,
    attendance,
    hiddenDangers,
    incidents,
    shiftHandovers,
    getPersonnelAttendance,
    getAreaById,
    getPersonnelById,
    updatePersonnel,
    addAttendance,
    addActivityLog,
    addShiftHandover,
    getDangersByHandler,
    getIncidentsByHandler,
    updateHiddenDanger,
    updateIncident,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'attendance'>('list');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedSuccessorId, setSelectedSuccessorId] = useState('');
  const [handoverRemark, setHandoverRemark] = useState('');

  const areas = useAppStore.getState().areas;

  const filteredPersonnel = personnel.filter((p) => {
    const matchesSearch = p.name.includes(searchTerm) || p.position.includes(searchTerm) || p.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesArea = areaFilter === 'all' || p.areaId === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  const statusStats = [
    { name: '在岗', value: personnel.filter((p) => p.status === 'on-duty').length, color: '#10B981' },
    { name: '巡逻', value: personnel.filter((p) => p.status === 'patrol').length, color: '#3B82F6' },
    { name: '调度中', value: personnel.filter((p) => p.status === 'dispatched').length, color: '#F59E0B' },
    { name: '休息', value: personnel.filter((p) => p.status === 'rest').length, color: '#EAB308' },
    { name: '离岗', value: personnel.filter((p) => p.status === 'off-duty').length, color: '#64748B' },
  ];

  const onDutyCaptains = personnel.filter(p => p.status !== 'off-duty' && p.position.includes('队长'));
  const availableSuccessors = selectedPersonnel
    ? personnel.filter(p => p.id !== selectedPersonnel.id && p.status !== 'off-duty')
    : [];

  const pendingDangers = selectedPersonnel ? getDangersByHandler(selectedPersonnel.id).filter(d => d.status !== 'resolved') : [];
  const processingIncidents = selectedPersonnel ? getIncidentsByHandler(selectedPersonnel.id).filter(i => i.status !== 'completed') : [];

  const handleSignIn = (person: Personnel, type: 'on' | 'off') => {
    const location = getAreaById(person.areaId)?.name || '未知区域';
    addAttendance({
      id: generateId(),
      personnelId: person.id,
      checkinTime: new Date(),
      type,
      location,
    });
    updatePersonnel(person.id, { status: type === 'on' ? 'on-duty' : 'off-duty' });
    setShowSignInModal(false);
    setShowDetailModal(false);
  };

  const handlePersonnelClick = (person: Personnel) => {
    setSelectedPersonnel(person);
    setShowDetailModal(true);
  };

  const handleTransfer = (person: Personnel) => {
    if (!selectedAreaId) return;
    
    const oldArea = getAreaById(person.areaId);
    const newArea = getAreaById(selectedAreaId);
    
    updatePersonnel(person.id, { areaId: selectedAreaId });
    addActivityLog({
      id: generateId(),
      type: 'attendance',
      title: '人员岗位调整',
      description: `${person.name} 从 ${oldArea?.name || '未知区域'} 调整到 ${newArea?.name || '未知区域'}`,
      time: new Date(),
      relatedId: person.id,
    });
    
    setSelectedPersonnel({ ...person, areaId: selectedAreaId });
    setSelectedAreaId('');
    setShowTransferModal(false);
  };

  const handleHandover = () => {
    if (!selectedPersonnel || !selectedSuccessorId) return;

    const successor = getPersonnelById(selectedSuccessorId);
    if (!successor) return;

    const areaIds = [selectedPersonnel.areaId];
    const pendingDangerIds = pendingDangers.map(d => d.id);
    const processingIncidentIds = processingIncidents.map(i => i.id);

    const handover: ShiftHandover = {
      id: generateId(),
      fromPersonnelId: selectedPersonnel.id,
      toPersonnelId: selectedSuccessorId,
      handoverTime: new Date(),
      areaIds,
      pendingDangerIds,
      processingIncidentIds,
      remark: handoverRemark,
      status: 'completed',
    };

    addShiftHandover(handover);

    updatePersonnel(selectedSuccessorId, { areaId: selectedPersonnel.areaId });

    pendingDangers.forEach(danger => {
      updateHiddenDanger(danger.id, { handlerId: selectedSuccessorId });
    });

    processingIncidents.forEach(incident => {
      updateIncident(incident.id, { currentHandlerId: selectedSuccessorId });
    });

    addActivityLog({
      id: generateId(),
      type: 'attendance',
      title: '交接班完成',
      description: `${selectedPersonnel.name} 将工作交接给 ${successor.name}`,
      time: new Date(),
      relatedId: handover.id,
    });

    setSelectedPersonnel({ ...selectedPersonnel, status: 'off-duty' });
    updatePersonnel(selectedPersonnel.id, { status: 'off-duty' });

    setSelectedSuccessorId('');
    setHandoverRemark('');
    setShowHandoverModal(false);
    setShowDetailModal(false);
  };

  const getPersonnelHandovers = (personnelId: string) => {
    return shiftHandovers.filter(h => h.fromPersonnelId === personnelId || h.toPersonnelId === personnelId)
      .sort((a, b) => b.handoverTime.getTime() - a.handoverTime.getTime());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="总人数"
          value={personnel.length}
          icon={Users}
          color="blue"
          className="animate-stagger-1"
        />
        <StatCard
          title="在岗人数"
          value={personnel.filter((p) => p.status === 'on-duty').length}
          icon={CheckCircle}
          color="green"
          className="animate-stagger-2"
        />
        <StatCard
          title="巡逻中"
          value={personnel.filter((p) => p.status === 'patrol').length}
          icon={MapPin}
          color="orange"
          className="animate-stagger-3"
        />
        <StatCard
          title="今日签到率"
          value={`${Math.round((personnel.filter((p) => p.status !== 'off-duty').length / personnel.length) * 100)}%`}
          icon={Clock}
          color="purple"
          className="animate-stagger-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card card-hover animate-fade-in-up opacity-0">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">人员状态分布</h3>
            </div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {statusStats.map((entry, index) => (
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
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {statusStats.map((stat) => (
                <div key={stat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                    <span className="text-dark-300">{stat.name}</span>
                  </div>
                  <span className="text-white font-medium">{stat.value}人</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card animate-fade-in-up opacity-0">
            <div className="p-4 border-b border-dark-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white">安保人员</h3>
                  <div className="flex gap-2">
                    <button
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        activeTab === 'list'
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-700 text-dark-300 hover:text-white'
                      )}
                      onClick={() => setActiveTab('list')}
                    >
                      人员列表
                    </button>
                    <button
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        activeTab === 'attendance'
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-700 text-dark-300 hover:text-white'
                      )}
                      onClick={() => setActiveTab('attendance')}
                    >
                      签到记录
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="text"
                      placeholder="搜索人员..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 pl-9 pr-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">全部状态</option>
                    <option value="on-duty">在岗</option>
                    <option value="patrol">巡逻中</option>
                    <option value="dispatched">调度中</option>
                    <option value="rest">休息</option>
                    <option value="off-duty">离岗</option>
                  </select>
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">全部区域</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    添加人员
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-800/50">
                      <th className="table-header">人员信息</th>
                      <th className="table-header">职位</th>
                      <th className="table-header">联系电话</th>
                      <th className="table-header">所属区域</th>
                      <th className="table-header">状态</th>
                      <th className="table-header">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {filteredPersonnel.map((person) => (
                      <tr
                        key={person.id}
                        className="hover:bg-dark-700/30 transition-colors cursor-pointer"
                        onClick={() => handlePersonnelClick(person)}
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="w-10 h-10 rounded-full bg-dark-700"
                            />
                            <div>
                              <p className="font-medium text-white">{person.name}</p>
                              <p className="text-xs text-dark-400">ID: {person.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">{person.position}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2 text-dark-300">
                            <Phone className="w-3.5 h-3.5" />
                            {person.phone}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2 text-dark-300">
                            <MapPin className="w-3.5 h-3.5" />
                            {getAreaById(person.areaId)?.name}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBgColor(person.status)}`}>
                            {getStatusText(person.status)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {person.status === 'off-duty' ? (
                              <button
                                onClick={() => {
                                  setSelectedPersonnel(person);
                                  setShowSignInModal(true);
                                }}
                                className="btn-success text-xs py-1 px-2 flex items-center gap-1"
                              >
                                <LogIn className="w-3 h-3" />
                                签到
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedPersonnel(person);
                                    setShowSignInModal(true);
                                  }}
                                  className="btn-outline text-xs py-1 px-2 flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" />
                                  签退
                                </button>
                                {person.position.includes('队长') && (
                                  <button
                                    onClick={() => {
                                      setSelectedPersonnel(person);
                                      setSelectedSuccessorId('');
                                      setHandoverRemark('');
                                      setShowHandoverModal(true);
                                    }}
                                    className="btn-primary text-xs py-1 px-2 flex items-center gap-1"
                                  >
                                    <Handshake className="w-3 h-3" />
                                    交接
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedPersonnel(person);
                                setSelectedAreaId(person.areaId);
                                setShowTransferModal(true);
                              }}
                              className="btn-outline text-xs py-1 px-2 flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              调岗
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-dark-800">
                    <tr>
                      <th className="table-header">人员</th>
                      <th className="table-header">类型</th>
                      <th className="table-header">时间</th>
                      <th className="table-header">地点</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {[...attendance]
                      .sort((a, b) => b.checkinTime.getTime() - a.checkinTime.getTime())
                      .slice(0, 50)
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-dark-700/30 transition-colors">
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <img
                                src={useAppStore.getState().getPersonnelById(record.personnelId)?.avatar}
                                alt=""
                                className="w-8 h-8 rounded-full bg-dark-700"
                              />
                              <span className="text-white">
                                {useAppStore.getState().getPersonnelById(record.personnelId)?.name}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${record.type === 'on' ? 'badge-green' : 'badge-gray'}`}>
                              {record.type === 'on' ? '上岗签到' : '下岗签退'}
                            </span>
                          </td>
                          <td className="table-cell text-dark-300">
                            {formatDate(record.checkinTime)} {formatTime(record.checkinTime)}
                          </td>
                          <td className="table-cell text-dark-300">{record.location}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="人员详情"
        size="lg"
      >
        {selectedPersonnel && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={selectedPersonnel.avatar}
                alt={selectedPersonnel.name}
                className="w-20 h-20 rounded-full bg-dark-700 border-2 border-primary-500"
              />
              <div>
                <h4 className="text-2xl font-bold text-white">{selectedPersonnel.name}</h4>
                <p className="text-dark-400">{selectedPersonnel.position}</p>
                <span className={`badge ${getStatusBgColor(selectedPersonnel.status)} mt-2`}>
                  {getStatusText(selectedPersonnel.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-1">联系电话</p>
                <p className="text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-400" />
                  {selectedPersonnel.phone}
                </p>
              </div>
              <div className="bg-dark-900 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-1">所属区域</p>
                <p className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  {getAreaById(selectedPersonnel.areaId)?.name}
                </p>
              </div>
              <div className="bg-dark-900 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-1">待处理隐患</p>
                <p className="text-warning-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {pendingDangers.length} 项
                </p>
              </div>
              <div className="bg-dark-900 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-1">处置中事件</p>
                <p className="text-danger-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {processingIncidents.length} 起
                </p>
              </div>
            </div>

            {pendingDangers.length > 0 && (
              <div>
                <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning-400" />
                  待处理隐患
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pendingDangers.map((danger: HiddenDanger) => (
                    <div key={danger.id} className="bg-dark-900 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{danger.description}</p>
                        <p className="text-xs text-dark-400 mt-1">{getAreaById(danger.areaId)?.name}</p>
                      </div>
                      <span className={`badge ${getLevelBgColor(danger.level)} text-xs`}>{getLevelText(danger.level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {processingIncidents.length > 0 && (
              <div>
                <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-danger-400" />
                  处置中事件
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {processingIncidents.map((incident: Incident) => (
                    <div key={incident.id} className="bg-dark-900 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{incident.title}</p>
                        <p className="text-xs text-dark-400 mt-1">{formatTime(incident.reportTime)}</p>
                      </div>
                      <span className={`badge ${getLevelBgColor(incident.level)} text-xs`}>{getLevelText(incident.level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-primary-400" />
                交接班记录
              </h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getPersonnelHandovers(selectedPersonnel.id).map((handover: ShiftHandover) => {
                  const fromPerson = getPersonnelById(handover.fromPersonnelId);
                  const toPerson = getPersonnelById(handover.toPersonnelId);
                  const isOutgoing = handover.fromPersonnelId === selectedPersonnel.id;
                  return (
                    <div key={handover.id} className="bg-dark-900 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-white">
                          {isOutgoing ? '交接给' : '承接自'}: {isOutgoing ? toPerson?.name : fromPerson?.name}
                        </p>
                        <span className={`badge ${isOutgoing ? 'badge-orange' : 'badge-blue'} text-xs`}>
                          {isOutgoing ? '交班' : '接班'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span>区域: {handover.areaIds.length}个</span>
                        <span>隐患: {handover.pendingDangerIds.length}项</span>
                        <span>事件: {handover.processingIncidentIds.length}起</span>
                      </div>
                      <p className="text-xs text-dark-500 mt-1">{formatTime(handover.handoverTime)}</p>
                    </div>
                  );
                })}
                {getPersonnelHandovers(selectedPersonnel.id).length === 0 && (
                  <p className="text-center text-dark-500 py-4">暂无交接班记录</p>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-white mb-3">近期签到记录</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getPersonnelAttendance(selectedPersonnel.id).slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between bg-dark-900 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {record.type === 'on' ? (
                        <CheckCircle className="w-5 h-5 text-success-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-dark-500" />
                      )}
                      <div>
                        <p className="text-white">
                          {record.type === 'on' ? '上岗签到' : '下岗签退'}
                        </p>
                        <p className="text-xs text-dark-400">{record.location}</p>
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">
                      {formatDate(record.checkinTime)} {formatTime(record.checkinTime)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              {selectedPersonnel.status === 'off-duty' ? (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  签到上岗
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    签退离岗
                  </button>
                  {selectedPersonnel.position.includes('队长') && (
                    <button
                      onClick={() => {
                        setSelectedSuccessorId('');
                        setHandoverRemark('');
                        setShowHandoverModal(true);
                      }}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Handshake className="w-4 h-4" />
                      交接班
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  setSelectedAreaId(selectedPersonnel.areaId);
                  setShowTransferModal(true);
                }}
                className="btn-outline flex-1 flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                调整岗位
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title="确认签到"
        size="sm"
      >
        {selectedPersonnel && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <img
                src={selectedPersonnel.avatar}
                alt={selectedPersonnel.name}
                className="w-16 h-16 rounded-full bg-dark-700 mx-auto mb-3"
              />
              <h4 className="text-xl font-semibold text-white">{selectedPersonnel.name}</h4>
              <p className="text-dark-400">{selectedPersonnel.position}</p>
            </div>

            <div className="bg-dark-900 p-4 rounded-lg text-center">
              <p className="text-dark-400 text-sm mb-1">当前时间</p>
              <p className="text-2xl font-mono text-white font-bold">
                {formatTime(new Date())}
              </p>
            </div>

            <div className="flex gap-3">
              {selectedPersonnel.status === 'off-duty' ? (
                <button
                  onClick={() => handleSignIn(selectedPersonnel, 'on')}
                  className="btn-success flex-1"
                >
                  确认签到
                </button>
              ) : (
                <button
                  onClick={() => handleSignIn(selectedPersonnel, 'off')}
                  className="btn-danger flex-1"
                >
                  确认签退
                </button>
              )}
              <button
                onClick={() => setShowSignInModal(false)}
                className="btn-outline flex-1"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedAreaId('');
        }}
        title="调整岗位"
        size="md"
      >
        {selectedPersonnel && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-dark-800 rounded-lg">
              <img
                src={selectedPersonnel.avatar}
                alt={selectedPersonnel.name}
                className="w-14 h-14 rounded-full bg-dark-700"
              />
              <div>
                <h4 className="text-lg font-semibold text-white">{selectedPersonnel.name}</h4>
                <p className="text-sm text-dark-400">{selectedPersonnel.position}</p>
                <p className="text-xs text-dark-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  当前区域: {getAreaById(selectedPersonnel.areaId)?.name}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                调整至区域
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择目标区域</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedAreaId && selectedAreaId !== selectedPersonnel.areaId && (
              <div className="bg-primary-900/20 border border-primary-700/30 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <ArrowRightLeft className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {getAreaById(selectedPersonnel.areaId)?.name}
                      <span className="mx-2 text-primary-400">→</span>
                      {getAreaById(selectedAreaId)?.name}
                    </p>
                    <p className="text-xs text-dark-400 mt-1">
                      确认后将更新该人员的负责区域
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={() => handleTransfer(selectedPersonnel)}
                disabled={!selectedAreaId || selectedAreaId === selectedPersonnel.areaId}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认调整
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedAreaId('');
                }}
                className="btn-outline flex-1"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showHandoverModal}
        onClose={() => {
          setShowHandoverModal(false);
          setSelectedSuccessorId('');
          setHandoverRemark('');
        }}
        title="交接班"
        size="lg"
      >
        {selectedPersonnel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-800 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-2">交班人员</p>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPersonnel.avatar}
                    alt=""
                    className="w-12 h-12 rounded-full bg-dark-700"
                  />
                  <div>
                    <p className="text-white font-medium">{selectedPersonnel.name}</p>
                    <p className="text-xs text-dark-400">{selectedPersonnel.position}</p>
                  </div>
                </div>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg">
                <p className="text-xs text-dark-400 mb-2">接班人员</p>
                {selectedSuccessorId ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={getPersonnelById(selectedSuccessorId)?.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full bg-dark-700"
                    />
                    <div>
                      <p className="text-white font-medium">{getPersonnelById(selectedSuccessorId)?.name}</p>
                      <p className="text-xs text-dark-400">{getPersonnelById(selectedSuccessorId)?.position}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSuccessorId('')}
                      className="ml-auto p-1 hover:bg-dark-700 rounded"
                    >
                      <X className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                ) : (
                  <p className="text-dark-500 text-sm">请选择接班人员</p>
                )}
              </div>
            </div>

            {!selectedSuccessorId && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">选择接班人员</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableSuccessors.map((person) => (
                    <label
                      key={person.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                        selectedSuccessorId === person.id
                          ? 'bg-primary-500/20 border-primary-500/50'
                          : 'bg-dark-800 border-transparent hover:bg-dark-700'
                      )}
                    >
                      <input
                        type="radio"
                        name="successor"
                        value={person.id}
                        checked={selectedSuccessorId === person.id}
                        onChange={(e) => setSelectedSuccessorId(e.target.value)}
                        className="hidden"
                      />
                      <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{person.name}</p>
                        <p className="text-xs text-dark-400">{person.position} · {getAreaById(person.areaId)?.name}</p>
                      </div>
                      <span className={`badge ${getStatusBgColor(person.status)} text-xs`}>
                        {getStatusText(person.status)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedSuccessorId && (
              <>
                <div className="bg-dark-900 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-white mb-3">交接内容</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-dark-800 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">{selectedPersonnel.areaId ? 1 : 0}</p>
                      <p className="text-xs text-dark-400">负责区域</p>
                    </div>
                    <div className="text-center p-3 bg-dark-800 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-warning-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">{pendingDangers.length}</p>
                      <p className="text-xs text-dark-400">待处理隐患</p>
                    </div>
                    <div className="text-center p-3 bg-dark-800 rounded-lg">
                      <Shield className="w-6 h-6 text-danger-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">{processingIncidents.length}</p>
                      <p className="text-xs text-dark-400">处置中事件</p>
                    </div>
                  </div>
                </div>

                {pendingDangers.length > 0 && (
                  <div className="bg-warning-500/10 border border-warning-500/30 p-4 rounded-lg">
                    <h6 className="text-sm font-medium text-warning-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      待处理隐患清单
                    </h6>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {pendingDangers.map((d: HiddenDanger) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                          <span className="text-dark-300 truncate">{d.description}</span>
                          <span className={`badge ${getLevelBgColor(d.level)} text-xs ml-2 flex-shrink-0`}>
                            {getLevelText(d.level)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {processingIncidents.length > 0 && (
                  <div className="bg-danger-500/10 border border-danger-500/30 p-4 rounded-lg">
                    <h6 className="text-sm font-medium text-danger-400 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      处置中事件清单
                    </h6>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {processingIncidents.map((i: Incident) => (
                        <div key={i.id} className="flex items-center justify-between text-sm">
                          <span className="text-dark-300 truncate">{i.title}</span>
                          <span className={`badge ${getLevelBgColor(i.level)} text-xs ml-2 flex-shrink-0`}>
                            {getLevelText(i.level)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">交接备注</label>
                  <textarea
                    value={handoverRemark}
                    onChange={(e) => setHandoverRemark(e.target.value)}
                    placeholder="请输入交接备注信息..."
                    rows={2}
                    className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={handleHandover}
                disabled={!selectedSuccessorId}
                className="btn-success flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-4 h-4" />
                确认交接
              </button>
              <button
                onClick={() => {
                  setShowHandoverModal(false);
                  setSelectedSuccessorId('');
                  setHandoverRemark('');
                }}
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
