'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Lock, Camera, Users, Upload, ScanFace, Images, Eye, CalendarCheck, UserCheck, Mic, ImagePlus, Zap, Shield, Trash2, PartyPopper, CameraIcon, UserCircle } from 'lucide-react';
import { Button, Input, Badge, Card } from '@/components/ui';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/use-api';

// ============================================
// CONFIGURATION - Toggle between modes
// ============================================
const SHOW_WAITLIST = false; // Set to false to show real homepage content

const WAITLIST_STORAGE_KEY = 'nenge_waitlist_joined';

const galleryPhotos = [
  { src: '/waitlist-1.png', alt: 'Party moment' },
  { src: '/waitlist-2.png', alt: 'Festival vibes' },
  { src: '/waitlist-3.png', alt: 'Wedding celebration' },
  { src: '/waitlist-4.png', alt: 'Networking event' },
  { src: '/waitlist-5.png', alt: 'Birthday selfie' },
  { src: '/waitlist-6.png', alt: 'Party moment' },
  { src: '/waitlist-2.png', alt: 'Festival vibes' },
  { src: '/waitlist-3.png', alt: 'Wedding celebration' },
  { src: '/waitlist-4.png', alt: 'Networking event' },
  { src: '/waitlist-5.png', alt: 'Birthday selfie' },
];

// ============================================
// SCROLL-REVEAL HOOK
// ============================================
const useReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
};

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
const AnimatedStat = ({ value, label, sub }: { value: string; label: string; sub: string }) => {
  const { ref, revealed } = useReveal(0.3);

  return (
    <div ref={ref} className="group cursor-default">
      <div
        className={`text-2xl sm:text-5xl font-black text-ivory mb-1 sm:mb-2 tracking-tighter transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
          }`}
      >
        {value}
      </div>
      <div
        className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-ivory/30 mb-0.5 sm:mb-1 transition-all duration-700 delay-150 ${revealed ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {label}
      </div>
      <div
        className={`text-[10px] sm:text-xs font-medium text-ivory/20 transition-all duration-700 delay-300 hidden sm:block ${revealed ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {sub}
      </div>
    </div>
  );
};

// ============================================
// SECTION WRAPPER WITH REVEAL
// ============================================
const RevealSection = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { ref, revealed } = useReveal();

  return (
    <section
      ref={ref}
      className={`${className} transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      {children}
    </section>
  );
};

// ============================================
// LANDING PAGE COMPONENT
// ============================================
const LandingPage = () => {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCreateEvent = () => {
    if (isAuthenticated) {
      router.push('/events');
    } else {
      router.push('/auth');
    }
  };

  const handleJoinEvent = () => {
    if (isAuthenticated) {
      router.push('/events');
    } else {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-titanium overflow-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO (Above the Fold)
          ═══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-24 sm:pt-32 pb-8 sm:pb-12">
        {/* Top tagline */}
        {/* <div
          className="animate-slide-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ivory/5 border border-ivory/10 text-ivory/50 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3 text-ivory/40" />
            Private Event Photos
          </span>
        </div> */}

        {/* Headline */}
        <h1
          className="text-[28px] sm:text-5xl md:text-7xl font-black text-ivory mt-8 sm:mt-8 mb-5 sm:mb-6 tracking-tighter leading-[1] max-w-4xl animate-slide-up relative flex flex-col items-center"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          {/* Line 1 */}
          <div className="relative">
            <span className="relative z-10 block">Find Your Best Moments</span>
            <span className="absolute inset-0 z-20 pointer-events-none animate-shimmer select-none block" aria-hidden="true">
              Find Your Best Moments
            </span>
          </div>

          {/* Line 2 */}
          <div className="relative">
            <span className="relative z-10 block">
              in a <span className="text-ivory/30">Flash.</span>
            </span>
            <span
              className="absolute inset-0 z-20 pointer-events-none animate-shimmer select-none block"
              style={{ animationDelay: '2s' }}
              aria-hidden="true"
            >
              in a Flash.
            </span>
          </div>
        </h1>

        {/* Subtitle */}
        <p
          className="text-[13px] sm:text-lg text-ivory/40 mb-8 sm:mb-10 max-w-xl font-medium leading-relaxed animate-slide-up px-2 sm:px-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          From weddings to music festivals, Nenge helps you find your photos—without scrolling through thousands of images. Just snap a quick selfie, and you’ll see your best moments instantly in one place.
        </p>

        {/* Dual CTA */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 animate-slide-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          <button
            onClick={handleCreateEvent}
            className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-white text-titanium font-bold text-sm tracking-tight hover:bg-ivory transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2.5 shadow-[0_8px_32px_rgba(255,255,255,0.1)] cursor-pointer"
          >
            Create Event
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleJoinEvent}
            className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-ivory/5 border border-ivory/10 text-ivory font-bold text-sm tracking-tight hover:bg-ivory/10 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2.5 backdrop-blur-sm cursor-pointer"
          >
            Join Event
          </button>
        </div>

        {/* Trust line */}
        <p
          className="mt-6 text-[11px] text-ivory/20 font-medium flex items-center gap-3 animate-slide-up"
          style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
        >
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Private events only</span>
          <span className="w-1 h-1 rounded-full bg-ivory/10" />
          <span>No public face search</span>
        </p>
      </main>

      {/* ── Photo Gallery Carousel ── */}
      <section
        className="relative py-6 sm:py-8 animate-slide-up"
        style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
      >
        <div className="max-w-[1200px] mx-auto relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-48 bg-gradient-to-r from-titanium to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-48 bg-gradient-to-l from-titanium to-transparent z-10 pointer-events-none" />
          <div className="overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee">
              {[...galleryPhotos, ...galleryPhotos, ...galleryPhotos].map((photo, idx) => (
                <div
                  key={idx}
                  className="relative flex-shrink-0 w-32 sm:w-56 aspect-[3/4] mx-1.5 sm:mx-2 rounded-apple-md overflow-hidden group cursor-default"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 128px, 224px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — VISUAL PROOF (How It Looks)
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-32 px-5 sm:px-6 gradient-mesh">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-ivory/30 mb-3 sm:mb-4">The Magic</p>
          <h2 className="text-[22px] sm:text-4xl md:text-5xl font-black text-ivory tracking-tighter mb-10 sm:mb-16 leading-tight">
            See how it works in <span className="text-ivory/30">seconds.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload photos',
                desc: 'Drop your event photos or let guests upload theirs in real-time.',
              },
              {
                step: '02',
                icon: ScanFace,
                title: 'Upload selfie',
                desc: 'Take a quick selfie so Nenge knows who to look for. It stays private.',
              },
              {
                step: '03',
                icon: Images,
                title: 'See results',
                desc: 'Instantly get every photo you appear in. Download, share, relive.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative group cursor-pointer"
              >
                <div className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[20px] sm:rounded-[28px] p-6 sm:p-10 text-left hover:bg-ivory/[0.06] hover:border-ivory/[0.1] transition-all duration-500 h-full hover-lift">
                  <div className="flex items-center justify-between mb-5 sm:mb-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-ivory/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:bg-ivory/[0.1] transition-all duration-500">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-ivory/60 group-hover:text-ivory/80 transition-colors duration-300" />
                    </div>
                    <span className="text-4xl sm:text-5xl font-black text-ivory/[0.06] tracking-tighter group-hover:text-ivory/[0.1] transition-colors duration-500">{item.step}</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-ivory tracking-tight mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-[13px] sm:text-sm text-ivory/35 font-medium leading-relaxed group-hover:text-ivory/45 transition-colors duration-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          SECTION 3 — HOW IT WORKS (Structured)
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-32 px-5 sm:px-6 border-t border-ivory/[0.04] relative">
        {/* Decorative connecting line for desktop */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 w-[60%] max-w-xl h-px bg-gradient-to-r from-transparent via-ivory/[0.06] to-transparent" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-ivory/30 mb-3 sm:mb-4">Step by Step</p>
            <h2 className="text-[22px] sm:text-4xl md:text-5xl font-black text-ivory tracking-tighter leading-tight">
              How Nenge <span className="text-ivory/30">works.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: CalendarCheck,
                title: 'Create or join an event',
                desc: 'Upload photos or get invited to an event. It takes 30 seconds.',
                num: '1',
              },
              {
                icon: ScanFace,
                title: 'Upload a selfie (optional)',
                desc: 'Help Nenge find your photos. Your selfie is encrypted and never shared.',
                num: '2',
              },
              {
                icon: Zap,
                title: 'Get your photos instantly',
                desc: 'Only see images you\'re in. Download them all with a single tap.',
                num: '3',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center group relative">
                {/* Step number badge */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-ivory/[0.08] border border-ivory/[0.1] flex items-center justify-center z-10">
                  <span className="text-[10px] font-black text-ivory/40">{item.num}</span>
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-ivory/[0.06] border border-ivory/[0.06] flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-ivory/[0.1] group-hover:border-ivory/[0.1] transition-all duration-500">
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-ivory/50 group-hover:text-ivory/70 transition-colors duration-300" />
                </div>
                <h3 className="text-base sm:text-xl font-black text-ivory tracking-tight mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-[13px] sm:text-sm text-ivory/35 font-medium leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          SECTION 4 — PRIVACY (Trust Builder)
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-32 px-5 sm:px-6 gradient-mesh-alt">
        <div className="max-w-4xl mx-auto">
          <div className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[24px] sm:rounded-[32px] p-6 sm:p-14 glow-card">
            <div className="text-center mb-8 sm:mb-12">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-ivory/[0.06] flex items-center justify-center mx-auto mb-5 sm:mb-6 relative">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-ivory/50" />
                {/* Subtle pulse ring */}
                <div className="absolute inset-0 rounded-2xl border border-ivory/[0.08] animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="text-xl sm:text-4xl font-black text-ivory tracking-tighter mb-3 sm:mb-4">
                Built with your privacy <span className="text-ivory/30">in mind.</span>
              </h2>
              <p className="text-[13px] sm:text-sm text-ivory/30 font-medium max-w-lg mx-auto">
                We designed Nenge from the ground up so your identity is never exposed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {[
                { icon: Eye, text: 'Optional selfie upload', sub: 'Only if you choose' },
                { icon: Lock, text: 'Event-only matching', sub: 'Scoped per event' },
                { icon: UserCheck, text: 'No identity tracking', sub: 'Zero cross-event data' },
                { icon: Trash2, text: 'Auto data deletion', sub: 'Cleaned after event' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-ivory/[0.03] border border-ivory/[0.04] hover:bg-ivory/[0.06] hover:border-ivory/[0.08] transition-all duration-300 cursor-default group/card"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ivory/[0.06] flex items-center justify-center shrink-0 mt-0.5 group-hover/card:bg-ivory/[0.1] transition-colors duration-300">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-ivory/40 group-hover/card:text-ivory/60 transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-[13px] sm:text-sm font-bold text-ivory">{item.text}</p>
                    <p className="text-xs text-ivory/25 font-medium mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          SECTION 5 — WHO IT'S FOR
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-32 px-5 sm:px-6 border-t border-ivory/[0.04]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-ivory/30 mb-3 sm:mb-4">For Everyone</p>
          <h2 className="text-[22px] sm:text-4xl md:text-5xl font-black text-ivory tracking-tighter mb-10 sm:mb-16">
            Perfect for any <span className="text-ivory/30">event.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                icon: PartyPopper,
                title: 'Event Organizers',
                desc: 'Give your guests a premium experience. Let them find their photos without the hassle.',
                accent: 'from-ivory/[0.04] to-transparent',
              },
              {
                icon: CameraIcon,
                title: 'Photographers',
                desc: 'Upload once, deliver to everyone. No more manual sorting or tagging faces.',
                accent: 'from-ivory/[0.03] to-transparent',
              },
              {
                icon: UserCircle,
                title: 'Attendees',
                desc: 'Just snap a selfie and get every photo of yourself from the event. Zero effort.',
                accent: 'from-ivory/[0.04] to-transparent',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[20px] sm:rounded-[28px] p-6 sm:p-10 text-left hover:bg-ivory/[0.06] hover:border-ivory/[0.1] transition-all duration-500 group cursor-pointer hover-lift relative overflow-hidden"
              >
                {/* Subtle top gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-b ${item.accent} pointer-events-none`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-ivory/[0.06] flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-110 group-hover:bg-ivory/[0.1] transition-all duration-500">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-ivory/60 group-hover:text-ivory/80 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-ivory tracking-tight mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-[13px] sm:text-sm text-ivory/35 font-medium leading-relaxed group-hover:text-ivory/45 transition-colors duration-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          SECTION 6 — SOCIAL PROOF
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-28 px-5 sm:px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-ivory/30 mb-3 sm:mb-4">Trusted</p>
          <h2 className="text-[22px] sm:text-4xl font-black text-ivory tracking-tighter mb-10 sm:mb-16">
            Already being <span className="text-ivory/30">used.</span>
          </h2>

          <div className="grid grid-cols-3 gap-4 sm:gap-12 mb-10 sm:mb-16">
            <AnimatedStat value="1,200+" label="Photos Processed" sub="Across early test events" />
            <AnimatedStat value="15+" label="Events Hosted" sub="Weddings, parties, meetups" />
            <AnimatedStat value="<3s" label="Avg Match Time" sub="From selfie to results" />
          </div>

          <div className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[20px] sm:rounded-[24px] p-6 sm:p-10 max-w-2xl mx-auto relative overflow-hidden">
            {/* Decorative quote accent */}
            <div className="absolute top-4 left-6 text-ivory/[0.04] text-7xl font-serif leading-none pointer-events-none select-none">&ldquo;</div>
            <p className="text-ivory/50 text-[13px] sm:text-base font-medium leading-relaxed italic relative z-10">
              &ldquo;Processed over 1,200 photos across early test events — guests found their photos
              in under 3 seconds.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="w-8 h-8 rounded-full bg-ivory/[0.08] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-ivory/30" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/20 font-bold">Nenge Early Access Program</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          SECTION 7 — FINAL CTA
          ═══════════════════════════════════════════ */}
      <RevealSection className="py-14 sm:py-32 px-5 sm:px-6 border-t border-ivory/[0.04] relative">
        {/* Background radial glow behind CTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] sm:w-[600px] h-[250px] sm:h-[400px] bg-ivory/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-[26px] sm:text-5xl md:text-6xl font-black text-ivory tracking-tighter mb-5 sm:mb-6 leading-[0.92]">
            Ready to try <span className="text-ivory/30">Nenge?</span>
          </h2>
          <p className="text-[13px] sm:text-lg text-ivory/35 font-medium mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
            Create your first event and let people find their photos instantly.
            No setup fees, no complex configuration.
          </p>
          <button
            onClick={handleCreateEvent}
            className="w-full sm:w-auto h-13 sm:h-16 px-10 sm:px-14 rounded-full bg-white text-titanium font-bold text-[15px] sm:text-base tracking-tight hover:bg-ivory hover:shadow-[0_12px_48px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 mx-auto shadow-[0_8px_32px_rgba(255,255,255,0.1)] cursor-pointer"
          >
            Create Event
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-[11px] text-ivory/15 font-medium">Free to get started · No credit card required</p>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="border-t border-ivory/[0.06] py-10 sm:py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/logo-white.png" alt="Nenge Logo" width={130} height={52} className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold tracking-tight text-ivory">Nenge</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.15em] text-ivory/20">
              <Link href="/privacy" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Privacy</Link>
              <Link href="/terms" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Terms</Link>
              <a href="mailto:hello@nenge.ng" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Contact</a>
            </div>

            {/* Social */}
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

          {/* Bottom line */}
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
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
const HomePage = () => {
  return <LandingPage />;
};

export default HomePage;









