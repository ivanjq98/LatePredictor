import { Resend } from 'resend';

const resendKey  = process.env.NEXT_PUBLIC_RESEND_API_KEY!;

if (!resendKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

export const resendEmail = new Resend(resendKey);