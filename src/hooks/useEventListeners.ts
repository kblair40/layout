"use client";
import { useRef, useState } from "react";
import Konva from "konva";
import type { LineConfig as KonvaLineConfig } from "konva/lib/shapes/Line";
import type { Vector2d } from "konva/lib/types";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;
interface LineConfig extends Omit<KonvaLineConfig, "points"> {
  points?: number[];
}

type Coordinate = { x: number; y: number };

function useEventListeners() {
  const [stageListenersActive, setStageListenersActive] = useState(true);
  const [lines, setLines] = useState<LineConfig[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectedLine, setSelectedLine] = useState<{
    id: string;
    x: number;
    y: number;
  }>();
  const [menuPosition, setMenuPosition] = useState<Coordinate>();

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
    if (!stageListenersActive) return;
    console.log("MOUSE DOWN");
    closeContextMenu();
    isDrawing.current = true;
    const pos = getMousePosition(e);
    console.log("MOUSE POSITION:", pos);
    mouseStart.current = pos;
    setLines((cur) => {
      return [...cur, { points: [pos.x, pos.y], id: lines.length.toString() }];
    });
  };

  const handleMouseMove = (e: KonvaMouseEvent) => {
    if (!stageListenersActive) return;
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
    if (!stageListenersActive) return;
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

  function validateLineSelection() {
    if (!selectedLine) {
      console.log("NO LINE SELECTED");
      return null;
    }

    const lines = getLinesClone();
    const lineIndex = lines.findIndex((l) => l.id === selectedLine.id);

    if (lineIndex === -1) {
      console.log("LINE NOT FOUND");
      return null;
    }

    const points = lines[lineIndex].points;
    if (!points || points.length != 4) {
      console.log("Invalid # of points:", points);
      return null;
    }

    return { clonedLines: lines, lineIndex, points };
  }

  function getLineLength(p: number[]) {
    return Math.sqrt((p[2] -= p[0]) * p[2] + (p[3] -= p[1]) * p[3]);
  }

  function rotateLineVertical() {
    const { clonedLines, lineIndex, points } = validateLineSelection() || {};

    if (!clonedLines || !points || typeof lineIndex !== "number") {
      console.log("Validation failed");
      return;
    }
    console.group("Rotate Vertical");
    console.log("Points before:", [...points]);
    const lengthBefore = getLineLength([...points]);
    console.log("Length before:", lengthBefore);
    const half = (points[0] + points[2]) / 2;
    points[0] = half;
    points[2] = half;
    console.log("Points after x update:", [...points]);

    const lengthAfter = getLineLength([...points]);
    const lengthChange = lengthBefore - lengthAfter;
    console.log("Length after x update:", { lengthAfter, lengthChange });

    if (points[1] > points[3]) {
      points[1] += lengthChange;
    } else {
      points[3] += lengthChange;
    }

    console.log("Points after y update:", [...points]);
    console.log("Length after y update:", getLineLength([...points]));
    console.groupEnd();
    clonedLines[lineIndex].points = points;
    setLines(clonedLines);
  }

  function rotateLineHorizontal() {
    const { clonedLines, lineIndex, points } = validateLineSelection() || {};

    if (!clonedLines || !points || typeof lineIndex !== "number") {
      console.log("Validation failed");
      return;
    }
    console.group("Rotate Horizontal");

    console.log("Points before:", [...points]);
    const lengthBefore = getLineLength([...points]);
    console.log("Length before:", lengthBefore);

    const half = (points[1] + points[3]) / 2;
    points[1] = half;
    points[3] = half;
    console.log("Points after y update:", [...points]);
    console.log("Length after y update:", getLineLength([...points]));

    const lengthAfter = getLineLength([...points]);
    const lengthChange = lengthBefore - lengthAfter;
    console.log("Length after x update:", { lengthAfter, lengthChange });

    if (points[0] > points[2]) {
      points[0] += lengthChange;
    } else {
      points[2] += lengthChange;
    }
    console.log("Points after x update:", [...points]);
    console.log("Length after x update:", getLineLength([...points]));

    clonedLines[lineIndex].points = points;
    console.groupEnd();
    setLines(clonedLines);
  }

  function handleContextMenu(e: KonvaMouseEvent) {
    e.evt.preventDefault();
    const line = e.target;
    const position = getMousePosition(e);
    console.log("handleContextMenu:", { line, position });
    setMenuPosition({ x: position.x, y: position.y });
    setSelectedLine({ id: line.id(), x: line.x(), y: line.y() });
  }

  function closeContextMenu() {
    setMenuPosition(undefined);
    setSelectedLine(undefined);
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
    handleContextMenu,
  };

  return {
    listeners,
    lines,
    stageListenersActive,
    actionState,
    selectedLine,
    menuPosition,
    setStageListenersActive,
    setStage,
    rotateLineVertical,
    rotateLineHorizontal,
    closeContextMenu,
  };
}

export default useEventListeners;
