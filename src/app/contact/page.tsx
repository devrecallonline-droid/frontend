'use client';

import { Mail, Phone, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-titanium overflow-hidden">
      <Navigation />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-32 pb-20">
        <div className="max-w-3xl w-full mx-auto">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-ivory/30 mb-3 sm:mb-4 animate-slide-up">Get in Touch</p>
          <h1 className="text-[32px] sm:text-5xl md:text-6xl font-black text-ivory tracking-tighter mb-6 sm:mb-8 leading-tight animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            We'd love to hear from <span className="text-ivory/30">you.</span>
          </h1>
          <p className="text-[13px] sm:text-base text-ivory/40 font-medium mb-12 sm:mb-16 leading-relaxed max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            Whether you have a question about our platform, need help with an event, or just want to say hi, our team is ready to answer all your questions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            {/* Email Card */}
            <a href="mailto:admin@nenge.ng" className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[24px] p-8 text-left hover:bg-ivory/[0.06] hover:border-ivory/[0.1] transition-all duration-300 group cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-ivory/[0.06] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-ivory/[0.1] transition-all duration-300">
                <Mail className="w-5 h-5 text-ivory/60 group-hover:text-ivory/80" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-ivory tracking-tight mb-2">Email Us</h3>
              <p className="text-[13px] sm:text-sm text-ivory/35 font-medium mb-4">Drop us a line anytime. We usually respond within 24 hours.</p>
              <p className="text-sm sm:text-base font-bold text-ivory flex items-center gap-2">
                admin@nenge.ng <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </p>
            </a>

            {/* Phone Card */}
            <a href="tel:08106119178" className="bg-ivory/[0.03] border border-ivory/[0.06] rounded-[24px] p-8 text-left hover:bg-ivory/[0.06] hover:border-ivory/[0.1] transition-all duration-300 group cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-ivory/[0.06] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-ivory/[0.1] transition-all duration-300">
                <Phone className="w-5 h-5 text-ivory/60 group-hover:text-ivory/80" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-ivory tracking-tight mb-2">Call Us</h3>
              <p className="text-[13px] sm:text-sm text-ivory/35 font-medium mb-4">Mon-Fri from 8am to 5pm. We're here to help.</p>
              <p className="text-sm sm:text-base font-bold text-ivory flex items-center gap-2">
                08106119178 <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </p>
            </a>
          </div>
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
              <Link href="/terms" className="hover:text-ivory/60 transition-colors duration-200 cursor-pointer">Terms</Link>
              <Link href="/contact" className="text-ivory/60 transition-colors duration-200 cursor-pointer">Contact</Link>
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
