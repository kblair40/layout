"use client";
import { useRef, useState, useEffect, type RefObject } from "react";
import type { LineConfig } from "konva/lib/shapes/Line";
import type { Vector2d } from "konva/lib/types";
import Konva from "konva";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

type Refs = {
  stage: RefObject<Konva.Stage | null>;
};

function useEventListeners({ refs }: { refs: Refs }) {
  const [stageListenersActive, setStageListenersActive] = useState(true);
  const [lines, setLines] = useState<LineConfig[]>([]);

  const isDrawing = useRef(false);

  //   }, [refs]);

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

  useEffect(() => {
    console.log("Stage change:", refs.stage.current);
    const stage = refs.stage.current;
    // if (stage) {
    //   stage.addEventListener("mousedown", handleMouseDown);
    //   stage.add;
    // }
  }, []);

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

  function handleClickLine(e: KonvaMouseEvent) {
    console.log("CLICK");
    console.log("E.TARGET:", {
      target: e.target,
      currentTarget: e.currentTarget,
    });
  }

  const listeners = {
    handleMouseDownOnStage: handleMouseDown,
    handleMouseUpOnStage: handleMouseUp,
    handleMouseMoveOnStage: handleMouseMove,
    handleDragStartLine: handleDragStart,
    handleClickLine,
  };

  return {
    listeners,
    lines,
    stageListenersActive,
    setStageListenersActive,
  };
}

export default useEventListeners;
