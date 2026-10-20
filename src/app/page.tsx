import dynamic from "next/dynamic";
import Navbar from "@/components/navbar";
import VideoBackground from "@/components/VideoBackground";
import HeroSection from "@/components/HeroSection";
import PhotosensitiveWarning from "@/components/PhotosensitiveWarning";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const ProjectSection = dynamic(
  () => import("@/components/ProjectSection"),
  { loading: () => null }
);

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />
      <VideoBackground />
      <HeroSection />
      <AboutSection />
      <ProjectSection />
      <Footer />
      <PhotosensitiveWarning />
    </div>
  );
}
