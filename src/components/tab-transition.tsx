// src/components/tab-transition.tsx
// Animated tab transition with fade + slide — shows NEW content during animation
"use client";
import { useEffect, useState, useRef } from "react";

interface Props {
  activeTab: string;
  children: React.ReactNode;
}

export default function TabTransition({ activeTab, children }: Props) {
  const [animClass, setAnimClass] = useState("opacity-100 translate-y-0 scale-100");
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (activeTab === prevTab.current) return;
    prevTab.current = activeTab;
    // Trigger re-animation on every tab change
    setAnimClass("opacity-0 translate-y-2 scale-[0.98]");
    const timeout = setTimeout(() => {
      setAnimClass("opacity-100 translate-y-0 scale-100");
    }, 50);
    return () => clearTimeout(timeout);
  }, [activeTab]);

  return (
    <div className={`transition-all duration-300 ease-in-out ${animClass}`}>
      {children}
    </div>
  );
}
