import { useState } from 'react';
import { Calendar, FileText, BarChart3, Clock, AlertCircle, CheckCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import { formatDate, formatTime, getLevelBgColor, getLevelText } from '@/utils';
import type { TimelineEvent, DailyReport } from '@/types';

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

export default function Review() {
  const { timelineEvents, dailyReports, incidents, patrolTasks, personnel } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const completedIncidents = incidents.filter((i) => i.status === 'completed').length;
  const completedPatrols = patrolTasks.filter((t) => t.status === 'completed').length;
  const onDutyPersonnel = personnel.filter((p) => p.status === 'on-duty').length;

  const trendData = [
    { name: 'Day1', incidents: 3, patrols: 5, attendance: 95 },
    { name: 'Day2', incidents: 5, patrols: 6, attendance: 98 },
    { name: 'Day3', incidents: 4, patrols: 4, attendance: 92 },
    { name: 'Day4', incidents: 6, patrols: 7, attendance: 96 },
    { name: 'Day5', incidents: 5, patrols: 6, attendance: 97 },
  ];

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleReportClick = (report: DailyReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const sortedEvents = [...timelineEvents].sort((a, b) => b.time.getTime() - a.time.getTime());
  const completedIncidentsList = incidents.filter((i) => i.status === 'completed');

  return (
    <div className="space-y-6">
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
                  {sortedEvents.map((event) => (
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
                  ))}
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
              {dailyReports.map((report) => (
                <div key={report.id} onClick={() => handleReportClick(report)} className="bg-dark-700/30 rounded-lg p-3 cursor-pointer hover:bg-dark-700/50 transition-colors border border-transparent hover:border-primary-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-400" />
                      <span className="font-medium text-white">{formatDate(report.date)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-dark-500" />
                  </div>
                  <p className="text-xs text-dark-400 line-clamp-2">{report.summary}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="badge badge-blue text-xs">事件 {report.incidents.total}</span>
                    <span className="badge badge-green text-xs">巡逻 {report.patrols.completionRate}%</span>
                  </div>
                </div>
              ))}
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
              {completedIncidentsList.map((incident) => (
                <div key={incident.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors">
                  <span className={`badge ${getLevelBgColor(incident.level)} text-xs`}>
                    {getLevelText(incident.level)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{incident.title}</p>
                    <p className="text-xs text-dark-400">{formatDate(incident.reportTime)}</p>
                  </div>
                </div>
              ))}
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

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="日报详情" size="lg">
        {selectedReport && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              {formatDate(selectedReport.date)} 日报
            </h4>

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

            <div className="bg-dark-900 p-4 rounded-lg">
              <h5 className="text-sm font-semibold text-white mb-3">事件分级统计</h5>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '紧急', value: selectedReport.incidents.byLevel.red },
                    { name: '重要', value: selectedReport.incidents.byLevel.orange },
                    { name: '关注', value: selectedReport.incidents.byLevel.yellow },
                    { name: '普通', value: selectedReport.incidents.byLevel.blue },
                  ]}>
                    <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartColors.map((color, i) => <Cell key={i} fill={color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-primary-900/20 border border-primary-700/50 p-4 rounded-lg">
              <h5 className="text-sm font-semibold text-white mb-2">当日总结</h5>
              <p className="text-dark-300 text-sm">{selectedReport.summary}</p>
            </div>

            <div className="pt-4 border-t border-dark-700">
              <button onClick={() => setShowReportModal(false)} className="btn-primary w-full">关闭</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
