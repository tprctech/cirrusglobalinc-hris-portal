import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Minus, Plus, RotateCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Background,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '../../app/AuthContext';
import './OrgChartPage.css';

const MIN_SCALE = 0.45;
const MAX_SCALE = 2.5;
const BUTTON_ZOOM_STEP = 0.2;
const SCROLL_ZOOM_STEP = 0.12;

type OrgPerson = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isCeo?: boolean;
  email: string;
};

function extractEmail(supervisorValue: string): string {
  if (!supervisorValue) return '';
  const match = supervisorValue.match(/\(([^)]+@[^)]+)\)/);
  if (match) return match[1].trim().toLowerCase();
  return supervisorValue.trim().toLowerCase();
}

const NODE_WIDTH = 238;
const LAYOUT_BASE_X = 120;
const LAYOUT_BASE_Y = 30;
const LAYOUT_HORIZONTAL_UNIT = 270;
const LAYOUT_LEVEL_GAP = 230;

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function OrgNodeLabel({
  name,
  role,
  avatarUrl,
  isCeo,
  isCurrentFocus,
  isParent,
  isCollapsed,
  onToggleCollapse,
}: Pick<OrgPerson, 'name' | 'role' | 'avatarUrl' | 'isCeo'> & {
  isCurrentFocus: boolean;
  isParent: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const initials = getInitials(name);

  return (
    <div className={`org-flow-node ${isCeo ? 'org-flow-node-ceo' : ''} ${isCurrentFocus ? 'org-flow-node-current' : ''}`}>
      <div className="org-flow-node-avatar" aria-hidden={!avatarUrl}>
        {avatarUrl ? <img src={avatarUrl} alt={`${name} profile`} /> : <span>{initials}</span>}
      </div>
      <h3>{name}</h3>
      <p>{role}</p>
      {isParent && (
        <button
          className="org-flow-node-collapse-btn nodrag nopan"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse();
          }}
          title={isCollapsed ? 'Expand team' : 'Collapse team'}
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
    </div>
  );
}

type ApiEmployee = {
  id: number;
  employee_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  email: string;
  job_title: string;
  department: string;
  supervisor: string;
  profile_photo: string;
  status: string;
};

function buildOrgData(employees: ApiEmployee[]) {
  const activeEmployees = employees.filter((e) => e.status === 'Active');

  const emailToEmp = new Map<string, ApiEmployee>();
  for (const emp of activeEmployees) {
    if (emp.email) {
      emailToEmp.set(emp.email.toLowerCase(), emp);
    }
  }

  const childrenByParent: Record<string, string[]> = {};
  const hasParent = new Set<string>();

  for (const emp of activeEmployees) {
    const nodeId = String(emp.id);
    if (emp.supervisor) {
      const supEmail = extractEmail(emp.supervisor);
      const supEmp = emailToEmp.get(supEmail);
      if (supEmp) {
        const parentId = String(supEmp.id);
        if (!childrenByParent[parentId]) {
          childrenByParent[parentId] = [];
        }
        childrenByParent[parentId].push(nodeId);
        hasParent.add(nodeId);
      }
    }
  }

  const rootIds = activeEmployees
    .filter((e) => !hasParent.has(String(e.id)) && childrenByParent[String(e.id)]?.length > 0)
    .map((e) => String(e.id));

  const connectedIds = new Set<string>();
  for (const id of hasParent) connectedIds.add(id);
  for (const id of Object.keys(childrenByParent)) connectedIds.add(id);

  const people: OrgPerson[] = activeEmployees
    .filter((emp) => connectedIds.has(String(emp.id)))
    .map((emp) => {
      const nodeId = String(emp.id);
      const isRoot = rootIds.includes(nodeId);
      return {
        id: nodeId,
        name: emp.display_name || `${emp.first_name} ${emp.last_name}`.trim(),
        role: emp.job_title || emp.department || '',
        avatarUrl: emp.profile_photo || undefined,
        isCeo: isRoot,
        email: emp.email || '',
      };
    });

  const connections: { id: string; source: string; target: string }[] = [];
  for (const [parentId, children] of Object.entries(childrenByParent)) {
    for (const childId of children) {
      connections.push({
        id: `e-${parentId}-${childId}`,
        source: parentId,
        target: childId,
      });
    }
  }

  if (rootIds.length === 0 && orphans.length > 0) {
    return { people, connections, childrenByParent };
  }

  return { people, connections, childrenByParent };
}

function collectHiddenDescendants(
  collapsedNodeIds: Set<string>,
  childrenByParent: Record<string, string[]>,
) {
  const hiddenNodeIds = new Set<string>();

  for (const collapsedNodeId of collapsedNodeIds) {
    const stack = [...(childrenByParent[collapsedNodeId] ?? [])];
    while (stack.length) {
      const childId = stack.pop();
      if (!childId || hiddenNodeIds.has(childId)) {
        continue;
      }
      hiddenNodeIds.add(childId);
      stack.push(...(childrenByParent[childId] ?? []));
    }
  }

  return hiddenNodeIds;
}

function buildNodePositions(
  people: OrgPerson[],
  childrenByParent: Record<string, string[]>,
  collapsedNodeIds: Set<string>,
) {
  const allIds = people.map((person) => person.id);
  const childIds = new Set(Object.values(childrenByParent).flat());
  const rootIds = allIds.filter((id) => !childIds.has(id));
  const spanCache = new Map<string, number>();
  const positions: Record<string, { x: number; y: number }> = {};

  const getSpan = (nodeId: string): number => {
    if (spanCache.has(nodeId)) {
      return spanCache.get(nodeId) ?? 1;
    }

    if (collapsedNodeIds.has(nodeId)) {
      spanCache.set(nodeId, 1);
      return 1;
    }

    const children = childrenByParent[nodeId] ?? [];
    if (!children.length) {
      spanCache.set(nodeId, 1);
      return 1;
    }

    const rows = [children];
    const rowSpans = rows.map((row) => row.reduce((sum, childId) => sum + getSpan(childId), 0));
    const ownGridSpan = children.length;
    const span = Math.max(ownGridSpan, ...rowSpans);
    spanCache.set(nodeId, span);
    return span;
  };

  const placeNode = (nodeId: string, leftSpan: number, y: number, minChildrenY?: number) => {
    const span = getSpan(nodeId);
    const centerSpan = leftSpan + (span / 2);

    positions[nodeId] = {
      x: LAYOUT_BASE_X + (centerSpan * LAYOUT_HORIZONTAL_UNIT) - (NODE_WIDTH / 2),
      y,
    };

    const children = childrenByParent[nodeId] ?? [];
    if (!children.length || collapsedNodeIds.has(nodeId)) {
      return;
    }

    const rows = [children];
    const childrenBlockStartY = Math.max(y + LAYOUT_LEVEL_GAP, minChildrenY ?? y + LAYOUT_LEVEL_GAP);
    const descendantsStartY = childrenBlockStartY + (rows.length * LAYOUT_LEVEL_GAP);

    rows.forEach((row, rowIndex) => {
      const rowSpan = row.reduce((sum, childId) => sum + getSpan(childId), 0);
      let childLeft = leftSpan + ((span - rowSpan) / 2);
      const childY = childrenBlockStartY + (rowIndex * LAYOUT_LEVEL_GAP);
      const rowDescendantsMinY = descendantsStartY + (rowIndex * LAYOUT_LEVEL_GAP);

      for (const childId of row) {
        placeNode(childId, childLeft, childY, rowDescendantsMinY);
        childLeft += getSpan(childId);
      }
    });
  };

  let currentLeft = 0;
  rootIds.forEach((rootId, index) => {
    placeNode(rootId, currentLeft, LAYOUT_BASE_Y);
    currentLeft += getSpan(rootId);
    if (index < rootIds.length - 1) {
      currentLeft += 1;
    }
  });

  return positions;
}

function OrgChartCanvas({ employees }: { employees: ApiEmployee[] }) {
  const { user } = useAuth();
  const currentUserEmail = user?.employee?.email || user?.email || '';

  const orgData = useMemo(() => buildOrgData(employees), [employees]);
  const { people: orgPeople, connections: orgConnections, childrenByParent } = orgData;

  const parentByChild = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const connection of orgConnections) {
      map[connection.target] = connection.source;
    }
    return map;
  }, [orgConnections]);

  const currentUserNodeId = useMemo(() => {
    if (!currentUserEmail) return null;
    const emailLower = currentUserEmail.toLowerCase();
    return orgPeople.find((person) => person.email.toLowerCase() === emailLower)?.id ?? null;
  }, [currentUserEmail, orgPeople]);

  const parentNodeIds = useMemo(() => new Set(Object.keys(childrenByParent)), [childrenByParent]);
  const ancestorPathNodeIds = useMemo(() => {
    if (!currentUserNodeId) {
      return new Set<string>();
    }

    const path = new Set<string>([currentUserNodeId]);
    let cursor: string | undefined = currentUserNodeId;
    while (cursor && parentByChild[cursor]) {
      cursor = parentByChild[cursor];
      if (cursor) {
        path.add(cursor);
      }
    }
    return path;
  }, [currentUserNodeId, parentByChild]);

  const userPathToRoot = useMemo(() => {
    if (!currentUserNodeId) {
      return [] as string[];
    }

    const path: string[] = [currentUserNodeId];
    let cursor: string | undefined = currentUserNodeId;
    while (cursor && parentByChild[cursor]) {
      cursor = parentByChild[cursor];
      if (cursor) {
        path.push(cursor);
      }
    }
    return path;
  }, [currentUserNodeId, parentByChild]);

  const initialCollapsedNodeIds = useMemo(() => {
    const collapsed = new Set<string>();
    for (const parentNodeId of parentNodeIds) {
      const isAncestor = ancestorPathNodeIds.has(parentNodeId);
      const isCurrentUser = currentUserNodeId === parentNodeId;

      if (!isAncestor || isCurrentUser) {
        collapsed.add(parentNodeId);
      }
    }
    return collapsed;
  }, [ancestorPathNodeIds, currentUserNodeId, parentNodeIds]);

  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(initialCollapsedNodeIds),
  );
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { zoomTo, fitView } = useReactFlow();

  const nodePositionsById = useMemo(
    () => buildNodePositions(orgPeople, childrenByParent, collapsedNodeIds),
    [orgPeople, childrenByParent, collapsedNodeIds],
  );

  const hiddenNodeIds = useMemo(
    () => collectHiddenDescendants(collapsedNodeIds, childrenByParent),
    [collapsedNodeIds, childrenByParent],
  );

  const currentFocusNodeId = useMemo(() => {
    if (!currentUserNodeId) {
      return null;
    }

    const isCurrentVisible = !hiddenNodeIds.has(currentUserNodeId);
    if (isCurrentVisible) {
      return currentUserNodeId;
    }

    for (const nodeId of userPathToRoot.slice(1)) {
      if (!hiddenNodeIds.has(nodeId) && !collapsedNodeIds.has(nodeId)) {
        return nodeId;
      }
    }

    for (const nodeId of userPathToRoot.slice(1)) {
      if (!hiddenNodeIds.has(nodeId)) {
        return nodeId;
      }
    }

    return null;
  }, [collapsedNodeIds, currentUserNodeId, hiddenNodeIds, userPathToRoot]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodeIds((previous) => {
      const next = new Set(previous);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const nodes = useMemo<Node[]>(
    () => orgPeople
      .filter((person) => !hiddenNodeIds.has(person.id))
      .map((person) => ({
        id: person.id,
        position: nodePositionsById[person.id] ?? { x: LAYOUT_BASE_X, y: LAYOUT_BASE_Y },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        data: {
          label: (
            <OrgNodeLabel
              name={person.name}
              role={person.role}
              avatarUrl={person.avatarUrl}
              isCeo={person.isCeo}
              isCurrentFocus={currentFocusNodeId === person.id}
              isParent={parentNodeIds.has(person.id)}
              isCollapsed={collapsedNodeIds.has(person.id)}
              onToggleCollapse={() => handleToggleCollapse(person.id)}
            />
          ),
        },
        draggable: false,
      })),
    [orgPeople, collapsedNodeIds, currentFocusNodeId, handleToggleCollapse, hiddenNodeIds, nodePositionsById, parentNodeIds],
  );

  const edges = useMemo<Edge[]>(
    () => orgConnections
      .filter((connection) => !hiddenNodeIds.has(connection.source) && !hiddenNodeIds.has(connection.target))
      .map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        style: { stroke: '#cbd5e1', strokeWidth: 2.2 },
        type: 'smoothstep',
      })),
    [orgConnections, hiddenNodeIds],
  );

  const viewportConfig = useMemo<Viewport>(
    () => ({ x: 0, y: 0, zoom: 1 }),
    [],
  );

  const handleMove = useCallback((_: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    setZoom(viewport.zoom);
  }, []);

  const applyZoomDelta = useCallback(
    (delta: number) => {
      const nextZoom = Math.min(MAX_SCALE, Math.max(MIN_SCALE, zoom + delta));
      zoomTo(nextZoom, { duration: 140 });
    },
    [zoom, zoomTo],
  );

  const handleZoomIn = useCallback(() => {
    if (zoom < MAX_SCALE) {
      applyZoomDelta(BUTTON_ZOOM_STEP);
    }
  }, [applyZoomDelta, zoom]);

  const handleZoomOut = useCallback(() => {
    if (zoom > MIN_SCALE) {
      applyZoomDelta(-BUTTON_ZOOM_STEP);
    }
  }, [applyZoomDelta, zoom]);

  const handleReset = useCallback(() => {
    fitView({ duration: 220, padding: 0.25 });
  }, [fitView]);

  const handleExportPdf = useCallback(async () => {
    if (!viewportRef.current || exporting) return;
    setExporting(true);
    try {
      const el = viewportRef.current;
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          if (node.classList?.contains('react-flow__minimap') || node.classList?.contains('react-flow__controls')) {
            return false;
          }
          return true;
        },
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      const imgWidth = img.width;
      const imgHeight = img.height;
      const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [imgWidth, imgHeight],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('organization-chart.pdf');
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  if (orgPeople.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>No employee data available to display the organization chart.</p>
      </div>
    );
  }

  return (
    <>
      <div className="org-chart-controls">
        <button
          className="org-chart-control-btn"
          onClick={handleZoomOut}
          title="Zoom out"
          disabled={zoom <= MIN_SCALE}
        >
          <Minus size={14} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          className="org-chart-control-btn"
          onClick={handleZoomIn}
          title="Zoom in"
          disabled={zoom >= MAX_SCALE}
        >
          <Plus size={14} />
        </button>
        <button className="org-chart-reset-btn" onClick={handleReset}>
          <RotateCcw size={14} />
          Reset View
        </button>
        <button
          className="org-chart-export-btn"
          onClick={handleExportPdf}
          disabled={exporting}
        >
          <Download size={14} />
          {exporting ? 'Exporting…' : 'Export Organization View'}
        </button>
      </div>

      <div
        className="org-chart-viewport"
        ref={viewportRef}
        onWheel={(event) => {
          if (event.ctrlKey) {
            event.preventDefault();
            return;
          }

          event.preventDefault();
          applyZoomDelta(event.deltaY < 0 ? SCROLL_ZOOM_STEP : -SCROLL_ZOOM_STEP);
        }}
      >
        <ReactFlow
          className="org-chart-flow"
          nodes={nodes}
          edges={edges}
          minZoom={MIN_SCALE}
          maxZoom={MAX_SCALE}
          fitView
          defaultViewport={viewportConfig}
          onMove={handleMove}
          zoomOnScroll={false}
          panOnDrag
          panOnScroll={false}
          zoomOnDoubleClick={false}
          elementsSelectable={false}
          nodesConnectable={false}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} color="#f1f5f9" />
        </ReactFlow>
      </div>
    </>
  );
}

function OrgChartPage() {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/hr/employees/')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load employees');
        return res.json();
      })
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setEmployees([]);
        setLoading(false);
      });
  }, []);

  return (
    <section className="org-chart-page">
      <header className="org-chart-header">
        <h1>Organization Chart</h1>
        <p>View team reporting lines and organizational structure.</p>
      </header>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
      ) : (
        <ReactFlowProvider>
          <OrgChartCanvas employees={employees} />
        </ReactFlowProvider>
      )}
    </section>
  );
}

export default OrgChartPage;
