import { ENV } from './env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Manus built-in email service
 * This uses the preconfigured email endpoint
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch(`${ENV.forgeApiUrl}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      console.error('[Email] Failed to send:', response.statusText);
      return false;
    }

    console.log('[Email] Sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('[Email] Error:', error);
    return false;
  }
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmation(
  email: string,
  name: string,
  date: string,
  time: string,
  guestCount: number
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C1810;">Reservation Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>Your reservation at Urban Sip Café has been confirmed.</p>
      
      <div style="background-color: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2C1810; margin-top: 0;">Reservation Details</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Guests:</strong> ${guestCount}</p>
      </div>
      
      <p>We look forward to seeing you!</p>
      <p style="color: #666; font-size: 12px;">Urban Sip Café</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reservation Confirmed - Urban Sip Café',
    html,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  orderNumber: string,
  items: any[],
  totalPrice: number,
  pickupTime: string
): Promise<boolean> {
  const itemsList = items.map((item) => `<li>${item.name} x${item.quantity} - $${(item.price / 100).toFixed(2)}</li>`).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C1810;">Order Confirmed!</h2>
      <p>Your order has been received and is being prepared.</p>
      
      <div style="background-color: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2C1810; margin-top: 0;">Order #${orderNumber}</h3>
        <ul style="list-style: none; padding: 0;">
          ${itemsList}
        </ul>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p><strong>Total:</strong> $${(totalPrice / 100).toFixed(2)}</p>
        <p><strong>Pickup Time:</strong> ${pickupTime}</p>
      </div>
      
      <p>Thank you for your order!</p>
      <p style="color: #666; font-size: 12px;">Urban Sip Café</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html,
  });
}

/**
 * Send review moderation notification to admin
 */
export async function sendReviewNotification(
  adminEmail: string,
  reviewerName: string,
  rating: number,
  title: string,
  comment: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C1810;">New Review Submitted</h2>
      
      <div style="background-color: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Rating:</strong> ${rating}/5 ⭐</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Comment:</strong> ${comment || 'No additional comment'}</p>
      </div>
      
      <p>Please log in to moderate this review.</p>
      <p style="color: #666; font-size: 12px;">Urban Sip Café Admin</p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: 'New Review - Awaiting Moderation',
    html,
  });
}

/**
 * Send newsletter email
 */
export async function sendNewsletterEmail(
  email: string,
  subject: string,
  content: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C1810;">${subject}</h2>
      <div style="background-color: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${content}
      </div>
      <p style="color: #666; font-size: 12px;">Urban Sip Café</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: subject,
    html,
  });
}
