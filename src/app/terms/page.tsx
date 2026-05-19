'use client';

import { useRef, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

// ── Scroll-reveal hook (gentle) ──
const useReveal = (threshold = 0.05) => {
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
    <div ref={ref} className={`${className} transition-all duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  );
};

export default function TermsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-titanium overflow-hidden selection:bg-ivory/20 selection:text-ivory">
      <Navigation />

      {/* HEADER SECTION */}
      <header className="pt-32 sm:pt-48 pb-16 px-5 sm:px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[500px] bg-ivory/[0.03] rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10 text-center sm:text-left">
          <RevealSection>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-ivory tracking-tighter mb-6">
              Terms & Conditions
            </h1>
            <p className="text-sm sm:text-base text-ivory/50 font-bold uppercase tracking-[0.2em]">
              Last Updated: May 2026
            </p>
          </RevealSection>
        </div>
      </header>

      {/* CONTENT SECTION */}
      <main className="flex-1 px-5 sm:px-6 pb-24 sm:pb-32 relative z-10">
        <div className="max-w-3xl mx-auto space-y-16 sm:space-y-24 text-[16px] sm:text-lg text-ivory/70 font-medium leading-[1.8]">
          
          <RevealSection>
            <p>
              By accessing or using <a href="https://www.nenge.ng/?utm_source=chatgpt.com" className="text-ivory font-bold border-b border-ivory/20 hover:border-ivory transition-colors pb-0.5">Nenge</a>, you agree to these Terms & Conditions.
            </p>
            <p className="mt-6">
              If you do not agree, please do not use the platform.
            </p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">1. Use of the Platform</h2>
            <p className="mb-6">Nenge allows users to:</p>
            <div className="flex flex-col gap-4 mb-6 pl-4 border-l-2 border-ivory/10">
              <span className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Upload event photos</span>
              <span className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Discover photos from events</span>
              <span className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Share event-related content</span>
            </div>
            <p className="text-ivory font-bold">You agree to use the platform lawfully and responsibly.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">2. Accounts</h2>
            <p className="mb-6">You are responsible for:</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-ivory/[0.02] border border-ivory/[0.05] p-5 rounded-xl">
                <p className="text-sm">Maintaining the security of your account</p>
              </div>
              <div className="bg-ivory/[0.02] border border-ivory/[0.05] p-5 rounded-xl">
                <p className="text-sm">Keeping login credentials confidential</p>
              </div>
              <div className="bg-ivory/[0.02] border border-ivory/[0.05] p-5 rounded-xl">
                <p className="text-sm">Activities that occur under your account</p>
              </div>
            </div>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">3. User Content</h2>
            <p className="mb-6 font-bold text-ivory">Users retain ownership of the content they upload.</p>
            <p className="mb-6">However, by uploading content to Nenge, you grant us a limited license to:</p>
            <div className="flex flex-wrap gap-3 mb-6">
              {['Store', 'Process', 'Display', 'Organize', 'Deliver content within the platform experience'].map((item, idx) => (
                <span key={idx} className="px-4 py-2 rounded-lg bg-ivory/5 border border-ivory/10 text-sm text-ivory/80">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-ivory/50 italic">This license exists only to operate the service.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">4. Prohibited Activities</h2>
            <p className="mb-6">You may not:</p>
            <ul className="space-y-4 mb-8">
              {[
                'Upload illegal or harmful content',
                'Attempt unauthorized access',
                'Abuse matching features',
                'Use the platform for surveillance or unlawful identification',
                'Interfere with platform operations'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-100/80">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-ivory font-bold">Violation may result in suspension or termination.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">5. AI Matching Limitations</h2>
            <p className="mb-6">Photo matching results may not always be accurate.</p>
            <p className="mb-6">Users should not rely on Nenge for:</p>
            <ul className="space-y-3 pl-4 border-l border-ivory/10 mb-6">
              <li>Identity verification</li>
              <li>Law enforcement purposes</li>
              <li>Sensitive decision-making</li>
            </ul>
            <p className="text-ivory font-bold text-sm bg-ivory/5 p-4 rounded-lg inline-block">
              The platform is intended for consumer event photo discovery only.
            </p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">6. Intellectual Property</h2>
            <p>
              All platform branding, software, design, and technology related to Nenge remain the property of Nenge unless otherwise stated.
            </p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">7. Service Availability</h2>
            <p className="mb-4">We may modify, suspend, or discontinue parts of the platform at any time without notice.</p>
            <p>We do not guarantee uninterrupted service availability.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">8. Limitation of Liability</h2>
            <p className="mb-6">To the fullest extent permitted by law, Nenge shall not be liable for:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {['Indirect damages', 'Lost data', 'Service interruptions', 'User-uploaded content', 'Matching inaccuracies'].map((item, idx) => (
                <div key={idx} className="bg-ivory/[0.02] border border-ivory/[0.05] p-3 rounded-lg text-sm text-center">
                  {item}
                </div>
              ))}
            </div>
            <p className="text-ivory font-bold italic">Use of the platform is at your own risk.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or misuse the platform.
            </p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">10. Governing Law</h2>
            <p>
              These Terms shall be governed by applicable laws and regulations in the jurisdictions where Nenge operates.
            </p>
          </RevealSection>

          <RevealSection className="pt-10 border-t border-ivory/10">
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">11. Contact</h2>
            <p className="mb-6">For support or legal inquiries:</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <a href="mailto:admin@nenge.ng" className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-ivory/5 hover:bg-ivory/10 transition-colors border border-ivory/10 text-ivory">
                <span className="text-xl">📧</span>
                <span className="font-bold">admin@nenge.ng</span>
              </a>
              <a href="https://www.nenge.ng" className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-ivory/5 hover:bg-ivory/10 transition-colors border border-ivory/10 text-ivory">
                <span className="text-xl">🌐</span>
                <span className="font-bold">www.nenge.ng</span>
              </a>
            </div>
          </RevealSection>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-ivory/[0.06] py-10 sm:py-16 px-5 sm:px-6 mt-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <Image src="/logo-white.png" alt="Nenge Logo" width={130} height={52} className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold tracking-tight text-ivory">Nenge</span>
            </div>

            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.15em] text-ivory/20">
              <Link href="/about" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">About Us</Link>
              <Link href="/privacy" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Privacy</Link>
              <Link href="/terms" className="text-ivory/60 transition-colors duration-200 cursor-pointer">Terms</Link>
              <Link href="/contact" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Contact</Link>
            </div>

            <div className="flex items-center gap-5">
              <a href="#" className="text-ivory/15 hover:text-ivory/50 transition-colors duration-200 cursor-pointer" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className="text-ivory/15 hover:text-ivory/50 transition-colors duration-200 cursor-pointer" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
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
