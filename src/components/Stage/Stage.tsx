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

  const { listeners, lines, stageListenersActive, setStageListenersActive } =
    useEventListeners({ refs: { stage: canvas } });

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
                {...DEFAULT_LINE}
                {...line}
                onDragStart={listeners.handleDragStartLine}
                onDragEnd={listeners.handleDragEndLine}
                key={i}
                draggable={true}
                // onClick={listeners.handleClickLine}
                onMouseEnter={(e) => {
                  document.body.style.cursor = "pointer";
                  setStageListenersActive(false);
                }}
                onMouseLeave={(e) => {
                  document.body.style.cursor = "default";
                  setStageListenersActive(true);
                }}
              />
            );
          })}

          {/* {lineNodes.map((node, i) => {
          return node.
        })} */}
        </Layer>
      </Canvas>

      <div className="h-[100px] flex items-center gap-x-4 px-4">
        <button
          className="border px-2 py-1 flex justify-center items-center rounded-sm bg-white transition-colors hover:bg-neutral-100 duration-150 cursor-pointer active:bg-neutral-200"
          onClick={() => setStageListenersActive((cur) => !cur)}
        >
          {stageListenersActive ? "disable" : "enable"} stage listeners
        </button>
      </div>
    </div>
  );
};

export default Stage;
