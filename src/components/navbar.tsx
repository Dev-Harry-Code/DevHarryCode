"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import {
  ArrowUpRight,
  User,
  FolderGit2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import LiquidGlass from "@/components/LiquidGlass/LiquidGlass";
import { useIntroSequence } from "@/components/IntroSequenceProvider";

const navItems = [
  {
    label: "About",
    href: "#about",
    icon: User,
  },
  {
    label: "Projects",
    href: "#projects",
    icon: FolderGit2,
  },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const framerReducedMotion = useReducedMotion();
  const { phase, reducedMotion: contextReducedMotion } = useIntroSequence();
  const reducedMotion = Boolean(framerReducedMotion || contextReducedMotion);

  const [floating, setFloating] = useState(false);
  const [active, setActive] = useState("#about");
  const [navStage, setNavStage] = useState<"hidden" | "bubble" | "settled">("hidden");
  const [contentVisible, setContentVisible] = useState(false);

  const navOpen = reducedMotion
    ? phase !== "waiting-consent"
    : phase === "nav-open" || phase === "complete";

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 60;
    setFloating((prev) => (prev === next ? prev : next));
  });

  useEffect(() => {
    if (!navOpen) return;

    if (reducedMotion || phase === "complete") {
      const immediate = window.setTimeout(() => {
        setNavStage("settled");
        setContentVisible(true);
      }, 0);
      return () => window.clearTimeout(immediate);
    }

    const tBubble = window.setTimeout(() => {
      setNavStage("bubble");
    }, 10);
    const tContent = window.setTimeout(() => {
      setContentVisible(true);
    }, 170);
    const tSettle = window.setTimeout(() => {
      setNavStage("settled");
    }, 560);

    return () => {
      window.clearTimeout(tBubble);
      window.clearTimeout(tContent);
      window.clearTimeout(tSettle);
    };
  }, [navOpen, phase, reducedMotion]);

  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash && navItems.some((item) => item.href === window.location.hash)) {
        setActive(window.location.hash);
      }
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    const sections = navItems
      .map((item) => document.querySelector(item.href))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        });
      },
      {
        rootMargin: "-15% 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const showBubbleGlass = navStage === "bubble" || floating;
  const effectiveStage = reducedMotion && navOpen ? "settled" : navStage;

  const desktopAnimate = (() => {
    if (effectiveStage === "hidden") {
      return {
        width: 140,
        marginTop: 14,
        height: 44,
        borderRadius: 9999,
        y: -36,
        scaleY: 0.52,
        opacity: 0,
        filter: "blur(10px)",
      };
    }
    if (effectiveStage === "bubble") {
      return {
        width: 860,
        marginTop: 14,
        height: 60,
        borderRadius: 9999,
        y: [-32, 5, 0],
        scaleY: [0.55, 1.09, 0.98, 1],
        opacity: 1,
        filter: "blur(0px)",
      };
    }
    return {
      width: floating ? 860 : "100%",
      marginTop: floating ? 14 : 0,
      height: floating ? 60 : 76,
      borderRadius: floating ? 9999 : 0,
      y: 0,
      scaleY: 1,
      opacity: 1,
      filter: "blur(0px)",
    };
  })();

  const desktopTransition = reducedMotion
    ? { duration: 0.2 }
    : effectiveStage === "bubble"
      ? {
          duration: 0.52,
          ease: [0.16, 1, 0.3, 1] as const,
          y: { duration: 0.52, times: [0, 0.6, 1], ease: [0.16, 1, 0.3, 1] as const },
          scaleY: { duration: 0.52, times: [0, 0.45, 0.78, 1], ease: [0.16, 1, 0.3, 1] as const },
        }
      : {
          duration: 0.34,
          ease: [0.16, 1, 0.3, 1] as const,
        };

  return (
    <>
      {/* Desktop / Top Navbar */}

      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pointer-events-none">

        <motion.div
          initial={false}
          animate={desktopAnimate}
          transition={desktopTransition}
          className={cn(
            "w-full max-w-300 origin-top",
            navOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >

          <LiquidGlass
            enabled={showBubbleGlass}
            blurAmount="16px"
            className={cn(
              "w-full h-full px-6 md:px-8",
              showBubbleGlass
                ? "liquid-glass bg-white/20 dark:bg-black/40 rounded-full"
                : "bg-transparent border-transparent shadow-none"
            )}
          >

            {/* Logo */}

            <Link
              href="#"
              className={cn(
                "text-lg md:text-xl font-bold tracking-tight text-white dark:text-white transition-all duration-300",
                contentVisible || reducedMotion ? "opacity-100 blur-0" : "opacity-0 blur-[6px]"
              )}
            >
              DevHarryCode
              <span className="text-blue-500">
                .
              </span>
            </Link>


            {/* Desktop Links */}

            <nav
              className={cn(
                "hidden md:flex items-center gap-1 transition-all duration-300",
                contentVisible || reducedMotion ? "opacity-100 blur-0" : "opacity-0 blur-[6px]"
              )}
            >

              {navItems.map((item) => (
                
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                  aria-current={active === item.href ? "location" : undefined}
                >
                  {item.label}
                </Link>
              ))}

            </nav>



            {/* CTA */}

            <Link
              href="mailto:dev.harshalsharma@gmail.com"
              className={cn(
                "hidden md:inline-flex liquid-btn items-center gap-1 transition-all duration-300",
                contentVisible || reducedMotion ? "opacity-100 blur-0" : "opacity-0 blur-[6px]"
              )}
            >
              Let&apos;s Talk
              <ArrowUpRight size={16} />
            </Link>


          </LiquidGlass>

        </motion.div>

      </header>



      {/* Mobile Bottom Liquid Navigation */}

      <nav
        className="
        fixed
        bottom-5
        inset-x-0
        z-[60]
        flex
        justify-center
        md:hidden
        px-4 pb-[env(safe-area-inset-bottom)]
        pointer-events-none
        "
      >

        <motion.div
          initial={false}
          animate={
            navOpen
              ? { y: 0, opacity: 1, scale: 1 }
              : { y: 100, opacity: 0, scale: 0.78 }
          }
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : {
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                }
          }
          className={navOpen ? "pointer-events-auto" : "pointer-events-none"}
        >

          <LiquidGlass
            enabled
            blurAmount="16px"
            className="
            liquid-glass
            rounded-full
            bg-white/20
            dark:bg-black/40
            px-2
            py-2
            "
          >

            <div className="flex items-center gap-1 text-white">


              {navItems.map((item) => {

                const Icon = item.icon;
                const selected = active === item.href;


                return (

                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActive(item.href)}
                    aria-label={item.label}
                    aria-current={selected ? "location" : undefined}
                  >

                    <motion.div
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 28
                      }}
                      className={cn(
                        `
  relative
  flex
  min-h-11
  min-w-11
  items-center
  gap-2
  rounded-full
  px-3
  py-2
  text-sm
  font-medium
  overflow-hidden
  transition-colors
  `,
                        selected
                          ? "text-white"
                          : "text-white-700 dark:text-white-300"
                      )}
                    >


                      {
                        selected && (
                          <motion.div
                            layoutId="mobile-active-pill"
                            className="
                            absolute
                            inset-0
                            rounded-full
                            bg-linear-to-tr
                            from-transparent
                            to-white/20
                            " 
                          />
                        )
                      }



                      <motion.div
                        className="relative z-10"
                        animate={
                          selected
                            ?
                            {
                              rotate: [
                                0,
                                -10,
                                10,
                                -5,
                                5,
                                0
                              ],
                              scale: [
                                1,
                                1.15,
                                1
                              ]
                            }
                            :
                            {}
                        }
                        transition={{
                          duration: .55
                        }}
                      >

                        <Icon size={18} />

                      </motion.div>



                      <motion.span
                        className="
                        relative
                        z-10
                        whitespace-nowrap
                        overflow-hidden
                        "
                        animate={{
                          width: selected ? "auto" : 0,
                          opacity: selected ? 1 : 0
                        }}
                      >
                        {item.label}
                      </motion.span>


                    </motion.div>

                  </Link>

                )

              })}


            </div>

          </LiquidGlass>


        </motion.div>


      </nav>

    </>
  );
}
