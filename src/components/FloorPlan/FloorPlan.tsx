"use client";

import { useEffect, useCallback, useRef } from "react";
import "@archilogic/floor-plan-sdk/dist/style.css";
import { FloorPlanEngine, type FpeConfig } from "@archilogic/floor-plan-sdk";

// import dynamic from "next/dynamic";

// import Stage from "@/components/Stage/Stage";
// const Stage = dynamic(() => import("@/components/Stage/Stage"), { ssr: false });

const options: FpeConfig = {
  //
};

export default function FloorPlan() {
  const container = useRef<HTMLDivElement>(null);
  const floorPlan = useRef<FloorPlanEngine>(null);

  const init = useCallback(() => {
    container.current = document.getElementById("floor-plan") as HTMLDivElement;
    floorPlan.current = new FloorPlanEngine({
      container: container.current,
      options,
    });

    floorPlan.current.loadSpaceGraphJson({
      spatialStructure: {
        id: "main",
        type: "spatialStructure:layout",
        spatialGraph: {
          vertices: [
            { type: "spatialGraph:vertex", id: "v1", position: [0, 0] },
            { type: "spatialGraph:vertex", id: "v2", position: [2, 0] },
            { type: "spatialGraph:vertex", id: "v3", position: [2, 2] },
            { type: "spatialGraph:vertex", id: "v4", position: [0, 2] },
            { type: "spatialGraph:vertex", id: "v5", position: [4, 0] },
            { type: "spatialGraph:vertex", id: "v6", position: [4, 2] },
            // { type: "spatialGraph:vertex", id: "v7", position: [4, 4] },
          ],
          edges: [
            { type: "spatialGraph:edge", id: "e1", vertices: ["v1", "v2"] },
            // e2 is the shared edge
            { type: "spatialGraph:edge", id: "e2", vertices: ["v2", "v3"] },
            { type: "spatialGraph:edge", id: "e3", vertices: ["v3", "v4"] },
            { type: "spatialGraph:edge", id: "e4", vertices: ["v4", "v1"] },
            { type: "spatialGraph:edge", id: "e5", vertices: ["v2", "v5"] },
            { type: "spatialGraph:edge", id: "e6", vertices: ["v5", "v6"] },
            { type: "spatialGraph:edge", id: "e7", vertices: ["v6", "v3"] },
          ],
        },
        spaces: [
          {
            type: "layout:space",
            id: "s1",
            boundaries: [{ edges: ["e1", "e2", "e3", "e4"] }],
          },
          {
            type: "layout:space",
            id: "s2",
            boundaries: [{ edges: ["e5", "e6", "e7", "e2"] }],
          },
        //   {
        //     type: "layout:space",
        //     id: "s3",
        //     boundaries: [{ edges: ["e1", "e3", "e5", "e2"] }],
        //   },
        ],
        elements: [],
        // id: 'main',
      },
      schemaVersion: "",
      sharedResources: {
        products: [],
        geometries: [],
        materials: [],
        relations: [],
      },
    });
    // {
    //   spatialGraph: {
    //     vertices: [
    //       { type: "spatialGraph:vertex", id: "v1", position: [0, 0] },
    //       { type: "spatialGraph:vertex", id: "v2", position: [2, 0] },
    //       { type: "spatialGraph:vertex", id: "v3", position: [2, 2] },
    //       { type: "spatialGraph:vertex", id: "v4", position: [0, 2] },
    //       { type: "spatialGraph:vertex", id: "v5", position: [4, 0] },
    //       { type: "spatialGraph:vertex", id: "v6", position: [4, 2] },
    //     ],
    //     edges: [
    //       { type: "spatialGraph:edge", id: "e1", vertices: ["v1", "v2"] },
    //       // e2 is the shared edge
    //       { type: "spatialGraph:edge", id: "e2", vertices: ["v2", "v3"] },
    //       { type: "spatialGraph:edge", id: "e3", vertices: ["v3", "v4"] },
    //       { type: "spatialGraph:edge", id: "e4", vertices: ["v4", "v1"] },
    //       { type: "spatialGraph:edge", id: "e5", vertices: ["v2", "v5"] },
    //       { type: "spatialGraph:edge", id: "e6", vertices: ["v5", "v6"] },
    //       { type: "spatialGraph:edge", id: "e7", vertices: ["v6", "v3"] },
    //     ],
    //   },
    //   spaces: [
    //     {
    //       type: "layout:space",
    //       id: "s1",
    //       boundaries: [{ edges: ["e1", "e2", "e3", "e4"] }],
    //     },
    //     {
    //       type: "layout:space",
    //       id: "s2",
    //       boundaries: [{ edges: ["e5", "e6", "e7", "e2"] }],
    //     },
    //   ],
    // }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="font-sans min-h-screen">
      {/* <Stage /> */}
      <div id="floor-plan">{/*  */}</div>
    </div>
  );
}
