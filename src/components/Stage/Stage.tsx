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

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

const DEFAULT_LINE: Partial<LineConfig> = {
  strokeWidth: 1,
  stroke: "black",
  draggable: true,
};

const Stage = () => {
  const [lines, setLines] = useState<LineConfig[]>([]);
  const [lineNodes, setLineNodes] = useState<LineNode[]>([]);

  const isDrawing = useRef(false);
  // const layerRef = useRef<KonvaNodeComponent<LayerType, LayerConfig> | null>(
  const layerRef = useRef<LayerType>(null);

  function getMousePosition(e: KonvaMouseEvent): Vector2d {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) throw new Error("STAGE NOT PRESENT");

    return pos;
  }

  function getLastLine() {
    const lastLine = lines[lines.length - 1];

    if (!lastLine) {
      throw new Error("No line found");
    }

    return lastLine;
  }

  const handleMouseDown = (e: KonvaMouseEvent) => {
    console.log("\nMOUSE DOWN");
    isDrawing.current = true;
    const pos = getMousePosition(e);
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: KonvaMouseEvent) => {
    // no drawing - skipping
    if (!isDrawing.current) return;

    const point = getMousePosition(e);
    const lastLine = getLastLine();

    // add point
    lastLine.points = (lastLine.points as number[])
      .slice(0, 2)
      .concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.slice());
  };

  const handleMouseUp = (e: KonvaMouseEvent) => {
    console.log("MOUSE UP");
    isDrawing.current = false;

    const stage = e.target.getStage();
    if (!stage) {
      console.log("NO STAGE");
      return;
    }

    const layers = stage.getLayers();
    console.log("LAYERS:", layers);

    const point = getMousePosition(e);
    const lastLine = getLastLine();
    console.log("MOUSEUP POINT:", point);

    // add point
    lastLine.points = (lastLine.points as number[])
      .slice(0, 2)
      .concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);

    setLines(lines);
    console.log("SETTING LINES TO:", [...lines], "\n\n");
  };

  const handleDragStart = (e: KonvaMouseEvent) => {
    const id = e.target.id();
    console.log("Drag Start:", id);
    e.evt.preventDefault();
    setLines(
      lines.map((line) => {
        console.log("LINE:", line);
        return {
          ...line,
          isDragging: line.id === id,
        };
      })
    );
  };

  function handleMouseEnter(e: KonvaMouseEvent) {
    console.log("E.TARGET:", {
      target: e.target,
      currentTarget: e.currentTarget,
    });
  }
  function handleClickLine(e: KonvaMouseEvent) {
    console.log("CLICK");
    console.log("E.TARGET:", {
      target: e.target,
      currentTarget: e.currentTarget,
    });
  }

  //   if (typeof window === "undefined") {
  //     return null;
  //   }

  const canvas = useRef<Konva.Stage>(null);

  return (
    <Canvas
      ref={canvas}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseup={handleMouseUp}
      width={window?.innerWidth || 0}
      height={window?.innerHeight || 0}
    >
      <Layer ref={layerRef}>
        {lines.map((line, i) => {
          return (
            <Line
              {...DEFAULT_LINE}
              {...line}
              onDragStart={handleDragStart}
              key={i}
              onMouseOver={handleMouseEnter}
              draggable={true}
              onClick={handleClickLine}
            />
          );
        })}

        {/* {lineNodes.map((node, i) => {
          return node.
        })} */}
      </Layer>
    </Canvas>
  );
};

export default Stage;
