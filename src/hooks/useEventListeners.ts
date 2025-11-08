"use client";
import type { RefObject } from "react";
import Konva from "konva";

type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;

type Refs = {
  stage: RefObject<Konva.Stage | null>;
};

function useEventListeners({ refs }: { refs: Refs }) {}

export default useEventListeners;
