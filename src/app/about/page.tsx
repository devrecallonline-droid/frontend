'use client';

import { useRef, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-api';
import { ArrowRight } from 'lucide-react';

// ── Scroll-reveal hook (gentle) ──
const useReveal = (threshold = 0.08) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.unobserve(el); } },
      { threshold, rootMargin: '0px 0px 40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
};

const RevealSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const { ref, revealed } = useReveal();
  return (
    <section ref={ref} className={`${className} transition-all duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </section>
  );
};

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleCTA = () => router.push(isAuthenticated ? '/events' : '/auth');

  return (
    <div className="min-h-screen flex flex-col bg-titanium overflow-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════════
          INTRO
          ═══════════════════════════════════════════ */}
      <header className="flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-32 sm:pt-44 pb-16 sm:pb-28 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] sm:w-[700px] h-[300px] sm:h-[500px] bg-ivory/[0.02] rounded-full blur-[100px]" />
        </div>

        <p
          className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-ivory/25 mb-4 sm:mb-6 animate-slide-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          About Us
        </p>

        <h1
          className="text-[32px] sm:text-5xl md:text-[72px] font-black text-ivory tracking-tighter leading-[0.92] max-w-4xl mb-6 sm:mb-8 animate-slide-up relative z-10"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <span className="relative z-10">Nenge was built from a simple</span>
          <br />
          <span className="text-ivory/30 relative z-10">frustration.</span>
        </h1>

        <div 
          className="max-w-2xl text-[15px] sm:text-xl text-ivory/60 font-medium leading-relaxed animate-slide-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          <p>
            You go to a wedding, concert, birthday, graduation, or party. Hundreds — sometimes thousands — of photos are taken. Days later, the photos finally arrive in a massive folder, and somehow you still can't find the moments that matter to you.
          </p>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          THE QUESTION
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-28 px-5 sm:px-6 gradient-mesh relative">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-lg sm:text-xl text-ivory/60 font-medium mb-8">So we asked:</p>
          <div className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[24px] sm:rounded-[32px] p-8 sm:p-16 glow-card relative overflow-hidden">
            <div className="absolute top-4 sm:top-6 left-6 sm:left-10 text-ivory/[0.04] text-[120px] sm:text-[180px] font-serif leading-none pointer-events-none select-none">&ldquo;</div>

            <div className="relative z-10 text-center">
              <p className="text-xl sm:text-3xl md:text-5xl font-black text-ivory tracking-tight leading-snug italic">
                Why is finding your own photos still this hard?
              </p>
              <div className="w-12 h-[2px] bg-ivory/10 mx-auto mt-8 sm:mt-10 rounded-full" />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          THE ANSWER
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-28 px-5 sm:px-6 border-t border-ivory/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 sm:gap-16 items-start">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-ivory tracking-tighter sticky top-32">
                The Answer.
              </h2>
            </div>

            <div className="space-y-6 sm:space-y-8 text-base sm:text-xl text-ivory/60 font-medium leading-relaxed">
              <p>
                Nenge helps people instantly discover the photos they appear in from events — without endlessly scrolling through galleries filled with strangers.
              </p>
              <p>
                Upload event photos once.<br/>
                Or upload a quick selfie and find your moments in seconds.
              </p>
              <p className="text-2xl sm:text-4xl font-black text-ivory tracking-tighter">
                That's it.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          OUR MISSION
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-28 px-5 sm:px-6 gradient-mesh-alt border-t border-ivory/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 sm:gap-16 items-start">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-ivory tracking-tighter sticky top-32">
                Our Mission.
              </h2>
            </div>

            <div className="text-base sm:text-xl text-ivory/60 font-medium leading-relaxed">
              <p>
                We're building Nenge to make event memories easier to access, easier to share, and more personal for everyone involved — from guests and friends to photographers and event organizers.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          OUR APPROACH
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-28 px-5 sm:px-6 border-t border-ivory/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 sm:gap-16 items-start">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-ivory tracking-tighter sticky top-32">
                Our Approach.
              </h2>
            </div>

            <div className="text-base sm:text-xl text-ivory/60 font-medium leading-relaxed">
              <p className="mb-6">Our approach is simple:</p>
              <ul className="space-y-4 text-ivory/80">
                <li className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-ivory/40" />
                  privacy-first
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-ivory/40" />
                  event-focused
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-ivory/40" />
                  fast and easy to use
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          CLOSING
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-28 px-5 sm:px-6 gradient-mesh border-t border-ivory/[0.04]">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <p className="text-xl sm:text-3xl text-ivory/80 font-medium leading-relaxed max-w-2xl mx-auto">
            We believe memories should feel accessible, not buried inside folders and forgotten links.
          </p>

          <p className="inline-flex items-center gap-3 px-6 py-4 rounded-full bg-ivory/[0.04] border border-ivory/[0.06] text-sm sm:text-lg font-bold text-ivory/60">
            Nenge is proudly built in Nigeria for people everywhere.
          </p>

          <p className="text-3xl sm:text-5xl md:text-6xl font-black text-ivory tracking-tighter">
            Welcome to a better way to relive moments.
          </p>

          <button
            onClick={handleCTA}
            className="w-full sm:w-auto h-13 sm:h-16 px-10 sm:px-14 mt-8 rounded-full bg-white text-titanium font-bold text-[15px] sm:text-base tracking-tight hover:bg-ivory hover:shadow-[0_12px_48px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 mx-auto shadow-[0_8px_32px_rgba(255,255,255,0.1)] cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </RevealSection>

      {/* FOOTER */}
      <footer className="border-t border-ivory/[0.06] py-10 sm:py-16 px-5 sm:px-6 mt-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <Image src="/logo-white.png" alt="Nenge Logo" width={130} height={52} className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold tracking-tight text-ivory">Nenge</span>
            </div>

            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.15em] text-ivory/20">
              <Link href="/about" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer text-ivory/60">About Us</Link>
              <Link href="/privacy" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Privacy</Link>
              <Link href="/terms" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Terms</Link>
              <Link href="/contact" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Contact</Link>
            </div>

            <div className="flex items-center gap-5">
              <a href="#" className="text-ivory/15 hover:text-ivory/50 transition-colors duration-200 cursor-pointer" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-ivory/15 hover:text-ivory/50 transition-colors duration-200 cursor-pointer" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-ivory/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-ivory/15 font-medium">
              © {new Date().getFullYear()} Nenge. All rights reserved.
            </p>
            <p className="text-[11px] text-ivory/15 font-medium">
              Find your photos. Keep your privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
