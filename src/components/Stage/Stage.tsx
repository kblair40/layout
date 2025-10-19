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

  const handleMouseDown = (e: KonvaMouseEvent) => {
    isDrawing.current = true;
    const pos = getMousePosition(e);
    console.log("SETTING LINES TO:", [...lines, { points: [pos.x, pos.y] }]);
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: KonvaMouseEvent) => {
    // no drawing - skipping
    if (!isDrawing.current) return;

    const point = getMousePosition(e);
    let lastLine = lines[lines.length - 1];
    if (!lastLine?.points || !point) {
      console.log("NO LASTLINE OR NO POINT");
      return;
    }

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

    const point = stage.getPointerPosition();
    console.log("MOUSEUP POINT:", point);
  };

  if (typeof window === "undefined") {
    return null;
  }

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
          return <Line {...DEFAULT_LINE} {...line} key={i} />;
        })}
      </Layer>
    </Canvas>
  );
};

export default Stage;
