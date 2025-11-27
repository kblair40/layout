"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Stage as Canvas, Line, Group, Rect, Layer } from "react-konva";
import Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";
import { Portal, Html } from "react-konva-utils";

import { Button } from "../ui/button";
// import Layer from "../Layer/Layer";
import useEventListeners from "@/hooks/useEventListeners";
import useObjectSnap from "@/hooks/useObjectSnap";
import { cn } from "@/lib/utils";
import type { KonvaMouseEvent } from "@/lib/event-listener-utils";

const DEFAULT_LINE: Partial<LineConfig> = {
  strokeWidth: 4,
  // stroke: "black",   
};
const GUIDELINE_OFFSET = 5;
// const GUIDELINE_OFFSET = 1;

type Snap = "start" | "center" | "end";
interface SnappingEdges {
  vertical: Array<{
    guide: number;
    offset: number;
    snap: Snap;
  }>;
  horizontal: Array<{
    guide: number;
    offset: number;
    snap: Snap;
  }>;
}

interface Guide {
  lineGuide: number;
  diff: number;
  snap?: string;
  offset: number;
  orientation?: "V" | "H";
}

const Stage2 = () => {
  const layerRef = useRef<Konva.Layer>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const getLineGuideStops = (skipShape: Konva.Shape) => {
    const stage = skipShape.getStage();
    if (!stage) return { vertical: [], horizontal: [] };

    // we can snap to stage borders and the center of the stage
    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    // and we snap over edges and center of each object on the canvas
    stage.find(".object").forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();
      // and we can snap to all edges of shapes
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });
    return {
      vertical,
      horizontal,
    };
  };

  const getObjectSnappingEdges = React.useCallback(
    (node: Konva.Shape): SnappingEdges => {
      const box = node.getClientRect();
      const absPos = node.absolutePosition();

      return {
        vertical: [
          {
            guide: Math.round(box.x),
            offset: Math.round(absPos.x - box.x),
            snap: "start",
          },
          {
            guide: Math.round(box.x + box.width / 2),
            offset: Math.round(absPos.x - box.x - box.width / 2),
            snap: "center",
          },
          {
            guide: Math.round(box.x + box.width),
            offset: Math.round(absPos.x - box.x - box.width),
            snap: "end",
          },
        ],
        horizontal: [
          {
            guide: Math.round(box.y),
            offset: Math.round(absPos.y - box.y),
            snap: "start",
          },
          {
            guide: Math.round(box.y + box.height / 2),
            offset: Math.round(absPos.y - box.y - box.height / 2),
            snap: "center",
          },
          {
            guide: Math.round(box.y + box.height),
            offset: Math.round(absPos.y - box.y - box.height),
            snap: "end",
          },
        ],
      };
    },
    []
  );

  const getGuides = React.useCallback(
    (
      lineGuideStops: ReturnType<typeof getLineGuideStops>,
      itemBounds: ReturnType<typeof getObjectSnappingEdges>
    ) => {
      const resultV: Array<{
        lineGuide: number;
        diff: number;
        snap: Snap;
        offset: number;
      }> = [];

      const resultH: Array<{
        lineGuide: number;
        diff: number;
        snap: Snap;
        offset: number;
      }> = [];

      lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound) => {
          const diff = Math.abs(lineGuide - itemBound.guide);
          if (diff < GUIDELINE_OFFSET) {
            resultV.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            });
          }
        });
      });

      lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound) => {
          const diff = Math.abs(lineGuide - itemBound.guide);
          if (diff < GUIDELINE_OFFSET) {
            resultH.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            });
          }
        });
      });

      const guides: Array<{
        lineGuide: number;
        offset: number;
        orientation: "V" | "H";
        snap: "start" | "center" | "end";
      }> = [];

      const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
      const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

      if (minV) {
        guides.push({
          lineGuide: minV.lineGuide,
          offset: minV.offset,
          orientation: "V",
          snap: minV.snap,
        });
      }

      if (minH) {
        guides.push({
          lineGuide: minH.lineGuide,
          offset: minH.offset,
          orientation: "H",
          snap: minH.snap,
        });
      }

      return guides;
    },
    []
  );

  const drawGuides = React.useCallback(
    (guides: ReturnType<typeof getGuides>, layer: Konva.Layer) => {
      guides.forEach((lg) => {
        if (lg.orientation === "H") {
          const line = new Konva.Line({
            points: [-6000, 0, 6000, 0],
            stroke: "rgb(0, 161, 255)",
            strokeWidth: 1,
            name: "guide-line",
            dash: [4, 6],
          });
          layer.add(line);
          line.absolutePosition({
            x: 0,
            y: lg.lineGuide,
          });
        } else if (lg.orientation === "V") {
          const line = new Konva.Line({
            points: [0, -6000, 0, 6000],
            stroke: "rgb(0, 161, 255)",
            strokeWidth: 1,
            name: "guide-line",
            dash: [4, 6],
          });
          layer.add(line);
          line.absolutePosition({
            x: lg.lineGuide,
            y: 0,
          });
        }
      });
    },
    []
  );

  const onDragMove = React.useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const layer = e.target.getLayer() as Konva.Layer;

      // clear all previous lines on the screen
      (layer?.find(".guide-line") as Konva.Shape[]).forEach((l: Konva.Shape) =>
        l.destroy()
      );

      // find possible snapping lines
      const lineGuideStops = getLineGuideStops(e.target as Konva.Shape);
      // find snapping points of current object
      const itemBounds = getObjectSnappingEdges(e.target as Konva.Shape);

      // now find where can we snap current object
      const guides = getGuides(lineGuideStops, itemBounds);

      // do nothing if no snapping
      if (!guides.length) {
        return;
      }

      drawGuides(guides, layer);

      const absPos = e.target.absolutePosition();
      // now force object position
      guides.forEach((lg) => {
        switch (lg.snap) {
          case "start": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
          case "center": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
          case "end": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
        }
      });
      e.target.absolutePosition(absPos);
    },
    [drawGuides, getGuides, getObjectSnappingEdges]
  );

  const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const layer = e.target.getLayer();
    // clear all previous lines on the screen
    (layer?.find(".guide-line") as Konva.Shape[]).forEach((l: Konva.Shape) =>
      l.destroy()
    );
  };

  //   const didDraw = useRef(false);
  //   useEffect(() => {
  //     if (didDraw.current) return;
  //     didDraw.current = true;

  //     const stage = stageRef.current;
  //     const layer = layerRef.current;
  //     if (!stage || !layer) {
  //       console.log("Stage and/or layerRef refs not set:", { stage, layer });
  //       return;
  //     }

  //     // setStage(stage);
  //     setLayer(layer);

  //     for (let i = 0; i < 5; i++) {
  //       const rect = new Konva.Rect({
  //         x: Math.random() * stage.width(),
  //         y: Math.random() * stage.height(),
  //         width: 50 + Math.random() * 50,
  //         height: 50 + Math.random() * 50,
  //         fill: Konva.Util.getRandomColor(),
  //         // rotation: Math.random() * 360,
  //         draggable: true,
  //         name: "object",
  //       });

  //       rect.on("dragmove", (e: Konva.KonvaEventObject<DragEvent>) =>
  //         // onDragMove(e)
  //         handleDragMove(e)
  //       );
  //       rect.on("dragend", (e: Konva.KonvaEventObject<DragEvent>) =>
  //         onDragEnd(e)
  //       );

  //       layer.add(rect);
  //     }

  //     layer.draw();
  //   }, []);

  const didDraw = useRef(false);
  useEffect(() => {
    if (didDraw.current) return;
    didDraw.current = true;

    setLayerAndStage(layerRef.current!, stageRef.current!);
    setEvtListenersLayerAndStage(layerRef.current!, stageRef.current!);
  }, []);

  const {
    listeners,
    lines,
    actionState,
    stageListenersActive,
    selectedLine,
    menuPosition,
    setStageListenersActive,
    rotateLineVertical,
    rotateLineHorizontal,
    closeContextMenu,
    deleteLine,
    setLayerAndStage: setEvtListenersLayerAndStage,
  } = useEventListeners();

  const { handleDragMove, handleDragEnd, setLayerAndStage } = useObjectSnap();

  function handleClickRotate(dir: "horizontal" | "vertical") {
    console.log("Rotate", dir);
    if (dir === "horizontal") rotateLineHorizontal();
    else rotateLineVertical();

    closeContextMenu();
  }

  const ctxMenuButtonClasses = cn(
    "h-6 w-full flex justify-center items-center py-1 text-xs"
  );

  return (
    <div>
      <Canvas
        ref={stageRef}
        // className="border"
        onMouseDown={listeners.handleMouseDownOnStage}
        onMouseMove={listeners.handleMouseMoveOnStage}
        onMouseup={listeners.handleMouseUpOnStage}
        width={window.innerWidth || 0}
        height={window.innerHeight - 100 || 0}
      >
        <Layer ref={layerRef}>
          {lines.map((line, i) => {
            return (
              <Line
                key={i}
                {...DEFAULT_LINE}
                x={0}
                y={0}
                id={line.id}
                points={line.points}
                onDragStart={listeners.handleDragStartLine}
                onDragEnd={(e) => {
                  listeners.handleDragEndLine(e);
                  handleDragEnd(e);
                }}
                onMouseEnter={(e) => {
                  document.body.style.cursor = "pointer";
                }}
                onMouseLeave={(e) => {
                  document.body.style.cursor = "default";
                }}
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  listeners.handleContextMenu(e);
                }}
                stroke={selectedLine?.id === line.id ? "#19a" : "#00000033"}
                draggable={!actionState.shiftKeyPressed}
                name="wall"
                // name="object"
                onDragMove={handleDragMove}
              />
            );
          })}

          <Portal selector=".top">
            {selectedLine && menuPosition && (
              <Html>
                <div
                  style={{ top: menuPosition.y, left: menuPosition.x }}
                  className="absolute w-40 h-20 border px-1 flex flex-col justify-evenly"
                >
                  <Button
                    size="sm"
                    className={ctxMenuButtonClasses}
                    onClick={() => handleClickRotate("vertical")}
                  >
                    Rotate Vertical
                  </Button>
                  <Button
                    size="sm"
                    className={ctxMenuButtonClasses}
                    onClick={() => handleClickRotate("horizontal")}
                  >
                    Rotate Horizontal
                  </Button>
                  <Button
                    size="sm"
                    className={ctxMenuButtonClasses}
                    onClick={() => deleteLine()}
                  >
                    Delete Line
                  </Button>
                </div>
              </Html>
            )}
          </Portal>
          <Group name="top" />
        </Layer>
      </Canvas>

      <div className="h-[100px] flex items-center gap-x-4 px-4 relative">
        <div className="flex flex-col gap-y-1 pl-12">
          <button
            className="border text-sm px-2 py-1 flex justify-center items-center rounded-sm bg-white transition-colors hover:bg-neutral-100 duration-150 cursor-pointer active:bg-neutral-200"
            onClick={() => setStageListenersActive((cur) => !cur)}
          >
            {stageListenersActive ? "disable" : "enable"} stage listeners
          </button>

          <div className="text-sm leading-tight font-medium">
            <p>Drawing: {String(actionState.isDrawing)}</p>
            <p>Dragging: {String(actionState.isDragging)}</p>
            <p>shiftKeyPressed: {String(actionState.shiftKeyPressed)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-y-1">
          <div># of Lines = {lines.length}</div>
        </div>

        <div className="absolute -top-60 right-0 bottom-0 w-60 max-h-[340px] border z-50 bg-neutral-50 overflow-y-auto">
          {lines.map((l, i) => {
            return (
              <div key={i}>
                {`Line ${l.id} =`}
                <pre>{JSON.stringify(l, null, 2)}</pre>
              </div>
            );
          })}
        </div>

        <pre>
          selectedLine:
          {selectedLine ? JSON.stringify(selectedLine) : null}
        </pre>
      </div>
    </div>
  );
};

export default Stage2;
