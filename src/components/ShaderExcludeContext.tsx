// components/ShaderExcludeContext.tsx
"use client";
import { createContext, useContext, useRef, useCallback, useState, useEffect } from "react";

type ExcludeRegistry = Map<string, React.RefObject<HTMLElement | null>>;

const ShaderExcludeContext = createContext<{
  register: (id: string, ref: React.RefObject<HTMLElement | null>) => void;
  unregister: (id: string) => void;
  getAll: () => ExcludeRegistry;
} | null>(null);

export function ShaderExcludeProvider({ children }: { children: React.ReactNode }) {
  const registryRef = useRef<ExcludeRegistry>(new Map());

  const register = useCallback((id: string, ref: React.RefObject<HTMLElement | null>) => {
    registryRef.current.set(id, ref);
  }, []);

  const unregister = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  const getAll = useCallback(() => registryRef.current, []);

  return (
    <ShaderExcludeContext.Provider value={{ register, unregister, getAll }}>
      {children}
    </ShaderExcludeContext.Provider>
  );
}

// Hook any component uses to opt itself out of the shader
export function useShaderExclude<T extends HTMLElement>(id: string) {
  const ref = useRef<T>(null);
  const ctx = useContext(ShaderExcludeContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.register(id, ref);
    return () => ctx.unregister(id);
  }, [ctx, id]);

  return ref;
}

// MouseShader reads from this
export function useShaderExcludeRegistry() {
  const ctx = useContext(ShaderExcludeContext);
  return ctx?.getAll() ?? new Map();
}