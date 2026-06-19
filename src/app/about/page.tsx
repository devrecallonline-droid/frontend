'use client';

import { useRef, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-api';
import Image from 'next/image';
import { ChevronDown, ArrowRight } from 'lucide-react';

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

const IMG = 'https://images.unsplash.com/photo-';
const IMG_PARAMS = '?w=1600&q=80&fm=jpg&crop=entropy&cs=srgb';

const ImageSection = ({ photoId, alt }: { photoId: string; alt: string }) => (
  <section className="w-full h-[50vh] sm:h-[70vh] relative overflow-hidden">
    <Image
      src={photoId.startsWith('/') ? photoId : `${IMG}${photoId}${IMG_PARAMS}`}
      alt={alt}
      fill
      className="object-cover"
      sizes="100vw"
    />
  </section>
);

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleCTA = () => router.push(isAuthenticated ? '/events' : '/auth');

  return (
    <div className="min-h-screen bg-ivory overflow-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col items-center justify-center px-5 sm:px-6 overflow-hidden">
        <Image
          src='/01.jpg'
          alt="Concert crowd cheering"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-ivory tracking-tighter leading-[0.9] mb-6 sm:mb-8">
            Every Moment
            <br />
            Deserves
            <br />
            to Be Found.
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-ivory/50 font-medium">
            The story behind Nenge.
          </p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-ivory/30">Scroll</span>
          <ChevronDown className="w-4 h-4 text-ivory/30 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — EVERY EVENT ENDS
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <p className="text-xl sm:text-2xl text-titanium/80 leading-[1.7] font-medium">
            Every event ends.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/80 leading-[1.7] font-medium">
            The music fades.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/80 leading-[1.7] font-medium">
            The decorations come down.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/80 leading-[1.7] font-medium">
            The lights go out.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/80 leading-[1.7] font-medium">
            But the memories stay.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/80 leading-[1.7] font-medium">
            Or at least they should.
          </p>

          <div className="h-6 sm:h-8" />

          <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
            The problem is that today&rsquo;s memories often get lost.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
            They&rsquo;re buried inside massive folders, scattered across WhatsApp groups, hidden behind Google Drive links, or forgotten on someone else&rsquo;s camera roll.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
            Thousands of photos are taken.
          </p>
          <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
            Yet somehow, the moments that matter most to us become the hardest to find.
          </p>

          <div className="h-6 sm:h-8" />

          <p className="text-xl sm:text-2xl text-titanium font-bold leading-[1.7]">
            We don&rsquo;t think it should be that way.
          </p>
        </div>
      </RevealSection>

      {/* ═══ IMAGE 1 ═══ */}
      <ImageSection photoId="/02.jpg" alt="Couple dancing at a wedding reception" />

      {/* ═══════════════════════════════════════════
          SECTION 3 — WHAT WE BELIEVE
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter mb-12 sm:mb-16">
            What We Believe
          </h2>
          <div className="space-y-5 sm:space-y-6">
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              We believe every person deserves to leave an event with their own memories.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Not after hours of scrolling.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Not after asking a photographer for a link.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Not after searching through thousands of photos of strangers.
            </p>
            <div className="h-6" />
            <p className="text-xl sm:text-2xl text-titanium font-bold leading-[1.7]">
              Your moments should find you.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ═══ IMAGE 2 ═══ */}
      <ImageSection photoId="/04.jpg" alt="Group of people hugging at a concert" />

      {/* ═══════════════════════════════════════════
          SECTION 4 — WHY WE BUILT NENGE
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter mb-12 sm:mb-16">
            Why We Built Nenge
          </h2>
          <div className="space-y-5 sm:space-y-6">
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Nenge was born from a simple question:
            </p>
            <blockquote className="text-2xl sm:text-3xl text-titanium font-black tracking-tight leading-snug italic pl-4 sm:pl-6 border-l-2 border-titanium/10 py-2 my-8">
              Why is finding yourself in event photos still so difficult?
            </blockquote>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Whether it&rsquo;s a wedding, concert, birthday, graduation, festival, or family celebration, people shouldn&rsquo;t have to dig through endless galleries just to relive the moments they were part of.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              So we built something different.
            </p>
            <div className="h-4" />
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Upload event photos once.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Guests upload a quick selfie.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Nenge helps them discover the photos that belong to their story.
            </p>
            <div className="h-4" />
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Simple. Fast. Private.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ═══ IMAGE 3 ═══ */}
      <ImageSection photoId="/03.jpg" alt="Graduates tossing their caps in the air" />

      {/* ═══════════════════════════════════════════
          SECTION 5 — MORE THAN A PHOTO APP
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter mb-12 sm:mb-16">
            More Than a Photo App
          </h2>
          <div className="space-y-5 sm:space-y-6">
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              We&rsquo;re not building another photo gallery.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              We&rsquo;re building a better way for people to reconnect with the moments that matter.
            </p>
            <div className="h-6" />
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              For guests, it&rsquo;s about finding memories they didn&rsquo;t know existed.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              For photographers, it&rsquo;s about delivering a better experience.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              For event hosts and planners, it&rsquo;s about giving every guest something meaningful to take home long after the event is over.
            </p>
            <div className="h-6" />
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Because the best events don&rsquo;t end when the lights go out.
            </p>
            <p className="text-xl sm:text-2xl text-titanium font-bold leading-[1.7]">
              They live on through the moments people remember.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ═══ IMAGE 4 ═══ */}
      <ImageSection photoId="/waitlist-3.png" alt="Graduation celebration with family and friends" />

      {/* ═══════════════════════════════════════════
          SECTION 6 — OUR VISION
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter mb-12 sm:mb-16">
            Our Vision
          </h2>
          <div className="space-y-5 sm:space-y-6">
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              We imagine a world where no meaningful memory is ever lost in a folder.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Where every celebration is easier to relive.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Where every guest can instantly find the moments that belong to them.
            </p>
            <div className="h-6" />
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              That&rsquo;s the future we&rsquo;re building.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              One event at a time.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ═══ IMAGE 5 ═══ */}
      <ImageSection photoId="/05.jpg" alt="Couple embracing outdoors during golden hour" />

      {/* ═══════════════════════════════════════════
          SECTION 7 — BUILT IN NIGERIA
          ═══════════════════════════════════════════ */}
      <RevealSection className="px-5 sm:px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter mb-12 sm:mb-16">
            Built in Nigeria.
            <br />
            Made for the World.
          </h2>
          <div className="space-y-5 sm:space-y-6">
            <p className="text-xl sm:text-2xl text-titanium/70 leading-[1.7]">
              Nenge is proudly built in Nigeria with a simple belief:
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Great memories are universal.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              Whether it&rsquo;s a wedding in Abuja, a graduation in London, a concert in New York, or a family gathering anywhere in the world, people deserve an easier way to reconnect with the moments that matter.
            </p>
            <p className="text-xl sm:text-2xl text-titanium/50 leading-[1.7]">
              We&rsquo;re building Nenge for everyone who has ever wondered:
            </p>
            <blockquote className="text-xl sm:text-2xl text-titanium/70 leading-[1.7] italic pl-4 sm:pl-6 border-l-2 border-titanium/10 py-2 my-6">
              &ldquo;I know there&rsquo;s a photo of me somewhere&hellip; where is it?&rdquo;
            </blockquote>
            <p className="text-xl sm:text-2xl text-titanium font-bold leading-[1.7]">
              Now, you&rsquo;ll know exactly where to look.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════
          SECTION 8 — FINAL CTA
          ═══════════════════════════════════════════ */}
      <section className="px-5 sm:px-6 py-32 sm:py-44 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter leading-[1.1] mb-10 sm:mb-12">
            Your next favorite memory
            <br />
            might already be waiting.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={handleCTA}
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
      </section>

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
              <Link href="/about" className="hover:text-titanium/60 transition-colors duration-200 text-titanium/60">About Us</Link>
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
