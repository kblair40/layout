"use client";

import "client-only";
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

const DEFAULT_LINE: Partial<LineConfig> = {
  width: 1,
  fill: "black",
  stroke: "black",
};

const Stage = (props: Props) => {
  const [lines, setLines] = useState<LineConfig[]>([]);

  const isDrawing = useRef(false);

  //   const handleMouseDown = (e: React.MouseEvent) => {
  const handleMouseDown = (e: KonvaMouseEvent) => {
    console.log("MOUSE DOWN");
    // if (!e?.target?.getStage()) return;
    // if (e === null || e.target === null) return;
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    console.log("MOUSEDOWN POINT:", pos);
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
    lastLine.points = (lastLine.points as number[]).concat([point.x, point.y]);
    console.log("MOUSEMOVE POINT:", [point.x, point.y]);
    console.log("POINTS:", lastLine.points);
    // replace last
    const spliced = lines.splice(lines.length - 1, 1, lastLine);
    console.log("SPLICED:", spliced);
    setLines(lines.concat());
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

    // All new
    // let curLine = lines[lines.length - 1];
    // curLine.points = [
    //   curLine.points![0],
    //   curLine.points![1],
    //   curLine.points![-2],
    //   curLine.points![-1],
    // ];

    // const spliced = lines.splice(lines.length - 1, 1, curLine);
    // console.log("SPLICED:", spliced);
    // setLines(lines.concat());
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
