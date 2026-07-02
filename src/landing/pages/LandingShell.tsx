import type { ReactNode } from "react";
import { useRef } from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { ScrollContainerContext } from "./ScrollContainerContext";
import "../landing.css";

type LandingShellProps = {
  children: ReactNode;
};

export function LandingShell({ children }: LandingShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <div
        ref={scrollRef}
        className="landing-page landing-bg-white h-screen w-screen overflow-y-auto overflow-x-hidden text-[var(--uu-ink)]"
      >
        <Navigation />
        <main>{children}</main>
        <Footer />
      </div>
    </ScrollContainerContext.Provider>
  );
}
