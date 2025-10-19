"use client";

import "client-only";
import React, { useState, useRef } from "react";
import { Stage as Canvas, Layer, Rect, Text, Circle, Line } from "react-konva";
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

  const isDrawing = useRef(false);

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

    const point = getMousePosition(e);
    const lastLine = getLastLine();
    console.log("MOUSEUP POINT:", point);

    const points = lastLine.points as number[];

    // add point
    lastLine.points = (lastLine.points as number[])
      .slice(0, 2)
      .concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.slice());
    console.log("SETTING LINES TO:", [...lines], "\n\n");
  };

  const handleDragStart = (e: KonvaMouseEvent) => {
    const id = e.target.id();
    console.log("Drag Start:", id);
    setLines(
      lines.map((line) => {
        return {
          ...line,
          isDragging: line.id === id,
        };
      })
    );
  };

  //   if (typeof window === "undefined") {
  //     return null;
  //   }

  return (
    <Canvas
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      //   className="border h-screen"
      width={window?.innerWidth || 0}
      height={window?.innerHeight || 0}
    >
      <Layer>
        {lines.map((line, i) => {
          return (
            <Line
              {...DEFAULT_LINE}
              {...line}
              onDragStart={handleDragStart}
              key={i}
            />
          );
        })}
      </Layer>
    </Canvas>
  );
};

export default Stage;
