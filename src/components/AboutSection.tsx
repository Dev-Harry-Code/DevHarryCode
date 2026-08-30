'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useShaderExclude } from "@/components/ShaderExcludeContext";
import { MapPin, Mail, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Section = { title: string; body: React.ReactNode };

const SKILLS = [
  'Python',
  'Next.js',
  'FastAPI',
  'Firebase',
  'MongoDB',
  'Full-Stack Development',
  'AI Assistants',
  'Scalable Web Platforms',
];

const GITHUB_URL = 'https://github.com/Dev-Harry-Code';
const LINKEDIN_URL = 'https://linkedin.com/in/devharry';
const EMAIL = 'dev.harshalsharma@gmail.com';

const VISIBLE_COMMANDS = ['bio', 'skills', 'experience', 'education', 'projects', 'now', 'contact', 'help', 'clear'];

function TermLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-400 underline decoration-emerald-700 underline-offset-2 hover:text-emerald-300 break-all sm:break-normal"
    >
      {children}
    </a>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300">{children}</div>;
}

export default function AboutSection(): React.ReactElement {
  const AboutRef = useShaderExclude<HTMLElement>("AboutRef");
  const sectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [query, setQuery] = useState('');
  const [windowState, setWindowState] = useState<'normal' | 'minimized' | 'maximized'>('normal');
  const [soundOn, setSoundOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [history, setHistory] = useState<
    { id: number; command: string; title: string; body: React.ReactNode; tone: 'normal' | 'error' }[]
  >([]);

  const SECTIONS: Record<string, Section> = {
    bio: {
      title: 'Background & Bio',
      body: (
        <>
          Developer, AI enthusiast, and aspiring tech entrepreneur passionate about building
          impactful products using AI and modern web technologies. I enjoy turning ideas into
          real-world solutions by combining intelligent systems, clean design, and user-focused
          experiences — constantly exploring emerging AI trends, software engineering, and
          startup innovation to grow as a builder and problem solver.
        </>
      ),
    },
    skills: {
      title: 'Technical Skills',
      body: (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {SKILLS.map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="rounded border-zinc-700 bg-zinc-900 font-mono text-[11px] sm:text-xs font-normal text-emerald-300 px-2 py-0.5"
            >
              {skill}
            </Badge>
          ))}
        </div>
      ),
    },
    experience: {
      title: 'Experience',
      body: (
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-zinc-100 text-xs sm:text-sm">President - IT COMMITTEE</div>
            <div className="text-[11px] sm:text-xs text-emerald-400">Delhi Public School Jodhpur | Jul 2025 – Jan 2026</div>
            <ul className="mt-1.5 list-disc pl-4 text-[11px] sm:text-xs space-y-1 text-zinc-400">
              <li>Led technical initiatives and digital event coordination</li>
              <li>Organized and managed IT-related activities and competitions</li>
              <li>Collaborated with student teams on technology-driven projects</li>
            </ul>
          </div>
          <div className="pt-1 text-[11px] sm:text-xs text-zinc-400 border-t border-zinc-800/60">
            Represented as a National-Level IT Fest Candidate, strengthening skills in innovation,
            collaboration, and technical problem-solving under competitive environments. Experience
            building AI assistants and scalable web platforms.
          </div>
        </div>
      ),
    },
    education: {
      title: 'Education',
      body: (
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-zinc-100 text-xs sm:text-sm">JIET Group of Institutions, Jodhpur</div>
            <div className="text-[11px] sm:text-xs text-emerald-400">B.Tech - Computer Science (AI & ML) | Aug 2026 – Jul 2030</div>
          </div>
          <div>
            <div className="font-semibold text-zinc-100 text-xs sm:text-sm">Delhi Public School, Jodhpur</div>
            <div className="text-[11px] sm:text-xs text-zinc-400">PCM Computer Science | Apr 2022 – Mar 2026</div>
          </div>
          <div>
            <div className="font-semibold text-zinc-100 text-xs sm:text-sm">Defence Public School, Jodhpur</div>
            <div className="text-[11px] sm:text-xs text-zinc-400">Elementary | May 2012 – Mar 2022</div>
          </div>
        </div>
      ),
    },
    projects: {
      title: 'Featured Projects',
      body: (
        <div className="space-y-1">
          <p>Nothing pinned here yet — the good stuff lives on GitHub.</p>
          <TermLink href={GITHUB_URL}>View all projects on GitHub →</TermLink>
        </div>
      ),
    },
    now: {
      title: "What I'm Up To",
      body: (
        <>
          Focused on learning, building, and connecting with developers, founders, and
          innovators shaping the future of AI and technology. Always open to connecting,
          collaborating, or learning something new!
        </>
      ),
    },
    contact: {
      title: 'Contact Information',
      body: (
        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-zinc-500 shrink-0" /> <span className="truncate">Jodhpur, Rajasthan, India</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Mail size={14} className="text-zinc-500 shrink-0" />
            <TermLink href={`mailto:${EMAIL}`}>{EMAIL}</TermLink>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard?.writeText(EMAIL);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              title="Copy email"
              className="text-zinc-500 hover:text-zinc-300 p-1 -m-1"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <FaGithub size={14} className="text-zinc-500 shrink-0" /> GitHub: <TermLink href={GITHUB_URL}>Dev-Harry-Code</TermLink>
          </div>
          <div className="flex items-center gap-2">
            <FaLinkedin size={14} className="text-zinc-500 shrink-0" /> LinkedIn: <TermLink href={LINKEDIN_URL}>devharry</TermLink>
          </div>
        </div>
      ),
    },
  };

  const TARGET_ASCII = `
██████╗ ███████╗██╗   ██╗██╗  ██╗ █████╗ ██████╗ ██████╗ ██╗   ██╗ ██████╗ ██████╗ ██████╗ ███████╗   
██╔══██╗██╔════╝██║   ██║██║  ██║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔════╝██╔═══██╗██╔══██╗██╔════╝   
██║  ██║█████╗  ██║   ██║███████║███████║██████╔╝██████╔╝ ╚████╔╝ ██║     ██║   ██║██║  ██║█████╗     
██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══██║██╔══██║██╔══██╗██╔══██╗  ╚██╔╝  ██║     ██║   ██║██║  ██║██╔══╝     
██████╔╝███████╗ ╚████╔╝ ██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ╚██████╗╚██████╔╝██████╔╝███████╗██╗
╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝ ╚══════╝╚══════╝╚═╝
`;

  const MATRIX_CHARS = '01#$@%&*<>?/\\█▓▒░';

  const [displayedAscii, setDisplayedAscii] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const beep = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'square', volume = 0.03) => {
      if (!soundOn) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
      } catch {
        /* fail silently */
      }
    },
    [soundOn, getCtx]
  );

  const playKeySound = useCallback(() => beep(300 + Math.random() * 140, 0.03, 'square', 0.02), [beep]);
  const playEnterSound = useCallback(() => beep(720, 0.09, 'triangle', 0.05), [beep]);
  const playErrorSound = useCallback(() => beep(160, 0.18, 'sawtooth', 0.05), [beep]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setIsAnimating(true);
          setHasAnimated(true);

          if (inputRef.current && window.innerWidth >= 768) {
            inputRef.current.focus({ preventScroll: true });
          }

          const lines = TARGET_ASCII.split('\n');
          const totalLines = lines.length;
          let frame = 0;
          const totalFrames = 45;
          let animationFrameId: number;

          const animate = () => {
            frame++;
            const progress = frame / totalFrames;
            const currentLineProgress = Math.floor(progress * totalLines);

            const animatedLines = lines.map((line, lineIdx) => {
              if (lineIdx > currentLineProgress) return ' '.repeat(line.length);

              if (lineIdx === currentLineProgress) {
                return line
                  .split('')
                  .map((char) => (char === ' ' ? ' ' : MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]))
                  .join('');
              }

              return line
                .split('')
                .map((char) => {
                  if (char === ' ') return ' ';
                  if (Math.random() > 0.85) return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                  return char;
                })
                .join('');
            });

            setDisplayedAscii(animatedLines.join('\n'));

            if (frame < totalFrames) {
              animationFrameId = requestAnimationFrame(animate);
            } else {
              setDisplayedAscii(TARGET_ASCII);
              setIsAnimating(false);
            }
          };

          animationFrameId = requestAnimationFrame(animate);
          return () => cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const container = scrollAreaRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    });
  }, []);

  useEffect(() => {
    const target = historyContainerRef.current;
    if (!target) return;

    const observer = new ResizeObserver(() => {
      scrollToBottom();
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const toggleMinimize = () => setWindowState((prev) => (prev === 'minimized' ? 'normal' : 'minimized'));
  const toggleMaximize = () => setWindowState((prev) => (prev === 'maximized' ? 'normal' : 'maximized'));

  const cleanInput = query.startsWith('/') ? query.slice(1) : query;

  const matchingCommand =
    query.startsWith('/') && cleanInput
      ? VISIBLE_COMMANDS.find((cmd) => cmd.startsWith(cleanInput.toLowerCase()))
      : '';

  const suggestion = matchingCommand ? `/${matchingCommand}` : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isAutoTyping) {
      e.preventDefault();
      return;
    }
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      setQuery(suggestion);
      return;
    }
    if (e.key === 'Backspace' || e.key.length === 1) {
      playKeySound();
    }
  };

  const pushEntry = (command: string, title: string, body: React.ReactNode, tone: 'normal' | 'error' = 'normal') => {
    setHistory((prev) => [...prev, { id: Date.now() + Math.random(), command, title, body, tone }]);
  };

  const processCommand = useCallback((commandText: string) => {
    const raw = commandText.startsWith('/') ? commandText.slice(1).trim() : commandText.trim();
    if (!raw) return;
    const lower = raw.toLowerCase();

    if (lower === 'clear') {
      setHistory([]);
      setQuery('');
      playEnterSound();
      return;
    }

    if (lower === 'help') {
      pushEntry(
        raw,
        'Available Commands',
        <div className="space-y-1">
          {VISIBLE_COMMANDS.filter((c) => c !== 'help' && c !== 'clear').map((c) => (
            <div key={c} className="flex items-center gap-1 sm:gap-2">
              <span className="text-zinc-100 font-semibold sm:font-normal">/{c.padEnd(11)}</span>
              <span className="text-zinc-500 hidden sm:inline"> — {SECTIONS[c]?.title ?? ''}</span>
              <span className="text-zinc-500 sm:hidden"> {SECTIONS[c]?.title ?? ''}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-zinc-100 font-semibold sm:font-normal">{'/clear'.padEnd(12)}</span>
            <span className="text-zinc-500 hidden sm:inline"> — clear this terminal</span>
            <span className="text-zinc-500 sm:hidden"> clear terminal</span>
          </div>
          <div className="pt-2 text-[11px] sm:text-xs text-zinc-500">
            Tip: press Tab to autocomplete. There may be a few more commands not listed here.
          </div>
        </div>
      );
      playEnterSound();
      setQuery('');
      return;
    }

    if (lower === 'whoami') {
      pushEntry(
        raw,
        'whoami',
        <>guest — probably here to snoop the source. Curious minds welcome, try <code className="text-emerald-400">/contact</code> to say hi.</>
      );
      playEnterSound();
      setQuery('');
      return;
    }

    if (lower.startsWith('sudo')) {
      pushEntry(
        raw,
        'Permission Denied',
        <>Nice try. This incident has been reported to <code className="text-zinc-500">/dev/null</code>.</>,
        'error'
      );
      playErrorSound();
      setQuery('');
      return;
    }

    if (SECTIONS[lower]) {
      pushEntry(raw, SECTIONS[lower].title, SECTIONS[lower].body);
      playEnterSound();
      setQuery('');
      return;
    }

    pushEntry(
      raw,
      'Command Not Found',
      <>
        <span className="text-zinc-100">{raw}</span>: command not found — type{' '}
        <code className="text-emerald-400">/help</code> for a list of things I respond to.
      </>,
      'error'
    );
    playErrorSound();
    setQuery('');
  }, [SECTIONS, playEnterSound, playErrorSound]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAutoTyping) return;
    processCommand(query);
  };

  const handleMobileChipClick = (cmd: string) => {
    if (isAutoTyping) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    setIsAutoTyping(true);
    setQuery('');

    const fullCommand = `/${cmd}`;
    let index = 0;

    const typeNextChar = () => {
      if (index < fullCommand.length) {
        setQuery(fullCommand.slice(0, index + 1));
        playKeySound();
        index++;
        typingTimerRef.current = setTimeout(typeNextChar, 100);
      } else {
        typingTimerRef.current = setTimeout(() => {
          setIsAutoTyping(false);
          processCommand(fullCommand);
        }, 400);
      }
    };

    typeNextChar();
  };

  const getContainerStyles = () => {
    if (windowState === 'maximized') return 'fixed inset-2 sm:inset-4 z-50 flex flex-col max-w-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]';
    if (windowState === 'minimized') return 'w-full max-w-5xl min-h-0';
    return 'w-full max-w-5xl h-[520px] sm:h-[650px] flex flex-col';
  };

  return (
    <TooltipProvider delay={200}>
      <style>{`
        @keyframes term-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
      <section
        ref={AboutRef}
        id="about"
        className={cn(
          'flex w-full items-center justify-center p-2 sm:p-4 transition-all duration-300',
          windowState === 'maximized' ? 'min-h-screen' : 'min-h-[520px] sm:min-h-[650px]'
        )}
      >
        <Card
          ref={sectionRef}
          className={cn(
            'relative overflow-hidden gap-0 rounded-lg border-zinc-700 bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-200 shadow-none transition-all duration-300',
            getContainerStyles()
          )}
        >
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-3 sm:p-4 pb-2.5 sm:pb-3">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setWindowState('normal')}
                    className="h-3 w-3 rounded-full bg-red-500/80 transition-colors hover:bg-red-500"
                  />
                </TooltipTrigger>
                <TooltipContent>Reset</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleMinimize}
                    className="h-3 w-3 rounded-full bg-yellow-500/80 transition-colors hover:bg-yellow-500"
                  />
                </TooltipTrigger>
                <TooltipContent>{windowState === 'minimized' ? 'Restore' : 'Minimize'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleMaximize}
                    className="h-3 w-3 rounded-full bg-emerald-500/80 transition-colors hover:bg-emerald-500"
                  />
                </TooltipTrigger>
                <TooltipContent>{windowState === 'maximized' ? 'Restore' : 'Maximize'}</TooltipContent>
              </Tooltip>
              <span className="ml-1 sm:ml-2 text-[11px] sm:text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-none">
                devharrycode@terminal:~
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-zinc-600 hidden sm:inline">
                {windowState === 'minimized' && '[Minimized]'}
                {windowState === 'maximized' && '[Maximized]'}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundOn((s) => !s)}
                    className="h-6 w-6 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{soundOn ? 'Mute sound' : 'Unmute sound'}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {windowState !== 'minimized' && (
            <CardContent className="flex flex-1 min-h-0 flex-col p-0">
              {/* Native Auto-overflow Scroll Container */}
              <div 
                ref={scrollAreaRef} 
                className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 pt-3 sm:pt-4"
              >
                <div className="relative min-h-[70px] sm:min-h-[120px] overflow-x-auto no-scrollbar">
                  <pre
                    className={cn(
                      'text-[6px] xs:text-[8px] sm:text-xs leading-tight transition-colors duration-500 select-none',
                      isAnimating
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                        : 'text-zinc-300'
                    )}
                  >
                    {displayedAscii || ' '}
                  </pre>
                </div>

                <div className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-zinc-400">
                  <p className="mb-2">
                    <span className="hidden md:inline">Type <span className="font-bold text-zinc-100">/</span> to run commands:</span>
                    <span className="md:hidden">Tap a command below to run:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {VISIBLE_COMMANDS.map((c) => (
                      <React.Fragment key={c}>
                        {/* Mobile: Interactive Click Chip */}
                        <button
                          type="button"
                          disabled={isAutoTyping}
                          onClick={() => handleMobileChipClick(c)}
                          className="md:hidden rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] sm:text-xs text-zinc-300 hover:border-zinc-700 hover:text-emerald-400 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          /{c}
                        </button>

                        {/* Desktop: Static Visual Pill (Non-Clickable) */}
                        <span className="hidden md:inline-block rounded bg-zinc-900 border border-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-400 select-none cursor-default">
                          /{c}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* History list with ResizeObserver attached */}
                <div ref={historyContainerRef} className="my-3 sm:my-4 space-y-3 pb-6">
                  {history.map((entry) => (
                    <div key={entry.id}>
                      <div className="text-zinc-500 text-[11px] sm:text-xs">
                        <span className="text-zinc-400">devharrycode:~$</span> /{entry.command}
                      </div>
                      <div
                        className={cn(
                          'mt-1 rounded-md border p-3 sm:p-4',
                          entry.tone === 'error'
                            ? 'border-red-900/60 bg-red-950/20'
                            : 'border-zinc-800 bg-zinc-900/60'
                        )}
                      >
                        <div className={cn('font-bold text-xs sm:text-sm', entry.tone === 'error' ? 'text-red-400' : 'text-zinc-100')}>
                          ▶ {entry.title.toUpperCase()}
                        </div>
                        <SectionBody>{entry.body}</SectionBody>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translucent Dock Input */}
              <form
                onSubmit={handleSubmit}
                className="sticky bottom-0 z-10 flex items-center gap-1.5 sm:gap-2 border-t border-zinc-800/80 bg-zinc-950/80 px-3 sm:px-6 py-2.5 sm:py-4 backdrop-blur-md"
              >
                <span className="font-bold text-xs sm:text-sm text-zinc-400 shrink-0">
                  devharrycode<span className="text-zinc-100">:~$</span>
                </span>
                <div className="relative flex-1 min-w-0">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    disabled={isAutoTyping}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isAutoTyping ? 'Executing command...' : 'Type /bio, /skills...'}
                    className="h-auto border-0 bg-transparent p-0 text-xs sm:text-sm font-mono text-zinc-100 shadow-none caret-transparent placeholder:text-zinc-600 focus-visible:ring-0"
                  />
                  {(isFocused || isAutoTyping) && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-0 h-[1.15em] w-[0.55em] sm:w-[0.6em] animate-[term-blink_1s_steps(2,jump-none)_infinite] bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                      style={{ left: `${query.length}ch` }}
                    />
                  )}
                  {!isAutoTyping && suggestion && suggestion !== query && (
                    <span className="pointer-events-none absolute left-0 top-0 text-xs sm:text-sm text-zinc-600 truncate max-w-full">
                      <span className="opacity-0">{query}</span>
                      {suggestion.slice(query.length)}
                      <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs text-zinc-500 hidden sm:inline">[Press Tab]</span>
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </section>
    </TooltipProvider>
  );
}