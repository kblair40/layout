"use client";
import { useRef, useState } from "react";
import type { LineConfig } from "konva/lib/shapes/Line";
import type { Vector2d } from "konva/lib/types";
import Konva from "konva";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

function useEventListeners() {
  const [stageListenersActive, setStageListenersActive] = useState(true);
  const [lines, setLines] = useState<LineConfig[]>([]);
  const [dragging, setDragging] = useState(false);

  const stage = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);

  function setStage(_stage: Konva.Stage) {
    stage.current = _stage;
  }

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
    console.log("\nMOUSE DOWN", e.target.id());
    isDrawing.current = true;
    const pos = getMousePosition(e);
    setLines([
      ...lines,
      { points: [pos.x, pos.y], id: lines.length.toString() },
    ]);
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

    console.log("SETTING LINES TO:", [...lines], "\n\n");
  };

  const handleDragStart = (e: KonvaMouseEvent) => {
    setDragging(true);
    e.evt.preventDefault();
    console.log("Drag Start:", e.target.id());
    // const id = e.target.id();
  };

  const handleDragEnd = (e: KonvaMouseEvent) => {
    const line = e.target;
    console.log("Drag End Evt:", e, { id: line.id() });
    e.evt.preventDefault();

    const position = line.position();
    const points = line.attrs.points;

    const newPoints = points.map((point: number, index: number) => {
      if (index % 2 === 0) {
        console.log("returning:", point + position.x);
        return point + position.x;
      }
      return point + position.y;
    });
    console.log("Points After:", newPoints);

    if (stage.current) {
      console.log("Stage:", {
        children: stage.current.getChildren(),
        getClientRect: stage.current.getClientRect(),
        getAbsolutePosition: e.target.getAbsolutePosition(stage.current),
        getAbsoluteTransform: e.target.getAbsoluteTransform(stage.current),
      });
    }

    setLines([{ points }]);
    setDragging(false);
  };

  // const handleDragEnd = (e: KonvaMouseEvent) => {
  //   const line = e.target;
  //   console.log("Drag End Evt:", e, { id: line.id() });
  //   e.evt.preventDefault();

  //   const position = line.position();
  //   const points = line.attrs.points;

  //   const newPoints = points.map((point: number, index: number) => {
  //     if (index % 2 === 0) {
  //       console.log("returning:", point + position.x);
  //       return point + position.x;
  //     }
  //     return point + position.y;
  //   });
  //   console.log("Points After:", newPoints);

  //   const id = line.id();
  //   const storedLineIndex = lines.findIndex((l) => l.id === id);
  //   if (storedLineIndex === -1) {
  //     console.log("LINE NOT FOUND", id);
  //     return;
  //   }
  //   const linesCopy = [...lines];
  //   const lineToUpdate = { ...linesCopy[storedLineIndex] };
  //   lineToUpdate.points = (lineToUpdate.points?.slice(0, 2) as number[]).concat(
  //     newPoints.slice(-2)
  //   );
  //   // linesCopy[storedLineIndex] = {
  //   //   ...linesCopy[storedLineIndex],
  //   //   points: newPoints,
  //   // };
  //   linesCopy[storedLineIndex] = lineToUpdate;

  //   setLines(linesCopy);
  //   // setLines([{ points }]);
  //   setDragging(false);
  // };

  function handleClickLine(e: KonvaMouseEvent) {
    console.log("CLICKED LINE - E.TARGET:", {
      target: e.target,
      currentTarget: e.currentTarget,
    });
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
    setStageListenersActive,
    setStage,
  };
}

export default useEventListeners;
