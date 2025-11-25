import { useRef } from "react";
import Konva from "konva";
import type { Node, NodeConfig } from "konva/lib/Node";

import type { LineConfig } from "./useEventListeners";
import type { KonvaMouseEvent } from "@/lib/event-listener-utils";

const GUIDELINE_OFFSET = 5;

function useObjectSnap(lines: LineConfig[]) {
  const layer = useRef<Konva.Layer>(null);
  
  const setLayer = (_layer: Konva.Layer) => {
    layer.current = _layer;
  };

  // were can we snap our objects?
  function getLineGuideStops(skipShape?: Node<NodeConfig>) {
    // const stage = getStage();
    const stage = layer.current?.getStage();
    if (!stage) return;
    const [w, h] = [stage.width(), stage.height()];
    // we can snap to stage borders and the center of the stage
    const vertical: (number | number[])[] = [0, w / 2, w];
    const horizontal: (number | number[])[] = [0, h / 2, h];

    // and we snap over edges and center of each object on the canvas
    stage.find(".wall").forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();
      // and we can snap to all edges of shapes
      vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });

    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  }

  interface SnappingEdge {
    guide: number;
    offset: number;
    snap: string;
  }

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  function getObjectSnappingEdges(node: Node<NodeConfig>): {
    vertical: SnappingEdge[];
    horizontal: SnappingEdge[];
  } {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: "start",
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: "end",
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: "start",
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: "end",
        },
      ],
    };
  }

  interface Guide {
    lineGuide: number;
    diff: number;
    snap?: string;
    offset: number;
    orientation?: "V" | "H";
  }

  // find all snapping possibilities
  function getGuides(
    lineGuideStops: { vertical: number[]; horizontal: number[] },
    itemBounds: { vertical: SnappingEdge[]; horizontal: SnappingEdge[] }
  ) {
    const resultV: Guide[] = [];
    const resultH: Guide[] = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    var guides = [];

    // find closest snap
    var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
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
  }

  function drawGuides(guides: Guide[]) {
    guides.forEach((lg) => {
      if (lg.orientation === "H") {
        var line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guide-line",
          dash: [4, 6],
        });

        layer.current?.add(line);

        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
      } else if (lg.orientation === "V") {
        var line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guide-line",
          dash: [4, 6],
        });

        layer.current?.add(line);

        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
      }
    });
  }

  function handleDragMove(e: KonvaMouseEvent) {
    console.log("LAYER DRAG MOVE");
    if (!layer.current) return;
    layer.current.find("guide-line").forEach((l) => l.destroy());

    // find possible snapping lines
    const lineGuideStops = getLineGuideStops(e.target);
    // find snapping points of current object
    const itemBounds = getObjectSnappingEdges(e.target);

    if (!lineGuideStops) {
      return;
    }

    // now find where can we snap current object
    const guides = getGuides(lineGuideStops, itemBounds);

    // do nothing of no snapping
    if (!guides.length) {
      return;
    }

    drawGuides(guides as Guide[]);

    const absPos = e.target.absolutePosition();

    guides.forEach((lg) => {
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
    });
    e.target.absolutePosition(absPos);
  }

  function handleDragEnd() {
    console.log("LAYER DRAG END");
    // clear all previous lines on the screen
    layer.current?.find(".guide-line").forEach((l) => l.destroy());
  }

  return {
    // setStage,
    setLayer,
    handleDragMove,
    handleDragEnd,
  };
}

export default useObjectSnap;
