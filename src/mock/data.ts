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

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const mockPersonnel: Personnel[] = [
  { id: 'p1', name: '张伟', phone: '13800138001', position: '安保队长', areaId: 'a1', status: 'on-duty', x: 450, y: 300, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: 'p2', name: '李强', phone: '13800138002', position: '安保队员', areaId: 'a1', status: 'patrol', x: 350, y: 400, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: 'p3', name: '王勇', phone: '13800138003', position: '安保队员', areaId: 'a2', status: 'on-duty', x: 600, y: 250, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { id: 'p4', name: '刘洋', phone: '13800138004', position: '安保队员', areaId: 'a2', status: 'dispatched', x: 550, y: 350, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { id: 'p5', name: '陈军', phone: '13800138005', position: '安保队员', areaId: 'a3', status: 'on-duty', x: 250, y: 200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
  { id: 'p6', name: '赵磊', phone: '13800138006', position: '安保队员', areaId: 'a3', status: 'rest', x: 700, y: 450, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6' },
  { id: 'p7', name: '孙涛', phone: '13800138007', position: '安保队员', areaId: 'a4', status: 'patrol', x: 400, y: 150, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7' },
  { id: 'p8', name: '周杰', phone: '13800138008', position: '安保队员', areaId: 'a4', status: 'on-duty', x: 500, y: 500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8' },
  { id: 'p9', name: '吴鹏', phone: '13800138009', position: '安检员', areaId: 'a5', status: 'on-duty', x: 150, y: 300, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9' },
  { id: 'p10', name: '郑浩', phone: '13800138010', position: '安检员', areaId: 'a5', status: 'on-duty', x: 750, y: 300, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10' },
  { id: 'p11', name: '马超', phone: '13800138011', position: '巡逻组长', areaId: 'a1', status: 'on-duty', x: 480, y: 280, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11' },
  { id: 'p12', name: '林峰', phone: '13800138012', position: '安保队员', areaId: 'a6', status: 'off-duty', x: 300, y: 350, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=12' },
];

export const mockAreas: Area[] = [
  { id: 'a1', name: '主会场', color: '#1E40AF', type: 'main', capacity: 5000, currentCount: 3200,
    points: [{x: 300, y: 150}, {x: 600, y: 150}, {x: 650, y: 350}, {x: 550, y: 450}, {x: 350, y: 450}, {x: 250, y: 350}] },
  { id: 'a2', name: '东侧展区', color: '#059669', type: 'other', capacity: 2000, currentCount: 1500,
    points: [{x: 600, y: 100}, {x: 800, y: 100}, {x: 800, y: 400}, {x: 650, y: 350}, {x: 600, y: 150}] },
  { id: 'a3', name: '西侧展区', color: '#D97706', type: 'other', capacity: 2000, currentCount: 1800,
    points: [{x: 100, y: 100}, {x: 300, y: 100}, {x: 300, y: 150}, {x: 250, y: 350}, {x: 100, y: 400}] },
  { id: 'a4', name: '中央通道', color: '#7C3AED', type: 'channel', capacity: 500, currentCount: 200,
    points: [{x: 350, y: 450}, {x: 550, y: 450}, {x: 550, y: 550}, {x: 350, y: 550}] },
  { id: 'a5', name: '主入口', color: '#DC2626', type: 'entrance', capacity: 300, currentCount: 50,
    points: [{x: 50, y: 250}, {x: 150, y: 250}, {x: 150, y: 350}, {x: 50, y: 350}] },
  { id: 'a6', name: '休息区', color: '#0891B2', type: 'rest', capacity: 500, currentCount: 150,
    points: [{x: 600, y: 450}, {x: 800, y: 450}, {x: 800, y: 550}, {x: 550, y: 550}, {x: 550, y: 450}] },
];

export const mockRiskPoints: RiskPoint[] = [
  { id: 'rp1', name: '主入口安检', type: 'entrance', level: 'high', areaId: 'a5', x: 100, y: 300, description: '人员密集，需重点监控', status: 'normal' },
  { id: 'rp2', name: '舞台左侧', type: 'risk', level: 'high', areaId: 'a1', x: 380, y: 200, description: '视线盲区，容易发生拥挤', status: 'warning' },
  { id: 'rp3', name: '舞台右侧', type: 'risk', level: 'high', areaId: 'a1', x: 520, y: 200, description: '视线盲区，容易发生拥挤', status: 'normal' },
  { id: 'rp4', name: '东出入口', type: 'exit', level: 'medium', areaId: 'a2', x: 780, y: 250, description: '紧急疏散通道', status: 'normal' },
  { id: 'rp5', name: '西出入口', type: 'exit', level: 'medium', areaId: 'a3', x: 120, y: 250, description: '紧急疏散通道', status: 'normal' },
  { id: 'rp6', name: '中央警戒线', type: 'cordon', level: 'medium', areaId: 'a1', x: 450, y: 300, description: 'VIP区域警戒线', status: 'normal' },
  { id: 'rp7', name: '监控点1', type: 'camera', level: 'low', areaId: 'a1', x: 450, y: 160, description: '主会场全景监控', status: 'normal' },
  { id: 'rp8', name: '监控点2', type: 'camera', level: 'low', areaId: 'a2', x: 700, y: 200, description: '东侧展区监控', status: 'normal' },
  { id: 'rp9', name: '监控点3', type: 'camera', level: 'low', areaId: 'a3', x: 200, y: 200, description: '西侧展区监控', status: 'normal' },
  { id: 'rp10', name: '电器设备间', type: 'risk', level: 'high', areaId: 'a6', x: 700, y: 500, description: '存在火灾隐患', status: 'danger' },
];

export const mockHiddenDangers: HiddenDanger[] = [
  { id: 'hd1', pointId: 'rp10', title: '电线裸露', description: '设备间门口有电线裸露，存在安全隐患', photos: [], reporterId: 'p3', reportTime: new Date(now.getTime() - 3600000), status: 'processing', handlerId: 'p1' },
  { id: 'hd2', pointId: 'rp2', title: '护栏松动', description: '舞台左侧护栏有轻微松动', photos: [], reporterId: 'p2', reportTime: new Date(now.getTime() - 7200000), status: 'resolved', handlerId: 'p5' },
  { id: 'hd3', pointId: 'rp1', title: '安检设备故障', description: '2号安检机偶尔卡顿', photos: [], reporterId: 'p9', reportTime: new Date(now.getTime() - 1800000), status: 'pending' },
];

export const mockPatrolRoutes: PatrolRoute[] = [
  { id: 'pr1', name: '主会场内环巡逻', pointIds: ['rp2', 'rp3', 'rp6', 'rp7'], estimatedTime: 30, description: '主会场内部重点区域巡逻' },
  { id: 'pr2', name: '外围巡逻路线', pointIds: ['rp1', 'rp5', 'rp9', 'rp4', 'rp8'], estimatedTime: 45, description: '场馆外围及出入口巡逻' },
  { id: 'pr3', name: '展区巡逻', pointIds: ['rp8', 'rp4', 'rp10', 'rp5', 'rp9'], estimatedTime: 40, description: '东西展区联合巡逻' },
];

export const mockPatrolTasks: PatrolTask[] = [
  { id: 'pt1', routeId: 'pr1', personnelId: 'p2', startTime: new Date(now.getTime() - 1800000), endTime: new Date(now.getTime() + 1800000), status: 'in-progress', frequency: 2, currentPointIndex: 1 },
  { id: 'pt2', routeId: 'pr2', personnelId: 'p7', startTime: new Date(now.getTime() - 3600000), endTime: new Date(now.getTime() - 900000), status: 'completed', frequency: 1, currentPointIndex: 5 },
  { id: 'pt3', routeId: 'pr3', personnelId: 'p6', startTime: new Date(now.getTime() + 3600000), endTime: new Date(now.getTime() + 7200000), status: 'pending', frequency: 1, currentPointIndex: 0 },
  { id: 'pt4', routeId: 'pr1', personnelId: 'p3', startTime: new Date(now.getTime() - 2700000), endTime: new Date(now.getTime() + 900000), status: 'in-progress', frequency: 2, currentPointIndex: 2 },
];

export const mockPatrolCheckins: PatrolCheckin[] = [
  { id: 'pc1', taskId: 'pt1', pointId: 'rp2', checkinTime: new Date(now.getTime() - 1500000), isAbnormal: false, remark: '一切正常' },
  { id: 'pc2', taskId: 'pt1', pointId: 'rp3', checkinTime: new Date(now.getTime() - 900000), isAbnormal: false },
  { id: 'pc3', taskId: 'pt2', pointId: 'rp1', checkinTime: new Date(now.getTime() - 3300000), isAbnormal: false },
  { id: 'pc4', taskId: 'pt2', pointId: 'rp5', checkinTime: new Date(now.getTime() - 2700000), isAbnormal: true, remark: '发现可疑人员，已上报' },
  { id: 'pc5', taskId: 'pt2', pointId: 'rp9', checkinTime: new Date(now.getTime() - 2100000), isAbnormal: false },
  { id: 'pc6', taskId: 'pt2', pointId: 'rp4', checkinTime: new Date(now.getTime() - 1500000), isAbnormal: false },
  { id: 'pc7', taskId: 'pt2', pointId: 'rp8', checkinTime: new Date(now.getTime() - 1000000), isAbnormal: false },
  { id: 'pc8', taskId: 'pt4', pointId: 'rp2', checkinTime: new Date(now.getTime() - 2400000), isAbnormal: false },
  { id: 'pc9', taskId: 'pt4', pointId: 'rp3', checkinTime: new Date(now.getTime() - 1800000), isAbnormal: false },
  { id: 'pc10', taskId: 'pt4', pointId: 'rp6', checkinTime: new Date(now.getTime() - 1200000), isAbnormal: false },
];

export const mockIncidents: Incident[] = [
  { id: 'i1', title: '观众突发疾病', level: 'red', type: '医疗急救', description: '主会场观众席有观众突发心脏病，需紧急医疗援助', photos: [], x: 420, y: 350, reportTime: new Date(now.getTime() - 600000), status: 'processing', reporterId: 'p2', currentHandlerId: 'p4' },
  { id: 'i2', title: '人群聚集拥挤', level: 'orange', type: '秩序维护', description: '东出入口附近人群聚集，存在拥挤风险', photos: [], x: 750, y: 280, reportTime: new Date(now.getTime() - 1200000), status: 'processing', reporterId: 'p8', currentHandlerId: 'p3' },
  { id: 'i3', title: '儿童走失', level: 'yellow', type: '寻人', description: '一名5岁男孩在西侧展区与家长走失', photos: [], x: 200, y: 300, reportTime: new Date(now.getTime() - 1800000), status: 'completed', reporterId: 'p5', currentHandlerId: 'p5' },
  { id: 'i4', title: '物品遗失', level: 'blue', type: '失物招领', description: '观众遗失黑色背包一个，内有重要物品', photos: [], x: 500, y: 380, reportTime: new Date(now.getTime() - 2400000), status: 'completed', reporterId: 'p1', currentHandlerId: 'p1' },
  { id: 'i5', title: '设备故障', level: 'yellow', type: '设施故障', description: '休息区空调故障，温度过高', photos: [], x: 680, y: 480, reportTime: new Date(now.getTime() - 300000), status: 'pending', reporterId: 'p6' },
];

export const mockIncidentDispatches: IncidentDispatch[] = [
  { id: 'id1', incidentId: 'i1', personnelId: 'p4', dispatchTime: new Date(now.getTime() - 580000), status: 'arrived', arriveTime: new Date(now.getTime() - 500000) },
  { id: 'id2', incidentId: 'i2', personnelId: 'p3', dispatchTime: new Date(now.getTime() - 1150000), status: 'accepted', arriveTime: new Date(now.getTime() - 1080000) },
  { id: 'id3', incidentId: 'i3', personnelId: 'p5', dispatchTime: new Date(now.getTime() - 1750000), status: 'completed', arriveTime: new Date(now.getTime() - 1680000), completeTime: new Date(now.getTime() - 900000) },
];

export const mockIncidentRecords: IncidentRecord[] = [
  { id: 'ir1', incidentId: 'i1', time: new Date(now.getTime() - 600000), content: '接到观众突发疾病报告', operatorId: 'p2', type: 'report' },
  { id: 'ir2', incidentId: 'i1', time: new Date(now.getTime() - 580000), content: '调度队员刘洋前往处置', operatorId: 'p1', type: 'dispatch' },
  { id: 'ir3', incidentId: 'i1', time: new Date(now.getTime() - 500000), content: '已到达现场，正在联系急救', operatorId: 'p4', type: 'update' },
  { id: 'ir4', incidentId: 'i2', time: new Date(now.getTime() - 1200000), content: '发现东出入口人群聚集', operatorId: 'p8', type: 'report' },
  { id: 'ir5', incidentId: 'i2', time: new Date(now.getTime() - 1150000), content: '调度队员王勇前往疏散', operatorId: 'p1', type: 'dispatch' },
  { id: 'ir6', incidentId: 'i3', time: new Date(now.getTime() - 1800000), content: '接到儿童走失报警', operatorId: 'p5', type: 'report' },
  { id: 'ir7', incidentId: 'i3', time: new Date(now.getTime() - 900000), content: '已找到儿童，与家长团聚', operatorId: 'p5', type: 'complete' },
];

export const mockIntercomLogs: IntercomLog[] = [
  { id: 'il1', incidentId: 'i1', fromId: 'p1', toId: 'p4', time: new Date(now.getTime() - 550000), content: '刘洋，尽快赶到主会场观众席，有观众突发疾病' },
  { id: 'il2', incidentId: 'i1', fromId: 'p4', toId: 'p1', time: new Date(now.getTime() - 520000), content: '收到，正在赶往现场' },
  { id: 'il3', incidentId: 'i1', fromId: 'p4', toId: 'p1', time: new Date(now.getTime() - 480000), content: '已到达，患者意识清醒，已联系120' },
  { id: 'il4', incidentId: 'i2', fromId: 'p1', toId: 'p3', time: new Date(now.getTime() - 1130000), content: '王勇，东出入口人群聚集，去协助疏散' },
  { id: 'il5', incidentId: 'i2', fromId: 'p3', toId: 'p1', time: new Date(now.getTime() - 1100000), content: '明白，已通知附近2名队员配合' },
  { id: 'il6', fromId: 'p1', toId: 'p2', time: new Date(now.getTime() - 2000000), content: '巡逻情况正常吗？' },
  { id: 'il7', fromId: 'p2', toId: 'p1', time: new Date(now.getTime() - 1980000), content: '正常，刚完成左侧舞台检查' },
];

export const mockEquipment: Equipment[] = [
  { id: 'e1', name: '对讲机', category: '通讯设备', model: 'Motorola GP328D', total: 30, available: 18, unit: '台', warningThreshold: 5, location: '装备室A区' },
  { id: 'e2', name: '防暴盾牌', category: '防暴装备', model: 'FD-S001', total: 20, available: 15, unit: '面', warningThreshold: 3, location: '装备室B区' },
  { id: 'e3', name: '警棍', category: '防暴装备', model: 'JG-001', total: 50, available: 42, unit: '根', warningThreshold: 10, location: '装备室B区' },
  { id: 'e4', name: '强光手电', category: '照明设备', model: 'SD-2000', total: 40, available: 3, unit: '把', warningThreshold: 10, location: '装备室A区' },
  { id: 'e5', name: '急救包', category: '医疗物资', model: 'JJB-003', total: 25, available: 20, unit: '个', warningThreshold: 5, location: '医疗点' },
  { id: 'e6', name: '隔离带', category: '安防设施', model: 'GLD-100', total: 100, available: 85, unit: '米', warningThreshold: 20, location: '装备室C区' },
  { id: 'e7', name: '喊话器', category: '通讯设备', model: 'HHQ-50W', total: 15, available: 12, unit: '个', warningThreshold: 3, location: '装备室A区' },
  { id: 'e8', name: '金属探测仪', category: '安检设备', model: 'MD-3003B1', total: 10, available: 7, unit: '台', warningThreshold: 2, location: '安检处' },
];

export const mockEquipmentLogs: EquipmentLog[] = [
  { id: 'el1', equipmentId: 'e1', personnelId: 'p2', type: 'borrow', time: new Date(now.getTime() - 28800000), quantity: 1, status: 'completed' },
  { id: 'el2', equipmentId: 'e1', personnelId: 'p3', type: 'borrow', time: new Date(now.getTime() - 28800000), quantity: 1, status: 'completed' },
  { id: 'el3', equipmentId: 'e2', personnelId: 'p4', type: 'borrow', time: new Date(now.getTime() - 28800000), quantity: 1, status: 'completed' },
  { id: 'el4', equipmentId: 'e4', personnelId: 'p5', type: 'borrow', time: new Date(now.getTime() - 14400000), quantity: 2, status: 'pending' },
  { id: 'el5', equipmentId: 'e1', personnelId: 'p6', type: 'return', time: new Date(now.getTime() - 7200000), quantity: 1, status: 'completed' },
  { id: 'el6', equipmentId: 'e5', personnelId: 'p4', type: 'borrow', time: new Date(now.getTime() - 3600000), quantity: 1, status: 'completed', remark: '处理急救事件' },
];

export const mockAlerts: Alert[] = [
  { id: 'a1', type: 'gathering', level: 'high', title: '异常聚集告警', description: '东出入口人群密度超过阈值，当前人数约300人', time: new Date(now.getTime() - 1200000), isRead: false, relatedId: 'i2' },
  { id: 'a2', type: 'equipment', level: 'medium', title: '物资库存告警', description: '强光手电库存不足，当前仅剩3把', time: new Date(now.getTime() - 1800000), isRead: false, relatedId: 'e4' },
  { id: 'a3', type: 'incident', level: 'high', title: '紧急事件告警', description: '主会场发生医疗急救事件，需立即处置', time: new Date(now.getTime() - 600000), isRead: true, relatedId: 'i1' },
  { id: 'a4', type: 'patrol', level: 'low', title: '巡逻异常提醒', description: '巡逻任务pt2发现可疑人员，已上报处理', time: new Date(now.getTime() - 2700000), isRead: true, relatedId: 'pt2' },
  { id: 'a5', type: 'personnel', level: 'medium', title: '人员离岗提醒', description: '队员林峰已离岗超过30分钟', time: new Date(now.getTime() - 5400000), isRead: true, relatedId: 'p12' },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'al1', type: 'incident', title: '新增紧急事件', description: '观众突发疾病 - 红色预警', time: new Date(now.getTime() - 600000), relatedId: 'i1' },
  { id: 'al2', type: 'attendance', title: '人员签到', description: '王勇 上岗签到', time: new Date(now.getTime() - 900000), relatedId: 'p3' },
  { id: 'al3', type: 'patrol', title: '巡逻完成', description: '外围巡逻路线已完成', time: new Date(now.getTime() - 900000), relatedId: 'pt2' },
  { id: 'al4', type: 'equipment', title: '装备领用', description: '刘洋 领用急救包1个', time: new Date(now.getTime() - 3600000), relatedId: 'el6' },
  { id: 'al5', type: 'incident', title: '事件处置完成', description: '儿童走失事件已解决', time: new Date(now.getTime() - 900000), relatedId: 'i3' },
  { id: 'al6', type: 'alert', title: '告警触发', description: '东出入口异常聚集告警', time: new Date(now.getTime() - 1200000), relatedId: 'a1' },
  { id: 'al7', type: 'attendance', title: '人员签到', description: '陈军 上岗签到', time: new Date(now.getTime() - 1500000), relatedId: 'p5' },
  { id: 'al8', type: 'patrol', title: '巡逻打卡', description: '李强 在舞台右侧打卡', time: new Date(now.getTime() - 900000), relatedId: 'pc2' },
];

export const mockTimelineEvents: TimelineEvent[] = [
  { id: 'te1', time: new Date(today.getTime() + 8 * 3600000), title: '活动开始', description: '安保人员全部到岗，设备检查完成', type: 'key' },
  { id: 'te2', time: new Date(today.getTime() + 8 * 3600000 + 1800000), title: '观众入场开始', description: '主入口开放，观众有序入场', type: 'key' },
  { id: 'te3', time: new Date(today.getTime() + 9 * 3600000), title: '发现隐患', description: '设备间电线裸露，已登记处理', type: 'alert', relatedId: 'hd1' },
  { id: 'te4', time: new Date(today.getTime() + 10 * 3600000), title: '儿童走失事件', description: '接到报警，15分钟后成功找到', type: 'incident', relatedId: 'i3' },
  { id: 'te5', time: new Date(today.getTime() + 11 * 3600000), title: '东出入口聚集', description: '人群密度超标，已派人员疏散', type: 'incident', relatedId: 'i2' },
  { id: 'te6', time: new Date(today.getTime() + 12 * 3600000), title: '医疗急救事件', description: '观众突发疾病，已联系急救', type: 'incident', relatedId: 'i1' },
  { id: 'te7', time: new Date(today.getTime() + 12 * 3600000 + 1800000), title: '午间休息', description: '人员换班休息，物资补充', type: 'key' },
];

export const mockDailyReports: DailyReport[] = [
  {
    id: 'dr1',
    date: today,
    personnelAttendance: { total: 12, onDuty: 10, attendanceRate: 95.2 },
    incidents: { total: 5, completed: 2, byLevel: { red: 1, orange: 1, yellow: 2, blue: 1 } },
    patrols: { total: 4, completed: 1, completionRate: 75 },
    equipment: { borrowed: 6, returned: 1, lowStock: 1 },
    summary: '今日活动整体平稳，发生5起事件，其中2起已处置完成。主要问题集中在东出入口人群聚集和医疗急救事件，需要加强重点区域人员部署。物资方面强光手电库存不足，需及时补充。',
  },
  {
    id: 'dr2',
    date: new Date(today.getTime() - 86400000),
    personnelAttendance: { total: 12, onDuty: 11, attendanceRate: 98.5 },
    incidents: { total: 3, completed: 3, byLevel: { red: 0, orange: 1, yellow: 1, blue: 1 } },
    patrols: { total: 6, completed: 6, completionRate: 100 },
    equipment: { borrowed: 8, returned: 7, lowStock: 0 },
    summary: '昨日演练活动顺利完成，所有事件均妥善处置。巡逻任务100%完成，物资领用归还有序。',
  },
];

export const mockAttendance: Attendance[] = [
  { id: 'att1', personnelId: 'p1', checkinTime: new Date(today.getTime() + 7 * 3600000), type: 'on', location: '指挥中心' },
  { id: 'att2', personnelId: 'p2', checkinTime: new Date(today.getTime() + 7 * 3600000 + 300000), type: 'on', location: '主会场' },
  { id: 'att3', personnelId: 'p3', checkinTime: new Date(today.getTime() + 7 * 3600000 + 600000), type: 'on', location: '东侧展区' },
  { id: 'att4', personnelId: 'p4', checkinTime: new Date(today.getTime() + 7 * 3600000 + 900000), type: 'on', location: '东侧展区' },
  { id: 'att5', personnelId: 'p5', checkinTime: new Date(today.getTime() + 7 * 3600000 + 1200000), type: 'on', location: '西侧展区' },
  { id: 'att6', personnelId: 'p7', checkinTime: new Date(today.getTime() + 7 * 3600000 + 1500000), type: 'on', location: '西侧展区' },
  { id: 'att7', personnelId: 'p8', checkinTime: new Date(today.getTime() + 7 * 3600000 + 1800000), type: 'on', location: '中央通道' },
  { id: 'att8', personnelId: 'p9', checkinTime: new Date(today.getTime() + 7 * 3600000 + 2100000), type: 'on', location: '主入口' },
  { id: 'att9', personnelId: 'p10', checkinTime: new Date(today.getTime() + 7 * 3600000 + 2400000), type: 'on', location: '主入口' },
  { id: 'att10', personnelId: 'p11', checkinTime: new Date(today.getTime() + 7 * 3600000 + 2700000), type: 'on', location: '主会场' },
  { id: 'att11', personnelId: 'p6', checkinTime: new Date(today.getTime() + 11 * 3600000), type: 'off', location: '休息区' },
  { id: 'att12', personnelId: 'p12', checkinTime: new Date(today.getTime() + 6 * 3600000), type: 'on', location: '休息区' },
  { id: 'att13', personnelId: 'p12', checkinTime: new Date(today.getTime() + 11 * 3600000), type: 'off', location: '休息区' },
];
