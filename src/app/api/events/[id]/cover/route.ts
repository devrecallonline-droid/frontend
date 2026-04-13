import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    try {
        const res = await fetch(`${apiUrl}/events/${id}`, { cache: 'no-store' });
        const data = await res.json();
        
        let coverUrl = null;
        if (res.ok && data.cover_image_url) {
            coverUrl = data.cover_image_url;
        } else if (res.status === 403 && data.detail?.event?.cover_image_url) {
            coverUrl = data.detail.event.cover_image_url;
        }

        if (coverUrl) {
            // Proxy the image directly instead of redirecting.
            // Many social media crawlers (WhatsApp, Facebook, Twitter/X) 
            // do NOT follow 302 redirects for OG images, especially 
            // presigned URLs with complex query parameters.
            const imageRes = await fetch(coverUrl);
            
            if (imageRes.ok && imageRes.body) {
                const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
                const imageBuffer = await imageRes.arrayBuffer();
                
                return new NextResponse(imageBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                        'CDN-Cache-Control': 'public, max-age=3600',
                    },
                });
            }
        }
    } catch (e) {
        console.error("Cover route error", e);
    }
    
    // Fallback: serve the logo if no cover image
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nenge.ng';
    return NextResponse.redirect(`${baseUrl}/logo-black.png`);
}
