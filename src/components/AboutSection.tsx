import React from 'react';

function AboutSection(): React.ReactElement {
  return (
    <section id='about' className="h-[700px]">
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl font-bold mb-4">About Me</h2>
        <p className="text-lg text-center max-w-2xl">
          I am a passionate web developer with experience in building modern web applications using React, TypeScript, and other cutting-edge technologies. I enjoy creating user-friendly interfaces and writing clean, maintainable code.
        </p>
      </div>
    </section>
  );
}

export default AboutSection;