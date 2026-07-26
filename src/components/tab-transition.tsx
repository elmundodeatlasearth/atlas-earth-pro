// src/components/tab-transition.tsx
// Animated tab transition with fade + slide
"use client";
import { useEffect, useState, useRef } from "react";

interface Props {
  activeTab: string;
  children: React.ReactNode;
}

export default function TabTransition({ activeTab, children }: Props) {
  const [display, setDisplay] = useState(children);
  const [animating, setAnimating] = useState(false);
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (activeTab === prevTab.current) return;
    setAnimating(true);
    const timeout = setTimeout(() => {
      setDisplay(children);
      prevTab.current = activeTab;
      setAnimating(false);
    }, 200);
    return () => clearTimeout(timeout);
  }, [activeTab, children]);

  return (
    <div className={`transition-all duration-300 ease-in-out ${
      animating
        ? "opacity-0 translate-y-2 scale-[0.98]"
        : "opacity-100 translate-y-0 scale-100"
    }`}>
      {animating ? display : children}
    </div>
  );
}
