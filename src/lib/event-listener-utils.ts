import Konva from "konva";
import type { Vector2d } from "konva/lib/types";

// import type { LineConfig } from "@/hooks/useEventListeners";

export type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

export function getLineLength(p: number[]) {
  return Math.sqrt((p[2] -= p[0]) * p[2] + (p[3] -= p[1]) * p[3]);
}

export function getMousePosition(e: KonvaMouseEvent): Vector2d {
  const pos = e.target.getStage()?.getPointerPosition();
  if (!pos) throw new Error("STAGE NOT PRESENT");

  return pos;
}
