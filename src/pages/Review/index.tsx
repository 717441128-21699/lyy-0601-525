import { useState } from 'react';
import { Calendar, FileText, BarChart3, Clock, AlertCircle, CheckCircle, AlertTriangle, Info, ChevronRight, Plus, Users, Shield, Package, Zap, Eye, Download, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { formatDate, formatTime, getLevelBgColor, getLevelText, getStatusBgColor, getStatusText, generateId, cn } from '@/utils';
import type { TimelineEvent, DailyReport, IncidentLevel } from '@/types';

const eventTypeColors: Record<string, string> = {
  key: 'bg-primary-500',
  incident: 'bg-danger-500',
  operation: 'bg-success-500',
  alert: 'bg-warning-500',
};

const eventTypeIcons: Record<string, React.ReactNode> = {
  key: <CheckCircle className="w-4 h-4" />,
  incident: <AlertCircle className="w-4 h-4" />,
  operation: <Info className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
};

const chartColors = ['#EF4444', '#F59E0B', '#EAB308', '#3B82F6'];
const tooltipStyle = {
  backgroundColor: '#1E293B',
  border: '1px solid #475569',
  borderRadius: '8px',
  color: '#F8FAFC',
};

type DetailTab = 'personnel' | 'incidents' | 'patrols' | 'equipment' | 'dangers';

export default function Review() {
  const {
    timelineEvents,
    dailyReports,
    incidents,
    patrolTasks,
    patrolCheckins,
    personnel,
    attendance,
    equipment,
    equipmentLogs,
    hiddenDangers,
    riskPoints,
    getPersonnelById,
    getPatrolRouteById,
    getRiskPointById,
    getEquipmentById,
    addDailyReport,
    addTimelineEvent,
    addActivityLog,
    getDailyReportByDate,
  } = useAppStore();

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('personnel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const completedIncidents = incidents.filter((i) => i.status === 'completed').length;
  const completedPatrols = patrolTasks.filter((t) => t.status === 'completed').length;
  const onDutyPersonnel = personnel.filter((p) => p.status === 'on-duty').length;

  const today = new Date();
  const todayStr = formatDate(today);
  const existingTodayReport = getDailyReportByDate(today);

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todayIncidents = incidents.filter(i => isSameDay(i.reportTime, today));
    todayIncidents.forEach(incident => {
      events.push({
        id: generateId(),
        time: incident.reportTime,
        title: `事件: ${incident.title}`,
        description: incident.description,
        type: 'incident',
        relatedId: incident.id,
      });
    });

    const todayDangers = hiddenDangers.filter(d => isSameDay(d.reportTime, today));
    todayDangers.forEach(danger => {
      const point = getRiskPointById(danger.pointId);
      events.push({
        id: generateId(),
        time: danger.reportTime,
        title: `隐患: ${danger.title}`,
        description: `${point?.name || '未知点位'} - ${danger.description}`,
        type: 'alert',
        relatedId: danger.id,
      });
    });

    const todayCheckins = patrolCheckins.filter(c => isSameDay(c.checkinTime, today));
    todayCheckins.forEach(checkin => {
      const point = getRiskPointById(checkin.pointId);
      const person = getPersonnelById(patrolTasks.find(t => t.id === checkin.taskId)?.personnelId || '');
      if (checkin.isAbnormal) {
        events.push({
          id: generateId(),
          time: checkin.checkinTime,
          title: `巡逻异常: ${point?.name || '未知点位'}`,
          description: `${person?.name || '未知人员'} - ${checkin.remark || '发现异常'}`,
          type: 'alert',
          relatedId: checkin.id,
        });
      }
    });

    const todayEquipmentLogs = equipmentLogs.filter(l => isSameDay(l.time, today));
    todayEquipmentLogs.slice(0, 5).forEach(log => {
      const equip = getEquipmentById(log.equipmentId);
      const person = getPersonnelById(log.personnelId);
      events.push({
        id: generateId(),
        time: log.time,
        title: `装备${log.type === 'borrow' ? '领用' : '归还'}: ${equip?.name || '未知装备'}`,
        description: `${person?.name || '未知人员'} ${log.type === 'borrow' ? '领用' : '归还'} ${log.quantity}${equip?.unit || ''}`,
        type: 'operation',
        relatedId: log.id,
      });
    });

    const completedTasks = patrolTasks.filter(t => t.status === 'completed' && isSameDay(t.endTime, today));
    completedTasks.forEach(task => {
      const route = getPatrolRouteById(task.routeId);
      const person = getPersonnelById(task.personnelId);
      events.push({
        id: generateId(),
        time: task.endTime,
        title: `巡逻完成: ${route?.name || '未知路线'}`,
        description: `${person?.name || '未知人员'} 完成巡逻任务`,
        type: 'key',
        relatedId: task.id,
      });
    });

    events.sort((a, b) => a.time.getTime() - b.time.getTime());

    const existingEventTimes = timelineEvents
      .filter(e => isSameDay(e.time, today))
      .map(e => e.time.getTime());

    const newEvents = events.filter(e => !existingEventTimes.some(t => Math.abs(t - e.time.getTime()) < 60000));

    return newEvents;
  };

  const generateDailyReport = (): DailyReport => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todayAttendance = attendance.filter(a => a.type === 'on' && isSameDay(a.checkinTime, today));
    const personnelDetails = todayAttendance.map(a => {
      const person = getPersonnelById(a.personnelId);
      return {
        personnelId: a.personnelId,
        name: person?.name || '未知',
        checkinTime: a.checkinTime,
        status: person?.status || 'unknown',
      };
    });

    const todayIncidents = incidents.filter(i => isSameDay(i.reportTime, today));
    const incidentDetails = todayIncidents.map(i => ({
      id: i.id,
      title: i.title,
      level: i.level,
      status: i.status,
      reportTime: i.reportTime,
      handlerName: i.currentHandlerId ? getPersonnelById(i.currentHandlerId)?.name : undefined,
    }));

    const byLevel: Record<IncidentLevel, number> = { red: 0, orange: 0, yellow: 0, blue: 0 };
    todayIncidents.forEach(i => byLevel[i.level]++);

    const keyEvents = todayIncidents
      .filter(i => i.level === 'red' || i.level === 'orange')
      .map(i => `${formatTime(i.reportTime)} - ${i.title}`);

    const todayTasks = patrolTasks.filter(t => isSameDay(t.startTime, today));
    const completedTaskCount = todayTasks.filter(t => t.status === 'completed').length;
    const taskDetails = todayTasks.map(t => {
      const route = getPatrolRouteById(t.routeId);
      const person = getPersonnelById(t.personnelId);
      const checkinCount = patrolCheckins.filter(c => c.taskId === t.id).length;
      return {
        id: t.id,
        routeName: route?.name || '未知路线',
        personnelName: person?.name || '未知',
        status: t.status,
        checkinCount,
      };
    });

    const todayCheckins = patrolCheckins.filter(c => isSameDay(c.checkinTime, today));
    const abnormalCheckins = todayCheckins.filter(c => c.isAbnormal).length;

    const todayEquipmentLogs = equipmentLogs.filter(l => isSameDay(l.time, today));
    const borrowedCount = todayEquipmentLogs.filter(l => l.type === 'borrow').length;
    const returnedCount = todayEquipmentLogs.filter(l => l.type === 'return').length;
    const lowStockItems = equipment.filter(e => e.available <= e.warningThreshold);
    const equipmentDetails = todayEquipmentLogs.map(l => {
      const equip = getEquipmentById(l.equipmentId);
      const person = getPersonnelById(l.personnelId);
      return {
        id: l.id,
        equipmentName: equip?.name || '未知装备',
        type: l.type,
        personnelName: person?.name || '未知',
        quantity: l.quantity,
        time: l.time,
      };
    });

    const todayDangers = hiddenDangers.filter(d => isSameDay(d.reportTime, today));
    const dangerDetails = todayDangers.map(d => {
      const point = getRiskPointById(d.pointId);
      return {
        id: d.id,
        title: d.title,
        pointName: point?.name || '未知点位',
        status: d.status,
        reportTime: d.reportTime,
      };
    });

    const newTimelineEvents = generateTimelineEvents();

    const allTodayEvents = [
      ...timelineEvents.filter(e => isSameDay(e.time, today)),
      ...newTimelineEvents,
    ].sort((a, b) => a.time.getTime() - b.time.getTime());

    let summary = `今日活动${todayIncidents.length > 0 ? '整体平稳' : '安全有序'}。`;
    summary += `人员出勤${personnelDetails.length}人，出勤率${((personnelDetails.length / personnel.length) * 100).toFixed(1)}%。`;
    summary += `发生事件${todayIncidents.length}起，已完成${todayIncidents.filter(i => i.status === 'completed').length}起。`;
    if (todayIncidents.some(i => i.level === 'red' || i.level === 'orange')) {
      summary += `重点关注${todayIncidents.filter(i => i.level === 'red' || i.level === 'orange').map(i => i.title).join('、')}。`;
    }
    summary += `巡逻任务${todayTasks.length}个，完成率${todayTasks.length > 0 ? Math.round((completedTaskCount / todayTasks.length) * 100) : 0}%。`;
    if (lowStockItems.length > 0) {
      summary += `物资预警：${lowStockItems.map(i => i.name).join('、')}库存不足，请及时补充。`;
    }

    return {
      id: generateId(),
      date: today,
      generatedAt: new Date(),
      personnelAttendance: {
        total: personnel.length,
        onDuty: onDutyPersonnel,
        attendanceRate: Math.round((personnelDetails.length / personnel.length) * 1000) / 10,
        details: personnelDetails,
      },
      incidents: {
        total: todayIncidents.length,
        completed: todayIncidents.filter(i => i.status === 'completed').length,
        byLevel,
        details: incidentDetails,
        keyEvents,
      },
      patrols: {
        total: todayTasks.length,
        completed: completedTaskCount,
        completionRate: todayTasks.length > 0 ? Math.round((completedTaskCount / todayTasks.length) * 100) : 0,
        totalCheckins: todayCheckins.length,
        abnormalCheckins,
        details: taskDetails,
      },
      equipment: {
        borrowed: borrowedCount,
        returned: returnedCount,
        lowStock: lowStockItems.length,
        details: equipmentDetails,
        lowStockItems: lowStockItems.map(e => ({
          id: e.id,
          name: e.name,
          available: e.available,
          warningThreshold: e.warningThreshold,
        })),
      },
      hiddenDangers: {
        total: todayDangers.length,
        pending: todayDangers.filter(d => d.status === 'pending').length,
        resolved: todayDangers.filter(d => d.status === 'resolved').length,
        details: dangerDetails,
      },
      timelineEvents: allTodayEvents,
      summary,
    };
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerateSuccess(false);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTimelineEvents = generateTimelineEvents();
    newTimelineEvents.forEach(event => {
      addTimelineEvent(event);
    });

    const report = generateDailyReport();
    addDailyReport(report);

    addActivityLog({
      id: generateId(),
      type: 'alert',
      title: '生成日报',
      description: `${todayStr} 日报已生成`,
      time: new Date(),
      relatedId: report.id,
    });

    setIsGenerating(false);
    setGenerateSuccess(true);
    setTimeout(() => setGenerateSuccess(false), 3000);
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleReportClick = (report: DailyReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleViewDetails = (report: DailyReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
    setDetailTab('personnel');
  };

  const sortedEvents = [...timelineEvents].sort((a, b) => b.time.getTime() - a.time.getTime());
  const completedIncidentsList = incidents.filter((i) => i.status === 'completed');
  const sortedReports = [...dailyReports].sort((a, b) => b.date.getTime() - a.date.getTime());

  const levelStats = selectedReport ? [
    { name: '紧急', value: selectedReport.incidents.byLevel.red, color: '#EF4444' },
    { name: '重要', value: selectedReport.incidents.byLevel.orange, color: '#F59E0B' },
    { name: '关注', value: selectedReport.incidents.byLevel.yellow, color: '#EAB308' },
    { name: '普通', value: selectedReport.incidents.byLevel.blue, color: '#3B82F6' },
  ] : [];

  const trendData = [
    { name: 'Day1', incidents: 3, patrols: 5, attendance: 95 },
    { name: 'Day2', incidents: 5, patrols: 6, attendance: 98 },
    { name: 'Day3', incidents: 4, patrols: 4, attendance: 92 },
    { name: 'Day4', incidents: 6, patrols: 7, attendance: 96 },
    { name: 'Day5', incidents: 5, patrols: 6, attendance: 97 },
  ];

  const statusCounts = selectedReport ? {
    pending: selectedReport.incidents.details.filter(i => i.status === 'pending').length,
    processing: selectedReport.incidents.details.filter(i => i.status === 'processing').length,
    completed: selectedReport.incidents.details.filter(i => i.status === 'completed').length,
  } : { pending: 0, processing: 0, completed: 0 };

  const statusChartData = [
    { name: '待处理', value: statusCounts.pending, color: '#F59E0B' },
    { name: '处理中', value: statusCounts.processing, color: '#3B82F6' },
    { name: '已完成', value: statusCounts.completed, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">复盘报告</h2>
        <div className="flex items-center gap-3">
          {generateSuccess && (
            <span className="text-success-400 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              日报生成成功！
            </span>
          )}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !!existingTodayReport}
            className={cn(
              'btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
              existingTodayReport && 'bg-dark-700 hover:bg-dark-600'
            )}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : existingTodayReport ? (
              <>
                <CheckCircle className="w-4 h-4" />
                今日已生成
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                一键生成日报
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="已归档事件" value={completedIncidents} icon={CheckCircle} color="green" className="animate-stagger-1" />
        <StatCard title="巡逻完成率" value={`${Math.round((completedPatrols / patrolTasks.length) * 100)}%`} icon={BarChart3} color="blue" className="animate-stagger-2" />
        <StatCard title="在岗人员" value={`${onDutyPersonnel}/${personnel.length}`} icon={Info} color="purple" className="animate-stagger-3" />
        <StatCard title="日报数量" value={dailyReports.length} icon={FileText} color="orange" className="animate-stagger-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-1">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                活动时间线复盘
              </h3>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-600" />
                <div className="space-y-6">
                  {sortedEvents.length === 0 ? (
                    <div className="text-center py-12 text-dark-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无时间线数据</p>
                      <p className="text-sm mt-1">点击"一键生成日报"自动提取关键节点</p>
                    </div>
                  ) : (
                    sortedEvents.map((event) => (
                      <div key={event.id} className="relative pl-12 cursor-pointer group" onClick={() => handleEventClick(event)}>
                        <div className={`absolute left-2 w-5 h-5 rounded-full ${eventTypeColors[event.type]} flex items-center justify-center text-white ring-4 ring-dark-800 group-hover:ring-primary-500/30 transition-all`}>
                          {eventTypeIcons[event.type]}
                        </div>
                        {event.type === 'key' && (
                          <div className="absolute left-0 w-9 h-9 -translate-x-0.5 -translate-y-0.5 rounded-full bg-primary-500/20 animate-ping" />
                        )}
                        <div className="bg-dark-700/30 rounded-lg p-4 hover:bg-dark-700/50 transition-colors border border-transparent hover:border-primary-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{event.title}</h4>
                            <span className="text-xs text-dark-400">{formatTime(event.time)}</span>
                          </div>
                          <p className="text-sm text-dark-300">{event.description}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-dark-500">{formatDate(event.time)}</span>
                            <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-2">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                日报列表
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {sortedReports.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无日报</p>
                </div>
              ) : (
                sortedReports.map((report) => (
                  <div key={report.id} className="bg-dark-700/30 rounded-lg p-3 hover:bg-dark-700/50 transition-colors border border-transparent hover:border-primary-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => handleReportClick(report)}>
                        <Calendar className="w-4 h-4 text-primary-400" />
                        <span className="font-medium text-white">{formatDate(report.date)}</span>
                      </div>
                      <button
                        onClick={() => handleViewDetails(report)}
                        className="p-1 text-primary-400 hover:text-primary-300 transition-colors"
                        title="查看明细"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-dark-400 line-clamp-2 cursor-pointer" onClick={() => handleReportClick(report)}>{report.summary}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="badge badge-blue text-xs">事件 {report.incidents.total}</span>
                      <span className="badge badge-green text-xs">巡逻 {report.patrols.completionRate}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card card-hover animate-fade-in-up opacity-0 animate-stagger-3">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-400" />
                事件归档
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {completedIncidentsList.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无已完成事件</p>
                </div>
              ) : (
                completedIncidentsList.map((incident) => (
                  <div key={incident.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors">
                    <span className={`badge ${getLevelBgColor(incident.level)} text-xs`}>
                      {getLevelText(incident.level)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{incident.title}</p>
                      <p className="text-xs text-dark-400">{formatDate(incident.reportTime)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-hover animate-fade-in-up opacity-0">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            数据统计趋势
          </h3>
        </div>
        <div className="p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} name="事件数" />
              <Line type="monotone" dataKey="patrols" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} name="巡逻数" />
              <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} name="出勤率%" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="事件详情" size="md">
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${eventTypeColors[selectedEvent.type]} flex items-center justify-center text-white`}>
                {eventTypeIcons[selectedEvent.type]}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white">{selectedEvent.title}</h4>
                <p className="text-sm text-dark-400">{formatDate(selectedEvent.time)} {formatTime(selectedEvent.time)}</p>
              </div>
            </div>
            <div className="bg-dark-900 p-4 rounded-lg">
              <p className="text-dark-300">{selectedEvent.description}</p>
            </div>
            <div className="pt-4 border-t border-dark-700">
              <button onClick={() => setShowEventModal(false)} className="btn-primary w-full">关闭</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="日报详情" size="xl">
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                {formatDate(selectedReport.date)} 日报
              </h4>
              <span className="text-xs text-dark-400">生成时间: {formatTime(selectedReport.generatedAt)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-900 p-3 rounded-lg text-center">
                <p className="text-xs text-dark-400">人员出勤率</p>
                <p className="text-2xl font-bold text-green-400">{selectedReport.personnelAttendance.attendanceRate}%</p>
              </div>
              <div className="bg-dark-900 p-3 rounded-lg text-center">
                <p className="text-xs text-dark-400">事件总数</p>
                <p className="text-2xl font-bold text-danger-400">{selectedReport.incidents.total}</p>
              </div>
              <div className="bg-dark-900 p-3 rounded-lg text-center">
                <p className="text-xs text-dark-400">巡逻完成率</p>
                <p className="text-2xl font-bold text-primary-400">{selectedReport.patrols.completionRate}%</p>
              </div>
              <div className="bg-dark-900 p-3 rounded-lg text-center">
                <p className="text-xs text-dark-400">物资预警</p>
                <p className="text-2xl font-bold text-warning-400">{selectedReport.equipment.lowStock}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3">事件分级统计</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelStats}>
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {levelStats.map((stat, i) => <Cell key={i} fill={stat.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {levelStats.map(stat => (
                    <div key={stat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-dark-300">{stat.name}</span>
                      </div>
                      <span className="text-white font-medium">{stat.value}起</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3">事件状态分布</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                        {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {statusChartData.map(stat => (
                    <div key={stat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-dark-300">{stat.name}</span>
                      </div>
                      <span className="text-white font-medium">{stat.value}起</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedReport.incidents.keyEvents.length > 0 && (
              <div className="bg-dark-900 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning-400" />
                  关键事件摘要
                </h5>
                <div className="space-y-2">
                  {selectedReport.incidents.keyEvents.map((event, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary-400 mt-0.5">•</span>
                      <span className="text-dark-200">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-primary-900/20 border border-primary-700/50 p-4 rounded-lg">
              <h5 className="text-sm font-semibold text-white mb-2">当日总结</h5>
              <p className="text-dark-300 text-sm">{selectedReport.summary}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => { setShowReportModal(false); handleViewDetails(selectedReport); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                查看明细
              </button>
              <button onClick={() => setShowReportModal(false)} className="btn-outline flex-1">关闭</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="日报明细" size="xl">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                {formatDate(selectedReport.date)} 日报明细
              </h4>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-dark-700 pb-4">
              {[
                { key: 'personnel', label: '人员签到', icon: Users },
                { key: 'incidents', label: '事件处置', icon: AlertCircle },
                { key: 'patrols', label: '巡逻任务', icon: Shield },
                { key: 'equipment', label: '装备流转', icon: Package },
                { key: 'dangers', label: '隐患登记', icon: AlertTriangle },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key as DetailTab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2',
                    detailTab === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-dark-300 hover:text-white'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              {detailTab === 'personnel' && (
                <table className="w-full">
                  <thead><tr className="bg-dark-800/50">
                    <th className="table-header">人员姓名</th>
                    <th className="table-header">签到时间</th>
                    <th className="table-header">当前状态</th>
                  </tr></thead>
                  <tbody className="divide-y divide-dark-700">
                    {selectedReport.personnelAttendance.details.map(detail => (
                      <tr key={detail.personnelId} className="hover:bg-dark-700/30 transition-colors">
                        <td className="table-cell text-white font-medium">{detail.name}</td>
                        <td className="table-cell text-dark-300">{formatTime(detail.checkinTime)}</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBgColor(detail.status)}`}>{getStatusText(detail.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {detailTab === 'incidents' && (
                <table className="w-full">
                  <thead><tr className="bg-dark-800/50">
                    <th className="table-header">事件标题</th>
                    <th className="table-header">等级</th>
                    <th className="table-header">上报时间</th>
                    <th className="table-header">处理人</th>
                    <th className="table-header">状态</th>
                  </tr></thead>
                  <tbody className="divide-y divide-dark-700">
                    {selectedReport.incidents.details.map(detail => (
                      <tr key={detail.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="table-cell text-white font-medium">{detail.title}</td>
                        <td className="table-cell">
                          <span className={`badge ${getLevelBgColor(detail.level)}`}>{getLevelText(detail.level)}</span>
                        </td>
                        <td className="table-cell text-dark-300">{formatTime(detail.reportTime)}</td>
                        <td className="table-cell text-dark-300">{detail.handlerName || '未分配'}</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBgColor(detail.status)}`}>{getStatusText(detail.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {detailTab === 'patrols' && (
                <table className="w-full">
                  <thead><tr className="bg-dark-800/50">
                    <th className="table-header">巡逻路线</th>
                    <th className="table-header">执行人员</th>
                    <th className="table-header">打卡次数</th>
                    <th className="table-header">状态</th>
                  </tr></thead>
                  <tbody className="divide-y divide-dark-700">
                    {selectedReport.patrols.details.map(detail => (
                      <tr key={detail.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="table-cell text-white font-medium">{detail.routeName}</td>
                        <td className="table-cell text-dark-300">{detail.personnelName}</td>
                        <td className="table-cell text-dark-300">{detail.checkinCount}次</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBgColor(detail.status)}`}>{getStatusText(detail.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {detailTab === 'equipment' && (
                <div className="space-y-4">
                  {selectedReport.equipment.lowStockItems.length > 0 && (
                    <div className="bg-warning-900/20 border border-warning-700/50 p-3 rounded-lg">
                      <h5 className="text-sm font-semibold text-warning-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        库存预警
                      </h5>
                      <div className="space-y-1">
                        {selectedReport.equipment.lowStockItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-dark-200">{item.name}</span>
                            <span className="text-warning-400">当前: {item.available} / 预警: {item.warningThreshold}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <table className="w-full">
                    <thead><tr className="bg-dark-800/50">
                      <th className="table-header">装备名称</th>
                      <th className="table-header">类型</th>
                      <th className="table-header">数量</th>
                      <th className="table-header">操作人员</th>
                      <th className="table-header">时间</th>
                    </tr></thead>
                    <tbody className="divide-y divide-dark-700">
                      {selectedReport.equipment.details.map(detail => (
                        <tr key={detail.id} className="hover:bg-dark-700/30 transition-colors">
                          <td className="table-cell text-white font-medium">{detail.equipmentName}</td>
                          <td className="table-cell">
                            <span className={`badge ${detail.type === 'borrow' ? 'badge-orange' : 'badge-green'} text-xs`}>
                              {detail.type === 'borrow' ? '领用' : '归还'}
                            </span>
                          </td>
                          <td className="table-cell text-dark-300">{detail.quantity}</td>
                          <td className="table-cell text-dark-300">{detail.personnelName}</td>
                          <td className="table-cell text-dark-300">{formatTime(detail.time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'dangers' && (
                <table className="w-full">
                  <thead><tr className="bg-dark-800/50">
                    <th className="table-header">隐患标题</th>
                    <th className="table-header">关联点位</th>
                    <th className="table-header">上报时间</th>
                    <th className="table-header">状态</th>
                  </tr></thead>
                  <tbody className="divide-y divide-dark-700">
                    {selectedReport.hiddenDangers.details.map(detail => (
                      <tr key={detail.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="table-cell text-white font-medium">{detail.title}</td>
                        <td className="table-cell text-dark-300">{detail.pointName}</td>
                        <td className="table-cell text-dark-300">{formatTime(detail.reportTime)}</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBgColor(detail.status)}`}>{getStatusText(detail.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-dark-700">
              <button onClick={() => setShowDetailModal(false)} className="btn-primary w-full">关闭</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
