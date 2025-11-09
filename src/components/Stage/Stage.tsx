"use client";

import "client-only";
import React, { useState, useRef } from "react";
import { Stage as Canvas, Layer, Rect, Text, Circle, Line } from "react-konva";
import type { KonvaNodeComponent } from "react-konva";
import type { LayerConfig, Layer as LayerType } from "konva/lib/Layer";
// import type { KonvaEventObject } from "konva/lib/Node";
import { Line as LineNode } from "konva/lib/shapes/Line";
import Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";
import type { Vector2d } from "konva/lib/types";
import useEventListeners from "@/hooks/useEventListeners";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

const DEFAULT_LINE: Partial<LineConfig> = {
  strokeWidth: 1,
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
                key={i}
                draggable={true}
                onClick={listeners.handleClickLine}
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
