import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
    params: Promise<{ id: string }>
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${apiUrl}/events/${id}`, { cache: 'no-store' });
        const data = await res.json();
        
        let eventMeta = null;
        let ownerUsername = 'Host';
        if (res.ok) {
            eventMeta = data;
            ownerUsername = data.owner_username || 'Host';
        } else if (res.status === 403 && data.detail && data.detail.event) {
            // Private event, but metadata is safely exposed
            eventMeta = data.detail.event;
            ownerUsername = data.detail.owner?.username || 'Host';
        }

        if (eventMeta && eventMeta.title) {
             const title = eventMeta.title;
             const desc = eventMeta.description ? `${eventMeta.description} - Find your event photos instantly.` : 'Find your event photos instantly on Nenge.';
             
             // Ensure cover image URL is absolute for OG crawlers
             let coverImageUrl = eventMeta.cover_image_url || '';
             if (coverImageUrl && !coverImageUrl.startsWith('http')) {
                 const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                 const baseOrigin = new URL(apiBase).origin;
                 coverImageUrl = `${baseOrigin}${coverImageUrl.startsWith('/') ? '' : '/'}${coverImageUrl}`;
             }
             
             const images = coverImageUrl ? [coverImageUrl] : [];
             const fullTitle = `Nenge - ${ownerUsername} invites you to join - ${title}`;

             return {
                 title: fullTitle,
                 description: desc,
                 metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nenge.ng'),
                 openGraph: {
                     title: fullTitle,
                     description: desc,
                     images: images.length > 0 ? images : ["/logo-black.png"],
                     type: 'website',
                 },
                 twitter: {
                     card: 'summary_large_image',
                     title: fullTitle,
                     description: desc,
                     images: images.length > 0 ? images : ["/logo-black.png"],
                 }
             };
        }
    } catch (e) {
        console.error("Failed to fetch event metadata for SEO", e);
    }
    
    return {
        title: 'Gathering | Nenge',
        description: 'Join my gathering on Nenge.'
    };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
