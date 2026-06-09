import { useAppStore } from '@/store';
import { useState } from 'react';
import type { Personnel, Incident, RiskPoint, Area } from '@/types';
import { User, AlertTriangle, MapPin, Camera, DoorOpen, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/utils';

interface VenueMapProps {
  showPersonnel?: boolean;
  showIncidents?: boolean;
  showRiskPoints?: boolean;
  showAreas?: boolean;
  showRoutes?: boolean;
  onPersonnelClick?: (personnel: Personnel) => void;
  onIncidentClick?: (incident: Incident) => void;
  onAreaClick?: (area: Area) => void;
  highlightPersonnelId?: string;
  highlightIncidentId?: string;
  highlightAreaId?: string;
  className?: string;
}

export default function VenueMap({
  showPersonnel = true,
  showIncidents = true,
  showRiskPoints = true,
  showAreas = true,
  showRoutes = false,
  onPersonnelClick,
  onIncidentClick,
  onAreaClick,
  highlightPersonnelId,
  highlightIncidentId,
  highlightAreaId,
  className,
}: VenueMapProps) {
  const {
    areas,
    personnel,
    incidents,
    riskPoints,
    patrolRoutes,
    getRiskPointById,
  } = useAppStore();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'red':
      case 'high':
      case 'danger':
        return 'text-danger-500';
      case 'orange':
      case 'medium':
      case 'warning':
        return 'text-warning-500';
      case 'yellow':
        return 'text-caution-500';
      case 'blue':
      case 'low':
      case 'normal':
        return 'text-primary-400';
      default:
        return 'text-dark-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-duty':
        return 'bg-success-500';
      case 'patrol':
        return 'bg-primary-500';
      case 'dispatched':
        return 'bg-warning-500';
      case 'rest':
        return 'bg-caution-500';
      case 'off-duty':
        return 'bg-dark-500';
      default:
        return 'bg-dark-400';
    }
  };

  return (
    <div className={cn('relative bg-dark-900 rounded-xl border border-dark-700 overflow-hidden', className)}>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-dark-800 border border-dark-600 rounded-lg flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-dark-800 border border-dark-600 rounded-lg flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
        >
          −
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-3 bg-dark-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-dark-600">
        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
          <span>在岗</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
          <span>巡逻</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <div className="w-2.5 h-2.5 rounded-full bg-warning-500" />
          <span>调度中</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <AlertTriangle className="w-3 h-3 text-danger-500" />
          <span>事件</span>
        </div>
      </div>

      <div
        className="relative w-full aspect-[4/3] overflow-hidden"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        <svg
          viewBox="0 0 900 650"
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="900" height="650" fill="url(#grid)" />

          {showAreas &&
            areas.map((area) => {
              const points = area.points.map((p) => `${p.x},${p.y}`).join(' ');
              const isHighlighted = highlightAreaId === area.id;
              return (
                <g key={area.id}>
                  <polygon
                    points={points}
                    fill={`${area.color}15`}
                    stroke={area.color}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeDasharray={area.type === 'other' ? '5,5' : 'none'}
                    className="cursor-pointer transition-all duration-300 hover:opacity-80"
                    style={{
                      filter: isHighlighted ? 'url(#glow)' : 'none',
                    }}
                    onClick={() => onAreaClick?.(area)}
                    onMouseEnter={() => setHoveredId(`area-${area.id}`)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                  <text
                    x={area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length}
                    y={area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length}
                    textAnchor="middle"
                    className="text-xs font-medium fill-white pointer-events-none"
                    style={{ fontSize: '11px' }}
                  >
                    {area.name}
                  </text>
                  {hoveredId === `area-${area.id}` && area.capacity && (
                    <text
                      x={area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length}
                      y={area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length + 18}
                      textAnchor="middle"
                      className="text-xs fill-dark-400 pointer-events-none"
                      style={{ fontSize: '10px' }}
                    >
                      {area.currentCount}/{area.capacity}人
                    </text>
                  )}
                </g>
              );
            })}

          {showRoutes &&
            patrolRoutes.map((route) => {
              const points = route.pointIds
                .map((id) => getRiskPointById(id))
                .filter(Boolean) as RiskPoint[];
              if (points.length < 2) return null;

              const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              return (
                <path
                  key={route.id}
                  d={pathData}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="animate-flow"
                  style={{ filter: 'url(#glow)' }}
                />
              );
            })}

          {showRiskPoints &&
            riskPoints.map((point) => {
              const isHighlighted = hoveredId === `point-${point.id}`;
              const getIcon = () => {
                switch (point.type) {
                  case 'entrance':
                  case 'exit':
                    return <DoorOpen className="w-4 h-4" />;
                  case 'cordon':
                    return <Zap className="w-4 h-4" />;
                  case 'camera':
                    return <Camera className="w-4 h-4" />;
                  default:
                    return <MapPin className="w-4 h-4" />;
                }
              };

              return (
                <g
                  key={point.id}
                  onMouseEnter={() => setHoveredId(`point-${point.id}`)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.status === 'danger' ? 10 : point.status === 'warning' ? 8 : 6}
                    className={cn(
                      point.status === 'danger'
                        ? 'fill-danger-500 animate-pulse-fast'
                        : point.status === 'warning'
                        ? 'fill-warning-500 animate-pulse-slow'
                        : point.type === 'entrance' || point.type === 'exit'
                        ? 'fill-success-500'
                        : 'fill-primary-500'
                    )}
                    style={{ filter: 'url(#glow)' }}
                  />
                  {isHighlighted && (
                    <g>
                      <rect
                        x={point.x + 15}
                        y={point.y - 30}
                        width="120"
                        height="40"
                        rx="4"
                        fill="#1e293b"
                        stroke="#475569"
                      />
                      <text
                        x={point.x + 75}
                        y={point.y - 12}
                        textAnchor="middle"
                        className="text-xs font-medium fill-white"
                        style={{ fontSize: '11px' }}
                      >
                        {point.name}
                      </text>
                      <text
                        x={point.x + 75}
                        y={point.y + 2}
                        textAnchor="middle"
                        className="text-xs fill-dark-400"
                        style={{ fontSize: '10px' }}
                      >
                        {point.description}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {showIncidents &&
            incidents
              .filter((i) => i.status !== 'completed')
              .map((incident) => {
                const isHighlighted = highlightIncidentId === incident.id;
                return (
                  <g
                    key={incident.id}
                    className="cursor-pointer"
                    onClick={() => onIncidentClick?.(incident)}
                    onMouseEnter={() => setHoveredId(`incident-${incident.id}`)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <circle
                      cx={incident.x}
                      cy={incident.y}
                      r={isHighlighted ? 18 : 14}
                      className={cn(
                        'animate-pulse-fast',
                        incident.level === 'red'
                          ? 'fill-danger-500/30'
                          : incident.level === 'orange'
                          ? 'fill-warning-500/30'
                          : incident.level === 'yellow'
                          ? 'fill-caution-500/30'
                          : 'fill-primary-500/30'
                      )}
                    />
                    <circle
                      cx={incident.x}
                      cy={incident.y}
                      r={isHighlighted ? 12 : 10}
                      className={cn(
                        incident.level === 'red'
                          ? 'fill-danger-500'
                          : incident.level === 'orange'
                          ? 'fill-warning-500'
                          : incident.level === 'yellow'
                          ? 'fill-caution-500'
                          : 'fill-primary-500'
                      )}
                      style={{ filter: 'url(#glow)' }}
                    />
                    <AlertTriangle
                      x={incident.x - 6}
                      y={incident.y - 6}
                      className="w-3 h-3 fill-white"
                    />
                    {hoveredId === `incident-${incident.id}` && (
                      <g>
                        <rect
                          x={incident.x + 20}
                          y={incident.y - 35}
                          width="150"
                          height="50"
                          rx="4"
                          fill="#1e293b"
                          stroke="#475569"
                        />
                        <text
                          x={incident.x + 95}
                          y={incident.y - 15}
                          textAnchor="middle"
                          className="text-xs font-medium fill-white"
                          style={{ fontSize: '11px' }}
                        >
                          {incident.title}
                        </text>
                        <text
                          x={incident.x + 95}
                          y={incident.y + 3}
                          textAnchor="middle"
                          className={cn('text-xs', getLevelColor(incident.level))}
                          style={{ fontSize: '10px' }}
                        >
                          {incident.type} · {incident.level.toUpperCase()}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

          {showPersonnel &&
            personnel.map((person) => {
              const isHighlighted = highlightPersonnelId === person.id;
              const isHovered = hoveredId === `person-${person.id}`;
              return (
                <g
                  key={person.id}
                  className="cursor-pointer"
                  onClick={() => onPersonnelClick?.(person)}
                  onMouseEnter={() => setHoveredId(`person-${person.id}`)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <circle
                    cx={person.x}
                    cy={person.y}
                    r={isHighlighted || isHovered ? 16 : 12}
                    className={`${getStatusColor(person.status)} transition-all duration-300`}
                    style={{
                      filter: isHighlighted || isHovered ? 'url(#glow)' : 'none',
                      animation: person.status === 'patrol' ? 'breathe 2s infinite' : 'none',
                    }}
                  />
                  <circle
                    cx={person.x}
                    cy={person.y}
                    r={isHighlighted || isHovered ? 12 : 9}
                    className="fill-dark-800"
                  />
                  <User
                    x={person.x - 6}
                    y={person.y - 6}
                    className="w-3 h-3 fill-white"
                  />
                  {isHovered && (
                    <g>
                      <rect
                        x={person.x + 20}
                        y={person.y - 30}
                        width="120"
                        height="45"
                        rx="4"
                        fill="#1e293b"
                        stroke="#475569"
                      />
                      <text
                        x={person.x + 80}
                        y={person.y - 12}
                        textAnchor="middle"
                        className="text-xs font-medium fill-white"
                        style={{ fontSize: '11px' }}
                      >
                        {person.name}
                      </text>
                      <text
                        x={person.x + 80}
                        y={person.y + 5}
                        textAnchor="middle"
                        className={cn('text-xs', getStatusColor(person.status))}
                        style={{ fontSize: '10px' }}
                      >
                        {person.position}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
}
