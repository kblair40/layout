import React, { useRef, useState } from "react";
import Konva from "konva";

import type { LineConfig } from "./useEventListeners";

function useObjectSnap(lines: LineConfig[]) {
  const stage = useRef<Konva.Stage>(null);

  const setStage = (_stage: Konva.Stage) => (stage.current = _stage);

  return {
    setStage,
  };
}

export default useObjectSnap;
