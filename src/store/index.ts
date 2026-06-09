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
} from '@/types';
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
  mockAlerts,
  mockActivityLogs,
  mockTimelineEvents,
  mockDailyReports,
} from '@/mock/data';

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
  markAlertRead: (id: string) => void;
  addAlert: (alert: Alert) => void;
  addActivityLog: (log: ActivityLog) => void;
  addHiddenDanger: (danger: HiddenDanger) => void;
  updateHiddenDanger: (id: string, updates: Partial<HiddenDanger>) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  updateCurrentTime: () => void;
  toggleSidebar: () => void;
  getPersonnelById: (id: string) => Personnel | undefined;
  getAreaById: (id: string) => Area | undefined;
  getRiskPointById: (id: string) => RiskPoint | undefined;
  getPatrolRouteById: (id: string) => PatrolRoute | undefined;
  getNearbyPersonnel: (x: number, y: number, radius: number) => Personnel[];
  getIncidentDispatches: (incidentId: string) => IncidentDispatch[];
  getIncidentRecords: (incidentId: string) => IncidentRecord[];
  getIntercomLogsByIncident: (incidentId: string) => IntercomLog[];
  getPersonnelAttendance: (personnelId: string) => Attendance[];
  getTaskCheckins: (taskId: string) => PatrolCheckin[];
  getUnreadAlerts: () => Alert[];
  getEquipmentLogsByEquipment: (equipmentId: string) => EquipmentLog[];
  getEquipmentById: (id: string) => Equipment | undefined;
  addPatrolRoute: (route: PatrolRoute) => void;
  addDailyReport: (report: DailyReport) => void;
  updateDailyReport: (id: string, updates: Partial<DailyReport>) => void;
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
