"use client";

import dynamic from "next/dynamic";
const Stage = dynamic(() => import("@/components/Stage/Stage"), {
  ssr: false,
});
const Stage2 = dynamic(() => import("@/components/Stage/Stage2"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      <Stage2 />
      {/* <Stage /> */}
    </div>
  );
}
