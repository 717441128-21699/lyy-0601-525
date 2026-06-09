import { useState } from 'react';
import { Package, AlertTriangle, ArrowUpDown, Search, Radio, Shield, Flashlight, Briefcase, Stethoscope, Layers, Scan } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusBgColor, getStatusText, formatDate, formatTime, cn } from '@/utils';
import type { Equipment } from '@/types';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const CATEGORY_ICONS: Record<string, any> = { '通讯设备': Radio, '防暴装备': Shield, '照明设备': Flashlight, '医疗物资': Stethoscope, '安防设施': Layers, '安检设备': Scan };

export default function Equipment() {
  const { equipment, equipmentLogs, getPersonnelById, getEquipmentById } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'records' | 'warnings'>('ledger');

  const categories = [...new Set(equipment.map(e => e.category))];
  const lowStock = equipment.filter(e => e.available <= e.warningThreshold);
  const total = equipment.reduce((sum, e) => sum + e.total, 0);
  const available = equipment.reduce((sum, e) => sum + e.available, 0);
  const todayLogs = equipmentLogs.filter(l => l.time.toDateString() === new Date().toDateString());

  const categoryStats = categories.map((cat, i) => ({ name: cat, value: equipment.filter(e => e.category === cat).length, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  const filtered = equipment.filter(e => (e.name.includes(searchTerm) || e.model.includes(searchTerm) || e.location.includes(searchTerm)) && (categoryFilter === 'all' || e.category === categoryFilter));
  const getStockProgress = (item: Equipment) => Math.round((item.available / item.total) * 100);
  const getStockColor = (item: Equipment) => item.available <= item.warningThreshold ? 'bg-danger-500' : item.available <= item.warningThreshold * 2 ? 'bg-warning-500' : 'bg-success-500';
  const handleClick = (item: Equipment) => { setSelectedEquipment(item); setShowDetailModal(true); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="装备总数" value={total} icon={Package} color="blue" className="animate-stagger-1" />
        <StatCard title="可用数量" value={available} icon={Briefcase} color="green" className="animate-stagger-2" />
        <StatCard title="库存预警" value={lowStock.length} icon={AlertTriangle} color="red" className="animate-stagger-3" />
        <StatCard title="今日流转" value={todayLogs.length} icon={ArrowUpDown} color="purple" className="animate-stagger-4" />
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
                  <div className="flex gap-2">
                    {(['ledger', 'records', 'warnings'] as const).map(tab => (
                      <button key={tab} className={cn('px-3 py-1.5 rounded-lg text-sm transition-colors', activeTab === tab ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:text-white')} onClick={() => setActiveTab(tab)}>
                        {tab === 'ledger' ? '装备台账' : tab === 'records' ? '领用记录' : '库存预警'}
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
                            <span className={cn('font-mono font-medium', item.available <= item.warningThreshold ? 'text-danger-400' : 'text-success-400')}>{item.available}/{item.total} {item.unit}</span>
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
                    {[...equipmentLogs].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 30).map(log => (
                      <tr key={log.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="table-cell"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center"><Package className="w-4 h-4 text-primary-400" /></div><span className="text-white">{getEquipmentById(log.equipmentId)?.name}</span></div></td>
                        <td className="table-cell"><span className={`badge ${log.type === 'borrow' ? 'badge-blue' : 'badge-green'}`}>{log.type === 'borrow' ? '领用' : '归还'}</span></td>
                        <td className="table-cell text-white font-mono">{log.quantity}</td>
                        <td className="table-cell"><div className="flex items-center gap-2"><img src={getPersonnelById(log.personnelId)?.avatar} alt="" className="w-6 h-6 rounded-full bg-dark-700" /><span className="text-dark-300">{getPersonnelById(log.personnelId)?.name}</span></div></td>
                        <td className="table-cell text-dark-400 text-xs">{formatDate(log.time)} {formatTime(log.time)}</td>
                        <td className="table-cell"><span className={`badge ${getStatusBgColor(log.status)}`}>{getStatusText(log.status)}</span></td>
                        <td className="table-cell text-dark-400 text-sm max-w-[150px] truncate">{log.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                        <div key={item.id} className="flex items-center justify-between bg-danger-500/10 border border-danger-500/30 rounded-xl p-4 hover:bg-danger-500/20 transition-colors cursor-pointer" onClick={() => handleClick(item)}>
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
        {selectedEquipment && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-500/30 to-primary-600/10 flex items-center justify-center border border-primary-500/30">
                {(CATEGORY_ICONS[selectedEquipment.category] || Package) && (() => { const Icon = CATEGORY_ICONS[selectedEquipment.category] || Package; return <Icon className="w-10 h-10 text-primary-400" />; })()}
              </div>
              <div><h4 className="text-2xl font-bold text-white">{selectedEquipment.name}</h4><p className="text-dark-400">{selectedEquipment.model}</p><span className="inline-block mt-2 px-3 py-1 bg-dark-700 text-dark-300 text-sm rounded-lg">{selectedEquipment.category}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">总数量</p><p className="text-2xl font-mono text-white font-bold">{selectedEquipment.total} {selectedEquipment.unit}</p></div>
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">可用数量</p><p className={cn('text-2xl font-mono font-bold', selectedEquipment.available <= selectedEquipment.warningThreshold ? 'text-danger-400' : 'text-success-400')}>{selectedEquipment.available} {selectedEquipment.unit}</p></div>
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">存放位置</p><p className="text-white">{selectedEquipment.location}</p></div>
              <div className="bg-dark-900 p-4 rounded-lg"><p className="text-xs text-dark-400 mb-1">预警阈值</p><p className="text-warning-400">{selectedEquipment.warningThreshold} {selectedEquipment.unit}</p></div>
            </div>
            <div className="bg-dark-900 p-4 rounded-lg">
              <p className="text-xs text-dark-400 mb-2">库存状态</p>
              <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', getStockColor(selectedEquipment))} style={{ width: `${getStockProgress(selectedEquipment)}%` }} /></div>
              <div className="flex justify-between mt-2 text-sm"><span className="text-dark-400">使用率: {100 - getStockProgress(selectedEquipment)}%</span><span className="text-white font-medium">{getStockProgress(selectedEquipment)}% 可用</span></div>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-white mb-3">近期领用记录</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {useAppStore.getState().getEquipmentLogsByEquipment(selectedEquipment.id).slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between bg-dark-900 p-3 rounded-lg">
                    <div className="flex items-center gap-3"><img src={getPersonnelById(log.personnelId)?.avatar} alt="" className="w-8 h-8 rounded-full bg-dark-700" /><div><p className="text-white">{getPersonnelById(log.personnelId)?.name} {log.type === 'borrow' ? '领用' : '归还'} {log.quantity} {selectedEquipment.unit}</p><p className="text-xs text-dark-400">{log.remark || '无备注'}</p></div></div>
                    <div className="text-right"><span className={`badge ${getStatusBgColor(log.status)}`}>{getStatusText(log.status)}</span><p className="text-xs text-dark-500 mt-1">{formatDate(log.time)} {formatTime(log.time)}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button className="btn-primary flex-1">领用登记</button>
              <button className="btn-success flex-1">归还登记</button>
              <button className="btn-outline">补充库存</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
