import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Personnel,
  Attendance,
  Area,
  RiskPoint,
  HiddenDanger,
  PatrolRoute,
  PatrolTask,
  PatrolCheckin,
  Incident,
  IncidentDispatch,
  IncidentRecord,
  IntercomLog,
  Equipment,
  EquipmentLog,
  Alert,
  ActivityLog,
  TimelineEvent,
  DailyReport,
  StocktakeRecord,
  ShiftHandover,
  DangerTransferRecord,
} from '@/types';
import { generateId, formatTime } from '@/utils';
import {
  mockPersonnel,
  mockAttendance,
  mockAreas,
  mockRiskPoints,
  mockHiddenDangers,
  mockPatrolRoutes,
  mockPatrolTasks,
  mockPatrolCheckins,
  mockIncidents,
  mockIncidentDispatches,
  mockIncidentRecords,
  mockIntercomLogs,
  mockEquipment,
  mockEquipmentLogs,
  mockStocktakeRecords,
  mockShiftHandovers,
  mockAlerts,
  mockActivityLogs,
  mockTimelineEvents,
  mockDailyReports,
} from '@/mock/data';
import type { IncidentLevel } from '@/types';

const STORAGE_KEY = 'security-command-system';

interface AppState {
  personnel: Personnel[];
  attendance: Attendance[];
  areas: Area[];
  riskPoints: RiskPoint[];
  hiddenDangers: HiddenDanger[];
  patrolRoutes: PatrolRoute[];
  patrolTasks: PatrolTask[];
  patrolCheckins: PatrolCheckin[];
  incidents: Incident[];
  incidentDispatches: IncidentDispatch[];
  incidentRecords: IncidentRecord[];
  intercomLogs: IntercomLog[];
  equipment: Equipment[];
  equipmentLogs: EquipmentLog[];
  stocktakeRecords: StocktakeRecord[];
  shiftHandovers: ShiftHandover[];
  alerts: Alert[];
  activityLogs: ActivityLog[];
  timelineEvents: TimelineEvent[];
  dailyReports: DailyReport[];
  currentTime: Date;
  sidebarCollapsed: boolean;
  
  setPersonnel: (personnel: Personnel[]) => void;
  updatePersonnel: (id: string, updates: Partial<Personnel>) => void;
  addAttendance: (attendance: Attendance) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  addIncidentDispatch: (dispatch: IncidentDispatch) => void;
  addIncidentRecord: (record: IncidentRecord) => void;
  addIntercomLog: (log: IntercomLog) => void;
  addPatrolTask: (task: PatrolTask) => void;
  updatePatrolTask: (id: string, updates: Partial<PatrolTask>) => void;
  addPatrolCheckin: (checkin: PatrolCheckin) => void;
  addEquipmentLog: (log: EquipmentLog) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  approveEquipmentLog: (id: string, approverId: string) => void;
  rejectEquipmentLog: (id: string, approverId: string, reason: string) => void;
  addStocktakeRecord: (record: StocktakeRecord) => void;
  updateStocktakeRecord: (id: string, updates: Partial<StocktakeRecord>) => void;
  adjustStockAfterStocktake: (recordId: string) => void;
  markAlertRead: (id: string) => void;
  addAlert: (alert: Alert) => void;
  addActivityLog: (log: ActivityLog) => void;
  addHiddenDanger: (danger: HiddenDanger) => void;
  updateHiddenDanger: (id: string, updates: Partial<HiddenDanger>) => void;
  transferDangerHandler: (dangerId: string, fromHandlerId: string, toHandlerId: string, operatorId: string, remark?: string) => void;
  changeDangerStatus: (dangerId: string, fromStatus: string, toStatus: string, operatorId: string, remark?: string) => void;
  addShiftHandover: (handover: ShiftHandover) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  updateCurrentTime: () => void;
  toggleSidebar: () => void;
  getPersonnelById: (id: string) => Personnel | undefined;
  getAreaById: (id: string) => Area | undefined;
  getRiskPointById: (id: string) => RiskPoint | undefined;
  getPatrolRouteById: (id: string) => PatrolRoute | undefined;
  getNearbyPersonnel: (x: number, y: number, radius: number) => Personnel[];
  getNearbyRiskPoints: (x: number, y: number, radius: number) => RiskPoint[];
  getEquipmentUsageByIncident: (incidentId: string) => { equipment: Equipment; quantity: number; handlerName: string }[];
  getIncidentDispatches: (incidentId: string) => IncidentDispatch[];
  getIncidentRecords: (incidentId: string) => IncidentRecord[];
  getIntercomLogsByIncident: (incidentId: string) => IntercomLog[];
  getPersonnelAttendance: (personnelId: string) => Attendance[];
  getTaskCheckins: (taskId: string) => PatrolCheckin[];
  getUnreadAlerts: () => Alert[];
  getEquipmentLogsByEquipment: (equipmentId: string) => EquipmentLog[];
  getEquipmentById: (id: string) => Equipment | undefined;
  getPendingApprovalLogs: () => EquipmentLog[];
  getDangersByHandler: (handlerId: string) => HiddenDanger[];
  getIncidentsByHandler: (handlerId: string) => Incident[];
  addPatrolRoute: (route: PatrolRoute) => void;
  addDailyReport: (report: DailyReport) => void;
  updateDailyReport: (id: string, updates: Partial<DailyReport>) => void;
  generateDailyReport: (date: Date) => DailyReport;
  generateTimelineEvents: (date: Date) => TimelineEvent[];
  regenerateDailyReport: (date: Date) => DailyReport;
  getDailyReportById: (id: string) => DailyReport | undefined;
  getDailyReportByDate: (date: Date) => DailyReport | undefined;
  resetStore: () => void;
}

const deserializeDates = (obj: any): any => {
  if (!obj) return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(deserializeDates);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        result[key] = new Date(value);
      } else {
        result[key] = deserializeDates(value);
      }
    }
    return result;
  }
  return obj;
};

const getInitialState = () => ({
  personnel: mockPersonnel,
  attendance: mockAttendance,
  areas: mockAreas,
  riskPoints: mockRiskPoints,
  hiddenDangers: mockHiddenDangers,
  patrolRoutes: mockPatrolRoutes,
  patrolTasks: mockPatrolTasks,
  patrolCheckins: mockPatrolCheckins,
  incidents: mockIncidents,
  incidentDispatches: mockIncidentDispatches,
  incidentRecords: mockIncidentRecords,
  intercomLogs: mockIntercomLogs,
  equipment: mockEquipment,
  equipmentLogs: mockEquipmentLogs,
  stocktakeRecords: mockStocktakeRecords,
  shiftHandovers: mockShiftHandovers,
  alerts: mockAlerts,
  activityLogs: mockActivityLogs,
  timelineEvents: mockTimelineEvents,
  dailyReports: mockDailyReports,
  currentTime: new Date(),
  sidebarCollapsed: false,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setPersonnel: (personnel) => set({ personnel }),
      
      updatePersonnel: (id, updates) => set((state) => ({
        personnel: state.personnel.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      
      addAttendance: (attendance) => set((state) => ({
        attendance: [...state.attendance, attendance],
      })),
      
      addIncident: (incident) => set((state) => ({
        incidents: [incident, ...state.incidents],
      })),
      
      updateIncident: (id, updates) => set((state) => ({
        incidents: state.incidents.map((i) => i.id === id ? { ...i, ...updates } : i),
      })),
      
      addIncidentDispatch: (dispatch) => set((state) => ({
        incidentDispatches: [...state.incidentDispatches, dispatch],
      })),
      
      addIncidentRecord: (record) => set((state) => ({
        incidentRecords: [...state.incidentRecords, record],
      })),
      
      addIntercomLog: (log) => set((state) => ({
        intercomLogs: [...state.intercomLogs, log],
      })),
      
      addPatrolRoute: (route) => set((state) => ({
        patrolRoutes: [...state.patrolRoutes, route],
      })),
      
      addPatrolTask: (task) => set((state) => ({
        patrolTasks: [...state.patrolTasks, task],
      })),
      
      updatePatrolTask: (id, updates) => set((state) => ({
        patrolTasks: state.patrolTasks.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),
      
      addPatrolCheckin: (checkin) => set((state) => ({
        patrolCheckins: [...state.patrolCheckins, checkin],
      })),
      
      addEquipmentLog: (log) => set((state) => ({
        equipmentLogs: [...state.equipmentLogs, log],
      })),
      
      updateEquipment: (id, updates) => set((state) => ({
        equipment: state.equipment.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),
      
      markAlertRead: (id) => set((state) => ({
        alerts: state.alerts.map((a) => a.id === id ? { ...a, isRead: true } : a),
      })),
      
      addAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts],
      })),
      
      addActivityLog: (log) => set((state) => ({
        activityLogs: [log, ...state.activityLogs],
      })),
      
      addHiddenDanger: (danger) => set((state) => ({
        hiddenDangers: [...state.hiddenDangers, danger],
      })),
      
      updateHiddenDanger: (id, updates) => set((state) => ({
        hiddenDangers: state.hiddenDangers.map((d) => d.id === id ? { ...d, ...updates } : d),
      })),
      
      addTimelineEvent: (event) => set((state) => ({
        timelineEvents: [...state.timelineEvents, event],
      })),
      
      addDailyReport: (report) => set((state) => ({
        dailyReports: [...state.dailyReports, report],
      })),
      
      updateDailyReport: (id, updates) => set((state) => ({
        dailyReports: state.dailyReports.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      
      getDailyReportById: (id) => get().dailyReports.find((r) => r.id === id),
      
      getDailyReportByDate: (date) => {
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return get().dailyReports.find((r) => {
          const reportDate = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate());
          return reportDate.getTime() === targetDate.getTime();
        });
      },
      
      updateCurrentTime: () => set({ currentTime: new Date() }),
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      resetStore: () => set(getInitialState()),

      getPersonnelById: (id) => get().personnel.find((p) => p.id === id),
      
      getAreaById: (id) => get().areas.find((a) => a.id === id),
      
      getRiskPointById: (id) => get().riskPoints.find((r) => r.id === id),
      
      getPatrolRouteById: (id) => get().patrolRoutes.find((r) => r.id === id),
      
      getNearbyPersonnel: (x, y, radius) => {
        return get().personnel.filter((p) => {
          const distance = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
          return distance <= radius && p.status === 'on-duty';
        });
      },
      
      getIncidentDispatches: (incidentId) => get().incidentDispatches.filter((d) => d.incidentId === incidentId),
      
      getIncidentRecords: (incidentId) => get().incidentRecords.filter((r) => r.incidentId === incidentId).sort((a, b) => a.time.getTime() - b.time.getTime()),
      
      getIntercomLogsByIncident: (incidentId) => get().intercomLogs.filter((l) => l.incidentId === incidentId).sort((a, b) => a.time.getTime() - b.time.getTime()),
      
      getPersonnelAttendance: (personnelId) => get().attendance.filter((a) => a.personnelId === personnelId).sort((a, b) => b.checkinTime.getTime() - a.checkinTime.getTime()),
      
      getTaskCheckins: (taskId) => get().patrolCheckins.filter((c) => c.taskId === taskId).sort((a, b) => a.checkinTime.getTime() - b.checkinTime.getTime()),
      
      getUnreadAlerts: () => get().alerts.filter((a) => !a.isRead),
      
      getEquipmentLogsByEquipment: (equipmentId) => get().equipmentLogs.filter((l) => l.equipmentId === equipmentId).sort((a, b) => b.time.getTime() - a.time.getTime()),
      
      getEquipmentById: (id) => get().equipment.find((e) => e.id === id),

      approveEquipmentLog: (id, approverId) => set((state) => {
        const log = state.equipmentLogs.find((l) => l.id === id);
        if (!log || log.status !== 'pending' || log.type !== 'borrow') return state;
        const equipment = state.equipment.find((e) => e.id === log.equipmentId);
        if (!equipment) return state;
        const newAvailable = equipment.available - log.quantity;
        return {
          equipmentLogs: state.equipmentLogs.map((l) => l.id === id ? { ...l, status: 'approved' as const, approverId, approvalTime: new Date() } : l),
          equipment: state.equipment.map((e) => e.id === log.equipmentId ? { ...e, available: newAvailable } : e),
          alerts: newAvailable <= equipment.warningThreshold ? [
            { id: `alert-${Date.now()}`, type: 'equipment', level: 'medium', title: '库存预警', description: `${equipment.name}库存不足，当前仅剩${newAvailable}${equipment.unit}`, time: new Date(), isRead: false, relatedId: equipment.id },
            ...state.alerts,
          ] : state.alerts,
        };
      }),

      rejectEquipmentLog: (id, approverId, reason) => set((state) => ({
        equipmentLogs: state.equipmentLogs.map((l) => l.id === id ? { ...l, status: 'rejected' as const, approverId, approvalTime: new Date(), remark: reason } : l),
      })),

      addStocktakeRecord: (record) => set((state) => ({
        stocktakeRecords: [...state.stocktakeRecords, record],
      })),

      updateStocktakeRecord: (id, updates) => set((state) => ({
        stocktakeRecords: state.stocktakeRecords.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),

      adjustStockAfterStocktake: (recordId) => set((state) => {
        const record = state.stocktakeRecords.find((r) => r.id === recordId);
        if (!record || record.status !== 'pending') return state;
        return {
          equipment: state.equipment.map((e) => e.id === record.equipmentId ? { ...e, available: record.actualQuantity, total: record.actualQuantity + (e.total - e.available) } : e),
          stocktakeRecords: state.stocktakeRecords.map((r) => r.id === recordId ? { ...r, status: 'adjusted' as const } : r),
          equipmentLogs: [...state.equipmentLogs, { id: `log-${Date.now()}`, equipmentId: record.equipmentId, personnelId: record.operatorId, type: 'stocktake' as const, time: new Date(), quantity: record.difference, status: 'completed' as const, remark: record.differenceReason }],
        };
      }),

      transferDangerHandler: (dangerId, fromHandlerId, toHandlerId, operatorId, remark) => set((state) => {
        const transferRecord: DangerTransferRecord = {
          id: `transfer-${Date.now()}`,
          dangerId,
          fromHandlerId,
          toHandlerId,
          transferTime: new Date(),
          remark,
        };
        return {
          hiddenDangers: state.hiddenDangers.map((d) => d.id === dangerId ? {
            ...d,
            handlerId: toHandlerId,
            status: 'processing' as const,
            transferHistory: [...d.transferHistory, transferRecord],
            statusChangeHistory: [...d.statusChangeHistory, { time: new Date(), from: d.status, to: 'processing', operatorId, remark: '改派处理人' }],
          } : d),
        };
      }),

      changeDangerStatus: (dangerId, fromStatus, toStatus, operatorId, remark) => set((state) => ({
        hiddenDangers: state.hiddenDangers.map((d) => d.id === dangerId ? {
          ...d,
          status: toStatus as 'pending' | 'processing' | 'resolved',
          statusChangeHistory: [...d.statusChangeHistory, { time: new Date(), from: fromStatus, to: toStatus, operatorId, remark }],
        } : d),
      })),

      addShiftHandover: (handover) => set((state) => {
        const updates: Partial<Personnel>[] = [
          { id: handover.fromPersonnelId, status: 'off-duty' as const },
          { id: handover.toPersonnelId, status: 'on-duty' as const, areaId: handover.areaIds[0] },
        ];
        const pendingDangerUpdates = handover.pendingDangerIds.map((dangerId) => {
          const danger = state.hiddenDangers.find((d) => d.id === dangerId);
          return danger ? {
            ...danger,
            handlerId: handover.toPersonnelId,
            statusChangeHistory: [...danger.statusChangeHistory, { time: new Date(), from: danger.status, to: danger.status, operatorId: handover.fromPersonnelId, remark: '交接班移交' }],
          } : null;
        }).filter(Boolean) as HiddenDanger[];
        const incidentUpdates = handover.processingIncidentIds.map((incidentId) => {
          const incident = state.incidents.find((i) => i.id === incidentId);
          return incident ? { ...incident, currentHandlerId: handover.toPersonnelId } : null;
        }).filter(Boolean) as Incident[];
        return {
          shiftHandovers: [...state.shiftHandovers, handover],
          personnel: state.personnel.map((p) => {
            const update = updates.find((u) => u.id === p.id);
            return update ? { ...p, ...update } : p;
          }),
          hiddenDangers: state.hiddenDangers.map((d) => {
            const update = pendingDangerUpdates.find((u) => u.id === d.id);
            return update ? update : d;
          }),
          incidents: state.incidents.map((i) => {
            const update = incidentUpdates.find((u) => u.id === i.id);
            return update ? update : i;
          }),
        };
      }),

      getNearbyRiskPoints: (x, y, radius) => {
        return get().riskPoints.filter((p) => {
          const distance = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
          return distance <= radius;
        });
      },

      getEquipmentUsageByIncident: (incidentId) => {
        const dispatches = get().incidentDispatches.filter((d) => d.incidentId === incidentId);
        const personnelIds = dispatches.map((d) => d.personnelId);
        const usage: { equipment: Equipment; quantity: number; handlerName: string }[] = [];
        get().equipmentLogs.filter((l) => l.type === 'borrow' && l.status === 'approved' && personnelIds.includes(l.personnelId)).forEach((log) => {
          const equipment = get().equipment.find((e) => e.id === log.equipmentId);
          const personnel = get().personnel.find((p) => p.id === log.personnelId);
          if (equipment && personnel) {
            usage.push({ equipment, quantity: log.quantity, handlerName: personnel.name });
          }
        });
        return usage;
      },

      getPendingApprovalLogs: () => get().equipmentLogs.filter((l) => l.status === 'pending'),

      getDangersByHandler: (handlerId) => get().hiddenDangers.filter((d) => d.handlerId === handlerId),

      getIncidentsByHandler: (handlerId) => get().incidents.filter((i) => i.currentHandlerId === handlerId),

      generateTimelineEvents: (date) => {
        const events: TimelineEvent[] = [];
        const state = get();
        const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const isSameDay = (d1: Date, d2: Date) => {
          d1 = typeof d1 === 'string' ? new Date(d1) : d1;
          d2 = typeof d2 === 'string' ? new Date(d2) : d2;
          return d1.getFullYear() === d2.getFullYear() &&
                 d1.getMonth() === d2.getMonth() &&
                 d1.getDate() === d2.getDate();
        };

        const todayIncidents = state.incidents.filter(i => isSameDay(i.reportTime, date));
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

        const todayDangers = state.hiddenDangers.filter(d => isSameDay(d.reportTime, date));
        todayDangers.forEach(danger => {
          const point = state.getRiskPointById(danger.pointId);
          events.push({
            id: generateId(),
            time: danger.reportTime,
            title: `隐患: ${danger.title}`,
            description: `${point?.name || '未知点位'} - ${danger.description}`,
            type: 'alert',
            relatedId: danger.id,
          });
        });

        const todayCheckins = state.patrolCheckins.filter(c => isSameDay(c.checkinTime, date));
        todayCheckins.forEach(checkin => {
          const point = state.getRiskPointById(checkin.pointId);
          const person = state.getPersonnelById(state.patrolTasks.find(t => t.id === checkin.taskId)?.personnelId || '');
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

        const todayEquipmentLogs = state.equipmentLogs.filter(l => isSameDay(l.time, date));
        todayEquipmentLogs.slice(0, 5).forEach(log => {
          const equip = state.getEquipmentById(log.equipmentId);
          const person = state.getPersonnelById(log.personnelId);
          events.push({
            id: generateId(),
            time: log.time,
            title: `装备${log.type === 'borrow' ? '领用' : log.type === 'return' ? '归还' : '盘点'}: ${equip?.name || '未知装备'}`,
            description: `${person?.name || '未知人员'} ${log.type === 'borrow' ? '领用' : log.type === 'return' ? '归还' : '盘点'} ${log.quantity}${equip?.unit || ''}`,
            type: 'operation',
            relatedId: log.id,
          });
        });

        const completedTasks = state.patrolTasks.filter(t => t.status === 'completed' && isSameDay(t.endTime, date));
        completedTasks.forEach(task => {
          const route = state.getPatrolRouteById(task.routeId);
          const person = state.getPersonnelById(task.personnelId);
          events.push({
            id: generateId(),
            time: task.endTime,
            title: `巡逻完成: ${route?.name || '未知路线'}`,
            description: `${person?.name || '未知人员'} 完成巡逻任务`,
            type: 'key',
            relatedId: task.id,
          });
        });

        events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        const existingEventTimes = state.timelineEvents
          .filter(e => isSameDay(e.time, date))
          .map(e => new Date(e.time).getTime());

        const newEvents = events.filter(e => !existingEventTimes.some(t => Math.abs(t - new Date(e.time).getTime()) < 60000));

        return newEvents;
      },

      generateDailyReport: (date) => {
        const state = get();
        const isSameDay = (d1: Date, d2: Date) => {
          d1 = typeof d1 === 'string' ? new Date(d1) : d1;
          d2 = typeof d2 === 'string' ? new Date(d2) : d2;
          return d1.getFullYear() === d2.getFullYear() &&
                 d1.getMonth() === d2.getMonth() &&
                 d1.getDate() === d2.getDate();
        };

        const todayAttendance = state.attendance.filter(a => a.type === 'on' && isSameDay(a.checkinTime, date));
        const onDutyPersonnel = state.personnel.filter((p) => p.status === 'on-duty').length;
        const personnelDetails = todayAttendance.map(a => {
          const person = state.getPersonnelById(a.personnelId);
          return {
            personnelId: a.personnelId,
            name: person?.name || '未知',
            checkinTime: a.checkinTime,
            status: person?.status || 'unknown',
          };
        });

        const todayIncidents = state.incidents.filter(i => isSameDay(i.reportTime, date));
        const incidentDetails = todayIncidents.map(i => ({
          id: i.id,
          title: i.title,
          level: i.level,
          status: i.status,
          reportTime: i.reportTime,
          handlerName: i.currentHandlerId ? state.getPersonnelById(i.currentHandlerId)?.name : undefined,
        }));

        const byLevel: Record<IncidentLevel, number> = { red: 0, orange: 0, yellow: 0, blue: 0 };
        todayIncidents.forEach(i => byLevel[i.level]++);

        const keyEvents = todayIncidents
          .filter(i => i.level === 'red' || i.level === 'orange')
          .map(i => `${formatTime(i.reportTime)} - ${i.title}`);

        const todayTasks = state.patrolTasks.filter(t => isSameDay(t.startTime, date));
        const completedTaskCount = todayTasks.filter(t => t.status === 'completed').length;
        const taskDetails = todayTasks.map(t => {
          const route = state.getPatrolRouteById(t.routeId);
          const person = state.getPersonnelById(t.personnelId);
          const checkinCount = state.patrolCheckins.filter(c => c.taskId === t.id).length;
          return {
            id: t.id,
            routeName: route?.name || '未知路线',
            personnelName: person?.name || '未知',
            status: t.status,
            checkinCount,
          };
        });

        const todayCheckins = state.patrolCheckins.filter(c => isSameDay(c.checkinTime, date));
        const abnormalCheckins = todayCheckins.filter(c => c.isAbnormal).length;

        const todayEquipmentLogs = state.equipmentLogs.filter(l => isSameDay(l.time, date));
        const borrowedCount = todayEquipmentLogs.filter(l => l.type === 'borrow').length;
        const returnedCount = todayEquipmentLogs.filter(l => l.type === 'return').length;
        const lowStockItems = state.equipment.filter(e => e.available <= e.warningThreshold);
        const equipmentDetails = todayEquipmentLogs.map(l => {
          const equip = state.getEquipmentById(l.equipmentId);
          const person = state.getPersonnelById(l.personnelId);
          return {
            id: l.id,
            equipmentName: equip?.name || '未知装备',
            type: l.type,
            personnelName: person?.name || '未知',
            quantity: l.quantity,
            time: l.time,
          };
        });

        const todayDangers = state.hiddenDangers.filter(d => isSameDay(d.reportTime, date));
        const dangerDetails = todayDangers.map(d => {
          const point = state.getRiskPointById(d.pointId);
          return {
            id: d.id,
            title: d.title,
            pointName: point?.name || '未知点位',
            status: d.status,
            reportTime: d.reportTime,
          };
        });

        const newTimelineEvents = state.generateTimelineEvents(date);

        const allTodayEvents = [
          ...state.timelineEvents.filter(e => isSameDay(e.time, date)),
          ...newTimelineEvents,
        ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        let summary = `今日活动${todayIncidents.length > 0 ? '整体平稳' : '安全有序'}。`;
        summary += `人员出勤${personnelDetails.length}人，出勤率${((personnelDetails.length / state.personnel.length) * 100).toFixed(1)}%。`;
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
          date,
          generatedAt: new Date(),
          personnelAttendance: {
            total: state.personnel.length,
            onDuty: onDutyPersonnel,
            attendanceRate: Math.round((personnelDetails.length / state.personnel.length) * 1000) / 10,
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
      },

      regenerateDailyReport: (date) => {
        const report = get().generateDailyReport(date);
        const existingReport = get().getDailyReportByDate(date);
        if (existingReport) {
          get().updateDailyReport(existingReport.id, report);
          return { ...existingReport, ...report };
        } else {
          get().addDailyReport(report);
          return report;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        personnel: state.personnel,
        attendance: state.attendance,
        hiddenDangers: state.hiddenDangers,
        patrolRoutes: state.patrolRoutes,
        patrolTasks: state.patrolTasks,
        patrolCheckins: state.patrolCheckins,
        incidents: state.incidents,
        incidentDispatches: state.incidentDispatches,
        incidentRecords: state.incidentRecords,
        intercomLogs: state.intercomLogs,
        equipment: state.equipment,
        equipmentLogs: state.equipmentLogs,
        stocktakeRecords: state.stocktakeRecords,
        shiftHandovers: state.shiftHandovers,
        alerts: state.alerts,
        activityLogs: state.activityLogs,
        timelineEvents: state.timelineEvents,
        dailyReports: state.dailyReports,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.currentTime = new Date();
          state.sidebarCollapsed = false;
          state.personnel = deserializeDates(state.personnel);
          state.attendance = deserializeDates(state.attendance);
          state.hiddenDangers = deserializeDates(state.hiddenDangers);
          state.patrolRoutes = deserializeDates(state.patrolRoutes);
          state.patrolTasks = deserializeDates(state.patrolTasks);
          state.patrolCheckins = deserializeDates(state.patrolCheckins);
          state.incidents = deserializeDates(state.incidents);
          state.incidentDispatches = deserializeDates(state.incidentDispatches);
          state.incidentRecords = deserializeDates(state.incidentRecords);
          state.intercomLogs = deserializeDates(state.intercomLogs);
          state.equipment = deserializeDates(state.equipment);
          state.equipmentLogs = deserializeDates(state.equipmentLogs);
          state.stocktakeRecords = deserializeDates(state.stocktakeRecords);
          state.shiftHandovers = deserializeDates(state.shiftHandovers);
          state.alerts = deserializeDates(state.alerts);
          state.activityLogs = deserializeDates(state.activityLogs);
          state.timelineEvents = deserializeDates(state.timelineEvents);
          state.dailyReports = deserializeDates(state.dailyReports);
        }
      },
    }
  )
);

export const deserializeStoreDates = deserializeDates;
