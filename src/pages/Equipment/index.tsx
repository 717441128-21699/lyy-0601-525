import { useState } from 'react';
import { Package, AlertTriangle, ArrowUpDown, Search, Radio, Shield, Flashlight, Briefcase, Stethoscope, Layers, Scan, Plus, Minus, CheckCircle, X, Clock, Check, XCircle, FileText, ClipboardCheck, Handshake } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusBgColor, getStatusText, formatDate, formatTime, generateId, cn } from '@/utils';
import type { Equipment, EquipmentLog, StocktakeRecord } from '@/types';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const CATEGORY_ICONS: Record<string, any> = { '通讯设备': Radio, '防暴装备': Shield, '照明设备': Flashlight, '医疗物资': Stethoscope, '安防设施': Layers, '安检设备': Scan };

export default function Equipment() {
  const {
    equipment,
    equipmentLogs,
    stocktakeRecords,
    personnel,
    getPersonnelById,
    getEquipmentById,
    updateEquipment,
    addEquipmentLog,
    addActivityLog,
    addAlert,
    approveEquipmentLog,
    rejectEquipmentLog,
    addStocktakeRecord,
    updateStocktakeRecord,
    adjustStockAfterStocktake,
    getPendingApprovalLogs,
    getEquipmentLogsByEquipment,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'records' | 'approvals' | 'stocktake' | 'warnings'>('ledger');

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showStocktakeModal, setShowStocktakeModal] = useState(false);
  const [showApprovalDetailModal, setShowApprovalDetailModal] = useState(false);
  const [selectedApprovalLog, setSelectedApprovalLog] = useState<EquipmentLog | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState({
    quantity: 1,
    personnelId: '',
    remark: '',
    restockQuantity: 0,
    stocktakeActualQuantity: 0,
    stocktakeDifferenceReason: '',
  });

  const categories = [...new Set(equipment.map(e => e.category))];
  const lowStock = equipment.filter(e => e.available <= e.warningThreshold);
  const total = equipment.reduce((sum, e) => sum + e.total, 0);
  const available = equipment.reduce((sum, e) => sum + e.available, 0);
  const todayLogs = equipmentLogs.filter(l => new Date(l.time).toDateString() === new Date().toDateString());
  const pendingApprovals = getPendingApprovalLogs();

  const categoryStats = categories.map((cat, i) => ({ name: cat, value: equipment.filter(e => e.category === cat).length, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  const filtered = equipment.filter(e => (e.name.includes(searchTerm) || e.model.includes(searchTerm) || e.location.includes(searchTerm)) && (categoryFilter === 'all' || e.category === categoryFilter));
  const getStockProgress = (item: Equipment) => Math.round((item.available / item.total) * 100);
  const getStockColor = (item: Equipment) => item.available <= item.warningThreshold ? 'bg-danger-500' : item.available <= item.warningThreshold * 2 ? 'bg-warning-500' : 'bg-success-500';

  const onDutyPersonnel = personnel.filter(p => p.status === 'on-duty');
  const selectedItem = selectedEquipment;

  const handleBorrow = () => {
    if (!selectedItem || !formData.personnelId || formData.quantity <= 0) return;
    if (formData.quantity > selectedItem.available) return;

    const log: EquipmentLog = {
      id: generateId(),
      equipmentId: selectedItem.id,
      type: 'borrow',
      quantity: formData.quantity,
      personnelId: formData.personnelId,
      time: new Date(),
      status: 'pending',
      remark: formData.remark,
    };
    addEquipmentLog(log);

    addActivityLog({
      id: generateId(),
      type: 'equipment',
      title: '装备领用申请',
      description: `${getPersonnelById(formData.personnelId)?.name} 申请领用 ${selectedItem.name} × ${formData.quantity}，待审批`,
      time: new Date(),
      relatedId: log.id,
    });

    setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' });
    setShowBorrowModal(false);
  };

  const handleApprove = (log: EquipmentLog) => {
    const equip = getEquipmentById(log.equipmentId);
    if (!equip) return;

    const newAvailable = equip.available - log.quantity;
    updateEquipment(equip.id, { available: newAvailable });

    approveEquipmentLog(log.id, 'p1');

    addActivityLog({
      id: generateId(),
      type: 'equipment',
      title: '装备领用审批通过',
      description: `${getPersonnelById(log.personnelId)?.name} 领用 ${equip.name} × ${log.quantity} 已批准`,
      time: new Date(),
      relatedId: log.id,
    });

    if (newAvailable <= equip.warningThreshold) {
      addAlert({
        id: generateId(),
        type: 'equipment',
        level: 'medium',
        title: '库存预警',
        description: `${equip.name} 库存不足，当前仅剩 ${newAvailable} ${equip.unit}`,
        time: new Date(),
        isRead: false,
        relatedId: equip.id,
      });
    }

    setShowApprovalDetailModal(false);
    setSelectedApprovalLog(null);
  };

  const handleReject = () => {
    if (!selectedApprovalLog) return;
    
    rejectEquipmentLog(selectedApprovalLog.id, 'p1', rejectReason);

    addActivityLog({
      id: generateId(),
      type: 'equipment',
      title: '装备领用审批拒绝',
      description: `${getPersonnelById(selectedApprovalLog.personnelId)?.name} 的领用申请已被拒绝，原因：${rejectReason}`,
      time: new Date(),
      relatedId: selectedApprovalLog.id,
    });

    setShowApprovalDetailModal(false);
    setSelectedApprovalLog(null);
    setRejectReason('');
  };

  const handleReturn = () => {
    if (!selectedItem || !formData.personnelId || formData.quantity <= 0) return;
    const borrowed = equipmentLogs.filter(l => l.equipmentId === selectedItem.id && l.type === 'borrow' && l.personnelId === formData.personnelId && l.status === 'completed').reduce((sum, l) => sum + l.quantity, 0);
    const returned = equipmentLogs.filter(l => l.equipmentId === selectedItem.id && l.type === 'return' && l.personnelId === formData.personnelId).reduce((sum, l) => sum + l.quantity, 0);
    if (formData.quantity > (borrowed - returned)) return;

    const newAvailable = selectedItem.available + formData.quantity;
    updateEquipment(selectedItem.id, { available: newAvailable });

    const log: EquipmentLog = {
      id: generateId(),
      equipmentId: selectedItem.id,
      type: 'return',
      quantity: formData.quantity,
      personnelId: formData.personnelId,
      time: new Date(),
      status: 'completed',
      remark: formData.remark,
    };
    addEquipmentLog(log);

    addActivityLog({
      id: generateId(),
      type: 'equipment',
      title: '装备归还',
      description: `${getPersonnelById(formData.personnelId)?.name} 归还 ${selectedItem.name} × ${formData.quantity}`,
      time: new Date(),
      relatedId: log.id,
    });

    setSelectedEquipment({ ...selectedItem, available: newAvailable });
    setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' });
    setShowReturnModal(false);
  };

  const handleRestock = () => {
    if (!selectedItem || formData.restockQuantity <= 0) return;

    const newTotal = selectedItem.total + formData.restockQuantity;
    const newAvailable = selectedItem.available + formData.restockQuantity;

    updateEquipment(selectedItem.id, { total: newTotal, available: newAvailable });

    const log: EquipmentLog = {
      id: generateId(),
      equipmentId: selectedItem.id,
      type: 'return',
      quantity: formData.restockQuantity,
      personnelId: 'p1',
      time: new Date(),
      status: 'completed',
      remark: `库存补充 ${formData.restockQuantity} ${selectedItem.unit}`,
    };
    addEquipmentLog(log);

    addActivityLog({
      id: generateId(),
      type: 'equipment',
      title: '库存补充',
      description: `${selectedItem.name} 库存补充 ${formData.restockQuantity} ${selectedItem.unit}`,
      time: new Date(),
      relatedId: log.id,
    });

    setSelectedEquipment({ ...selectedItem, total: newTotal, available: newAvailable });
    setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' });
    setShowRestockModal(false);
  };

  const handleStocktake = () => {
    if (!selectedItem) return;

    const expectedQuantity = selectedItem.available;
    const actualQuantity = formData.stocktakeActualQuantity;
    const difference = actualQuantity - expectedQuantity;

    const record: StocktakeRecord = {
      id: generateId(),
      equipmentId: selectedItem.id,
      operatorId: 'p1',
      time: new Date(),
      expectedQuantity,
      actualQuantity,
      difference,
      differenceReason: formData.stocktakeDifferenceReason,
      status: difference !== 0 ? 'pending' : 'adjusted',
    };

    addStocktakeRecord(record);

    if (difference !== 0) {
      const log: EquipmentLog = {
        id: generateId(),
        equipmentId: selectedItem.id,
        type: 'stocktake',
        quantity: Math.abs(difference),
        personnelId: 'p1',
        time: new Date(),
        status: 'completed',
        remark: `盘点差异：${difference > 0 ? '盘盈' : '盘亏'} ${Math.abs(difference)} ${selectedItem.unit}，原因：${formData.stocktakeDifferenceReason || '未填写'}`,
      };
      addEquipmentLog(log);

      addActivityLog({
        id: generateId(),
        type: 'equipment',
        title: '库存盘点差异',
        description: `${selectedItem.name} 盘点差异：${difference > 0 ? '+' : ''}${difference} ${selectedItem.unit}`,
        time: new Date(),
        relatedId: record.id,
      });
    } else {
      addActivityLog({
        id: generateId(),
        type: 'equipment',
        title: '库存盘点完成',
        description: `${selectedItem.name} 盘点完成，账实相符`,
        time: new Date(),
        relatedId: record.id,
      });
    }

    setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' });
    setShowStocktakeModal(false);
  };

  const handleAdjustStock = (record: StocktakeRecord) => {
    adjustStockAfterStocktake(record.id);

    const equip = getEquipmentById(record.equipmentId);
    if (equip) {
      addActivityLog({
        id: generateId(),
        type: 'equipment',
        title: '库存调整完成',
        description: `${equip.name} 已根据盘点结果调整库存`,
        time: new Date(),
        relatedId: record.id,
      });
    }
  };

  const handleClick = (item: Equipment) => {
    setSelectedEquipment(item);
    setShowDetailModal(true);
  };

  const getItemLogs = (itemId: string) => {
    return getEquipmentLogsByEquipment(itemId);
  };

  const getPersonnelBorrowed = (personnelId: string, equipmentId: string) => {
    const borrowed = equipmentLogs.filter(l => l.equipmentId === equipmentId && l.type === 'borrow' && l.personnelId === personnelId && l.status === 'completed').reduce((sum, l) => sum + l.quantity, 0);
    const returned = equipmentLogs.filter(l => l.equipmentId === equipmentId && l.type === 'return' && l.personnelId === personnelId).reduce((sum, l) => sum + l.quantity, 0);
    return borrowed - returned;
  };

  const getEquipmentStocktakeRecords = (equipmentId: string) => {
    return stocktakeRecords.filter(r => r.equipmentId === equipmentId).sort((a, b) => b.time.getTime() - a.time.getTime());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-yellow';
      case 'approved': return 'badge-green';
      case 'rejected': return 'badge-red';
      case 'completed': return 'badge-green';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="装备总数" value={total} icon={Package} color="blue" className="animate-stagger-1" />
        <StatCard title="可用数量" value={available} icon={Briefcase} color="green" className="animate-stagger-2" />
        <StatCard title="待审批" value={pendingApprovals.length} icon={Clock} color="orange" className="animate-stagger-3" />
        <StatCard title="库存预警" value={lowStock.length} icon={AlertTriangle} color="red" className="animate-stagger-4" />
        <StatCard title="今日流转" value={todayLogs.length} icon={ArrowUpDown} color="purple" className="animate-stagger-5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card card-hover animate-fade-in-up opacity-0">
            <div className="p-4 border-b border-dark-700"><h3 className="text-lg font-semibold text-white">装备分类统计</h3></div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {categoryStats.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', color: '#F8FAFC' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {categoryStats.map(stat => (
                <div key={stat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} /><span className="text-dark-300">{stat.name}</span></div>
                  <span className="text-white font-medium">{stat.value}种</span>
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
                  <h3 className="text-lg font-semibold text-white">物资装备管理</h3>
                  <div className="flex gap-2 flex-wrap">
                    {(['ledger', 'records', 'approvals', 'stocktake', 'warnings'] as const).map(tab => (
                      <button key={tab} className={cn('px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5', activeTab === tab ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:text-white')} onClick={() => setActiveTab(tab)}>
                        {tab === 'ledger' && <Package className="w-3.5 h-3.5" />}
                        {tab === 'records' && <FileText className="w-3.5 h-3.5" />}
                        {tab === 'approvals' && <Handshake className="w-3.5 h-3.5" />}
                        {tab === 'stocktake' && <ClipboardCheck className="w-3.5 h-3.5" />}
                        {tab === 'warnings' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {tab === 'ledger' ? '装备台账' : tab === 'records' ? '领用记录' : tab === 'approvals' ? `待审批(${pendingApprovals.length})` : tab === 'stocktake' ? '库存盘点' : '库存预警'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input type="text" placeholder="搜索装备..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 pl-9 pr-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">全部分类</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {activeTab === 'ledger' && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(item => {
                    const Icon = CATEGORY_ICONS[item.category] || Package;
                    return (
                      <div key={item.id} className="bg-dark-900/50 border border-dark-700 rounded-xl p-4 hover:border-primary-500/50 transition-all cursor-pointer" onClick={() => handleClick(item)}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center"><Icon className="w-6 h-6 text-primary-400" /></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{item.name}</h4>
                            <p className="text-xs text-dark-400 truncate">{item.model}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-dark-700 text-dark-300 text-xs rounded">{item.category}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-dark-400">库存状态</span>
                            <span className={cn('font-mono font-medium', item.available <= item.warningThreshold ? 'text-danger-400 animate-pulse' : 'text-success-400')}>{item.available}/{item.total} {item.unit}</span>
                          </div>
                          <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', getStockColor(item))} style={{ width: `${getStockProgress(item)}%` }} /></div>
                          <div className="flex items-center justify-between text-xs text-dark-500"><span>存放: {item.location}</span><span>预警: {item.warningThreshold} {item.unit}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-dark-800">
                    <tr><th className="table-header">装备</th><th className="table-header">类型</th><th className="table-header">数量</th><th className="table-header">领用人</th><th className="table-header">时间</th><th className="table-header">状态</th><th className="table-header">备注</th></tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {[...equipmentLogs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50).map(log => (
                      <tr key={log.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="table-cell"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center"><Package className="w-4 h-4 text-primary-400" /></div><span className="text-white">{getEquipmentById(log.equipmentId)?.name}</span></div></td>
                        <td className="table-cell"><span className={`badge ${log.type === 'borrow' ? 'badge-blue' : log.type === 'return' ? 'badge-green' : 'badge-purple'}`}>{log.type === 'borrow' ? '领用' : log.type === 'return' ? '归还' : '盘点'}</span></td>
                        <td className="table-cell text-white font-mono">{log.quantity}</td>
                        <td className="table-cell"><div className="flex items-center gap-2"><img src={getPersonnelById(log.personnelId)?.avatar} alt="" className="w-6 h-6 rounded-full bg-dark-700" /><span className="text-dark-300">{getPersonnelById(log.personnelId)?.name}</span></div></td>
                        <td className="table-cell text-dark-400 text-xs">{formatDate(new Date(log.time))} {formatTime(new Date(log.time))}</td>
                        <td className="table-cell"><span className={`badge ${getStatusBadge(log.status)}`}>{getStatusText(log.status)}</span></td>
                        <td className="table-cell text-dark-400 text-sm max-w-[150px] truncate">{log.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="p-4">
                <div className="space-y-3">
                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-12 text-dark-400"><Handshake className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无待审批申请</p></div>
                  ) : (
                    pendingApprovals.map(log => {
                      const equip = getEquipmentById(log.equipmentId);
                      const person = getPersonnelById(log.personnelId);
                      return (
                        <div key={log.id} className="bg-dark-900/50 border border-dark-700 rounded-xl p-4 hover:border-primary-500/50 transition-colors cursor-pointer" onClick={() => { setSelectedApprovalLog(log); setShowApprovalDetailModal(true); }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center"><Clock className="w-6 h-6 text-warning-400" /></div>
                              <div>
                                <p className="text-white font-medium">{person?.name} 申请领用 {equip?.name}</p>
                                <p className="text-sm text-dark-400 mt-0.5">数量: {log.quantity} {equip?.unit} · {formatTime(log.time)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="badge badge-yellow">待审批</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stocktake' && (
              <div className="p-4">
                <div className="space-y-3">
                  {stocktakeRecords.length === 0 ? (
                    <div className="text-center py-12 text-dark-400"><ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无盘点记录</p></div>
                  ) : (
                    [...stocktakeRecords].sort((a, b) => b.time.getTime() - a.time.getTime()).map(record => {
                      const equip = getEquipmentById(record.equipmentId);
                      const operator = getPersonnelById(record.operatorId);
                      return (
                        <div key={record.id} className="bg-dark-900/50 border border-dark-700 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', record.difference === 0 ? 'bg-success-500/20' : record.status === 'adjusted' ? 'bg-primary-500/20' : 'bg-warning-500/20')}>
                                {record.difference === 0 ? <CheckCircle className="w-6 h-6 text-success-400" /> : <ClipboardCheck className={cn('w-6 h-6', record.status === 'adjusted' ? 'text-primary-400' : 'text-warning-400')} />}
                              </div>
                              <div>
                                <p className="text-white font-medium">{equip?.name} 盘点</p>
                                <p className="text-sm text-dark-400 mt-0.5">
                                  账存: {record.expectedQuantity} · 实存: {record.actualQuantity} · 
                                  <span className={cn('ml-1', record.difference > 0 ? 'text-success-400' : record.difference < 0 ? 'text-danger-400' : 'text-dark-400')}>
                                    差异: {record.difference > 0 ? '+' : ''}{record.difference}
                                  </span>
                                </p>
                                <p className="text-xs text-dark-500 mt-0.5">操作人: {operator?.name} · {formatTime(record.time)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`badge ${record.difference === 0 ? 'badge-green' : record.status === 'adjusted' ? 'badge-blue' : 'badge-yellow'}`}>
                                {record.difference === 0 ? '账实相符' : record.status === 'adjusted' ? '已调整' : '待调整'}
                              </span>
                              {record.difference !== 0 && record.status === 'pending' && (
                                <button onClick={(e) => { e.stopPropagation(); handleAdjustStock(record); }} className="btn-primary text-xs py-1 px-3">
                                  调整库存
                                </button>
                              )}
                            </div>
                          </div>
                          {record.differenceReason && (
                            <p className="text-xs text-dark-400 mt-2 pt-2 border-t border-dark-700">差异原因: {record.differenceReason}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'warnings' && (
              <div className="p-4">
                <div className="space-y-3">
                  {lowStock.length === 0 ? (
                    <div className="text-center py-12 text-dark-400"><Shield className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无库存预警</p></div>
                  ) : (
                    lowStock.map(item => {
                      const Icon = CATEGORY_ICONS[item.category] || Package;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-danger-500/10 border border-danger-500/30 rounded-xl p-4 hover:bg-danger-500/20 transition-colors cursor-pointer animate-pulse" onClick={() => handleClick(item)}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-danger-500/20 flex items-center justify-center"><Icon className="w-6 h-6 text-danger-400" /></div>
                            <div><h4 className="font-semibold text-white">{item.name}</h4><p className="text-sm text-dark-400">{item.category} · {item.location}</p></div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold font-mono text-danger-400">{item.available}<span className="text-sm text-dark-500 font-normal">/{item.total} {item.unit}</span></p>
                            <p className="text-xs text-danger-400"><AlertTriangle className="w-3 h-3 inline mr-1" />低于预警线 ({item.warningThreshold} {item.unit})</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="装备详情" size="lg">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-500/30 to-primary-600/10 flex items-center justify-center border border-primary-500/30">
                {(CATEGORY_ICONS[selectedItem.category] || Package) && (() => { const Icon = CATEGORY_ICONS[selectedItem.category] || Package; return <Icon className="w-10 h-10 text-primary-400" />; })()}
              </div>
              <div><h4 className="text-2xl font-bold text-white">{selectedItem.name}</h4><p className="text-dark-400">{selectedItem.model}</p><span className="inline-block mt-2 px-3 py-1 bg-dark-700 text-dark-300 text-sm rounded-lg">{selectedItem.category}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">总数量</p><p className="text-2xl font-mono text-white font-bold">{selectedItem.total} {selectedItem.unit}</p></div>
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">可用数量</p><p className={cn('text-2xl font-mono font-bold', selectedItem.available <= selectedItem.warningThreshold ? 'text-danger-400 animate-pulse' : 'text-success-400')}>{selectedItem.available} {selectedItem.unit}</p></div>
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">存放位置</p><p className="text-white">{selectedItem.location}</p></div>
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">预警阈值</p><p className="text-warning-400">{selectedItem.warningThreshold} {selectedItem.unit}</p></div>
            </div>
            <div className="bg-dark-900 p-4 rounded-lg">
              <p className="text-xs text-dark-400 mb-2">库存状态</p>
              <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', getStockColor(selectedItem))} style={{ width: `${getStockProgress(selectedItem)}%` }} /></div>
              <div className="flex justify-between mt-2 text-sm"><span className="text-dark-400">使用率: {100 - getStockProgress(selectedItem)}%</span><span className="text-white font-medium">{getStockProgress(selectedItem)}% 可用</span></div>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-white mb-3">盘点记录</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getEquipmentStocktakeRecords(selectedItem.id).slice(0, 5).map((record: StocktakeRecord) => (
                  <div key={record.id} className="bg-dark-900 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">
                        账存 {record.expectedQuantity} · 实存 {record.actualQuantity}
                        <span className={cn('ml-2', record.difference > 0 ? 'text-success-400' : record.difference < 0 ? 'text-danger-400' : 'text-dark-400')}>
                          ({record.difference > 0 ? '+' : ''}{record.difference})
                        </span>
                      </p>
                      <p className="text-xs text-dark-400 mt-0.5">{formatTime(record.time)}</p>
                    </div>
                    <span className={`badge ${record.difference === 0 ? 'badge-green' : record.status === 'adjusted' ? 'badge-blue' : 'badge-yellow'} text-xs`}>
                      {record.difference === 0 ? '相符' : record.status === 'adjusted' ? '已调整' : '待调整'}
                    </span>
                  </div>
                ))}
                {getEquipmentStocktakeRecords(selectedItem.id).length === 0 && (
                  <p className="text-center text-dark-500 py-4">暂无盘点记录</p>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-white mb-3">近期领用记录</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getItemLogs(selectedItem.id).slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between bg-dark-900 p-3 rounded-lg">
                    <div className="flex items-center gap-3"><img src={getPersonnelById(log.personnelId)?.avatar} alt="" className="w-8 h-8 rounded-full bg-dark-700" /><div><p className="text-white">{getPersonnelById(log.personnelId)?.name} {log.type === 'borrow' ? '领用' : log.type === 'return' ? '归还' : '盘点'} {log.quantity} {selectedItem.unit}</p><p className="text-xs text-dark-400">{log.remark || '无备注'}</p></div></div>
                    <div className="text-right"><span className={`badge ${getStatusBadge(log.status)}`}>{getStatusText(log.status)}</span><p className="text-xs text-dark-500 mt-1">{formatDate(new Date(log.time))} {formatTime(new Date(log.time))}</p></div>
                  </div>
                ))}
                {getItemLogs(selectedItem.id).length === 0 && (
                  <p className="text-center text-dark-500 py-4">暂无领用记录</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => { setFormData(prev => ({ ...prev, quantity: 1, personnelId: '' })); setShowBorrowModal(true); }} disabled={selectedItem.available <= 0} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">领用登记</button>
              <button onClick={() => { setFormData(prev => ({ ...prev, quantity: 1, personnelId: '' })); setShowReturnModal(true); }} className="btn-success flex-1">归还登记</button>
              <button onClick={() => { setFormData(prev => ({ ...prev, restockQuantity: 0 })); setShowRestockModal(true); }} className="btn-outline">补充库存</button>
              <button onClick={() => { setFormData(prev => ({ ...prev, stocktakeActualQuantity: selectedItem.available, stocktakeDifferenceReason: '' })); setShowStocktakeModal(true); }} className="btn-outline">盘点</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showApprovalDetailModal} onClose={() => { setShowApprovalDetailModal(false); setSelectedApprovalLog(null); setRejectReason(''); }} title="审批领用申请" size="md">
        {selectedApprovalLog && (
          <div className="space-y-4">
            <div className="bg-dark-900 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-dark-400 mb-1">装备名称</p>
                  <p className="text-white font-medium">{getEquipmentById(selectedApprovalLog.equipmentId)?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">申请数量</p>
                  <p className="text-white font-mono">{selectedApprovalLog.quantity} {getEquipmentById(selectedApprovalLog.equipmentId)?.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">申请人</p>
                  <div className="flex items-center gap-2">
                    <img src={getPersonnelById(selectedApprovalLog.personnelId)?.avatar} alt="" className="w-6 h-6 rounded-full bg-dark-700" />
                    <span className="text-white">{getPersonnelById(selectedApprovalLog.personnelId)?.name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">申请时间</p>
                  <p className="text-white">{formatTime(selectedApprovalLog.time)}</p>
                </div>
              </div>
              {selectedApprovalLog.remark && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-xs text-dark-400 mb-1">申请备注</p>
                  <p className="text-white">{selectedApprovalLog.remark}</p>
                </div>
              )}
            </div>

            <div className="bg-warning-500/10 border border-warning-500/30 p-4 rounded-lg">
              <p className="text-sm text-warning-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                当前库存: {getEquipmentById(selectedApprovalLog.equipmentId)?.available} {getEquipmentById(selectedApprovalLog.equipmentId)?.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">拒绝原因（选填）</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="如拒绝请填写原因..."
                rows={2}
                className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={() => handleApprove(selectedApprovalLog)}
                disabled={selectedApprovalLog.quantity > (getEquipmentById(selectedApprovalLog.equipmentId)?.available || 0)}
                className="btn-success flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={handleReject}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                拒绝
              </button>
              <button
                onClick={() => { setShowApprovalDetailModal(false); setSelectedApprovalLog(null); setRejectReason(''); }}
                className="btn-outline flex-1"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showBorrowModal} onClose={() => { setShowBorrowModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} title="装备领用登记" size="md">
        <div className="space-y-4">
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <p className="text-white font-medium">{selectedItem?.name}</p>
            <p className="text-sm text-dark-400">当前可用: {selectedItem?.available} {selectedItem?.unit}</p>
            <p className="text-xs text-warning-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />提交后需管理员审批</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">领用人员 *</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {onDutyPersonnel.map(person => {
                const borrowed = getPersonnelBorrowed(person.id, selectedItem?.id || '');
                return (
                  <label key={person.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                    formData.personnelId === person.id
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-dark-800 border-transparent hover:bg-dark-700'
                  )}>
                    <input type="radio" name="borrower" value={person.id} checked={formData.personnelId === person.id} onChange={e => setFormData(prev => ({ ...prev, personnelId: e.target.value }))} className="hidden" />
                    <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{person.name}</p>
                      <p className="text-xs text-dark-400">{person.position}</p>
                    </div>
                    {borrowed > 0 && <span className="text-xs text-warning-400">已借: {borrowed}</span>}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">领用数量 *</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                <Minus className="w-4 h-4 text-white" />
              </button>
              <input type="number" min={1} max={selectedItem?.available || 1} value={formData.quantity} onChange={e => setFormData(prev => ({ ...prev, quantity: Math.min(Math.max(1, parseInt(e.target.value) || 1), selectedItem?.available || 1) }))} className="w-24 text-center px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={() => setFormData(prev => ({ ...prev, quantity: Math.min(selectedItem?.available || 1, prev.quantity + 1) }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
              <span className="text-dark-400">{selectedItem?.unit}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">备注</label>
            <textarea
              value={formData.remark}
              onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              placeholder="请输入备注信息..."
              rows={2}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={handleBorrow} disabled={!formData.personnelId || formData.quantity <= 0 || formData.quantity > (selectedItem?.available || 0)} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">提交申请</button>
            <button onClick={() => { setShowBorrowModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} className="btn-outline flex-1">取消</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => { setShowReturnModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} title="装备归还登记" size="md">
        <div className="space-y-4">
          <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-4">
            <p className="text-white font-medium">{selectedItem?.name}</p>
            <p className="text-sm text-dark-400">当前可用: {selectedItem?.available} {selectedItem?.unit}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">归还人员 *</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {personnel.filter(p => getPersonnelBorrowed(p.id, selectedItem?.id || '') > 0).map(person => {
                const borrowed = getPersonnelBorrowed(person.id, selectedItem?.id || '');
                return (
                  <label key={person.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                    formData.personnelId === person.id
                      ? 'bg-success-500/20 border-success-500/50'
                      : 'bg-dark-800 border-transparent hover:bg-dark-700'
                  )}>
                    <input type="radio" name="returner" value={person.id} checked={formData.personnelId === person.id} onChange={e => setFormData(prev => ({ ...prev, personnelId: e.target.value, quantity: Math.min(prev.quantity, getPersonnelBorrowed(e.target.value, selectedItem?.id || '')) }))} className="hidden" />
                    <img src={person.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{person.name}</p>
                      <p className="text-xs text-dark-400">{person.position}</p>
                    </div>
                    <span className="text-xs text-primary-400">待归还: {borrowed}</span>
                  </label>
                );
              })}
              {personnel.filter(p => getPersonnelBorrowed(p.id, selectedItem?.id || '') > 0).length === 0 && (
                <p className="text-center text-dark-500 py-4">暂无待归还人员</p>
              )}
            </div>
          </div>

          {formData.personnelId && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">归还数量 *</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <input type="number" min={1} max={getPersonnelBorrowed(formData.personnelId, selectedItem?.id || '')} value={formData.quantity} onChange={e => setFormData(prev => ({ ...prev, quantity: Math.min(Math.max(1, parseInt(e.target.value) || 1), getPersonnelBorrowed(formData.personnelId, selectedItem?.id || '')) }))} className="w-24 text-center px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={() => setFormData(prev => ({ ...prev, quantity: Math.min(getPersonnelBorrowed(formData.personnelId, selectedItem?.id || ''), prev.quantity + 1) }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <span className="text-dark-400">{selectedItem?.unit}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">备注</label>
            <textarea
              value={formData.remark}
              onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              placeholder="请输入备注信息..."
              rows={2}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={handleReturn} disabled={!formData.personnelId || formData.quantity <= 0} className="btn-success flex-1 disabled:opacity-50 disabled:cursor-not-allowed">确认归还</button>
            <button onClick={() => { setShowReturnModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} className="btn-outline flex-1">取消</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRestockModal} onClose={() => { setShowRestockModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} title="库存补充" size="md">
        <div className="space-y-4">
          <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-4">
            <p className="text-white font-medium">{selectedItem?.name}</p>
            <p className="text-sm text-dark-400">当前库存: {selectedItem?.total} {selectedItem?.unit} (可用: {selectedItem?.available} {selectedItem?.unit})</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">补充数量 *</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setFormData(prev => ({ ...prev, restockQuantity: Math.max(1, prev.restockQuantity - 1) }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                <Minus className="w-4 h-4 text-white" />
              </button>
              <input type="number" min={1} value={formData.restockQuantity} onChange={e => setFormData(prev => ({ ...prev, restockQuantity: Math.max(0, parseInt(e.target.value) || 0) }))} className="w-32 text-center px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={() => setFormData(prev => ({ ...prev, restockQuantity: prev.restockQuantity + 1 }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
              <span className="text-dark-400">{selectedItem?.unit}</span>
            </div>
            <p className="text-xs text-dark-500 mt-2">补充后库存: {selectedItem ? selectedItem.total + formData.restockQuantity : 0} {selectedItem?.unit}</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={handleRestock} disabled={formData.restockQuantity <= 0} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">确认补充</button>
            <button onClick={() => { setShowRestockModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} className="btn-outline flex-1">取消</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showStocktakeModal} onClose={() => { setShowStocktakeModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} title="库存盘点" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-dark-900 p-4 rounded-lg">
              <p className="text-white font-medium">{selectedItem.name}</p>
              <p className="text-sm text-dark-400 mt-1">系统账面库存: <span className="text-primary-400 font-mono">{selectedItem.available} {selectedItem.unit}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">实际盘点数量 *</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setFormData(prev => ({ ...prev, stocktakeActualQuantity: Math.max(0, prev.stocktakeActualQuantity - 1) }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <input type="number" min={0} value={formData.stocktakeActualQuantity} onChange={e => setFormData(prev => ({ ...prev, stocktakeActualQuantity: Math.max(0, parseInt(e.target.value) || 0) }))} className="w-32 text-center px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={() => setFormData(prev => ({ ...prev, stocktakeActualQuantity: prev.stocktakeActualQuantity + 1 }))} className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <span className="text-dark-400">{selectedItem.unit}</span>
              </div>
            </div>

            {formData.stocktakeActualQuantity !== selectedItem.available && (
              <div className={cn('p-4 rounded-lg border', formData.stocktakeActualQuantity > selectedItem.available ? 'bg-success-500/10 border-success-500/30' : 'bg-danger-500/10 border-danger-500/30')}>
                <p className={cn('text-sm font-medium flex items-center gap-2', formData.stocktakeActualQuantity > selectedItem.available ? 'text-success-400' : 'text-danger-400')}>
                  <AlertTriangle className="w-4 h-4" />
                  盘点差异: {formData.stocktakeActualQuantity > selectedItem.available ? '盘盈' : '盘亏'} {Math.abs(formData.stocktakeActualQuantity - selectedItem.available)} {selectedItem.unit}
                </p>
              </div>
            )}

            {formData.stocktakeActualQuantity !== selectedItem.available && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">差异原因 *</label>
                <textarea
                  value={formData.stocktakeDifferenceReason}
                  onChange={e => setFormData(prev => ({ ...prev, stocktakeDifferenceReason: e.target.value }))}
                  placeholder="请输入差异原因..."
                  rows={2}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button onClick={handleStocktake} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                <ClipboardCheck className="w-4 h-4 inline mr-1" />
                确认盘点
              </button>
              <button onClick={() => { setShowStocktakeModal(false); setFormData({ quantity: 1, personnelId: '', remark: '', restockQuantity: 0, stocktakeActualQuantity: 0, stocktakeDifferenceReason: '' }); }} className="btn-outline flex-1">取消</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
