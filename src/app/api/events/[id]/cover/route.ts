import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Wait for params in Next.js 15+ compatible way
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
            // Social media crawlers follow 302 redirects properly.
            // This hides the complex presigned URL parameters from the OG tags
            return NextResponse.redirect(coverUrl);
        }
    } catch (e) {
        console.error("Cover route error", e);
    }
    
    // Fallback image if event has no cover or fetch fails
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nenge.ng';
    return NextResponse.redirect(`${baseUrl}/logo-black.png`);
}
