"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Coffee, Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      className="relative z-10 overflow-hidden border-t border-white/10 bg-black px-6 pb-10 pt-20 text-white sm:pb-12 sm:pt-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <div>
            <Link
              href="#"
              className="group inline-flex items-baseline text-6xl font-bold tracking-[-0.08em] text-white transition-opacity hover:opacity-75 sm:text-8xl"
            >
              DevHarryCode<span className="text-white/40 transition-colors duration-300 ease-in-out group-hover:text-blue-500">.</span>
              <ArrowUpRight className="ml-2 h-6 w-6 -translate-y-1 text-white/50 transition-all duration-300 ease-in-out group-hover:-translate-y-2 group-hover:translate-x-1 group-hover:text-blue-500 sm:h-8 sm:w-8" />
            </Link>
            <p className="mt-5 max-w-md font-mono text-xs uppercase tracking-[0.2em] text-white/40 sm:text-sm">
              Building strange, useful, beautiful things on the internet.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 font-mono text-xs uppercase tracking-[0.18em] text-white/55 md:items-end">
            <span className="flex items-center gap-2">
              <span className="group flex items-center gap-2 transition-colors duration-300 ease-in-out hover:text-amber-300">
                <Coffee className="h-4 w-4 transition-colors duration-300 ease-in-out group-hover:text-amber-300" /> made with coffee
              </span>
            </span>
            <span className="group flex items-center gap-2">
              and <Heart className="h-4 w-4 fill-current transition-colors duration-300 ease-in-out group-hover:text-red-500" /> love
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 DevHarryCode</span>
          <span>Creative engineering / shipped with intent</span>
        </div>
      </div>
    </motion.footer>
  );
}
