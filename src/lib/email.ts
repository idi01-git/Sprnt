import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Sprintern <noreply@sprintern.in>';

export async function sendEmail({ to, subject, html, text, from, replyTo }: EmailOptions) {
  try {
    const emailData: Record<string, unknown> = {
      from: from || DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
    };
    
    if (html) emailData.html = html;
    if (text) emailData.text = text;
    if (replyTo) emailData.replyTo = replyTo;
    
    const result = await resend.emails.send(emailData as any);

    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Email send error:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Sprintern! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #9333ea; font-size: 32px; margin: 0;">🎓 Sprintern</h1>
              </div>
              
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Welcome, ${name}!</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Thank you for joining Sprintern! We're excited to help you gain practical skills through our 7-day virtual internship programs.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/courses" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  Explore Courses →
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 32px;">
                © 2026 Sprintern. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Sprintern, ${name}! Thank you for joining. Start exploring courses at sprintern.in/courses`,
  });
}

export async function sendEnrollmentEmail(email: string, name: string, courseName: string) {
  return sendEmail({
    to: email,
    subject: `Enrollment Confirmed: ${courseName} 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">You're enrolled! 🎉</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hi ${name}, your enrollment in <strong>${courseName}</strong> is confirmed!
              </p>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Start your 7-day learning journey now. Complete daily lessons, pass quizzes, and earn your certificate!
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  Start Learning →
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `You're enrolled in ${courseName}! Start learning at sprintern.in/dashboard`,
  });
}

export async function sendCertificateEmail(email: string, name: string, courseName: string, grade: string) {
  return sendEmail({
    to: email,
    subject: `Congratulations! Your Certificate for ${courseName} 🏆`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">🏆</span>
              </div>
              
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px; text-align: center;">Congratulations, ${name}!</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                You've successfully completed <strong>${courseName}</strong> with grade: <strong style="color: #9333ea;">${grade}</strong>
              </p>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                Your certificate is now available. Download it from your dashboard.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  View Certificate →
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Congratulations! You've completed ${courseName} with grade ${grade}. View your certificate at sprintern.in/dashboard`,
  });
}

export async function sendReferralBonusEmail(email: string, name: string, amount: number) {
  return sendEmail({
    to: email,
    subject: `You've earned ₹${amount}! 💰`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">💰</span>
              </div>
              
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px; text-align: center;">Ka-ching! 💵</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                Hi ${name}, someone used your referral code! You've earned <strong style="color: #10b981; font-size: 24px;">₹${amount}</strong>
              </p>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                Your wallet balance has been updated. Continue sharing to earn more!
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  View Wallet →
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Ka-ching! You've earned ₹${amount} from a referral! View your wallet at sprintern.in/dashboard/wallet`,
  });
}

export async function sendWithdrawalProcessedEmail(
  email: string, 
  name: string, 
  amount: number, 
  upiId: string
) {
  return sendEmail({
    to: email,
    subject: `Withdrawal of ₹${amount} Processed ✓`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Withdrawal Processed! ✓</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hi ${name}, your withdrawal has been processed successfully.
              </p>
              
              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Amount</p>
                <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">₹${amount}</p>
              </div>
              
              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Transferred to</p>
                <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${upiId}</p>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
                The amount should reflect in your UPI app within 24 hours.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your withdrawal of ₹${amount} has been processed to ${upiId}. Check your UPI app within 24 hours.`,
  });
}
