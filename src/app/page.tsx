"use client";

import dynamic from "next/dynamic";

// import Stage from "@/components/Stage/Stage";
const Stage = dynamic(() => import("@/components/Stage/Stage"), { ssr: false });

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      <Stage />
    </div>
  );
}
