'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-api';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import Navigation from '@/components/Navigation';

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

const RevealSection = ({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) => {
  const { ref, revealed } = useReveal();
  return (
    <div ref={ref} id={id} className={`${className} transition-all duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

const plans = [
  {
    name: 'Free',
    tagline: 'For everyday memories.',
    price: '₦0',
    period: null,
    description: 'Perfect for friends, families, birthdays, and small gatherings.',
    popular: false,
    features: [
      '1 GB storage',
      'Up to 3 events',
      'AI photo discovery',
      'Unlimited guests',
      'Private galleries',
      'Download your own photos',
    ],
    cta: 'Start Free',
    href: '/auth',
  },
  {
    name: 'Celebrate',
    tagline: 'For life\'s biggest moments.',
    price: '₦7,500',
    period: '/ Event',
    description: 'Everything you need to make your event unforgettable.',
    popular: true,
    features: [
      'Unlimited guests',
      'Unlimited photo discovery',
      'High-quality uploads',
      'QR code sharing',
      'Beautiful event page',
      '90-day gallery',
      'Priority processing',
    ],
    cta: 'Make This Event Memorable',
    href: '/auth',
  },
  {
    name: 'Signature',
    tagline: 'For photographers, planners, and event professionals.',
    price: '₦25,000',
    period: '/ month',
    description: 'Built for professionals creating unforgettable experiences.',
    popular: false,
    features: [
      'Unlimited events',
      'Unlimited storage',
      'Client management',
      'Team members',
      'Custom branding',
      'Analytics',
      'Priority support',
      'Early feature access',
    ],
    cta: 'Grow Your Business',
    href: '/auth',
  },
];

const faqs = [
  { q: 'Why is there a free plan?', a: 'We believe everyone deserves to reconnect with their memories.' },
  { q: 'Can I upgrade later?', a: 'Yes. You can upgrade any time without losing your events.' },
  { q: 'Is my data private?', a: 'Yes. Your photos belong to you.' },
  { q: 'Who is Signature for?', a: 'Photographers, event planners, organizers, and professionals managing multiple events.' },
];

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleCTA = (href: string) => router.push(isAuthenticated ? '/events' : href);
  const handleCompare = () => {
    document.getElementById('compare-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-ivory overflow-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="px-5 sm:px-6 pt-32 sm:pt-44 pb-12 sm:pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-titanium tracking-tighter leading-[0.9] mb-6">
            Every Memory
            <br />
            Matters.
          </h1>
          <p className="text-base sm:text-xl text-titanium/50 font-medium max-w-2xl mx-auto mb-10">
            Whether you&rsquo;re celebrating once or creating memories every weekend, there&rsquo;s a place for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleCTA('/auth')}
              className="h-13 sm:h-16 px-10 sm:px-14 rounded-full bg-titanium text-ivory font-bold text-[15px] sm:text-base tracking-tight hover:bg-black transition-all duration-300 active:scale-[0.97] cursor-pointer"
            >
              Start Free
            </button>
            <button
              onClick={handleCompare}
              className="text-titanium/50 text-[15px] sm:text-base font-semibold hover:text-titanium transition-colors duration-200 underline-offset-4 hover:underline cursor-pointer"
            >
              Compare Plans
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRICING CARDS
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[24px] p-8 sm:p-10 flex flex-col ${
                plan.popular
                  ? 'border-2 border-titanium/30 bg-titanium/[0.02]'
                  : 'border border-titanium/[0.08] bg-transparent'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-titanium/40 bg-ivory px-4 py-1.5 rounded-full border border-titanium/10">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-titanium tracking-tight mb-1">
                  {plan.name}
                </h2>
                <p className="text-sm text-titanium/40 font-medium">{plan.tagline}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl sm:text-5xl font-black text-titanium tracking-tight">{plan.price}</span>
                {plan.period && (
                  <span className="text-base text-titanium/30 font-medium ml-1">{plan.period}</span>
                )}
              </div>

              <p className="text-sm text-titanium/50 font-medium mb-8 leading-relaxed">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                    <span className="text-sm text-titanium/60 font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCTA(plan.href)}
                className={`w-full h-13 rounded-full font-bold text-[14px] tracking-tight transition-all duration-300 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-titanium text-ivory hover:bg-black'
                    : 'bg-titanium/[0.06] text-titanium hover:bg-titanium/[0.1]'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          ENTERPRISE
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-24 sm:py-32 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-titanium tracking-tighter leading-[1.1] mb-6">
            Hosting festivals, universities
            <br />
            or large organizations?
          </h2>
          <p className="text-base sm:text-lg text-titanium/50 font-medium mb-8">
            Let&rsquo;s build something together.
          </p>
          <Link
            href="/contact"
            className="inline-flex h-13 sm:h-16 px-10 sm:px-14 rounded-full bg-titanium text-ivory font-bold text-[15px] sm:text-base tracking-tight hover:bg-black transition-all duration-300 active:scale-[0.97] items-center justify-center gap-2"
          >
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          FEATURE COMPARISON
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-24 sm:py-32" id="compare-section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-titanium tracking-tighter mb-16 text-center">
            Find Your Plan
          </h2>

          {/* Mobile: stacked cards */}
          <div className="md:hidden space-y-8">
            {plans.map((plan) => (
              <div key={plan.name} className="border border-titanium/[0.08] rounded-[20px] p-6">
                <h3 className="text-lg font-black text-titanium mb-4">{plan.name}</h3>
                <ul className="space-y-3">
                  {plan.name === 'Free' && (
                    <>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Find your own moments
                      </li>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Small gatherings
                      </li>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Personal use
                      </li>
                    </>
                  )}
                  {plan.name === 'Celebrate' && (
                    <>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Make every guest feel included
                      </li>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Weddings &amp; celebrations
                      </li>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Event hosts
                      </li>
                    </>
                  )}
                  {plan.name === 'Signature' && (
                    <>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Deliver a premium experience
                      </li>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Professional events
                      </li>
                      <li className="flex items-start gap-3 text-sm text-titanium/60 font-medium">
                        <Check className="w-4 h-4 text-titanium/30 mt-0.5 shrink-0" />
                        Businesses
                      </li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.name} className="text-center">
                  <h3 className="text-lg font-black text-titanium mb-6">{plan.name}</h3>
                  <ul className="space-y-4">
                    {plan.name === 'Free' && (
                      <>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Find your own moments</li>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Small gatherings</li>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Personal use</li>
                      </>
                    )}
                    {plan.name === 'Celebrate' && (
                      <>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Make every guest feel included</li>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Weddings &amp; celebrations</li>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Event hosts</li>
                      </>
                    )}
                    {plan.name === 'Signature' && (
                      <>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Deliver a premium experience</li>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Professional events</li>
                        <li className="text-sm text-titanium/60 font-medium leading-relaxed">Businesses</li>
                      </>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-24 sm:py-32">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-titanium tracking-tighter mb-16 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-titanium/[0.06] pb-6">
                <h3 className="text-lg sm:text-xl font-black text-titanium tracking-tight mb-2">{faq.q}</h3>
                <p className="text-sm sm:text-base text-titanium/50 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-24 sm:py-32 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter leading-[1.1] mb-10 sm:mb-12">
            Your next favorite memory
            <br />
            might already be waiting.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => handleCTA('/auth')}
              className="w-full sm:w-auto h-13 sm:h-16 px-10 sm:px-14 rounded-full bg-titanium text-ivory font-bold text-[15px] sm:text-base tracking-tight hover:bg-black transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 cursor-pointer"
            >
              Create Your First Event
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href={isAuthenticated ? '/events' : '/auth'}
              className="text-titanium/50 text-[15px] sm:text-base font-semibold hover:text-titanium transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Join an Event
            </Link>
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
              <Link href="/contact" className="hover:text-titanium/60 transition-colors duration-200">Contact</Link>
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
