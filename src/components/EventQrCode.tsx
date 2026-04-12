'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, ScanFace } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

interface EventQrCodeProps {
  url: string;
  eventName: string;
  className?: string;
  lightMode?: boolean;
}

export function EventQrCode({ url, eventName, className = '', lightMode = false }: EventQrCodeProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [logoWhiteBase64, setLogoWhiteBase64] = useState<string | undefined>(undefined);

  // Preload logos
  useEffect(() => {
    const loadLogo = async (src: string, setter: (val: string) => void) => {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(`Failed to load logo ${src}:`, err);
      }
    };
    loadLogo('/logo-black.png', setLogoBase64);
    loadLogo('/logo-white.png', setLogoWhiteBase64);
  }, []);

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    // Get the SVG element
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrImg = new Image();
    
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const urlBlob = URL.createObjectURL(blob);
    
    qrImg.onload = () => {
      // Made 1.5x larger for high definition print/screens
      const cardWidth = 900;
      const cardHeight = 1440; // 5:8 vertical ID card ratio
      canvas.width = cardWidth;
      canvas.height = cardHeight;
      
      if (ctx) {
        // 1. Draw premium dark background
        const gradient = ctx.createLinearGradient(0, 0, 0, cardHeight);
        gradient.addColorStop(0, '#0F172A'); // Slate 900
        gradient.addColorStop(1, '#1E293B'); // Slate 800
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 2. Add subtle border/glass effect border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

        // 5. Draw Header
        ctx.fillStyle = '#94A3B8'; // Slate 400
        ctx.font = 'bold 28px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '10px';
        ctx.fillText('SCAN TO FIND YOUR PHOTOS', cardWidth / 2, 250);

        // 6. Draw Event Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 72px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        // Simple naive word wrap
        const words = eventName.split(' ');
        let line = '';
        let y = 380;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 750 && i > 0) {
                ctx.fillText(line.trim(), cardWidth / 2, y);
                line = words[i] + ' ';
                y += 90;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), cardWidth / 2, y);

        // 7. Draw the QR code background (white rounded rect)
        const qrSize = 560;
        const qrX = (cardWidth - qrSize) / 2;
        const qrY = 660;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 36);
        ctx.fill();

        // Draw actual QR Image
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // 8. Draw Footer
        ctx.fillStyle = '#475569'; // Slate 600
        ctx.font = 'bold 24px Inter, system-ui, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('SCAN FOR EVENT DETAILS', cardWidth / 2, 1340);

        // Finalize and download
        const pngFile = canvas.toDataURL('image/png', 1.0);
        const downloadLink = document.createElement('a');
        downloadLink.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pass.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        URL.revokeObjectURL(urlBlob);
      } else {
          URL.revokeObjectURL(urlBlob);
      }
    };
    
    qrImg.src = urlBlob;
  };

  return (
    <>
      {/* Large Visible QR Card Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group relative flex flex-col items-center p-4 rounded-3xl backdrop-blur-sm transition-all duration-500 ease-out transform sm:hover:scale-105 border shadow-xl w-full sm:w-auto ${
          lightMode 
            ? 'bg-white border-slate-200 hover:shadow-indigo-500/10' 
            : 'bg-slate-900/50 border-white/10 hover:bg-slate-800/80 hover:shadow-white/5'
        } ${className}`}
      >
        <div className="bg-white p-3 rounded-2xl shadow-inner mb-3">
            <QRCodeSVG 
                value={url} 
                size={140} 
                level="H" 
                marginSize={0}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                imageSettings={logoBase64 ? {
                    src: logoBase64,
                    height: 36,
                    width: 36,
                    excavate: true,
                } : undefined}
            />
        </div>
        
        <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${
              lightMode ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 text-white'
            }`}>
              <ScanFace className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col items-start pr-1 text-left">
              <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 ${
                lightMode ? 'text-slate-400' : 'text-white/40'
              }`}>
                Click to Enlarge
              </span>
              <span className={`text-xs font-bold tracking-wide leading-none ${
                lightMode ? 'text-slate-800' : 'text-white'
              }`}>
                Get Event Pass
              </span>
            </div>
        </div>
      </button>

      {/* Replaced Modal with a custom full-screen/large modal approach for a massive QR card */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="flex flex-col items-center justify-center max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated ID Pass Preview - Super Sized */}
            <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] aspect-[5/8] bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border flex flex-col items-center p-8 sm:p-10 border-slate-700/50 mb-8 overflow-hidden transform transition-transform duration-500 ease-out">
                {/* Lanyard Hole */}
                <div className="absolute top-6 w-16 sm:w-20 h-4 bg-slate-800 rounded-full border border-slate-950 shadow-inner"></div>

                {/* Event Text */}
                <div className="w-full text-center flex flex-col items-center mt-12 sm:mt-16">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Scan to find your photos</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-8 sm:mb-12 text-center line-clamp-2 px-2">{eventName}</h3>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 sm:p-5 rounded-[2rem] shadow-xl w-full max-w-[280px] sm:max-w-[320px] flex items-center justify-center mt-auto mb-4 relative group">
                    <QRCodeSVG 
                        ref={qrRef}
                        value={url} 
                        size={300} 
                        level="H" // High error correction
                        marginSize={0}
                        bgColor="#FFFFFF"
                        fgColor="#0F172A" // Deep Slate
                        imageSettings={logoBase64 ? {
                            src: logoBase64,
                            height: 64,
                            width: 64,
                            excavate: true, // Cuts out the background so logo pops
                        } : undefined}
                        style={{ width: '100%', height: 'auto' }}
                    />
                </div>

                {/* Footer text */}
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-auto">Scan for details</span>
            </div>

            <div className="w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] flex gap-4">
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1 h-14 sm:h-16 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md text-base sm:text-lg transition-colors border border-white/10"
              >
                Close
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-[2] h-14 sm:h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-600/30 text-base sm:text-lg transition-colors border border-indigo-500/50"
              >
                <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Download Pass
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
