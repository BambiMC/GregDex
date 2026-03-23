"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type {
  PlannerNode,
  PlannerEdge,
  ValidationIssue,
  HandleInfo,
} from "./types";
import RecipeNode from "./RecipeNode";
import RecipeSearchModal from "./RecipeSearchModal";
import type { RecipeData } from "./types";

const MINIMAP_W = 200;
const MINIMAP_H = 130;
const NODE_EST_W = 300;
const NODE_EST_H = 170;

function Minimap({
  nodes,
  camera,
  containerSize,
  onNavigate,
}: {
  nodes: PlannerNode[];
  camera: { x: number; y: number; zoom: number };
  containerSize: { width: number; height: number };
  onNavigate: (wx: number, wy: number) => void;
}) {
  const isDragging = useRef(false);

  // World bounds: union of all nodes + current viewport
  const PAD = 120;
  const vpLeft = -camera.x / camera.zoom;
  const vpTop = -camera.y / camera.zoom;
  const vpRight = vpLeft + containerSize.width / camera.zoom;
  const vpBottom = vpTop + containerSize.height / camera.zoom;

  let minX = vpLeft, minY = vpTop, maxX = vpRight, maxY = vpBottom;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x - PAD);
    minY = Math.min(minY, n.position.y - PAD);
    maxX = Math.max(maxX, n.position.x + NODE_EST_W + PAD);
    maxY = Math.max(maxY, n.position.y + NODE_EST_H + PAD);
  }

  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const scale = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH);

  const toMini = (wx: number, wy: number) => ({
    x: (wx - minX) * scale,
    y: (wy - minY) * scale,
  });

  const vpMini = toMini(vpLeft, vpTop);
  const vpW = Math.max(4, (containerSize.width / camera.zoom) * scale);
  const vpH = Math.max(4, (containerSize.height / camera.zoom) * scale);

  const miniToWorld = (mx: number, my: number) => ({
    wx: mx / scale + minX,
    wy: my / scale + minY,
  });

  function handleMouseDown(e: ReactMouseEvent<SVGSVGElement>) {
    e.stopPropagation();
    isDragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const { wx, wy } = miniToWorld(e.clientX - rect.left, e.clientY - rect.top);
    onNavigate(wx, wy);
  }

  function handleMouseMove(e: ReactMouseEvent<SVGSVGElement>) {
    if (!isDragging.current) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { wx, wy } = miniToWorld(e.clientX - rect.left, e.clientY - rect.top);
    onNavigate(wx, wy);
  }

  function handleMouseUp(e: ReactMouseEvent<SVGSVGElement>) {
    e.stopPropagation();
    isDragging.current = false;
  }

  return (
    <div
      className="absolute bottom-10 left-3 z-20 rounded-lg overflow-hidden border border-border-default bg-bg-secondary/90 backdrop-blur-sm"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
    >
      <svg
        width={MINIMAP_W}
        height={MINIMAP_H}
        style={{ cursor: "crosshair", display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Node rects */}
        {nodes.map((node) => {
          const { x, y } = toMini(node.position.x, node.position.y);
          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={NODE_EST_W * scale}
              height={NODE_EST_H * scale}
              rx={1}
              fill={node.recipe ? "var(--color-accent-primary)" : "var(--color-bg-elevated)"}
              fillOpacity={0.7}
              stroke="var(--color-border-bright)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={vpMini.x}
          y={vpMini.y}
          width={vpW}
          height={vpH}
          rx={1}
          fill="white"
          fillOpacity={0.06}
          stroke="white"
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

interface Props {
  nodes: PlannerNode[];
  edges: PlannerEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (x: number, y: number) => void;
  onUpdateNode: (id: string, updates: Partial<PlannerNode>) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (edge: Omit<PlannerEdge, "id">) => void;
  onRemoveEdge: (id: string) => void;
  validationIssues: ValidationIssue[];
}

export default function PlannerCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onUpdateNode,
  onRemoveNode,
  onAddEdge,
  onRemoveEdge,
  validationIssues,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Container size for minimap viewport rect
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setContainerSize({ width: el.clientWidth, height: el.clientHeight })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tracks whether the recipe-search modal is open (used inside handleWheel without a dep)
  const modalOpenRef = useRef(false);

  // Camera: pan and zoom
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const cameraStart = useRef({ x: 0, y: 0 });

  // Node dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Edge drawing
  const [drawingEdge, setDrawingEdge] = useState<{
    sourceNodeId: string;
    sourceHandle: string;
    sourceSide: "input" | "output";
    sourceKind: "item" | "fluid";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Handle registry — stores WORLD coordinates so edges stay correct after pan/zoom
  const handlePositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  // Keep a stable ref to camera for use inside the registerHandle callback
  const cameraRef = useRef(camera);
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  const registerHandle = useCallback(
    (nodeId: string, handle: string, rect: DOMRect) => {
      const cam = cameraRef.current;
      const containerRect = containerRef.current?.getBoundingClientRect();
      const cLeft = containerRect?.left ?? 0;
      const cTop = containerRect?.top ?? 0;
      const wx = (rect.left + rect.width / 2 - cLeft - cam.x) / cam.zoom;
      const wy = (rect.top + rect.height / 2 - cTop - cam.y) / cam.zoom;
      handlePositions.current.set(`${nodeId}:${handle}`, { x: wx, y: wy });
    },
    [] // stable — reads camera and containerRef from refs at call time
  );

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: screenX, y: screenY };
      return {
        x: (screenX - rect.left - camera.x) / camera.zoom,
        y: (screenY - rect.top - camera.y) / camera.zoom,
      };
    },
    [camera]
  );

  // Convert world to screen
  const worldToScreen = useCallback(
    (wx: number, wy: number) => {
      return {
        x: wx * camera.zoom + camera.x,
        y: wy * camera.zoom + camera.y,
      };
    },
    [camera]
  );

  // === Mouse handlers ===
  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      // Middle-click or Ctrl+Left-click for pan
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        cameraStart.current = { x: camera.x, y: camera.y };
        return;
      }

      // Left-click on canvas background — deselect
      if (e.button === 0 && (e.target as Element).closest?.(".canvas-bg")) {
        onSelectNode(null);
      }
    },
    [camera, onSelectNode]
  );

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      // Panning
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setCamera((c) => ({
          ...c,
          x: cameraStart.current.x + dx,
          y: cameraStart.current.y + dy,
        }));
        return;
      }

      // Node dragging
      if (draggingNodeId) {
        const world = screenToWorld(e.clientX, e.clientY);
        let newX = world.x - dragOffset.current.x;
        let newY = world.y - dragOffset.current.y;

        // Snap to horizontal/vertical alignment with other nodes
        const SNAP = 12 / camera.zoom; // 12 screen-pixels worth of snap in world space
        for (const other of nodes) {
          if (other.id === draggingNodeId) continue;
          if (Math.abs(newX - other.position.x) < SNAP) newX = other.position.x;
          if (Math.abs(newY - other.position.y) < SNAP) newY = other.position.y;
        }

        onUpdateNode(draggingNodeId, { position: { x: newX, y: newY } });
        return;
      }

      // Edge drawing
      if (drawingEdge) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        const cLeft = containerRect?.left ?? 0;
        const cTop = containerRect?.top ?? 0;
        setDrawingEdge((prev) =>
          prev
            ? { ...prev, currentX: e.clientX - cLeft, currentY: e.clientY - cTop }
            : null
        );
      }
    },
    [isPanning, draggingNodeId, drawingEdge, screenToWorld, onUpdateNode]
  );

  const handleMouseUp = useCallback(
    (e: globalThis.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (draggingNodeId) {
        setDraggingNodeId(null);
        return;
      }

      // Edge drawing — find target handle
      if (drawingEdge) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        const relDropX = e.clientX - (containerRect?.left ?? 0);
        const relDropY = e.clientY - (containerRect?.top ?? 0);
        let foundNodeId = "";
        let foundHandle = "";
        let closestDist = 30; // snap distance in pixels

        handlePositions.current.forEach((worldPos, key) => {
          const parts = key.split(":");
          const nId = parts[0];
          const h = parts.slice(1).join(":");
          // Can't connect to same node
          if (nId === drawingEdge.sourceNodeId) return;

          // Must connect output to input (or input to output)
          const isInput = h.includes("-in-");
          const isOutput = h.includes("-out-");
          if (drawingEdge.sourceSide === "output" && !isInput) return;
          if (drawingEdge.sourceSide === "input" && !isOutput) return;

          const { x: cx, y: cy } = worldToScreen(worldPos.x, worldPos.y);
          const dist = Math.hypot(relDropX - cx, relDropY - cy);
          if (dist < closestDist) {
            closestDist = dist;
            foundNodeId = nId;
            foundHandle = h;
          }
        });

        if (foundNodeId) {
          if (drawingEdge.sourceSide === "output") {
            onAddEdge({
              sourceNodeId: drawingEdge.sourceNodeId,
              sourceHandle: drawingEdge.sourceHandle,
              targetNodeId: foundNodeId,
              targetHandle: foundHandle,
            });
          } else {
            onAddEdge({
              sourceNodeId: foundNodeId,
              sourceHandle: foundHandle,
              targetNodeId: drawingEdge.sourceNodeId,
              targetHandle: drawingEdge.sourceHandle,
            });
          }
        }

        setDrawingEdge(null);
        return;
      }
    },
    [isPanning, draggingNodeId, drawingEdge, onAddEdge, worldToScreen]
  );

  // === Wheel zoom ===
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Don't hijack scroll when the recipe search modal is open
      if (modalOpenRef.current) return;
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.2), 3);

      // Zoom towards mouse position
      const wx = (mouseX - camera.x) / camera.zoom;
      const wy = (mouseY - camera.y) / camera.zoom;

      setCamera({
        x: mouseX - wx * newZoom,
        y: mouseY - wy * newZoom,
        zoom: newZoom,
      });
    },
    [camera]
  );

  // Attach/detach global listeners
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // === Node drag start (called from RecipeNode) ===
  const startNodeDrag = useCallback(
    (nodeId: string, e: ReactMouseEvent) => {
      const world = screenToWorld(e.clientX, e.clientY);
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      dragOffset.current = {
        x: world.x - node.position.x,
        y: world.y - node.position.y,
      };
      setDraggingNodeId(nodeId);
      onSelectNode(nodeId);
    },
    [nodes, screenToWorld, onSelectNode]
  );

  // === Handle drag start (for edge drawing) ===
  const startEdgeDraw = useCallback(
    (info: HandleInfo, e: ReactMouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const cLeft = containerRect?.left ?? 0;
      const cTop = containerRect?.top ?? 0;
      setDrawingEdge({
        sourceNodeId: info.nodeId,
        sourceHandle: info.handle,
        sourceSide: info.side,
        sourceKind: info.kind,
        startX: e.clientX - cLeft,
        startY: e.clientY - cTop,
        currentX: e.clientX - cLeft,
        currentY: e.clientY - cTop,
      });
    },
    []
  );

  // === Compute edge paths (world coords → screen) ===
  const getEdgePath = useCallback(
    (edge: PlannerEdge): string | null => {
      const sourceKey = `${edge.sourceNodeId}:${edge.sourceHandle}`;
      const targetKey = `${edge.targetNodeId}:${edge.targetHandle}`;
      const sw = handlePositions.current.get(sourceKey);
      const tw = handlePositions.current.get(targetKey);
      if (!sw || !tw) return null;

      const { x: sx, y: sy } = worldToScreen(sw.x, sw.y);
      const { x: tx, y: ty } = worldToScreen(tw.x, tw.y);

      const dx = Math.abs(tx - sx) * 0.5;
      return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
    },
    [worldToScreen]
  );

  // Resolve what item/fluid a handle points to
  const getHandleSlot = useCallback(
    (nodeId: string, handle: string): { kind: "item" | "fluid"; id: string } | null => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.recipe) return null;
      const recipe = node.recipe;
      const m = handle.match(/^(item|fluid)-(in|out)-(\d+)$/);
      if (!m) return null;
      const kind = m[1] as "item" | "fluid";
      const idx = parseInt(m[3]);
      if (kind === "item") {
        const arr = handle.includes("-in-") ? recipe.itemInputs : recipe.itemOutputs;
        const slot = arr[idx];
        return slot ? { kind: "item", id: slot.id } : null;
      } else {
        const arr = handle.includes("-in-") ? recipe.fluidInputs : recipe.fluidOutputs;
        const slot = arr[idx];
        return slot ? { kind: "fluid", id: slot.name } : null;
      }
    },
    [nodes]
  );

  // Determine edge color: orange = compatible, gray = mismatch
  const getEdgeColor = useCallback(
    (edge: PlannerEdge) => {
      const src = getHandleSlot(edge.sourceNodeId, edge.sourceHandle);
      const tgt = getHandleSlot(edge.targetNodeId, edge.targetHandle);
      if (src && tgt && src.id !== tgt.id) return "var(--color-text-muted)"; // gray — mismatch
      return "#f97316"; // orange — compatible
    },
    [getHandleSlot]
  );

  // Hovered edge id for trash button
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Recipe search modal — lifted here to stay outside the CSS transform context
  const [searchNodeId, setSearchNodeId] = useState<string | null>(null);
  // Keep ref in sync so handleWheel can read it without needing it as a dep
  useEffect(() => { modalOpenRef.current = searchNodeId !== null; }, [searchNodeId]);

  const handleRecipeSelect = useCallback(
    (recipe: RecipeData, label: string) => {
      if (searchNodeId) onUpdateNode(searchNodeId, { recipe, label });
      setSearchNodeId(null);
    },
    [searchNodeId, onUpdateNode]
  );

  // Get screen midpoint of an edge (for trash icon placement)
  const getEdgeMidpoint = useCallback(
    (edge: PlannerEdge): { x: number; y: number } | null => {
      const sw = handlePositions.current.get(`${edge.sourceNodeId}:${edge.sourceHandle}`);
      const tw = handlePositions.current.get(`${edge.targetNodeId}:${edge.targetHandle}`);
      if (!sw || !tw) return null;
      const { x: sx, y: sy } = worldToScreen(sw.x, sw.y);
      const { x: tx, y: ty } = worldToScreen(tw.x, tw.y);
      // Cubic bezier midpoint at t=0.5
      const dx = Math.abs(tx - sx) * 0.5;
      const cx1 = sx + dx, cy1 = sy;
      const cx2 = tx - dx, cy2 = ty;
      const mx = 0.125*sx + 0.375*cx1 + 0.375*cx2 + 0.125*tx;
      const my = 0.125*sy + 0.375*cy1 + 0.375*cy2 + 0.125*ty;
      return { x: mx, y: my };
    },
    [worldToScreen]
  );

  // Minimap navigation: center camera on clicked world point
  const handleMinimapNavigate = useCallback(
    (wx: number, wy: number) => {
      setCamera((c) => ({
        ...c,
        x: containerSize.width / 2 - wx * c.zoom,
        y: containerSize.height / 2 - wy * c.zoom,
      }));
    },
    [containerSize]
  );

  // Force re-render after nodes change so newly registered handle positions are reflected
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    // One rAF delay ensures RecipeNode effects (updateHandlePositions) have run first
    const id = requestAnimationFrame(() => forceUpdate((n) => n + 1));
    return () => cancelAnimationFrame(id);
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-bg-primary select-none"
      onMouseDown={handleMouseDown}
      style={{ cursor: isPanning ? "grabbing" : draggingNodeId ? "grabbing" : "default" }}
    >
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none canvas-bg" style={{ pointerEvents: "all" }}>
        <defs>
          <pattern
            id="grid-small"
            width={20 * camera.zoom}
            height={20 * camera.zoom}
            patternUnits="userSpaceOnUse"
            x={camera.x % (20 * camera.zoom)}
            y={camera.y % (20 * camera.zoom)}
          >
            <circle
              cx={1}
              cy={1}
              r={0.5}
              fill="var(--color-border-default)"
              opacity={0.3}
            />
          </pattern>
          <pattern
            id="grid-large"
            width={100 * camera.zoom}
            height={100 * camera.zoom}
            patternUnits="userSpaceOnUse"
            x={camera.x % (100 * camera.zoom)}
            y={camera.y % (100 * camera.zoom)}
          >
            <circle
              cx={1}
              cy={1}
              r={1}
              fill="var(--color-border-default)"
              opacity={0.5}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-small)" className="canvas-bg" />
        <rect width="100%" height="100%" fill="url(#grid-large)" className="canvas-bg" />
      </svg>

      {/* Edge SVG overlay (fixed coordinates — edges use screen positions from DOMRects) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        {edges.map((edge) => {
          const path = getEdgePath(edge);
          if (!path) return null;
          const color = getEdgeColor(edge);
          const isHovered = hoveredEdgeId === edge.id;
          const mid = isHovered ? getEdgeMidpoint(edge) : null;
          return (
            <g key={edge.id}>
              {/* Thicker invisible hitbox for hover + right-click delete */}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ pointerEvents: "stroke", cursor: "pointer" }}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemoveEdge(edge.id);
                }}
              />
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 2}
                opacity={isHovered ? 1 : 0.7}
                strokeLinecap="round"
              />
              {/* Animated flow dots */}
              <circle r={3} fill={color} opacity={0.9}>
                <animateMotion dur="2s" repeatCount="indefinite" path={path} />
              </circle>
              {/* Trash icon at midpoint on hover */}
              {isHovered && mid && (
                <g
                  transform={`translate(${mid.x}, ${mid.y})`}
                  className="cursor-pointer"
                  pointerEvents="all"
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveEdge(edge.id);
                  }}
                >
                  {/* Background circle */}
                  <circle r={10} fill="var(--color-bg-secondary)" stroke="var(--color-border-default)" strokeWidth={1} />
                  {/* Trash icon (12×12 centered) */}
                  <g transform="translate(-6,-6)" fill="none" stroke="#f87171" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h8" />
                    <path d="M4 3V2h4v1" />
                    <path d="M3 3l.7 7.3a1 1 0 001 .7h2.6a1 1 0 001-.7L9 3" />
                    <path d="M4.5 5.5v3.5M6 5v4M7.5 5.5v3.5" />
                  </g>
                </g>
              )}
            </g>
          );
        })}

        {/* Drawing edge preview */}
        {drawingEdge && (
          <path
            d={`M ${drawingEdge.startX} ${drawingEdge.startY} C ${drawingEdge.startX + 60} ${drawingEdge.startY}, ${drawingEdge.currentX - 60} ${drawingEdge.currentY}, ${drawingEdge.currentX} ${drawingEdge.currentY}`}
            fill="none"
            stroke={
              drawingEdge.sourceKind === "fluid"
                ? "var(--color-accent-secondary)"
                : "var(--color-accent-primary)"
            }
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.6}
          />
        )}
      </svg>

      {/* Nodes layer (transformed) */}
      <div
        className="absolute"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
          zIndex: 10,
        }}
      >
        {nodes.map((node) => {
          const nodeIssues = validationIssues.filter(
            (i) => i.nodeId === node.id
          );
          return (
            <RecipeNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isDragging={draggingNodeId === node.id}
              issues={nodeIssues}
              onMouseDown={(e) => startNodeDrag(node.id, e)}
              onUpdateNode={(updates) => onUpdateNode(node.id, updates)}
              onRemoveNode={() => onRemoveNode(node.id)}
              onHandleDragStart={startEdgeDraw}
              registerHandle={registerHandle}
              onOpenSearch={() => setSearchNodeId(node.id)}
            />
          );
        })}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 text-[10px] text-text-muted bg-bg-secondary/80 px-2 py-1 rounded border border-border-default z-20">
        {Math.round(camera.zoom * 100)}% &middot; {nodes.length} node
        {nodes.length !== 1 ? "s" : ""} &middot; {edges.length} edge
        {edges.length !== 1 ? "s" : ""}
      </div>

      {/* Minimap */}
      {containerSize.width > 0 && (
        <Minimap
          nodes={nodes}
          camera={camera}
          containerSize={containerSize}
          onNavigate={handleMinimapNavigate}
        />
      )}

      {/* Controls hint */}
      <div className="absolute bottom-3 right-3 text-[10px] text-text-muted bg-bg-secondary/80 px-2 py-1 rounded border border-border-default z-20">
        Scroll: zoom &middot; Mid/Ctrl+drag: pan &middot; Right-click edge: delete
      </div>

      {/* Recipe search modal — rendered here, outside the transform context */}
      {searchNodeId && (
        <RecipeSearchModal
          onSelect={handleRecipeSelect}
          onClose={() => setSearchNodeId(null)}
        />
      )}
    </div>
  );
}
