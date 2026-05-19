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

export default function PrivacyPage() {
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
              Privacy Policy
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
              Welcome to <a href="https://www.nenge.ng/?utm_source=chatgpt.com" className="text-ivory font-bold border-b border-ivory/20 hover:border-ivory transition-colors pb-0.5">Nenge</a>.
            </p>
            <p className="mt-6">
              Nenge is a platform that helps users discover and share photos from events. This Privacy Policy explains how we collect, use, store, and protect your information when you use our services.
            </p>
            <p className="mt-6">
              By using Nenge, you agree to the practices described below.
            </p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">1. Information We Collect</h2>
            <p className="mb-8">We may collect the following information:</p>
            
            <div className="grid gap-10 sm:grid-cols-2">
              <div className="bg-ivory/[0.02] border border-ivory/[0.05] rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl font-black text-ivory mb-4">Account Information</h3>
                <p className="mb-4 text-sm sm:text-base">When you create an account, we may collect:</p>
                <ul className="space-y-3 text-sm sm:text-base text-ivory/60">
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Name</li>
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Email address</li>
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Username</li>
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Profile photo</li>
                </ul>
              </div>

              <div className="bg-ivory/[0.02] border border-ivory/[0.05] rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl font-black text-ivory mb-4">Photos & Selfies</h3>
                <p className="mb-4 text-sm sm:text-base">Users may upload:</p>
                <ul className="space-y-3 text-sm sm:text-base text-ivory/60 mb-6">
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Event photos</li>
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Selfies for matching</li>
                  <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Profile images</li>
                </ul>
                <p className="text-sm text-ivory/50 leading-relaxed border-t border-ivory/10 pt-4">These uploads are used to power photo discovery and matching within events.</p>
              </div>

              <div className="bg-ivory/[0.02] border border-ivory/[0.05] rounded-2xl p-6 sm:p-8 sm:col-span-2">
                <h3 className="text-xl font-black text-ivory mb-4">Usage Information</h3>
                <p className="mb-4 text-sm sm:text-base">We may collect:</p>
                <div className="grid grid-cols-2 gap-4">
                  <ul className="space-y-3 text-sm sm:text-base text-ivory/60">
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Device information</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> IP address</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Browser type</li>
                  </ul>
                  <ul className="space-y-3 text-sm sm:text-base text-ivory/60">
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> App activity</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Log data</li>
                  </ul>
                </div>
                <p className="text-sm text-ivory/50 leading-relaxed border-t border-ivory/10 pt-4 mt-6">This helps us improve platform performance and security.</p>
              </div>
            </div>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">2. How Nenge Uses Your Information</h2>
            <p className="mb-6">We use information to:</p>
            <ul className="grid sm:grid-cols-2 gap-4">
              {[
                'Provide photo discovery features',
                'Help users find photos they appear in',
                'Improve product performance',
                'Prevent abuse and unauthorized access',
                'Support event-based photo sharing',
                'Communicate important updates'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-ivory/[0.02] border border-ivory/[0.04]">
                  <span className="text-ivory/30 font-black mt-0.5">{idx + 1}.</span>
                  <span className="text-ivory/80">{item}</span>
                </li>
              ))}
            </ul>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">3. AI-Powered Photo Matching</h2>
            <p className="mb-6">Nenge uses AI-assisted image matching to help users discover photos within specific events.</p>
            
            <div className="p-6 sm:p-8 rounded-2xl bg-ivory/5 border-l-4 border-ivory mb-6">
              <p className="text-ivory font-black uppercase tracking-widest text-sm mb-4">Important:</p>
              <ul className="space-y-4 text-ivory/80">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-ivory mt-2.5 shrink-0" />
                  Matching is limited to event-specific contexts
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-ivory mt-2.5 shrink-0" />
                  Nenge does not provide public identity search
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-ivory mt-2.5 shrink-0" />
                  We do not sell biometric data
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-ivory mt-2.5 shrink-0" />
                  We do not allow users to search the general public
                </li>
              </ul>
            </div>
            <p className="text-sm sm:text-base text-ivory/50">Selfies uploaded for matching are used only to provide the matching experience within the platform.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">4. Privacy & Access Controls</h2>
            <p className="mb-6">Nenge is designed with privacy in mind.</p>
            <p className="mb-6">Depending on platform settings:</p>
            <ul className="space-y-4 pl-6 border-l border-ivory/10">
              <li><strong className="text-ivory">Event creators</strong> may control who can access event content</li>
              <li><strong className="text-ivory">Users</strong> may only access photos from events they are permitted to view</li>
              <li><strong className="text-ivory">Certain features</strong> may require approval or event participation</li>
            </ul>
            <p className="mt-8 italic text-ivory/50">We continuously work to improve privacy protections across the platform.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">5. Storage & Security</h2>
            <p className="mb-6">We use industry-standard infrastructure and cloud services to help secure user data and uploaded content.</p>
            <p className="mb-6">While no system is completely secure, we take reasonable steps to:</p>
            <div className="flex flex-wrap gap-4">
              <span className="px-5 py-2.5 rounded-full bg-ivory/[0.03] border border-ivory/[0.05] text-sm text-ivory/80">Protect user information</span>
              <span className="px-5 py-2.5 rounded-full bg-ivory/[0.03] border border-ivory/[0.05] text-sm text-ivory/80">Prevent unauthorized access</span>
              <span className="px-5 py-2.5 rounded-full bg-ivory/[0.03] border border-ivory/[0.05] text-sm text-ivory/80">Monitor abuse and misuse</span>
            </div>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">6. Sharing of Information</h2>
            <p className="mb-6 font-bold text-ivory text-xl">We do not sell personal information to third parties.</p>
            <p className="mb-6">We may share limited information:</p>
            <ul className="space-y-4 pl-6 border-l border-ivory/10">
              <li>With service providers that help operate our platform</li>
              <li>When required by law</li>
              <li>To protect the safety, rights, or integrity of Nenge and its users</li>
            </ul>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">7. User Content</h2>
            <p className="mb-6">Users are responsible for the content they upload to Nenge.</p>
            <p className="mb-6">By uploading content, you confirm that:</p>
            <ul className="space-y-4 pl-6 border-l border-ivory/10 mb-8">
              <li>You have the right to share the content</li>
              <li>The content does not violate laws or third-party rights</li>
            </ul>
            <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200/80 text-sm">
              Nenge reserves the right to remove content that violates our policies.
            </div>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">8. Data Retention</h2>
            <p className="mb-6">We may retain uploaded photos, selfies, and account information for as long as necessary to:</p>
            <ul className="space-y-4 pl-6 border-l border-ivory/10 mb-8">
              <li>Provide platform functionality</li>
              <li>Maintain service integrity</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-ivory font-bold">Users may request account deletion at any time.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">9. Your Rights</h2>
            <p className="mb-6">Depending on your location, you may have rights to:</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ivory/[0.02] border border-ivory/[0.04]">
                <span className="text-ivory/80 text-sm sm:text-base">Access your data</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ivory/[0.02] border border-ivory/[0.04]">
                <span className="text-ivory/80 text-sm sm:text-base">Update your information</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ivory/[0.02] border border-ivory/[0.04]">
                <span className="text-ivory/80 text-sm sm:text-base">Request deletion</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ivory/[0.02] border border-ivory/[0.04]">
                <span className="text-ivory/80 text-sm sm:text-base">Withdraw consent</span>
              </div>
            </div>
            <p>To make a request, contact us using the information below.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">10. Children's Privacy</h2>
            <p className="mb-4">Nenge is not intended for children under 13 years old.</p>
            <p>We do not knowingly collect personal information from children without appropriate consent.</p>
          </RevealSection>

          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">11. Changes to This Policy</h2>
            <p className="mb-4">We may update this Privacy Policy from time to time.</p>
            <p>When we make material changes, we will update the "Last Updated" date above.</p>
          </RevealSection>

          <RevealSection className="pt-10 border-t border-ivory/10">
            <h2 className="text-2xl sm:text-3xl font-black text-ivory tracking-tight mb-8">12. Contact Us</h2>
            <p className="mb-6">For questions about this Privacy Policy, contact:</p>
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
              <Link href="/privacy" className="text-ivory/60 transition-colors duration-200 cursor-pointer">Privacy</Link>
              <Link href="/terms" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Terms</Link>
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
