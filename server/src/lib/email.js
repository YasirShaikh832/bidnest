// Email via Nodemailer (SMTP). Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
import nodemailer from 'nodemailer';
import { prisma } from './prisma.js';

let transporter = null;
const SITE_NAME = process.env.SITE_NAME || 'BidNest';
const from = process.env.SMTP_FROM || `${SITE_NAME} <noreply@localhost>`;

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
} catch {
  // nodemailer not installed or env missing
}

export async function sendEmail(to, subject, text) {
  if (!transporter) return false;
  try {
    await transporter.sendMail({ from, to, subject, text });
    return true;
  } catch (err) {
    console.error('Email send error:', err?.message);
    return false;
  }
}

export async function sendEmailToUser(userId, subject, text) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailAlerts: true },
  });
  if (!user?.email || !user.emailAlerts) return false;
  return sendEmail(user.email, subject, text);
}
