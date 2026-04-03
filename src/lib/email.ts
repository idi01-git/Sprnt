import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const EMAIL_FROM = process.env.EMAIL_FROM || 'Sprintern <noreply@sprintern.in>'

interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, from, replyTo }: EmailOptions) {
  try {
    const result = await transporter.sendMail({
      from: from || EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      replyTo: replyTo,
      subject,
      text: text || (html ? undefined : ''),
      html,
    })
    console.info('[Email] Sent:', { to, subject, messageId: result.messageId })
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('[Email] Send error:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Sprintern!',
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
                <h1 style="color: #9333ea; font-size: 32px; margin: 0;">Sprintern</h1>
              </div>
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Welcome, ${name}!</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Thank you for joining Sprintern! We're excited to help you gain practical skills through our 7-day virtual internship programs.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/courses" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  Explore Courses
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
  })
}

export async function sendEnrollmentEmail(email: string, name: string, courseName: string) {
  return sendEmail({
    to: email,
    subject: `Enrollment Confirmed: ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">You're enrolled! ${name}</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Your enrollment in <strong>${courseName}</strong> is confirmed!
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Start your 7-day learning journey now. Complete daily lessons, pass quizzes, and earn your certificate!
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  Start Learning
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `You're enrolled in ${courseName}! Start learning at sprintern.in/dashboard`,
  })
}

export async function sendCertificateEmail(
  email: string,
  name: string,
  courseName: string,
  grade: string,
  certificateId: string
) {
  return sendEmail({
    to: email,
    subject: `Congratulations! Your Certificate for ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
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
              <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Your Certificate ID</p>
                <p style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700; letter-spacing: 2px;">${certificateId}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Your official PDF certificate will be emailed to you separately by the Sprintern team.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Congratulations ${name}! You've completed ${courseName} with grade ${grade}. Your Certificate ID is: ${certificateId}. The official PDF will be emailed separately.`,
  })
}

export async function sendReferralBonusEmail(email: string, name: string, amount: number) {
  return sendEmail({
    to: email,
    subject: `You've earned ₹${amount}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">💰</span>
              </div>
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px; text-align: center;">Ka-ching! ${name}</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                Someone used your referral code! You've earned <strong style="color: #10b981; font-size: 24px;">₹${amount}</strong>
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                Your wallet balance has been updated. Continue sharing to earn more!
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard/wallet" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  View Wallet
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Ka-ching! You've earned ₹${amount} from a referral! View your wallet at sprintern.in/dashboard/wallet`,
  })
}

export async function sendWithdrawalProcessedEmail(
  email: string,
  name: string,
  amount: number,
  upiId: string
) {
  return sendEmail({
    to: email,
    subject: `Withdrawal of ₹${amount} Processed`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Withdrawal Processed!</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hi ${name}, your withdrawal has been processed successfully.</p>
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
  })
}

export async function sendWithdrawalRejectedEmail(
  email: string,
  name: string,
  amount: number,
  reason: string
) {
  return sendEmail({
    to: email,
    subject: `Withdrawal of ₹${amount} Rejected`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Withdrawal Rejected</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hi ${name}, your withdrawal request of <strong>₹${amount}</strong> has been rejected.</p>
              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Reason</p>
                <p style="margin: 0; color: #1f2937; font-size: 16px;">${reason}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                The funds have been returned to your wallet. If you have questions, contact support.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your withdrawal of ₹${amount} has been rejected. Reason: ${reason}. The funds have been returned to your wallet.`,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

  return sendEmail({
    to: email,
    subject: 'Reset Your Sprintern Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #9333ea; font-size: 28px; margin: 0;">Sprintern</h1>
              </div>
              <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; text-align: center;">Password Reset Request</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hi ${name}, we received a request to reset your Sprintern password. This link is valid for <strong>1 hour</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0 0 8px;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name}, reset your password by visiting: ${resetUrl}. This link expires in 1 hour. If you didn't request this, ignore this email.`,
  })
}

export async function sendVerificationEmail(email: string, name: string, verifyToken: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`

  return sendEmail({
    to: email,
    subject: 'Verify Your Sprintern Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #9333ea; font-size: 28px; margin: 0;">Sprintern</h1>
              </div>
              <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; text-align: center;">Verify Your Email Address</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hi ${name}, please verify your email address. This link is valid for <strong>24 hours</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Verify Email
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                If you didn't sign up for Sprintern, ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name}, verify your email by visiting: ${verifyUrl}. This link expires in 24 hours. If you didn't sign up, ignore this email.`,
  })
}

export async function sendSubmissionReceivedEmail(email: string, name: string, courseName: string) {
  return sendEmail({
    to: email,
    subject: `Project Submitted: ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Project Submitted, ${name}!</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                We have received your project submission for <strong>${courseName}</strong>. Our team will review it shortly.
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                You'll receive an email once the review is complete. We typically take 3-5 business days.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard/submit" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  View Submission
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name}, your project for ${courseName} has been received. Our team will review it and email you when the review is complete.`,
  })
}

export async function sendSubmissionRejectedEmail(
  email: string,
  name: string,
  courseName: string,
  feedback: string
) {
  return sendEmail({
    to: email,
    subject: `Project Update: ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Project Update, ${name}</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Your project submission for <strong>${courseName}</strong> needs some changes before it can be approved.
              </p>
              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; font-weight: 600;">Review Feedback</p>
                <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">${feedback}</p>
              </div>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Please review the feedback and resubmit your project. You have up to ${2} attempts remaining.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://sprintern.in/dashboard/submit" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #3b82f6); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                  Resubmit Project
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name}, your project for ${courseName} needs changes. Feedback: ${feedback}. Please resubmit your project.`,
  })
}
