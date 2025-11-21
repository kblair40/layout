"use client";
import { useRef, useState } from "react";
import Konva from "konva";
import type { LineConfig as KonvaLineConfig } from "konva/lib/shapes/Line";
import type { Vector2d } from "konva/lib/types";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;
interface LineConfig extends Omit<KonvaLineConfig, "points"> {
  points?: number[];
}

function useEventListeners() {
  const [stageListenersActive, setStageListenersActive] = useState(true);
  const [lines, setLines] = useState<LineConfig[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectedLine, setSelectedLine] = useState<{
    id: string;
    x: number;
    y: number;
  }>();

  const stage = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);
  const mouseStart = useRef<Vector2d>(null);

  function setStage(_stage: Konva.Stage) {
    stage.current = _stage;
  }

  function getMousePosition(e: KonvaMouseEvent): Vector2d {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) throw new Error("STAGE NOT PRESENT");

    return pos;
  }

  function getLinesClone(): LineConfig[] {
    return JSON.parse(JSON.stringify(lines));
  }

  function getLastLine() {
    const lastLine = lines[lines.length - 1];

    if (!lastLine) {
      throw new Error("No line found");
    }

    return lastLine;
  }

  const handleMouseDown = (e: KonvaMouseEvent) => {
    console.log("MOUSE DOWN");
    isDrawing.current = true;
    const pos = getMousePosition(e);
    console.log("MOUSE POSITION:", pos);
    mouseStart.current = pos;
    setLines((cur) => {
      return [...cur, { points: [pos.x, pos.y], id: lines.length.toString() }];
    });
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

    setLines((cur) => {
      console.log("MOVE: length before:", [...cur].length);
      cur = cur.slice(0, cur.length - 1);
      console.log("Length after:", [...cur].length);
      console.log("pushing:", lastLine);
      cur.push(lastLine);
      return [...cur];
    });
  };

  const handleMouseUp = (e: KonvaMouseEvent) => {
    if (e.target.getType() !== "Stage") {
      console.log("Not on stage. No Mouse Up Event");
      return;
    }
    console.log("MOUSE UP");
    isDrawing.current = false;

    const stage = e.target.getStage();
    if (!stage) {
      console.log("NO STAGE");
      return;
    }

    const { x, y } = mouseStart.current || {}; // new
    const point = getMousePosition(e);
    const dist = Math.max(
      Math.abs((x || 0) - point.x),
      Math.abs((y || 0) - point.y)
    ); // new
    console.log("Dist:", dist);

    // new
    if (dist < 5) {
      if (lines.length === 1) {
        console.log("SETTING LINES EMPTY");
        setLines([]);
        return;
      }

      lines.pop();
      setLines([...lines]);
      mouseStart.current = null;
      return;
    }

    const lastLine = getLastLine();
    console.log("MOUSEUP POINT:", point);

    // add point
    lastLine.points = (lastLine.points as number[])
      .slice(0, 2)
      .concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines);

    console.log("SETTING LINES TO:", [...lines], "\n\n");
    mouseStart.current = null;
  };

  const handleDragStart = (e: KonvaMouseEvent) => {
    setDragging(true);
    e.evt.preventDefault();
    console.log("\n\n\nDrag Start:", e.target.id());
    console.log("Points Before:", e.target.attrs?.points);
  };

  const handleDragEnd = (e: KonvaMouseEvent) => {
    const line = e.target as Konva.Line;
    console.log("Drag End Evt:", e, { id: line.id() });
    e.evt.preventDefault();

    const id = line.id();
    const lineIndex = lines.findIndex((l) => l.id === id);
    const x = line.x();
    const y = line.y();
    const points = line.attrs.points;

    const newPoints = points.map((pt: number, index: number) => {
      if (index % 2 === 0) {
        console.log("returning:", pt + x);
        return pt + x;
      }
      return pt + y;
    });
    console.log("Points After:", newPoints);

    line.points(newPoints);
    line.x(0);
    line.y(0);

    if (lineIndex === -1) {
      console.warn("LINE NOT FOUND");
      return;
    }

    const linesCopy = getLinesClone();
    linesCopy[lineIndex] = { points: line.points(), id };

    setLines(linesCopy);

    setDragging(false);
  };

  function logStage(e?: KonvaMouseEvent) {
    if (stage.current) {
      console.log("Stage:", {
        children: stage.current.getChildren(),
        getClientRect: stage.current.getClientRect(),
        getAbsolutePosition:
          e?.target.getAbsolutePosition(stage.current) || undefined,
        getAbsoluteTransform:
          e?.target.getAbsoluteTransform(stage.current) || undefined,
      });
    }
  }

  function handleClickLine(e: KonvaMouseEvent) {
    console.log("CLICKED LINE - E.TARGET:", {
      target: e.target,
      currentTarget: e.currentTarget,
    });
    const points = e.target.attrs.points;
    setSelectedLine({ id: e.target.id(), x: points[0], y: points[1] });
  }

  function rotateLineVertical() {
    if (!selectedLine) {
      console.log("NO LINE SELECTED");
      return;
    }

    const lines = getLinesClone();
    const lineIndex = lines.findIndex((l) => l.id === selectedLine.id);

    if (lineIndex === -1) {
      console.log("LINE NOT FOUND");
      return;
    }

    const points = lines[lineIndex].points;
    if (!points || points.length != 4) {
      console.log("Invalid # of points:", points);
      return;
    }

    const halfWay = (points[0] + points[2]) / 2;
    points[0] = halfWay;
    points[2] = halfWay;

    lines[lineIndex].points = points;
    setLines(lines);
  }

  const actionState = {
    isDragging: dragging,
  };

  const listeners = {
    handleMouseDownOnStage: handleMouseDown,
    handleMouseUpOnStage: handleMouseUp,
    handleMouseMoveOnStage: handleMouseMove,
    handleDragStartLine: handleDragStart,
    handleDragEndLine: handleDragEnd,
    handleClickLine,
  };

  return {
    listeners,
    lines,
    stageListenersActive,
    actionState,
    selectedLine,
    setStageListenersActive,
    setStage,
  };
}

export default useEventListeners;
