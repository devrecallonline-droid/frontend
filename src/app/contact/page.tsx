'use client';

import { useRef, useState, useEffect } from 'react';
import { Mail, Phone, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

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
    <div ref={ref} className={`${className} transition-all duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-ivory overflow-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════════
          SECTION 1 — HEADER
          ═══════════════════════════════════════════ */}
      <section className="px-5 sm:px-6 pt-32 sm:pt-44 pb-8 sm:pb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-titanium/30 mb-3 sm:mb-4">
            Get in Touch
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter leading-[0.9] mb-6 sm:mb-8">
            We'd love to hear
            <br />
            from <span className="text-titanium/30">you.</span>
          </h1>
          <p className="text-base sm:text-lg text-titanium/50 font-medium max-w-xl mx-auto">
            Whether you have a question, need help, or just want to say hi.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — CONTACT CARDS
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter mb-12 sm:mb-16 text-center">
            Reach Out
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Email Card */}
            <a href="mailto:admin@nenge.ng" className="bg-titanium/[0.03] border border-titanium/[0.06] rounded-[24px] p-8 text-left hover:bg-titanium/[0.06] hover:border-titanium/[0.1] transition-all duration-300 group cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-titanium/[0.06] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-titanium/[0.1] transition-all duration-300">
                <Mail className="w-5 h-5 text-titanium/60 group-hover:text-titanium/80" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-titanium tracking-tight mb-2">Email Us</h3>
              <p className="text-[13px] sm:text-sm text-titanium/35 font-medium mb-4">Drop us a line anytime. We usually respond within 24 hours.</p>
              <p className="text-sm sm:text-base font-bold text-titanium flex items-center gap-2">
                admin@nenge.ng <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </p>
            </a>

            {/* Phone Card */}
            <a href="tel:08106119178" className="bg-titanium/[0.03] border border-titanium/[0.06] rounded-[24px] p-8 text-left hover:bg-titanium/[0.06] hover:border-titanium/[0.1] transition-all duration-300 group cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-titanium/[0.06] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-titanium/[0.1] transition-all duration-300">
                <Phone className="w-5 h-5 text-titanium/60 group-hover:text-titanium/80" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-titanium tracking-tight mb-2">Call Us</h3>
              <p className="text-[13px] sm:text-sm text-titanium/35 font-medium mb-4">Mon-Fri from 8am to 5pm. We're here to help.</p>
              <p className="text-sm sm:text-base font-bold text-titanium flex items-center gap-2">
                08106119178 <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </p>
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="border-t border-black/5 py-10 sm:py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold tracking-tight text-titanium">Nenge</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.15em] text-titanium/30">
              <Link href="/about" className="hover:text-titanium/60 transition-colors duration-200">About Us</Link>
              <Link href="/privacy" className="hover:text-titanium/60 transition-colors duration-200">Privacy</Link>
              <Link href="/terms" className="hover:text-titanium/60 transition-colors duration-200">Terms</Link>
              <Link href="/contact" className="text-titanium/60 transition-colors duration-200">Contact</Link>
            </div>
            <div className="flex items-center gap-5">
              <a href="https://instagram.com/getnenge" target="_blank" rel="noopener noreferrer" className="text-titanium/20 hover:text-titanium/50 transition-colors duration-200" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-black/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-titanium/20 font-medium">
              &copy; {new Date().getFullYear()} Nenge. All rights reserved.
            </p>
            <p className="text-[11px] text-titanium/20 font-medium">
              Every Moment Deserves to Be Found
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
