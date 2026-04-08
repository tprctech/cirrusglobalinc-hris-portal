import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Minus, Plus, RotateCcw } from 'lucide-react';
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
const RELAY_NODE_OFFSET = 60;
const RELAY_PREFIX = '__relay__';

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

const MAX_ROW_WIDTH = 4;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function sortChildrenForEdges(
  ids: string[],
  childrenByParent: Record<string, string[]>,
  collapsedNodeIds: Set<string>,
) {
  const leaves = ids.filter((cid) => !(childrenByParent[cid]?.length) || collapsedNodeIds.has(cid));
  const branches = ids.filter((cid) => (childrenByParent[cid]?.length) && !collapsedNodeIds.has(cid));
  return [...leaves, ...branches];
}

function buildNodePositions(
  people: OrgPerson[],
  childrenByParent: Record<string, string[]>,
  collapsedNodeIds: Set<string>,
) {
  const allIds = people.map((person) => person.id);
  const childIds = new Set(Object.values(childrenByParent).flat());
  const rootIds = allIds.filter((id) => !childIds.has(id));
  const positions: Record<string, { x: number; y: number }> = {};

  const sortChildren = (ids: string[]) => {
    const leaves = ids.filter((cid) => !(childrenByParent[cid]?.length) || collapsedNodeIds.has(cid));
    const branches = ids.filter((cid) => (childrenByParent[cid]?.length) && !collapsedNodeIds.has(cid));
    return [...leaves, ...branches];
  };

  const spanCache = new Map<string, number>();
  const getSpan = (nodeId: string): number => {
    if (spanCache.has(nodeId)) return spanCache.get(nodeId)!;

    if (collapsedNodeIds.has(nodeId)) {
      spanCache.set(nodeId, 1);
      return 1;
    }

    const children = childrenByParent[nodeId] ?? [];
    if (!children.length) {
      spanCache.set(nodeId, 1);
      return 1;
    }

    const rows = chunkArray(sortChildren(children), MAX_ROW_WIDTH);
    let maxRowSpan = 0;
    for (const row of rows) {
      const rowSpan = row.reduce((sum, cid) => sum + getSpan(cid), 0);
      if (rowSpan > maxRowSpan) maxRowSpan = rowSpan;
    }
    const span = Math.max(1, maxRowSpan);
    spanCache.set(nodeId, span);
    return span;
  };

  const heightCache = new Map<string, number>();
  const getSubtreeHeight = (nodeId: string): number => {
    if (heightCache.has(nodeId)) return heightCache.get(nodeId)!;

    if (collapsedNodeIds.has(nodeId)) {
      heightCache.set(nodeId, 0);
      return 0;
    }

    const children = childrenByParent[nodeId] ?? [];
    if (!children.length) {
      heightCache.set(nodeId, 0);
      return 0;
    }

    const rows = chunkArray(sortChildren(children), MAX_ROW_WIDTH);
    let totalHeight = 0;

    for (const row of rows) {
      let maxChildSubtreeHeight = 0;
      for (const cid of row) {
        const ch = getSubtreeHeight(cid);
        if (ch > maxChildSubtreeHeight) maxChildSubtreeHeight = ch;
      }
      totalHeight += LAYOUT_LEVEL_GAP + maxChildSubtreeHeight;
    }

    heightCache.set(nodeId, totalHeight);
    return totalHeight;
  };

  const relayNodes: { id: string; x: number; y: number }[] = [];

  const placeNode = (nodeId: string, leftSpan: number, y: number) => {
    const span = getSpan(nodeId);
    const centerSpan = leftSpan + span / 2;
    const parentX = LAYOUT_BASE_X + centerSpan * LAYOUT_HORIZONTAL_UNIT - NODE_WIDTH / 2;

    positions[nodeId] = { x: parentX, y };

    const children = childrenByParent[nodeId] ?? [];
    if (!children.length || collapsedNodeIds.has(nodeId)) return;

    const rows = chunkArray(sortChildren(children), MAX_ROW_WIDTH);
    let currentY = y + LAYOUT_LEVEL_GAP;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const rowSpan = row.reduce((sum, cid) => sum + getSpan(cid), 0);
      let childLeft = leftSpan + (span - rowSpan) / 2;

      let maxChildSubtreeHeight = 0;
      for (const cid of row) {
        const ch = getSubtreeHeight(cid);
        if (ch > maxChildSubtreeHeight) maxChildSubtreeHeight = ch;
      }

      if (rowIdx > 0) {
        const relayId = `${RELAY_PREFIX}${nodeId}_r${rowIdx}`;
        const relayX = parentX + NODE_WIDTH / 2 - 1;
        const relayY = currentY - RELAY_NODE_OFFSET;
        relayNodes.push({ id: relayId, x: relayX, y: relayY });
      }

      for (const cid of row) {
        placeNode(cid, childLeft, currentY);
        childLeft += getSpan(cid);
      }

      currentY += LAYOUT_LEVEL_GAP + maxChildSubtreeHeight;
    }
  };

  let currentLeft = 0;
  for (const rootId of rootIds) {
    placeNode(rootId, currentLeft, LAYOUT_BASE_Y);
    currentLeft += getSpan(rootId) + 1;
  }

  return { positions, relayNodes };
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

  const layoutResult = useMemo(
    () => buildNodePositions(orgPeople, childrenByParent, collapsedNodeIds),
    [orgPeople, childrenByParent, collapsedNodeIds],
  );
  const nodePositionsById = layoutResult.positions;
  const relayNodes = layoutResult.relayNodes;

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

  const visibleRelayNodes = useMemo(() => {
    return relayNodes.filter((r) => {
      const parentId = r.id.replace(RELAY_PREFIX, '').split('_r')[0];
      return !hiddenNodeIds.has(parentId) && !collapsedNodeIds.has(parentId);
    });
  }, [relayNodes, hiddenNodeIds, collapsedNodeIds]);

  const relayEdgeMap = useMemo(() => {
    const map = new Map<string, { relayId: string; rowIdx: number }[]>();
    for (const relay of visibleRelayNodes) {
      const parts = relay.id.replace(RELAY_PREFIX, '').split('_r');
      const parentId = parts[0];
      const rowIdx = parseInt(parts[1], 10);
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push({ relayId: relay.id, rowIdx });
    }
    return map;
  }, [visibleRelayNodes]);

  const nodes = useMemo<Node[]>(() => {
    const personNodes: Node[] = orgPeople
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
      }));

    const relayNodeElements: Node[] = visibleRelayNodes.map((r) => ({
      id: r.id,
      position: { x: r.x, y: r.y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { label: '' },
      draggable: false,
      selectable: false,
      style: {
        width: 2,
        height: 2,
        minWidth: 2,
        minHeight: 2,
        padding: 0,
        border: 'none',
        background: 'transparent',
        opacity: 0,
        pointerEvents: 'none' as const,
      },
    }));

    return [...personNodes, ...relayNodeElements];
  }, [orgPeople, collapsedNodeIds, currentFocusNodeId, handleToggleCollapse, hiddenNodeIds, nodePositionsById, parentNodeIds, visibleRelayNodes]);

  const edges = useMemo<Edge[]>(() => {
    const edgeStyle = { stroke: '#cbd5e1', strokeWidth: 2.2 };
    const result: Edge[] = [];

    for (const connection of orgConnections) {
      if (hiddenNodeIds.has(connection.source) || hiddenNodeIds.has(connection.target)) continue;

      const parentId = connection.source;
      const childId = connection.target;
      const parentRelays = relayEdgeMap.get(parentId);
      const children = childrenByParent[parentId] ?? [];
      const sortedEdge = sortChildrenForEdges(children, childrenByParent, collapsedNodeIds);
      const rows = chunkArray(sortedEdge, MAX_ROW_WIDTH);

      let childRowIdx = 0;
      for (let ri = 0; ri < rows.length; ri++) {
        if (rows[ri].includes(childId)) {
          childRowIdx = ri;
          break;
        }
      }

      if (childRowIdx === 0) {
        result.push({
          id: connection.id,
          source: parentId,
          target: childId,
          style: edgeStyle,
          type: 'smoothstep',
        });
      } else {
        const relay = parentRelays?.find((r) => r.rowIdx === childRowIdx);
        if (relay) {
          const relayToParentId = `relay-up-${relay.relayId}`;
          if (!result.some((e) => e.id === relayToParentId)) {
            result.push({
              id: relayToParentId,
              source: parentId,
              target: relay.relayId,
              style: { ...edgeStyle, strokeDasharray: '6 3' },
              type: 'smoothstep',
            });
          }
          result.push({
            id: `relay-${relay.relayId}-${childId}`,
            source: relay.relayId,
            target: childId,
            style: edgeStyle,
            type: 'smoothstep',
          });
        } else {
          result.push({
            id: connection.id,
            source: parentId,
            target: childId,
            style: edgeStyle,
            type: 'smoothstep',
          });
        }
      }
    }

    return result;
  }, [orgConnections, hiddenNodeIds, relayEdgeMap, childrenByParent]);

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
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch('/api/v1/hr/employees/org-chart/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'organization-chart.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
