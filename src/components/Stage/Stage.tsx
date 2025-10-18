"use client";

import React, { useState, useRef } from "react";
import {
  Stage as Canvas,
  Layer,
  Rect,
  Text,
  Circle,
  Line,
  type KonvaNodeEvents,
} from "react-konva";
import Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

type Props = {};

const Stage = (props: Props) => {
  const [lines, setLines] = useState<LineConfig[]>([]);

  const isDrawing = useRef(false);

  //   const handleMouseDown = (e: React.MouseEvent) => {
  const handleMouseDown = (e: KonvaMouseEvent) => {
    // if (!e?.target?.getStage()) return;
    // if (e === null || e.target === null) return;
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: KonvaMouseEvent) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    if (!stage) {
      console.log("NO STAGE");
      return;
    }

    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    if (!lastLine?.points || !point) {
      console.log("NO LASTLINE OR NO POINT");
      return;
    }
    // add point
    lastLine.points = (lastLine.points as any[]).concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <Canvas
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
    >
      Stage
    </Canvas>
  );
};

export default Stage;
