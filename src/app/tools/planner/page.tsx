"use client";

import { useState, useCallback, useRef, useEffect, type ChangeEvent } from "react";
import Link from "next/link";
import PlannerCanvas from "./PlannerCanvas";
import type { PlannerNode, PlannerEdge, ValidationIssue } from "./types";

export default function PlannerPage() {
  const [nodes, setNodes] = useState<PlannerNode[]>([]);
  const [edges, setEdges] = useState<PlannerEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>(
    []
  );
  const [showValidation, setShowValidation] = useState(false);

  const nextId = useRef(1);

  const addNode = useCallback(
    (x: number, y: number) => {
      const id = `node-${nextId.current++}`;
      const node: PlannerNode = {
        id,
        position: { x, y },
        recipe: null,
        label: "Empty Node",
        collapsed: false,
      };
      setNodes((prev) => [...prev, node]);
      setSelectedNodeId(id);
    },
    []
  );

  const updateNode = useCallback((id: string, updates: Partial<PlannerNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  const removeNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) =>
        prev.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id)
      );
      if (selectedNodeId === id) setSelectedNodeId(null);
    },
    [selectedNodeId]
  );

  const addEdge = useCallback(
    (edge: Omit<PlannerEdge, "id">) => {
      // Prevent duplicate edges
      const exists = edges.some(
        (e) =>
          e.sourceNodeId === edge.sourceNodeId &&
          e.sourceHandle === edge.sourceHandle &&
          e.targetNodeId === edge.targetNodeId &&
          e.targetHandle === edge.targetHandle
      );
      if (exists) return;
      // Prevent self-connections
      if (edge.sourceNodeId === edge.targetNodeId) return;

      const id = `edge-${nextId.current++}`;
      setEdges((prev) => [...prev, { ...edge, id }]);
    },
    [edges]
  );

  const removeEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // === Validation ===
  const validate = useCallback(() => {
    const issues: ValidationIssue[] = [];

    for (const node of nodes) {
      if (!node.recipe) {
        issues.push({
          nodeId: node.id,
          type: "warning",
          message: `"${node.label}" has no recipe assigned`,
        });
        continue;
      }

      // Check if all inputs are connected
      const nodeInputEdges = edges.filter((e) => e.targetNodeId === node.id);
      const recipe = node.recipe;

      // Check item inputs
      for (let i = 0; i < recipe.itemInputs.length; i++) {
        const input = recipe.itemInputs[i];
        if (!input) continue;
        const connected = nodeInputEdges.some(
          (e) => e.targetHandle === `item-in-${i}`
        );
        if (!connected) {
          issues.push({
            nodeId: node.id,
            type: "error",
            message: `"${node.label}": input "${input.displayName}" is not connected`,
          });
        }
      }

      // Check fluid inputs
      for (let i = 0; i < recipe.fluidInputs.length; i++) {
        const input = recipe.fluidInputs[i];
        const connected = nodeInputEdges.some(
          (e) => e.targetHandle === `fluid-in-${i}`
        );
        if (!connected) {
          issues.push({
            nodeId: node.id,
            type: "error",
            message: `"${node.label}": fluid input "${input.displayName}" is not connected`,
          });
        }
      }

      // Check output connections — warn if nothing is consuming
      const nodeOutputEdges = edges.filter((e) => e.sourceNodeId === node.id);
      if (nodeOutputEdges.length === 0) {
        issues.push({
          nodeId: node.id,
          type: "info",
          message: `"${node.label}" outputs are not connected to anything (final product?)`,
        });
      }
    }

    // Check edge compatibility (item types match)
    for (const edge of edges) {
      const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
      const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
      if (!sourceNode?.recipe || !targetNode?.recipe) continue;

      const sourceItem = getHandleItem(sourceNode, edge.sourceHandle);
      const targetItem = getHandleItem(targetNode, edge.targetHandle);

      if (sourceItem && targetItem && sourceItem.id !== targetItem.id) {
        issues.push({
          nodeId: edge.sourceNodeId,
          type: "error",
          message: `Mismatched connection: "${sourceItem.displayName}" → "${targetItem.displayName}"`,
        });
      }

      // Check rate mismatch
      if (sourceItem && targetItem && sourceItem.id === targetItem.id) {
        if (sourceItem.amount < targetItem.amount) {
          issues.push({
            nodeId: edge.targetNodeId,
            type: "warning",
            message: `"${targetItem.displayName}": producing ${sourceItem.amount} but needs ${targetItem.amount} (underflow)`,
          });
        }
      }
    }

    setValidationIssues(issues);
    setShowValidation(true);
  }, [nodes, edges]);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setValidationIssues([]);
    setShowValidation(false);
    nextId.current = 1;
  }, []);

  // Persistence: save/load from localStorage
  const saveToLocal = useCallback(() => {
    const data = {
      nodes: nodes.map((n) => ({
        ...n,
        // Strip transient state
      })),
      edges,
      nextId: nextId.current,
    };
    localStorage.setItem("gregdex-planner", JSON.stringify(data));
  }, [nodes, edges]);

  const loadFromLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem("gregdex-planner");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);
      if (data.nextId) nextId.current = data.nextId;
    } catch {
      // ignore corrupt data
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadFromLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportToFile = useCallback(() => {
    const data = { nodes, edges, nextId: nextId.current };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gregdex-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const importFileRef = useRef<HTMLInputElement>(null);

  const importFromFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        if (data.nextId) nextId.current = data.nextId;
      } catch {
        // ignore corrupt file
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = "";
  }, []);

  const errorCount = validationIssues.filter((i) => i.type === "error").length;
  const warnCount = validationIssues.filter((i) => i.type === "warning").length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-secondary shrink-0">
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link
              href="/"
              className="hover:text-text-secondary transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-text-secondary">Tools</span>
            <span>/</span>
            <span className="text-text-primary font-medium">
              Production Line Planner
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Stagger new nodes so they don't pile up
              const offset = nodes.length * 30;
              addNode(120 + offset, 80 + offset);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-accent-primary/40 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Node
          </button>
          <div className="w-px h-5 bg-border-default" />
          <button
            onClick={validate}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent-success/30 bg-accent-success/10 text-accent-success hover:bg-accent-success/20 transition-colors cursor-pointer"
          >
            Validate
          </button>
          <button
            onClick={saveToLocal}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary hover:bg-accent-secondary/20 transition-colors cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={loadFromLocal}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-default text-text-secondary hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            Load
          </button>
          <div className="w-px h-5 bg-border-default" />
          <button
            onClick={exportToFile}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-default text-text-secondary hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            Export
          </button>
          <button
            onClick={() => importFileRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-default text-text-secondary hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            Import
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json"
            aria-label="Import plan from JSON file"
            className="hidden"
            onChange={importFromFile}
          />
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent-danger/30 text-accent-danger hover:bg-accent-danger/10 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <PlannerCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onAddNode={addNode}
          onUpdateNode={updateNode}
          onRemoveNode={removeNode}
          onAddEdge={addEdge}
          onRemoveEdge={removeEdge}
          validationIssues={validationIssues}
        />

        {/* Floating help hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <p className="text-text-muted text-lg mb-2">
                Click <span className="text-accent-primary font-semibold">+ Add Node</span> to start
              </p>
              <p className="text-text-muted text-sm">
                Assign a recipe, drag ports to connect nodes, right-click edges to remove.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Validation panel */}
      {showValidation && validationIssues.length > 0 && (
        <div className="border-t border-border-default bg-bg-secondary shrink-0 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-default">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-text-primary">
                Validation Results
              </span>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-accent-danger/15 text-accent-danger font-medium">
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </span>
              )}
              {warnCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 font-medium">
                  {warnCount} warning{warnCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowValidation(false)}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="divide-y divide-border-default">
            {validationIssues.map((issue, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-1.5 text-xs hover:bg-bg-elevated transition-colors cursor-pointer"
                onClick={() => setSelectedNodeId(issue.nodeId)}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    issue.type === "error"
                      ? "bg-accent-danger"
                      : issue.type === "warning"
                        ? "bg-amber-400"
                        : "bg-accent-secondary"
                  }`}
                />
                <span className="text-text-secondary">{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No-issues toast */}
      {showValidation && validationIssues.length === 0 && nodes.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-accent-success/15 border border-accent-success/30 text-accent-success text-sm font-medium z-50">
          All connections valid!
        </div>
      )}
    </div>
  );
}

// Helper to extract the item/fluid from a handle string
function getHandleItem(
  node: PlannerNode,
  handle: string
): { id: string; displayName: string; amount: number } | null {
  if (!node.recipe) return null;
  const recipe = node.recipe;

  const itemOutMatch = handle.match(/^item-out-(\d+)$/);
  if (itemOutMatch) {
    const idx = parseInt(itemOutMatch[1]);
    return recipe.itemOutputs[idx] || null;
  }

  const itemInMatch = handle.match(/^item-in-(\d+)$/);
  if (itemInMatch) {
    const idx = parseInt(itemInMatch[1]);
    return recipe.itemInputs[idx] || null;
  }

  const fluidOutMatch = handle.match(/^fluid-out-(\d+)$/);
  if (fluidOutMatch) {
    const idx = parseInt(fluidOutMatch[1]);
    const f = recipe.fluidOutputs[idx];
    if (f) return { id: f.name, displayName: f.displayName, amount: f.amount };
    return null;
  }

  const fluidInMatch = handle.match(/^fluid-in-(\d+)$/);
  if (fluidInMatch) {
    const idx = parseInt(fluidInMatch[1]);
    const f = recipe.fluidInputs[idx];
    if (f) return { id: f.name, displayName: f.displayName, amount: f.amount };
    return null;
  }

  return null;
}
