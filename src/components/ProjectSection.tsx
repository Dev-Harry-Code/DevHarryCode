import React from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
}

const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Canvas Shader Engine',
    description: 'A performance-focused WebGL rendering pipeline for interactive UI backdrops and fluid dynamics.',
    tags: ['TypeScript', 'WebGL', 'React'],
    demoUrl: '#',
    githubUrl: '#',
  },
  {
    id: '2',
    title: 'Minimalist Analytics',
    description: 'Privacy-first web telemetry platform providing real-time data aggregation without client-side cookies.',
    tags: ['Next.js', 'Tailwind CSS', 'PostgreSQL'],
    demoUrl: '#',
    githubUrl: '#',
  },
  {
    id: '3',
    title: 'System Design Toolkit',
    description: 'An open-source diagramming utility designed for architectural blueprints and schema planning.',
    tags: ['React', 'TypeScript', 'Canvas API'],
    demoUrl: '#',
    githubUrl: '#',
  },
];

export function ProjectSection(): React.ReactElement {
  return (
    <section id="projects" className="w-full py-24 px-6 max-w-6xl mx-auto text-white">
      {/* Header */}
      <div className="mb-16 max-w-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          Selected Projects
        </h2>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
          A collection of recent work focusing on clean system design, modular web architecture, and functional user interfaces.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROJECTS.map((project) => (
          <div
            key={project.id}
            className="group flex flex-col justify-between p-6 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-zinc-500 transition-all duration-200"
          >
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {project.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {project.description}
              </p>
            </div>

            <div>
              {/* Tech Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 border-t border-zinc-900 pt-5">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-xs tracking-wide transition-colors"
                  >
                    Live Demo &rarr;
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-medium text-xs tracking-wide transition-colors"
                  >
                    Source
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProjectSection;