import { useRef, useState, useCallback, useEffect } from "react";
import Konva from "konva";
import type { Node, NodeConfig } from "konva/lib/Node";

import type { LineConfig } from "./useEventListeners";
import type { KonvaMouseEvent } from "@/lib/event-listener-utils";

const GUIDELINE_OFFSET = 12;
// const GUIDELINE_OFFSET = 5;
const LINE_WIDTH = 4;
const HALF_LINE_WIDTH = LINE_WIDTH / 2;

type Snap = "start" | "center" | "end";
interface SnappingEdges {
  vertical: Array<{
    guide: number;
    offset: number;
    snap: Snap;
  }>;
  horizontal: Array<{
    guide: number;
    offset: number;
    snap: Snap;
  }>;
}

interface Guide {
  lineGuide: number;
  diff: number;
  snap?: string;
  offset: number;
  orientation?: "V" | "H";
}

function useObjectSnap() {
  const [guides, setGuides] = useState<Guide[]>();
  // const [stage, setStage] = useState<Konva.Stage>();
  // const [layer, _setLayer] = useState<Konva.Layer>();

  const layerRef = useRef<Konva.Layer>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const setLayerAndStage = (layer: Konva.Layer, stage: Konva.Stage) => {
    layerRef.current = layer;
    stageRef.current = stage;
  };

  // were can we snap our objects?
  function getLineGuideStops(skipShape: Konva.Shape) {
    const stage = skipShape.getStage();
    if (!stage) return { vertical: [], horizontal: [] };

    const [w, h] = [stage.width(), stage.height()];
    // we can snap to stage borders and the center of the stage
    const vertical: (number | number[])[] = [0, w / 2, w];
    const horizontal: (number | number[])[] = [0, h / 2, h];

    // and we snap over edges and center of each object on the canvas
    stage.find(".wall").forEach((guideItem) => {
      // stage.find(".object").forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();
      console.log("BOX:", box);
      // and we can snap to all edges of shapes
      // // ORIGINAL
      // vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      // horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);

      // NEW (tweaking due to use of line instead of rect)
      vertical.push([
        box.x,
        // box.x - 1,
        // box.x + 1,
        box.x - 2,
        box.x + box.width,
        // box.x + box.width / 2,
      ]);
      horizontal.push([
        box.y,
        // box.y - 1,
        // box.y + 1,
        box.y - 2,
        box.y + box.height,
        // box.y + box.height / 2,
      ]);
    });

    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  }

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  // function getObjectSnappingEdges(node: Node<NodeConfig>): SnappingEdges {
  const getObjectSnappingEdges = useCallback(
    (node: Konva.Shape): SnappingEdges => {
      const box = node.getClientRect();
      const absPos = node.absolutePosition();
      console.log("BOX/absPos:", { box, absPos });

      // Original
      // return {
      //   vertical: [
      //     {
      //       guide: Math.round(box.x),
      //       offset: Math.round(absPos.x - box.x),
      //       snap: "start",
      //     },
      //     {
      //       guide: Math.round(box.x + box.width / 2),
      //       offset: Math.round(absPos.x - box.x - box.width / 2),
      //       snap: "center",
      //     },
      //     {
      //       guide: Math.round(box.x + box.width),
      //       offset: Math.round(absPos.x - box.x - box.width),
      //       snap: "end",
      //     },
      //   ],
      //   horizontal: [
      //     {
      //       guide: Math.round(box.y),
      //       offset: Math.round(absPos.y - box.y),
      //       snap: "start",
      //     },
      //     {
      //       guide: Math.round(box.y + box.height / 2),
      //       offset: Math.round(absPos.y - box.y - box.height / 2),
      //       snap: "center",
      //     },
      //     {
      //       guide: Math.round(box.y + box.height),
      //       offset: Math.round(absPos.y - box.y - box.height),
      //       snap: "end",
      //     },
      //   ],
      // };

      // New - updating for line instead of rect
      const res: SnappingEdges = {
        vertical: [
          {
            guide: Math.round(box.x) - 2,
            offset: Math.round(absPos.x - box.x) - 2,
            snap: "start",
          },
          {
            guide: Math.round(box.x + LINE_WIDTH / 2) - 2,
            offset: Math.round(absPos.x - box.x - LINE_WIDTH / 2) - 2,
            snap: "center",
          },
          {
            guide: Math.round(box.x + HALF_LINE_WIDTH) - 2,
            offset: Math.round(absPos.x - box.x - HALF_LINE_WIDTH) - 2,
            snap: "end",
          },
        ],
        horizontal: [
          {
            guide: Math.round(box.y) + 2,
            offset: Math.round(absPos.y - box.y) + 2,
            snap: "start",
          },
          {
            guide: Math.round(box.y + LINE_WIDTH / 2) + 2,
            offset: Math.round(absPos.y - box.y - LINE_WIDTH / 2) + 2,
            snap: "center",
          },
          {
            guide: Math.round(box.y + HALF_LINE_WIDTH) + 2,
            offset: Math.round(absPos.y - box.y - HALF_LINE_WIDTH) + 2,
            snap: "end",
          },
        ],
      };
      // console.log("getObjectSnappingEdges:", res);
      return res;
    },
    []
  );

  // find all snapping possibilities
  const getGuides = useCallback(
    (
      lineGuideStops: { vertical: number[]; horizontal: number[] },
      itemBounds: SnappingEdges
    ) => {
      const resultV: Guide[] = [];
      const resultH: Guide[] = [];

      lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound) => {
          const diff = Math.abs(lineGuide - itemBound.guide);
          // console.log("diff:", diff);
          // if the distance between guild line and object snap point is close we can consider this for snapping
          if (diff < GUIDELINE_OFFSET) {
            resultV.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            });
          } else {
            console.warn("Vertical skipping", {
              lineGuide,
              snappingEdge: itemBound,
            });
          }
        });
      });

      lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound) => {
          const diff = Math.abs(lineGuide - itemBound.guide);
          // console.log("diff:", diff);
          if (diff < GUIDELINE_OFFSET) {
            resultH.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            });
          } else {
            console.warn("NO GUIDE");
            console.warn("Horizontal skipping", {
              lineGuide,
              snappingEdge: itemBound,
            });
          }
        });
      });

      const guides = [];

      // find closest snap
      const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
      const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
      if (minV) {
        guides.push({
          lineGuide: minV.lineGuide,
          offset: minV.offset,
          orientation: "V",
          snap: minV.snap,
        });
      }
      if (minH) {
        guides.push({
          lineGuide: minH.lineGuide,
          offset: minH.offset,
          orientation: "H",
          snap: minH.snap,
        });
      }
      return guides;
    },
    []
  );

  const drawGuides = useCallback(
    (guides: ReturnType<typeof getGuides>, layer: Konva.Layer) => {
      guides.forEach((lg) => {
        if (lg.orientation === "H") {
          const line = new Konva.Line({
            points: [-6000, 0, 6000, 0],
            stroke: "rgb(0, 161, 255)",
            strokeWidth: 1,
            name: "guide-line",
            dash: [4, 6],
          });

          layer.add(line);

          line.absolutePosition({
            x: 0,
            y: lg.lineGuide,
          });
        } else if (lg.orientation === "V") {
          const line = new Konva.Line({
            points: [0, -6000, 0, 6000],
            stroke: "rgb(0, 161, 255)",
            strokeWidth: 1,
            name: "guide-line",
            dash: [4, 6],
          });

          layer.add(line);

          line.absolutePosition({
            x: lg.lineGuide,
            y: 0,
          });
        }
      });
    },
    []
  );

  const handleDragMove = useCallback(
    // (e: KonvaMouseEvent) => {
    (e: Konva.KonvaEventObject<DragEvent>) => {
      console.log("LAYER DRAG MOVE");

      const layer = e.target.getLayer()!;
      console.log("LAYER:", layer);

      const lines = layer.find(".guide-line") as Konva.Shape[];
      console.log("LINES:", lines);

      // clear all previous lines on the screen
      lines.forEach((l: Konva.Shape) => l.destroy());

      // find possible snapping lines
      const lineGuideStops = getLineGuideStops(e.target as Konva.Shape);
      // find snapping points of current object
      const itemBounds = getObjectSnappingEdges(e.target as Konva.Shape);

      console.log({ lineGuideStops, itemBounds });

      if (!lineGuideStops) {
        return;
      }

      // now find where can we snap current object
      const guides = getGuides(lineGuideStops, itemBounds);

      // do nothing of no snapping
      if (!guides.length) {
        return;
      }

      drawGuides(guides, layer);
      // setGuides(guides as Guide[]);

      const absPos = e.target.absolutePosition();

      guides.forEach((lg) => {
        switch (lg.snap) {
          case "start": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
          case "center": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
          case "end": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
        }
      });

      e.target.absolutePosition(absPos);
    },
    [drawGuides, getGuides, getObjectSnappingEdges]
  );

  function handleDragEnd(e: KonvaMouseEvent) {
    const layer = e.target.getLayer();
    console.log("LAYER DRAG END");
    // clear all previous lines on the screen
    layer?.find(".guide-line").forEach((l) => l.destroy());
    // setGuides(undefined);
  }

  return {
    setLayerAndStage,
    handleDragMove,
    handleDragEnd,
    guides,
  };
}

export default useObjectSnap;
