"use client";

import dynamic from "next/dynamic";
const Stage = dynamic(() => import("@/components/Stage/Stage"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      <Stage />
    </div>
  );
}
