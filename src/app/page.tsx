import Navbar from "@/components/navbar";
import VideoBackground from "@/components/VideoBackground";
import HeroSection from "@/components/HeroSection";
import MainContent from "@/components/MainContent";
import PhotosensitiveWarning from "@/components/PhotosensitiveWarning";
import AboutSection from "@/components/AboutSection";
import ProjectSection from "@/components/ProjectSection";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />
      <VideoBackground />
      <HeroSection />
      <AboutSection />
      <ProjectSection />
      <MainContent />
      <PhotosensitiveWarning />
    </div>
  );
}
