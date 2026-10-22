import type { Metadata } from "next";
import "./globals.css";
import "@/styles/liquid-glass.css";
import { ShaderExcludeProvider } from "@/components/ShaderExcludeContext";
import MouseShader from "@/components/MouseShader";

export const metadata: Metadata = {
  metadataBase: new URL("https://devharrycode.vercel.app"),
  title: {
    default: "DevHarryCode",
    template: "%s | DevHarryCode",
  },
  description:
    "DevHarryCode is the creative engineering portfolio of Harshal Sharma — building immersive interfaces, intelligent systems, and expressive web experiences.",
  applicationName: "DevHarryCode",
  authors: [{ name: "Harshal Sharma", url: "https://devharrycode.vercel.app" }],
  creator: "Harshal Sharma",
  publisher: "Harshal Sharma",
  keywords: [
    "Harshal Sharma",
    "DevHarryCode",
    "MaTriX Programmer",
    "creative developer",
    "frontend developer",
    "full-stack developer",
    "immersive web experiences",
  ],
  alternates: {
    canonical: "https://devharrycode.vercel.app",
  },
  openGraph: {
    type: "website",
    url: "https://devharrycode.vercel.app",
    siteName: "DevHarryCode",
    title: "DevHarryCode",
    description:
      "Creative engineering, immersive interfaces, and intelligent digital experiences by Harshal Sharma.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevHarryCode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevHarryCode",
    description:
      "Creative engineering, immersive interfaces, and intelligent digital experiences by Harshal Sharma.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.svg",
  },
  category: "technology",
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans scroll-smooth scroll-pt-30"
    >
      
      <body className="min-h-full flex flex-col">

    <ShaderExcludeProvider>
      <MouseShader
  rippleIntensity={0.01}
  rippleSpeed={2.0}
  rippleRadius={10.0}
  accelThreshold={0.015} // Optional: Adjust how sensitive the fast flick streak is
  className="bg-slate-900 border-none"
>
        {children}
        </MouseShader>
        </ShaderExcludeProvider>
        </body>
    </html>
  );
}
