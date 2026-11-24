import dynamic from "next/dynamic";
import Navbar from "@/components/navbar";
import VideoBackground from "@/components/VideoBackground";
import HeroSection from "@/components/HeroSection";
import PhotosensitiveWarning from "@/components/PhotosensitiveWarning";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import StackSection from "@/components/StackSection";
import { IntroSequenceProvider } from "@/components/IntroSequenceProvider";

const ProjectSection = dynamic(
  () => import("@/components/ProjectSection"),
  { loading: () => null }
);

export default function Home() {
  return (
    <IntroSequenceProvider>
      <div className="relative min-h-screen bg-black text-white">
        <Navbar />
        <VideoBackground />
        <HeroSection />
        <AboutSection />
        <ProjectSection />
        <StackSection />
        <Footer />
        <PhotosensitiveWarning />
      </div>
    </IntroSequenceProvider>
  );
}
