"use client";

import { useCallback, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

type DragGroupRef = React.MutableRefObject<THREE.Group | null>;

export function useInertiaDrag(groupRef: DragGroupRef, locked = false) {
  const state = useRef({ down: false, x: 0, y: 0, targetX: 0, targetY: 0 });

  const onDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (locked) return;
    const current = state.current;
    current.down = true;
    current.x = event.clientX;
    current.y = event.clientY;
    if (groupRef.current) {
      current.targetX = groupRef.current.rotation.x;
      current.targetY = groupRef.current.rotation.y;
    }
    const target = event.currentTarget as unknown as { setPointerCapture?: (pointerId: number) => void };
    target.setPointerCapture?.(event.pointerId);
  }, [groupRef, locked]);

  const onMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (locked) return;
    const current = state.current;
    if (!current.down) return;
    const deltaX = event.clientX - current.x;
    const deltaY = event.clientY - current.y;
    current.targetY = THREE.MathUtils.clamp(current.targetY + deltaX * 0.0045, -0.9, 0.9);
    current.targetX = THREE.MathUtils.clamp(current.targetX + deltaY * 0.0045, -0.65, 0.65);
    current.x = event.clientX;
    current.y = event.clientY;
  }, [locked]);

  const onUp = useCallback(() => {
    state.current.down = false;
    state.current.targetX = 0;
    state.current.targetY = 0;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const current = state.current;
    if (locked) {
      current.down = false;
      current.targetX = 0;
      current.targetY = 0;
    }
    const easing = locked ? 8.5 : current.down ? 7.5 : 3.8;
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, current.targetX, easing, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, current.targetY, easing, delta);
  });

  return { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp };
}
