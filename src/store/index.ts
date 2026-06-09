import { create } from 'zustand';
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
}

export const useAppStore = create<AppState>((set, get) => ({
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
  
  updateCurrentTime: () => set({ currentTime: new Date() }),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

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
}));
