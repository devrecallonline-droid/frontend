import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Send welcome email
    await resend.emails.send({
      from: `Memzo <${fromEmail}>`,
      to: email,
      subject: "You're on the Memzo waitlist!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff; color: #1a1a1a; line-height: 1.6;">
          <p>Hi there,</p>
          
          <p>You’re officially on the <strong>Memzo</strong> waitlist—welcome! 🎉</p>
          
          <p>Let’s be honest: after a wedding, concert, or big event, thousands of photos get shared… and somehow the best shots of <em>you</em> are always buried somewhere in that endless scroll. Finding them? That’s a whole different job.</p>
          
          <p>That’s exactly why we’re building <strong>Memzo</strong>.</p>
          
          <p>Think of it as your personal memory assistant—designed to instantly find every photo you’re in, without the hassle.</p>
          
          <p><strong>Here’s how it works:</strong></p>
          
          <ul style="padding-left: 20px;">
            <li>You join a private event hosted by someone you know and trust</li>
            <li>You take a quick selfie so Memzo knows who to look for</li>
            <li>Our system scans the event photos and delivers only the ones you appear in—no endless searching</li>
          </ul>
          
          <p><strong>And yes, your privacy comes first:</strong></p>
          
          <ul style="padding-left: 20px;">
            <li><strong>Private by design:</strong> Event hosts can see activity, but never which photos matched with you</li>
            <li><strong>No tracking across events:</strong> Every event is treated separately—no identity linking</li>
            <li><strong>Temporary data only:</strong> Your facial map is securely deleted shortly after the event ends</li>
          </ul>
          
          <p>We’re building Memzo so you can relive your best moments—without becoming a permanent data point.</p>
          
          <p>You’re early, and that means you’ll be among the first to experience it. We’ll be in touch soon with updates and early access 👀</p>
          
          <p>Stay tuned—we can’t wait to help you find your magic.</p>
          
          <p>Best,<br>The Memzo Team</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="#" style="display: inline-block; margin: 0 10px; text-decoration: none;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z"/>
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>
              </svg>
            </a>
            <a href="#" style="display: inline-block; margin: 0 10px; text-decoration: none;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" style="display: inline-block; margin: 0 10px; text-decoration: none;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully joined waitlist'
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
