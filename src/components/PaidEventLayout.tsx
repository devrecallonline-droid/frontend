'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Event, Photo } from '@/lib/api';
import {
  Calendar,
  MapPin,
  Search,
  Upload,
  Heart,
  ChevronDown,
  Clock,
  Camera,
  Menu,
  X,
  Lock,
  User
} from 'lucide-react';

interface PaidEventLayoutProps {
  event: Event;
  isOwner: boolean;
  isAuthenticated: boolean;
  accessStatus?: 'pending' | 'approved' | 'none';
  photos: Photo[];
  page?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  isFetchingPhotos?: boolean;
  onPageChange?: (page: number) => void;
  onSearch: () => void;
  onUpload: () => void;
  onPhotoClick: (photo: Photo) => void;
  onRequestAccess?: () => void;
  onLogin?: () => void;
}

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

export function PaidEventLayout({
  event,
  isOwner,
  isAuthenticated,
  accessStatus = 'none',
  photos,
  page = 1,
  totalPages = 1,
  hasNextPage = false,
  isFetchingPhotos = false,
  onPageChange,
  onSearch,
  onUpload,
  onPhotoClick,
  onRequestAccess,
  onLogin
}: PaidEventLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Navigation items
  const navItems = [
    { id: 'when-where', label: 'When & Where' },
    { id: 'our-story', label: 'Our Story' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'find-photos', label: 'Find Your Photos' },
  ];

  // Determine what action to show in Find Your Photos section
  const renderFindPhotosAction = () => {
    // Not logged in - show login button
    if (!isAuthenticated) {
      return (
        <div className="space-y-4">
          <Button
            onClick={onLogin}
            className="bg-white text-titanium hover:bg-white/90 px-8 py-6 h-auto text-sm uppercase tracking-[0.15em] font-medium rounded-full"
          >
            <User className="w-4 h-4 mr-2" />
            Login to Find Photos
          </Button>
          <p className="text-ivory/50 text-sm">
            You need to be logged in to search for your photos
          </p>
        </div>
      );
    }

    // Logged in but no access - show request access button
    if (accessStatus === 'none') {
      return (
        <div className="space-y-4">
          <Button
            onClick={onRequestAccess}
            className="bg-white text-titanium hover:bg-white/90 px-8 py-6 h-auto text-sm uppercase tracking-[0.15em] font-medium rounded-full"
          >
            <Lock className="w-4 h-4 mr-2" />
            Request Access
          </Button>
          <p className="text-ivory/50 text-sm">
            Request access from the event owner to search for your photos
          </p>
        </div>
      );
    }

    // Access pending
    if (accessStatus === 'pending') {
      return (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-[28px]">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm uppercase tracking-[0.15em] font-medium">Access Request Pending</span>
          </div>
          <p className="text-ivory/50 text-sm">
            Waiting for the event owner to approve your request
          </p>
        </div>
      );
    }

    // Has access - show scan button
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          onClick={onSearch}
          className="bg-white text-titanium hover:bg-white/90 px-8 py-6 h-auto text-sm uppercase tracking-[0.15em] font-medium rounded-full shadow-premium"
        >
          <Search className="w-4 h-4 mr-2" />
          Scan for My Photos
        </Button>

        {isOwner && (
          <Button
            onClick={onUpload}
            variant="outline"
            className="border-ivory/30 text-ivory hover:bg-ivory/10 px-8 py-6 h-auto text-sm uppercase tracking-[0.15em] font-medium rounded-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Photos
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-titanium">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-titanium/90 backdrop-blur-md border-b border-ivory/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Names */}
            <button
              onClick={() => scrollToSection('hero')}
              className="text-lg font-serif italic text-ivory hover:text-ivory/80 transition-colors"
            >
              {event.title}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-xs uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ivory"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-titanium border-t border-ivory/[0.06]"
            >
              <div className="px-4 py-4 space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      scrollToSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-xs uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory transition-colors font-medium py-2"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {event.cover_image_url ? (
            <OptimizedImage
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-titanium to-titanium/80" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center"
          >
            <p className="text-ivory/80 text-xs uppercase tracking-[0.3em] mb-6 font-medium">
              {event.event_type || 'Event'}
            </p>

            <div className="flex flex-col items-center justify-center gap-8 mb-6">
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter italic text-ivory leading-tight text-center">
                {event.title}
              </h1>
            </div>

            {event.event_date && (
              <div className="flex items-center justify-center gap-2 text-ivory/90 mb-4">
                <Calendar className="w-4 h-4" />
                <p className="text-sm uppercase tracking-[0.2em] font-medium">
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {event.location && (
              <div className="flex items-center justify-center gap-2 text-ivory/80 mb-10 text-center">
                <MapPin className="w-4 h-4" />
                <p className="text-sm tracking-wide">
                  {event.location}
                </p>
              </div>
            )}

            {/* Find Photos Button */}
            <div className="flex justify-center w-full">
              {renderFindPhotosAction()}
            </div>

            <motion.button
              onClick={() => scrollToSection('when-where')}
              className="mt-16 text-ivory/70 hover:text-ivory transition-colors"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-8 h-8" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* When & Where Section */}
      <section id="when-where" className="py-24 md:py-32 bg-titanium">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-ivory/40 text-xs uppercase tracking-[0.3em] mb-4 font-bold">Details</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic text-ivory mb-16">
              When & Where
            </h2>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Date */}
              <div className="text-center md:text-right md:pr-8 md:border-r border-ivory/[0.06]">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-ivory/[0.06] rounded-2xl mb-6">
                  <Calendar className="w-7 h-7 text-ivory/60" />
                </div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-ivory/50 mb-3 font-bold">
                  Date
                </h3>
                {event.event_date ? (
                  <>
                    <p className="text-3xl font-black tracking-tighter italic text-ivory mb-2">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xl text-ivory/60 mb-1">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-ivory/40 mt-2 font-medium">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long'
                      })}
                    </p>
                  </>
                ) : (
                  <p className="text-ivory/40 italic">Date to be announced</p>
                )}
              </div>

              {/* Location */}
              <div className="text-center md:text-left md:pl-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-ivory/[0.06] rounded-2xl mb-6">
                  <MapPin className="w-7 h-7 text-ivory/60" />
                </div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-ivory/50 mb-3 font-bold">
                  Location
                </h3>
                {event.location ? (
                  <>
                    <p className="text-2xl font-black tracking-tighter italic text-ivory mb-2">
                      {event.location}
                    </p>
                    <p className="text-sm text-ivory/40 mt-2 font-medium">
                      Join us at this beautiful venue
                    </p>
                  </>
                ) : (
                  <p className="text-ivory/40 italic">Location to be announced</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="our-story" className="py-24 md:py-32 bg-titanium">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-ivory/40 text-xs uppercase tracking-[0.3em] mb-4 font-bold">About</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic text-ivory mb-12">
              Our Story
            </h2>

            <div className="prose prose-lg mx-auto">
              {event.description ? (
                <p className="text-ivory/60 leading-relaxed text-lg font-medium">
                  {event.description}
                </p>
              ) : (
                <p className="text-ivory/40 italic">
                  A beautiful story waiting to be told...
                </p>
              )}
            </div>

            {/* Decorative Element */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <div className="h-px w-16 bg-ivory/[0.06]" />
              <Heart className="w-5 h-5 text-ivory/20" />
              <div className="h-px w-16 bg-ivory/[0.06]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 md:py-32 bg-titanium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-ivory/40 text-xs uppercase tracking-[0.3em] mb-4 font-bold">Memories</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic text-ivory mb-4">
              Gallery
            </h2>
            <p className="text-ivory/40 max-w-md mx-auto text-sm font-medium">
              {photos.length > 0
                ? `${photos.length} beautiful moments captured`
                : 'Photos will appear here soon'
              }
            </p>
          </motion.div>

          {/* Photo Grid */}
          {photos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => onPhotoClick(photo)}
                    className="aspect-square overflow-hidden rounded-[28px] cursor-pointer group bg-ivory/[0.03] border border-ivory/[0.06]"
                  >
                    <OptimizedImage
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {(totalPages > 1) && (
                <div className="flex items-center justify-center gap-4 mt-12 py-4">
                  <Button
                    variant="outline"
                    disabled={page === 1 || isFetchingPhotos}
                    onClick={() => onPageChange?.(Math.max(1, page - 1))}
                    className="px-6 border-ivory/20 text-ivory hover:bg-ivory/10 hover:text-ivory"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-bold text-ivory/60">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!hasNextPage || isFetchingPhotos}
                    onClick={() => onPageChange?.(page + 1)}
                    className="px-6 border-ivory/20 text-ivory hover:bg-ivory/10 hover:text-ivory"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-ivory/[0.03] border border-ivory/[0.06] rounded-[28px]">
              <Camera className="w-12 h-12 text-ivory/20 mx-auto mb-4" />
              <p className="text-ivory/40 italic">
                No photos yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Find Your Photos Section */}
      <section id="find-photos" className="py-24 md:py-32 bg-titanium text-ivory">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Hero-style headline matching landing page */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter italic mb-6 leading-[1]">
              <span className="text-ivory">Find Your Best Moments</span>
              <br />
              <span className="text-ivory/30">in a Flash.</span>
            </h2>

            <p className="text-ivory/40 text-base sm:text-lg mb-10 leading-relaxed font-medium max-w-xl mx-auto">
              From weddings to music festivals, Nenge helps you find your photos—without scrolling through thousands of images. Just snap a quick selfie, and you&apos;ll see your best moments instantly in one place.
            </p>

            {renderFindPhotosAction()}

            <div className="flex items-center justify-center gap-2 mt-8 text-ivory/30 text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>Takes less than 30 seconds</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-titanium text-ivory/40 border-t border-ivory/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-black tracking-tighter italic text-ivory/60 mb-2">{event.title}</p>
          <p className="text-xs uppercase tracking-[0.2em] font-bold">
            Made with love
          </p>
        </div>
      </footer>
    </div>
  );
}
