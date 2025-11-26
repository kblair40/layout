import { useRef, useState, useCallback, useEffect } from "react";
import Konva from "konva";
import type { Node, NodeConfig } from "konva/lib/Node";

import type { LineConfig } from "./useEventListeners";
import type { KonvaMouseEvent } from "@/lib/event-listener-utils";

const GUIDELINE_OFFSET = 5;

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

  const setLayer = (layer: Konva.Layer, stage: Konva.Stage) => {
    // _setLayer(layer)
    layerRef.current = layer;
    stageRef.current = stage;

    init();
  };

  function init() {
    const stage = stageRef.current;
    const layer = layerRef.current;

    if (!stage || !layer) {
      console.log("Stage and/or layerRef refs not set:", { stage, layer });
      return;
    }

    // setStage(stage);
    // setLayer(layer);

    for (let i = 0; i < 5; i++) {
      const rect = new Konva.Rect({
        x: Math.random() * stage.width(),
        y: Math.random() * stage.height(),
        width: 50 + Math.random() * 50,
        height: 50 + Math.random() * 50,
        fill: Konva.Util.getRandomColor(),
        // rotation: Math.random() * 360,
        draggable: true,
        name: "object",
      });

      rect.on("dragmove", (e: Konva.KonvaEventObject<DragEvent>) =>
        // onDragMove(e)
        handleDragMove(e)
      );
      rect.on("dragend", (e: Konva.KonvaEventObject<DragEvent>) =>
        handleDragEnd(e)
      );

      layer.add(rect);
    }

    layer.draw();
  }

  // const didDraw = useRef(false);
  // useEffect(() => {
  //   if (didDraw.current) return;
  //   didDraw.current = true;

  //   const stage = stageRef.current;
  //   const layer = layerRef.current;

  //   if (!stage || !layer) {
  //     console.log("Stage and/or layerRef refs not set:", { stage, layer });
  //     return;
  //   }

  //   // setStage(stage);
  //   // setLayer(layer);

  //   for (let i = 0; i < 5; i++) {
  //     const rect = new Konva.Rect({
  //       x: Math.random() * stage.width(),
  //       y: Math.random() * stage.height(),
  //       width: 50 + Math.random() * 50,
  //       height: 50 + Math.random() * 50,
  //       fill: Konva.Util.getRandomColor(),
  //       // rotation: Math.random() * 360,
  //       draggable: true,
  //       name: "object",
  //     });

  //     rect.on("dragmove", (e: Konva.KonvaEventObject<DragEvent>) =>
  //       // onDragMove(e)
  //       handleDragMove(e)
  //     );
  //     rect.on("dragend", (e: Konva.KonvaEventObject<DragEvent>) =>
  //       handleDragEnd(e)
  //     );

  //     layer.add(rect);
  //   }

  //   layer.draw();
  // }, []);

  // were can we snap our objects?
  function getLineGuideStops(skipShape: Konva.Shape) {
    const stage = skipShape.getStage();
    if (!stage) return { vertical: [], horizontal: [] };

    // const [w, h] = [stage.width(), stage.height()];
    // we can snap to stage borders and the center of the stage
    // const vertical: (number | number[])[] = [0, w / 2, w];
    // const horizontal: (number | number[])[] = [0, h / 2, h];

    const vertical: (number | number[])[] = [
      0,
      stage.width() / 2,
      stage.width(),
    ];
    const horizontal: (number | number[])[] = [
      0,
      stage.height() / 2,
      stage.height(),
    ];

    // and we snap over edges and center of each object on the canvas
    // stage.find(".wall").forEach((guideItem) => {
    stage.find(".object").forEach((guideItem) => {
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

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  // function getObjectSnappingEdges(node: Node<NodeConfig>): SnappingEdges {
  const getObjectSnappingEdges = useCallback(
    (node: Konva.Shape): SnappingEdges => {
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
          const diff = Math.abs(lineGuide - itemBound.guide);
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
    setLayer,
    handleDragMove,
    handleDragEnd,
    guides,
  };
}

export default useObjectSnap;
