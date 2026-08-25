"use client";
import { useShaderExclude } from "@/components/ShaderExcludeContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  ArrowUpRight,
  User,
  FolderGit2,
  BriefcaseBusiness,
  Mail,
} from "lucide-react";

import { cn } from "@/lib/utils";
import LiquidGlass from "@/components/LiquidGlass/LiquidGlass";

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
  {
    label: "Experience",
    href: "#experience",
    icon: BriefcaseBusiness,
  },
  {
    label: "Contact",
    href: "#contact",
    icon: Mail,
  },
];

export default function Navbar() {
  const headerRef = useShaderExclude<HTMLElement>("navbar-header");
  const mobileNavRef = useShaderExclude<HTMLDivElement>("navbar-mobile");
  const { scrollY } = useScroll();

  const [floating, setFloating] = useState(false);
  const [active, setActive] = useState("#about");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 60;
    setFloating((prev) => (prev === next ? prev : next));
  });


  useEffect(() => {
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
        threshold: 0.45,
      }
    );


    sections.forEach((section) => {
      if (section) observer.observe(section);
    });


    return () => observer.disconnect();
  }, []);


  return (
    <>
      {/* Desktop / Top Navbar */}

      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pointer-events-none">

        <motion.div
          initial={false}
          animate={{
            width: floating ? 860 : "100%",
            marginTop: floating ? 14 : 0,
            height: floating ? 60 : 76,
            borderRadius: floating ? 9999 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
          }}
          className="w-full max-w-300 pointer-events-auto"
        >

          <LiquidGlass
            enabled={floating}
            blurAmount="50px"
            className={cn(
              "w-full h-full px-6 md:px-8",
              floating
                ? "liquid-glass bg-white/20 dark:bg-black/40 rounded-full"
                : "bg-transparent border-transparent shadow-none"
            )}
          >

            {/* Logo */}

            <Link
              href="#"
              className="
              text-lg md:text-xl 
              font-bold 
              tracking-tight 
              text-white
              dark:text-white
              "
            >
              DevHarryCode
              <span className="text-blue-500">
                .
              </span>
            </Link>


            {/* Desktop Links */}

            <nav className="hidden md:flex items-center gap-1">

              {navItems.map((item) => (
                
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                >
                  {item.label}
                </Link>
              ))}

            </nav>



            {/* CTA */}

            <Link
              href="#contact"
              className="
              hidden md:inline-flex
              liquid-btn
              items-center
              gap-1
              "
            >
              Let&apos;s Talk
              <ArrowUpRight size={16} />
            </Link>


          </LiquidGlass>

        </motion.div>

      </header>



      {/* Mobile Bottom Liquid Navigation */}

      <div
      ref={mobileNavRef}
        className="
        fixed
        bottom-5
        inset-x-0
        z-60
        flex
        justify-center
        md:hidden
        px-4
        pointer-events-none
        "
      >

        <motion.div
          initial={{
            y: 100,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25
          }}
          className="pointer-events-auto"
        >

          <LiquidGlass
            enabled
            blurAmount="55px"
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


      </div>

    </>
  );
}