"use client";
import { motion } from "framer-motion";

/** Scroll-triggered fade/slide-in. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, sub, center }: { eyebrow?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto mb-10 max-w-2xl text-center" : "mb-10 max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="text-3xl md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-navy-400">{sub}</p>}
    </div>
  );
}
