import { Bindings } from '../env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends transactional email alerts (Resend API).
 * Used for review notifications, licence verification, and publication status.
 */
export async function sendEmail(
  env: Bindings,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!env.RESEND_API_KEY) {
    console.warn('[Email Service] RESEND_API_KEY not configured. Email logged to console:');
    console.warn(`To: ${options.to} | Subject: ${options.subject}`);
    return { success: true, messageId: 'mock-dev-id' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      console.error('[Email Service] Failed to send email via Resend:', data);
      return { success: false, error: data.message || 'Email sending failed' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[Email Service] Exception sending email:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Email templates for TPF Cinemas workflow notifications
 */
export const EmailTemplates = {
  filmApproved(filmTitle: string): { subject: string; html: string } {
    return {
      subject: `Your film "${filmTitle}" has been approved! - TPF Cinemas`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
          <h2>Congratulations!</h2>
          <p>Your film <strong>${filmTitle}</strong> has been reviewed and approved by the TPF Cinemas curation team.</p>
          <p>Once staff verifies the licence and music clearance declaration, your film will be scheduled for publication.</p>
          <p>You can track the progress in your <a href="https://studio.tpfcinemas.com">Filmmaker Studio</a>.</p>
          <br/>
          <p>Warm regards,<br/>The TPF Cinemas Team</p>
        </div>
      `,
    };
  },

  changesRequested(filmTitle: string, notes: string): { subject: string; html: string } {
    return {
      subject: `Feedback on your submission "${filmTitle}" - TPF Cinemas`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
          <h2>Changes Requested</h2>
          <p>Thank you for submitting <strong>${filmTitle}</strong> to TPF Cinemas.</p>
          <p>Our curation team has reviewed your submission and requested the following changes before approval:</p>
          <blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #e11d48; margin: 16px 0;">
            ${notes}
          </blockquote>
          <p>Please update your film details or assets in your <a href="https://studio.tpfcinemas.com">Filmmaker Studio</a> and resubmit for review.</p>
          <br/>
          <p>Warm regards,<br/>The TPF Cinemas Team</p>
        </div>
      `,
    };
  },

  filmRejected(filmTitle: string, notes: string): { subject: string; html: string } {
    return {
      subject: `Update regarding your submission "${filmTitle}" - TPF Cinemas`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
          <h2>Submission Update</h2>
          <p>Thank you for submitting <strong>${filmTitle}</strong> to TPF Cinemas.</p>
          <p>After careful evaluation by our curation team, we regret to inform you that your film has not been selected for inclusion in the TPF Cinemas catalogue at this time.</p>
          <p><strong>Curator Feedback:</strong></p>
          <blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #e11d48; margin: 16px 0;">
            ${notes}
          </blockquote>
          <p>We appreciate your interest in sharing your work with TPF Cinemas and encourage you to submit future projects via your <a href="https://studio.tpfcinemas.com">Filmmaker Studio</a>.</p>
          <br/>
          <p>Warm regards,<br/>The TPF Cinemas Team</p>
        </div>
      `,
    };
  },

  filmPublished(filmTitle: string, slug: string): { subject: string; html: string } {
    return {
      subject: `Your film "${filmTitle}" is now live on TPF Cinemas! 🎉`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
          <h2>Your film is now streaming!</h2>
          <p>We are thrilled to announce that <strong>${filmTitle}</strong> is published and available to viewers worldwide.</p>
          <p><a href="https://tpfcinemas.com/film/${slug}" style="display:inline-block; padding: 10px 18px; background: #e11d48; color: #fff; text-decoration: none; border-radius: 4px;">Watch Now on TPF Cinemas</a></p>
          <p>Share the link with your audience and follow performance metrics in your <a href="https://studio.tpfcinemas.com">Studio Dashboard</a>.</p>
          <br/>
          <p>Warm regards,<br/>The TPF Cinemas Team</p>
        </div>
      `,
    };
  },
};
