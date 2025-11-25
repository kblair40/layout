"use client";

import "client-only";
import React, { useState, useRef, useEffect } from "react";
import {
  Stage as Canvas,
  Layer as KonvaLayer,
  Rect,
  Text,
  Circle,
  Line,
  Group,
} from "react-konva";
import Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";
import { Portal, Html } from "react-konva-utils";

import { Button } from "../ui/button";
import useEventListeners from "@/hooks/useEventListeners";
import useObjectSnap from "@/hooks/useObjectSnap";
import { cn } from "@/lib/utils";

interface Props extends React.PropsWithChildren {
  //
}

const Layer = ({ children }: Props) => {
  const layer = useRef<Konva.Layer>(null);

  const { lines } = useEventListeners();
  const {
    // setStage: setSnapStage,
    setLayer,
    handleDragMove,
    handleDragEnd,
  } = useObjectSnap(lines);

  useEffect(() => {
    if (layer.current) setLayer(layer.current);
  }, []);

  return (
    <KonvaLayer
      ref={layer}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {children}
    </KonvaLayer>
  );
};

export default Layer;
