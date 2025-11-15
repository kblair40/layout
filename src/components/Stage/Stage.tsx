"use client";

import "client-only";
import React, { useState, useRef } from "react";
import { Stage as Canvas, Layer, Rect, Text, Circle, Line } from "react-konva";
import type { Layer as LayerType } from "konva/lib/Layer";
import Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";
import useEventListeners from "@/hooks/useEventListeners";

const DEFAULT_LINE: Partial<LineConfig> = {
  strokeWidth: 3,
  stroke: "black",
  draggable: true,
};

const Stage = () => {
  const isDrawing = useRef(false);
  const layerRef = useRef<LayerType>(null);

  const canvas = useRef<Konva.Stage>(null);

  const {
    listeners,
    lines,
    actionState,
    stageListenersActive,
    setStageListenersActive,
    latestData,
  } = useEventListeners({ refs: { stage: canvas } });

  return (
    <div>
      <Canvas
        ref={canvas}
        className="border"
        onMouseDown={
          stageListenersActive ? listeners.handleMouseDownOnStage : undefined
        }
        onMouseMove={
          stageListenersActive ? listeners.handleMouseMoveOnStage : undefined
        }
        onMouseup={
          stageListenersActive ? listeners.handleMouseUpOnStage : undefined
        }
        width={window?.innerWidth || 0}
        height={window?.innerHeight - 100 || 0}
      >
        <Layer ref={layerRef}>
          {lines.map((line, i) => {
            return (
              <Line
                key={i}
                {...DEFAULT_LINE}
                // x={line.x}
                // y={line.y}
                points={line.points}
                x={0}
                y={0}
                // rotation={line.rotation}
                onDragStart={listeners.handleDragStartLine}
                onDragEnd={listeners.handleDragEndLine}
                onMouseEnter={(e) => {
                  document.body.style.cursor = "pointer";
                  setStageListenersActive(false);
                }}
                onMouseLeave={(e) => {
                  document.body.style.cursor = "default";
                  setStageListenersActive(true);
                }}
              />
              // <Line
              //   {...DEFAULT_LINE}
              //   {...line}
              //   onDragStart={listeners.handleDragStartLine}
              //   onDragEnd={listeners.handleDragEndLine}
              //   key={i}
              //   onMouseEnter={(e) => {
              //     document.body.style.cursor = "pointer";
              //     setStageListenersActive(false);
              //   }}
              //   onMouseLeave={(e) => {
              //     document.body.style.cursor = "default";
              //     setStageListenersActive(true);
              //   }}
              //   draggable={true}
              // />
            );
          })}

          {/* {lineNodes.map((node, i) => {
          return node.
        })} */}
        </Layer>
      </Canvas>

      <div className="h-[100px] flex items-center gap-x-4 px-4 relative">
        <button
          className="border px-2 py-1 flex justify-center items-center rounded-sm bg-white transition-colors hover:bg-neutral-100 duration-150 cursor-pointer active:bg-neutral-200"
          onClick={() => setStageListenersActive((cur) => !cur)}
        >
          {stageListenersActive ? "disable" : "enable"} stage listeners
        </button>

        <div className="absolute -top-60 right-0 bottom-0 w-60 max-h-[340px] border z-50 bg-neutral-50 overflow-y-auto">
          <pre>{JSON.stringify(lines, null, 2)}</pre>
          {/* <pre>{JSON.stringify(latestData, null, 2)}</pre> */}
        </div>
      </div>
    </div>
  );
};

export default Stage;
