export interface Personnel {
  id: string;
  name: string;
  phone: string;
  position: string;
  areaId: string;
  status: 'on-duty' | 'off-duty' | 'rest' | 'patrol' | 'dispatched';
  x: number;
  y: number;
  avatar: string;
  equipment?: string[];
}

export interface Attendance {
  id: string;
  personnelId: string;
  checkinTime: Date;
  type: 'on' | 'off';
  location: string;
}

export interface Area {
  id: string;
  name: string;
  color: string;
  type: 'main' | 'entrance' | 'exit' | 'channel' | 'rest' | 'stage' | 'other';
  points: { x: number; y: number }[];
  capacity?: number;
  currentCount?: number;
}

export interface RiskPoint {
  id: string;
  name: string;
  type: 'risk' | 'entrance' | 'exit' | 'cordon' | 'camera';
  level: 'high' | 'medium' | 'low';
  areaId: string;
  x: number;
  y: number;
  description: string;
  status: 'normal' | 'warning' | 'danger';
}

export interface HiddenDanger {
  id: string;
  pointId: string;
  title: string;
  description: string;
  photos: string[];
  reporterId: string;
  reportTime: Date;
  status: 'pending' | 'processing' | 'resolved';
  handlerId?: string;
}

export interface PatrolRoute {
  id: string;
  name: string;
  pointIds: string[];
  estimatedTime: number;
  description?: string;
}

export interface PatrolTask {
  id: string;
  routeId: string;
  personnelId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'abnormal';
  frequency: number;
  currentPointIndex: number;
}

export interface PatrolCheckin {
  id: string;
  taskId: string;
  pointId: string;
  checkinTime: Date;
  photo?: string;
  remark?: string;
  isAbnormal: boolean;
}

export type IncidentLevel = 'red' | 'orange' | 'yellow' | 'blue';

export interface Incident {
  id: string;
  title: string;
  level: IncidentLevel;
  type: string;
  description: string;
  photos: string[];
  x: number;
  y: number;
  reportTime: Date;
  status: 'pending' | 'processing' | 'completed';
  reporterId: string;
  currentHandlerId?: string;
}

export interface IncidentDispatch {
  id: string;
  incidentId: string;
  personnelId: string;
  dispatchTime: Date;
  status: 'dispatched' | 'accepted' | 'arrived' | 'completed';
  arriveTime?: Date;
  completeTime?: Date;
}

export interface IncidentRecord {
  id: string;
  incidentId: string;
  time: Date;
  content: string;
  operatorId: string;
  type: 'report' | 'dispatch' | 'update' | 'complete';
}

export interface IntercomLog {
  id: string;
  incidentId?: string;
  fromId: string;
  toId: string;
  time: Date;
  content: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  model: string;
  total: number;
  available: number;
  unit: string;
  warningThreshold: number;
  location: string;
}

export interface EquipmentLog {
  id: string;
  equipmentId: string;
  personnelId: string;
  type: 'borrow' | 'return';
  time: Date;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
}

export interface Alert {
  id: string;
  type: 'gathering' | 'incident' | 'equipment' | 'personnel' | 'patrol';
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time: Date;
  isRead: boolean;
  relatedId?: string;
}

export interface ActivityLog {
  id: string;
  type: 'incident' | 'attendance' | 'patrol' | 'equipment' | 'alert';
  title: string;
  description: string;
  time: Date;
  relatedId?: string;
}

export interface TimelineEvent {
  id: string;
  time: Date;
  title: string;
  description: string;
  type: 'key' | 'incident' | 'operation' | 'alert';
  relatedId?: string;
  photos?: string[];
}

export interface DailyReport {
  id: string;
  date: Date;
  personnelAttendance: {
    total: number;
    onDuty: number;
    attendanceRate: number;
  };
  incidents: {
    total: number;
    completed: number;
    byLevel: Record<IncidentLevel, number>;
  };
  patrols: {
    total: number;
    completed: number;
    completionRate: number;
  };
  equipment: {
    borrowed: number;
    returned: number;
    lowStock: number;
  };
  summary: string;
}

export interface MapPoint {
  x: number;
  y: number;
}
