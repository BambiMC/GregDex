"use client";

import {
  useRef,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";
import ItemIcon from "@/components/ItemIcon";
import {
  getMachineDisplayName,
  getVoltageTier,
  formatTicks,
} from "@/lib/format";
import type {
  PlannerNode,
  HandleInfo,
  ValidationIssue,
} from "./types";
interface Props {
  node: PlannerNode;
  isSelected: boolean;
  isDragging: boolean;
  issues: ValidationIssue[];
  onMouseDown: (e: ReactMouseEvent) => void;
  onUpdateNode: (updates: Partial<PlannerNode>) => void;
  onRemoveNode: () => void;
  onHandleDragStart: (info: HandleInfo, e: ReactMouseEvent) => void;
  registerHandle: (nodeId: string, handle: string, rect: DOMRect) => void;
  onOpenSearch: () => void;
}

export default function RecipeNode({
  node,
  isSelected,
  isDragging,
  issues,
  onMouseDown,
  onUpdateNode,
  onRemoveNode,
  onHandleDragStart,
  registerHandle,
  onOpenSearch,
}: Props) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Register handle positions whenever the node moves
  const updateHandlePositions = useCallback(() => {
    handleRefs.current.forEach((el, handle) => {
      if (el) {
        registerHandle(node.id, handle, el.getBoundingClientRect());
      }
    });
  }, [node.id, registerHandle]);

  useEffect(() => {
    updateHandlePositions();
  }, [node.position, node.recipe, node.collapsed, updateHandlePositions]);

  // Also update on resize / scroll
  useEffect(() => {
    const observer = new ResizeObserver(updateHandlePositions);
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [updateHandlePositions]);

  const recipe = node.recipe;
  const tier =
    recipe?.euPerTick ? getVoltageTier(recipe.euPerTick) : null;

  const hasError = issues.some((i) => i.type === "error");
  const hasWarning = issues.some((i) => i.type === "warning");

  const borderColor = hasError
    ? "border-accent-danger"
    : hasWarning
      ? "border-amber-400"
      : isSelected
        ? "border-accent-primary"
        : "border-border-default";

  const handleRef = (handle: string) => (el: HTMLDivElement | null) => {
    if (el) {
      handleRefs.current.set(handle, el);
    } else {
      handleRefs.current.delete(handle);
    }
  };

  const onHandleMouseDown = (
    handle: string,
    side: "input" | "output",
    kind: "item" | "fluid",
    e: ReactMouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const el = handleRefs.current.get(handle);
    if (!el) return;
    onHandleDragStart(
      {
        nodeId: node.id,
        handle,
        side,
        kind,
        rect: el.getBoundingClientRect(),
      },
      e
    );
  };

  return (
    <>
      <div
        ref={nodeRef}
        className={`absolute select-none ${isDragging ? "" : "transition-shadow"}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          zIndex: isSelected ? 20 : 10,
        }}
      >
        <div
          className={`bg-bg-secondary border ${borderColor} rounded-lg shadow-lg min-w-[220px] max-w-[320px] ${
            isSelected ? "ring-1 ring-accent-primary/30" : ""
          }`}
        >
          {/* Header — draggable */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-default cursor-grab active:cursor-grabbing rounded-t-lg"
            onMouseDown={(e) => {
              if (e.button === 0) {
                e.stopPropagation();
                onMouseDown(e);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onRemoveNode();
            }}
            style={{
              background: tier
                ? `linear-gradient(135deg, ${tier.color}08, transparent)`
                : undefined,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {tier && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: tier.color,
                    backgroundColor: `${tier.color}15`,
                    border: `1px solid ${tier.color}30`,
                  }}
                >
                  {tier.name}
                </span>
              )}
              <span className="text-xs font-medium text-text-primary truncate">
                {node.label}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Collapse toggle */}
              <button
                type="button"
                title={node.collapsed ? "Expand" : "Collapse"}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateNode({ collapsed: !node.collapsed });
                }}
                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${node.collapsed ? "" : "rotate-90"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {/* Delete */}
              <button
                type="button"
                title="Remove node"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveNode();
                }}
                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-accent-danger transition-colors"
              >
                <svg
                  className="w-3 h-3"
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
          </div>

          {/* Body */}
          {!node.collapsed && (
            <div className="px-3 py-2">
              {!recipe ? (
                /* No recipe assigned — show picker */
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSearch();
                  }}
                  className="w-full py-3 text-xs text-text-muted border border-dashed border-border-default rounded-md hover:border-accent-primary hover:text-accent-primary transition-colors cursor-pointer"
                >
                  Click to assign recipe
                </button>
              ) : (
                /* Recipe content */
                <div className="flex gap-3">
                  {/* Inputs column (left side with ports) */}
                  <div className="flex flex-col gap-1 items-start min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5 font-medium">
                      In
                    </div>
                    {recipe.itemInputs.map((input, i) => {
                      if (!input) return null;
                      const handle = `item-in-${i}`;
                      return (
                        <div
                          key={handle}
                          className="flex items-center gap-1.5 relative"
                        >
                          {/* Input port */}
                          <div
                            ref={handleRef(handle)}
                            className="w-3 h-3 rounded-full bg-accent-primary/30 border border-accent-primary/60 hover:bg-accent-primary hover:scale-125 transition-all cursor-crosshair shrink-0 -ml-[18px]"
                            onMouseDown={(e) =>
                              onHandleMouseDown(handle, "input", "item", e)
                            }
                          />
                          <div className="item-slot !w-7 !h-7">
                            <ItemIcon
                              itemId={input.id}
                              displayName={input.displayName}
                              size={22}
                            />
                          </div>
                          <div className="text-[10px] text-text-secondary truncate max-w-[70px]">
                            <div className="truncate">{input.displayName}</div>
                            <div className="text-text-muted">
                              x{input.amount}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {recipe.fluidInputs.map((fluid, i) => {
                      const handle = `fluid-in-${i}`;
                      return (
                        <div
                          key={handle}
                          className="flex items-center gap-1.5 relative"
                        >
                          <div
                            ref={handleRef(handle)}
                            className="w-3 h-3 rounded-full bg-accent-secondary/30 border border-accent-secondary/60 hover:bg-accent-secondary hover:scale-125 transition-all cursor-crosshair shrink-0 -ml-[18px]"
                            onMouseDown={(e) =>
                              onHandleMouseDown(handle, "input", "fluid", e)
                            }
                          />
                          <div className="item-slot !w-7 !h-7 bg-accent-secondary/10 border-accent-secondary/30">
                            <span className="text-[7px] text-accent-secondary">
                              {fluid.displayName.substring(0, 2)}
                            </span>
                          </div>
                          <div className="text-[10px] text-text-secondary truncate max-w-[70px]">
                            <div className="truncate">
                              {fluid.displayName}
                            </div>
                            <div className="text-accent-secondary">
                              {fluid.amount}L
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center text-text-muted shrink-0 self-center">
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
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>

                  {/* Outputs column (right side with ports) */}
                  <div className="flex flex-col gap-1 items-end min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5 font-medium">
                      Out
                    </div>
                    {recipe.itemOutputs.map((output, i) => {
                      const handle = `item-out-${i}`;
                      return (
                        <div
                          key={handle}
                          className="flex items-center gap-1.5 relative"
                        >
                          <div className="text-[10px] text-text-secondary truncate max-w-[70px] text-right">
                            <div className="truncate">
                              {output.displayName}
                            </div>
                            <div className="text-text-muted">
                              x{output.amount}
                            </div>
                          </div>
                          <div className="item-slot !w-7 !h-7">
                            <ItemIcon
                              itemId={output.id}
                              displayName={output.displayName}
                              size={22}
                            />
                          </div>
                          {/* Output port */}
                          <div
                            ref={handleRef(handle)}
                            className="w-3 h-3 rounded-full bg-accent-primary/30 border border-accent-primary/60 hover:bg-accent-primary hover:scale-125 transition-all cursor-crosshair shrink-0 translate-x-4.5"
                            onMouseDown={(e) =>
                              onHandleMouseDown(handle, "output", "item", e)
                            }
                          />
                        </div>
                      );
                    })}
                    {recipe.fluidOutputs.map((fluid, i) => {
                      const handle = `fluid-out-${i}`;
                      return (
                        <div
                          key={handle}
                          className="flex items-center gap-1.5 relative"
                        >
                          <div className="text-[10px] text-text-secondary truncate max-w-[70px] text-right">
                            <div className="truncate">
                              {fluid.displayName}
                            </div>
                            <div className="text-accent-secondary">
                              {fluid.amount}L
                            </div>
                          </div>
                          <div className="item-slot !w-7 !h-7 bg-accent-secondary/10 border-accent-secondary/30">
                            <span className="text-[7px] text-accent-secondary">
                              {fluid.displayName.substring(0, 2)}
                            </span>
                          </div>
                          <div
                            ref={handleRef(handle)}
                            className="w-3 h-3 rounded-full bg-accent-secondary/30 border border-accent-secondary/60 hover:bg-accent-secondary hover:scale-125 transition-all cursor-crosshair shrink-0 translate-x-4.5"
                            onMouseDown={(e) =>
                              onHandleMouseDown(handle, "output", "fluid", e)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Machine info footer */}
              {recipe && (
                <div className="mt-2 pt-2 border-t border-border-default flex items-center justify-between text-[10px] text-text-muted">
                  <span>{getMachineDisplayName(recipe.machine)}</span>
                  <div className="flex gap-2">
                    {recipe.euPerTick && (
                      <span>
                        {recipe.euPerTick} EU/t
                      </span>
                    )}
                    {recipe.duration && (
                      <span>{formatTicks(recipe.duration)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Change recipe button */}
              {recipe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSearch();
                  }}
                  className="w-full mt-2 py-1 text-[10px] text-text-muted hover:text-accent-primary border border-dashed border-border-default rounded hover:border-accent-primary/40 transition-colors cursor-pointer"
                >
                  Change recipe
                </button>
              )}
            </div>
          )}

          {/* Collapsed body — show compact input/output ports */}
          {node.collapsed && recipe && (
            <div className="flex items-center justify-between px-3 py-1.5">
              {/* Input ports */}
              <div className="flex gap-1">
                {recipe.itemInputs
                  .filter((i): i is NonNullable<typeof i> => i !== null)
                  .map((_, i) => {
                    const handle = `item-in-${i}`;
                    return (
                      <div
                        key={handle}
                        ref={handleRef(handle)}
                        className="w-3 h-3 rounded-full bg-accent-primary/30 border border-accent-primary/60 hover:bg-accent-primary hover:scale-125 transition-all cursor-crosshair"
                        onMouseDown={(e) =>
                          onHandleMouseDown(handle, "input", "item", e)
                        }
                      />
                    );
                  })}
                {recipe.fluidInputs.map((_, i) => {
                  const handle = `fluid-in-${i}`;
                  return (
                    <div
                      key={handle}
                      ref={handleRef(handle)}
                      className="w-3 h-3 rounded-full bg-accent-secondary/30 border border-accent-secondary/60 hover:bg-accent-secondary hover:scale-125 transition-all cursor-crosshair"
                      onMouseDown={(e) =>
                        onHandleMouseDown(handle, "input", "fluid", e)
                      }
                    />
                  );
                })}
              </div>

              <svg
                className="w-3 h-3 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>

              {/* Output ports */}
              <div className="flex gap-1">
                {recipe.itemOutputs.map((_, i) => {
                  const handle = `item-out-${i}`;
                  return (
                    <div
                      key={handle}
                      ref={handleRef(handle)}
                      className="w-3 h-3 rounded-full bg-accent-primary/30 border border-accent-primary/60 hover:bg-accent-primary hover:scale-125 transition-all cursor-crosshair"
                      onMouseDown={(e) =>
                        onHandleMouseDown(handle, "output", "item", e)
                      }
                    />
                  );
                })}
                {recipe.fluidOutputs.map((_, i) => {
                  const handle = `fluid-out-${i}`;
                  return (
                    <div
                      key={handle}
                      ref={handleRef(handle)}
                      className="w-3 h-3 rounded-full bg-accent-secondary/30 border border-accent-secondary/60 hover:bg-accent-secondary hover:scale-125 transition-all cursor-crosshair"
                      onMouseDown={(e) =>
                        onHandleMouseDown(handle, "output", "fluid", e)
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Validation issue indicators */}
          {issues.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border-default">
              {issues.slice(0, 3).map((issue, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[9px] leading-snug"
                >
                  <span
                    className={`w-1 h-1 rounded-full shrink-0 ${
                      issue.type === "error"
                        ? "bg-accent-danger"
                        : issue.type === "warning"
                          ? "bg-amber-400"
                          : "bg-accent-secondary"
                    }`}
                  />
                  <span
                    className={
                      issue.type === "error"
                        ? "text-accent-danger"
                        : issue.type === "warning"
                          ? "text-amber-400"
                          : "text-text-muted"
                    }
                  >
                    {issue.message.replace(`"${node.label}": `, "")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </>
  );
}
