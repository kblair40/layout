"use client";

import dynamic from "next/dynamic";
const FloorPlan = dynamic(() => import("@/components/FloorPlan/FloorPlan"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      {/* <Stage /> */}
      <FloorPlan />
    </div>
  );
}
