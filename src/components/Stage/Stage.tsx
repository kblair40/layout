"use client";

import "client-only";
import React, { useState, useRef, useEffect } from "react";
import {
  Stage as Canvas,
  Layer,
  Rect,
  Text,
  Circle,
  Line,
  Group,
} from "react-konva";
import Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";
import { Portal, Html } from "react-konva-utils";

import { Button } from "../ui/button";
import useEventListeners from "@/hooks/useEventListeners";

const DEFAULT_LINE: Partial<LineConfig> = {
  strokeWidth: 3,
  stroke: "black",
  draggable: true,
};

const Stage = () => {
  const layer = useRef<Konva.Layer>(null);
  const canvas = useRef<Konva.Stage>(null);

  function listLines() {
    if (!layer.current || !canvas.current) {
      console.log("No Layer");
      return;
    }

    const children = layer.current.getChildren();
    console.log(
      "\nChildren:",
      children,
      "type =",
      typeof children,
      "isArray =",
      Array.isArray(children)
    );

    for (let child of children) {
      if (child instanceof Konva.Line) {
        console.log("Found LINE:", child.attrs.points);

        console.log({
          pos: child.getAbsolutePosition(canvas.current),
          transform: child.getAbsoluteTransform(canvas.current),
        });
      }
    }
  }

  useEffect(() => {
    if (canvas.current) setStage(canvas.current);
  }, []);

  const {
    listeners,
    lines,
    actionState,
    stageListenersActive,
    selectedLine,
    menuPosition,
    isDrawing,
    setStageListenersActive,
    setStage,
    rotateLineVertical,
    rotateLineHorizontal,
    closeContextMenu,
  } = useEventListeners();

  function handleClickRotate(dir: "horizontal" | "vertical") {
    console.log("Rotate", dir);
    if (dir === "horizontal") rotateLineHorizontal();
    else rotateLineVertical();

    closeContextMenu();
  }

  return (
    <div>
      <Canvas
        ref={canvas}
        className="border"
        onMouseDown={listeners.handleMouseDownOnStage}
        onMouseMove={listeners.handleMouseMoveOnStage}
        onMouseup={listeners.handleMouseUpOnStage}
        width={window?.innerWidth || 0}
        height={window?.innerHeight - 100 || 0}
      >
        <Layer ref={layer}>
          {lines.map((line, i) => {
            return (
              <Line
                key={i}
                {...DEFAULT_LINE}
                x={0}
                y={0}
                id={line.id}
                points={line.points}
                onDragStart={listeners.handleDragStartLine}
                onDragEnd={listeners.handleDragEndLine}
                onMouseEnter={(e) => {
                  document.body.style.cursor = "pointer";
                }}
                onMouseLeave={(e) => {
                  document.body.style.cursor = "default";
                }}
                onContextMenu={(e) => {
                  console.log("Ctx menu");
                  e.evt.stopPropagation();
                  e.evt.preventDefault();
                  listeners.handleContextMenu(e);
                }}
                onMouseDown={(e) => {
                  console.log("Stopping mousedown:", e);
                  e.evt.stopPropagation();
                  e.evt.preventDefault();
                }}
                stroke={selectedLine?.id === line.id ? "#19a" : "#000"}
              />
            );
          })}

          <Portal selector=".top">
            {/* content of that portal will be moved into "top" group*/}
            {/* <Rect width={100} height={100} fill="red" draggable /> */}

            {/* {selectedLine && (
              // Subtract 50% of width and 100% of height
              <Group x={selectedLine.x - 100} y={selectedLine.y - 100}>
                <Rect
                  stroke="#010c0d"
                  fill="#f8f8f8"
                  strokeWidth={2}
                  width={200}
                  height={100}
                  // Subtract 50% of width and 100% of height
                  // x={selectedLine.x - 50}
                  // y={selectedLine.y - 100}
                ></Rect>
                <Circle
                  // x={selectedLine.x - 20}
                  // y={selectedLine.y - 50}
                  stroke="#000"
                  strokeWidth={2}
                  width={25}
                  height={25}
                />
              </Group>
            )} */}

            {selectedLine && menuPosition && (
              <Html>
                <div
                  style={{
                    top: menuPosition.y,
                    left: menuPosition.x,
                    // top: selectedLine.y - 80,
                    // left: selectedLine.x - 80,
                  }}
                  className="absolute w-40 h-20 border px-1 flex flex-col justify-evenly"
                >
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleClickRotate("vertical")}
                  >
                    Rotate Vertical
                  </Button>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleClickRotate("horizontal")}
                  >
                    Rotate Horizontal
                  </Button>
                </div>
              </Html>
            )}
          </Portal>
          <Group name="top" />
        </Layer>
      </Canvas>

      <div className="h-[100px] flex items-center gap-x-4 px-4 relative">
        <div className="flex flex-col gap-y-1 pl-12">
          <button
            className="border text-sm px-2 py-1 flex justify-center items-center rounded-sm bg-white transition-colors hover:bg-neutral-100 duration-150 cursor-pointer active:bg-neutral-200"
            onClick={() => setStageListenersActive((cur) => !cur)}
          >
            {stageListenersActive ? "disable" : "enable"} stage listeners
          </button>
          <div className="text-sm leading-tight font-medium">
            <p>Drawing: {String(isDrawing)}</p>
            <p>Dragging: {String(actionState.isDragging)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-y-1">
          <div># of Lines = {lines.length}</div>

          <button
            className="border px-2 py-1 flex justify-center items-center rounded-sm bg-white transition-colors hover:bg-neutral-100 duration-150 cursor-pointer active:bg-neutral-200"
            onClick={listLines}
          >
            List Lines
          </button>
        </div>

        <div className="absolute -top-60 right-0 bottom-0 w-60 max-h-[340px] border z-50 bg-neutral-50 overflow-y-auto">
          {lines.map((l, i) => {
            return (
              <div key={i}>
                {`Line ${l.id} =`}
                <pre>{JSON.stringify(l, null, 2)}</pre>
              </div>
            );
          })}
        </div>

        <pre>
          selectedLine:
          {selectedLine ? JSON.stringify(selectedLine) : null}
        </pre>
      </div>
    </div>
  );
};

export default Stage;
