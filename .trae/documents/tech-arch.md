## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["React Router DOM (路由)"]
        C["Zustand (状态管理)"]
        D["TailwindCSS (样式)"]
        E["Lucide React (图标)"]
        F["Recharts (图表)"]
    end

    subgraph "业务层"
        G["页面组件 (7个页面)"]
        H["公共组件 (布局/表格/卡片等)"]
        I["自定义 Hooks"]
        J["工具函数"]
    end

    subgraph "数据层"
        K["Mock 数据 (JSON/TS)"]
        L["类型定义 (TypeScript)"]
        M["Store (Zustand)"]
    end

    A --> G
    B --> G
    C --> M
    D --> G
    D --> H
    E --> H
    F --> G
    G --> M
    H --> M
    I --> M
    J --> K
    M --> K
    L --> G
    L --> M
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript@5 + Vite@5
- **初始化工具**：vite-init
- **路由管理**：react-router-dom@6
- **状态管理**：zustand@4
- **UI 样式**：tailwindcss@3 + postcss + autoprefixer
- **图标库**：lucide-react@0.294
- **图表库**：recharts@2.10
- **后端**：无（纯前端应用，使用 Mock 数据）
- **数据存储**：LocalStorage 持久化 + 内存 Mock 数据

## 3. 路由定义

| 路由路径 | 页面名称 | 说明 |
|-------|---------|------|
| / | 总览大屏 | 系统首页，全局态势监控 |
| /personnel | 人员管理 | 安保人员信息与签到管理 |
| /risk-points | 风险点位 | 会场区域与风险点位管理 |
| /patrol | 巡逻任务 | 巡逻路线制定与任务跟踪 |
| /incidents | 事件处置 | 事件上报、调度与处置 |
| /equipment | 物资装备 | 装备台账与领用归还 |
| /review | 复盘报告 | 活动复盘与日报生成 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PERSONNEL ||--o{ ATTENDANCE : "签到"
    PERSONNEL ||--o{ PATROL_TASK : "执行"
    PERSONNEL ||--o{ INCIDENT_DISPATCH : "调度"
    PERSONNEL ||--o{ EQUIPMENT_LOG : "领用"
    AREA ||--o{ RISK_POINT : "包含"
    AREA ||--o{ PATROL_ROUTE : "途经"
    PATROL_ROUTE ||--o{ PATROL_TASK : "生成"
    PATROL_TASK ||--o{ PATROL_CHECKIN : "打卡"
    INCIDENT ||--o{ INCIDENT_DISPATCH : "派单"
    INCIDENT ||--o{ INCIDENT_RECORD : "处置记录"
    INCIDENT ||--o{ INTERCOM_LOG : "对讲"
    EQUIPMENT ||--o{ EQUIPMENT_LOG : "出入库"

    PERSONNEL {
        string id "人员ID"
        string name "姓名"
        string phone "电话"
        string position "职位"
        string areaId "所属区域"
        string status "状态：在岗/离岗/休息"
        number x "地图X坐标"
        number y "地图Y坐标"
        string avatar "头像"
    }

    ATTENDANCE {
        string id "记录ID"
        string personnelId "人员ID"
        datetime checkinTime "签到时间"
        string type "签到类型：上岗/下岗"
        string location "签到地点"
    }

    AREA {
        string id "区域ID"
        string name "区域名称"
        string color "标注颜色"
        string type "类型：主会场/出入口/通道等"
        number[] points "区域边界点坐标"
    }

    RISK_POINT {
        string id "点位ID"
        string name "点位名称"
        string type "类型：风险点/出入口/警戒线"
        string level "风险等级：高/中/低"
        string areaId "所属区域"
        number x "X坐标"
        number y "Y坐标"
        string description "描述"
    }

    PATROL_ROUTE {
        string id "路线ID"
        string name "路线名称"
        string[] pointIds "途经点位ID列表"
        number estimatedTime "预计时长(分钟)"
    }

    PATROL_TASK {
        string id "任务ID"
        string routeId "路线ID"
        string personnelId "人员ID"
        datetime startTime "开始时间"
        datetime endTime "结束时间"
        string status "状态：待执行/进行中/已完成/异常"
        number frequency "巡查频次"
    }

    PATROL_CHECKIN {
        string id "打卡ID"
        string taskId "任务ID"
        string pointId "点位ID"
        datetime checkinTime "打卡时间"
        string photo "现场照片"
        string remark "备注"
    }

    INCIDENT {
        string id "事件ID"
        string title "事件标题"
        string level "级别：红/橙/黄/蓝"
        string type "事件类型"
        string description "描述"
        string[] photos "现场照片"
        number x "发生地点X"
        number y "发生地点Y"
        datetime reportTime "上报时间"
        string status "状态：待处置/处置中/已完成"
        string reporterId "上报人ID"
    }

    INCIDENT_DISPATCH {
        string id "调度ID"
        string incidentId "事件ID"
        string personnelId "调度人员ID"
        datetime dispatchTime "调度时间"
        string status "状态：已派单/已接收/已到达/已完成"
    }

    INCIDENT_RECORD {
        string id "记录ID"
        string incidentId "事件ID"
        datetime time "时间"
        string content "处置内容"
        string operatorId "操作人ID"
    }

    INTERCOM_LOG {
        string id "记录ID"
        string incidentId "关联事件ID"
        string fromId "发话人ID"
        string toId "接收人ID"
        datetime time "时间"
        string content "通话内容"
    }

    EQUIPMENT {
        string id "装备ID"
        string name "装备名称"
        string category "分类"
        string model "型号"
        number total "总数"
        number available "可用数量"
        string unit "单位"
        number warningThreshold "预警阈值"
    }

    EQUIPMENT_LOG {
        string id "记录ID"
        string equipmentId "装备ID"
        string personnelId "人员ID"
        string type "类型：领用/归还"
        datetime time "时间"
        number quantity "数量"
        string status "状态"
    }
```

### 4.2 目录结构

```
src/
├── components/          # 公共组件
│   ├── Layout/         # 布局组件
│   ├── Card/           # 卡片组件
│   ├── Table/          # 表格组件
│   ├── Map/            # 地图组件
│   ├── Modal/          # 弹窗组件
│   └── Chart/          # 图表组件
├── pages/              # 页面组件
│   ├── Dashboard/      # 总览大屏
│   ├── Personnel/      # 人员管理
│   ├── RiskPoints/     # 风险点位
│   ├── Patrol/         # 巡逻任务
│   ├── Incidents/      # 事件处置
│   ├── Equipment/      # 物资装备
│   └── Review/         # 复盘报告
├── store/              # Zustand 状态管理
│   ├── usePersonnelStore.ts
│   ├── useIncidentStore.ts
│   └── ...
├── types/              # TypeScript 类型定义
│   └── index.ts
├── mock/               # Mock 数据
│   └── data.ts
├── utils/              # 工具函数
│   ├── date.ts
│   └── map.ts
├── hooks/              # 自定义 Hooks
│   └── useRealtime.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 5. 核心技术方案

### 5.1 地图可视化方案

- 使用 SVG + React 实现可交互的会场平面图
- 支持缩放、平移、点位标记、区域高亮
- 人员位置实时更新动画
- 巡逻路线流动效果

### 5.2 实时数据模拟

- 使用 `setInterval` 模拟实时数据更新
- 人员位置随机漂移模拟移动
- 事件随机生成模拟突发情况
- LocalStorage 持久化关键数据

### 5.3 状态管理

- 使用 Zustand 管理全局状态
- 按业务领域拆分 Store（人员、事件、物资等）
- 支持状态持久化到 LocalStorage

### 5.4 响应式布局

- TailwindCSS 响应式工具类
- Grid + Flex 混合布局
- 侧边栏可折叠适配不同屏幕
