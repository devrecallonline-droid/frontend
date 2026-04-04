'use client';

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUI } from '@/hooks/use-api'
import Navigation from '@/components/Navigation'
import { ShieldCheck, Camera, Settings, ArrowRight, Grid3X3, Sparkles } from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'

// Hero Section
const Hero = () => {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/events')
    } else {
      router.push('/auth')
    }
  }

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background - Pure Neutral */}
      <div className="absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-slide-up">
        <Badge variant="secondary" className="mb-8">
          <Sparkles className="w-3 h-3 mr-2" />
          The "Magic" Photo Finder
        </Badge>

        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-titanium mb-8 tracking-tighter leading-[0.9]">
          Found in a <span className="opacity-30">Flash.</span><br />
          Private by Design.
        </h1>

        <p className="text-lg md:text-2xl text-titanium/60 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
          Stop the endless scroll. Use your personal memory assistant to find every photo
          of yourself at any event—instantly and privately.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="default"
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleGetStarted}
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Features Section
const FeaturesGrid = () => {
  const features = [
    {
      title: "Finding You in a Flash",
      description: "Instead of scrolling for hours, just snap a quick selfie. We'll find every shot of you in seconds.",
      icon: ShieldCheck,
      color: "text-titanium"
    },
    {
      title: "The Circle of Trust",
      description: "Only approved guests can search. Your memories stay between you and the host you know.",
      icon: Camera,
      color: "text-titanium"
    },
    {
      title: "Private Islands",
      description: "Every event is its own separate space. We never track who you are from one party to the next.",
      icon: Settings,
      color: "text-titanium"
    }
  ]

  return (
    <section className="py-16 sm:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="hover:scale-[1.02] transition-transform duration-500 cursor-default">
              <div className="w-12 h-12 rounded-apple-md bg-titanium/5 flex items-center justify-center mb-8">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-2xl font-black text-titanium mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-titanium/50 font-medium leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// OS-Style Stats Section
const StatsSection = () => {
  return (
    <section className="py-16 sm:py-32 px-6 bg-black/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-black mb-16 tracking-tight">Focus on What Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { label: 'Privacy', value: '1:1', sub: 'Hosts can\'t see matches' },
            { label: 'Security', value: 'Zero', sub: 'No facial maps saved' },
            { label: 'Control', value: 'Auto', sub: 'Data deletes itself' }
          ].map((stat, i) => (
            <div key={i} className="group">
              <div className="text-6xl font-black text-titanium mb-2 tracking-tighter group-hover:scale-110 transition-transform duration-500">
                {stat.value}
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-titanium/30 mb-1">{stat.label}</div>
              <div className="text-sm font-medium text-titanium/50">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA / Closing Section
const CTASection = () => {
  return (
    <section className="py-20 sm:py-40 px-6">
      <Card className="max-w-5xl mx-auto bg-white/40 glass border-white/60 p-8 sm:p-16 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-8 tracking-tighter text-titanium">Stop hunting, start reliving.</h2>
          <p className="text-xl text-titanium/60 mb-12 max-w-xl mx-auto font-medium">
            Get your time back and keep your privacy. Find your photos the easy way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto">
              Create Event
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold uppercase tracking-widest text-xs">
              View Showcase
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}

const HomePage = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      <Navigation />

      <main>
        <Hero />
        <FeaturesGrid />
        <StatsSection />
        <CTASection />
      </main>

      <footer className="py-20 px-6 border-t border-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-titanium rounded-apple-sm flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Remember</span>
          </div>

          <div className="flex space-x-8 text-sm font-bold uppercase tracking-widest text-titanium/30">
            <Link href="/privacy" className="hover:text-titanium transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-titanium transition-colors">Terms</Link>
            <Link href="/docs" className="hover:text-titanium transition-colors">Docs</Link>
          </div>

          <p className="text-sm font-medium text-titanium/30">© 2024 Remember. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
