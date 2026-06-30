import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { Resend } from 'resend';

let mailTransport: Transporter<SMTPTransport.SentMessageInfo>;
let resendClient: Resend;

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

function useResend(): boolean {
  const env = process.env.NODE_ENV;
  return env === 'production' || env === 'staging';
}

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required in production and staging');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getTransport(): Transporter<SMTPTransport.SentMessageInfo> {
  if (!mailTransport) {
    mailTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_SMP_USERNAME,
        pass: process.env.GMAIL_SMP_PASSWORD,
      },
    });
  }
  return mailTransport;
}

function getFromAddress(): string {
  if (useResend()) {
    const email = process.env.EMAIL_FROM;
    const name = process.env.EMAIL_FROM_NAME ?? 'Winnov8';

    if (!email) {
      throw new Error('EMAIL_FROM is required when sending emails via Resend');
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      throw new Error(
        `EMAIL_FROM cannot be a Gmail address (${email}) when using Resend. ` +
          'Use an address on a domain verified at https://resend.com/domains, ' +
          'or set NODE_ENV=development to use Gmail SMTP locally.',
      );
    }

    return `${name} <${email}>`;
  }

  const from = process.env.GMAIL_SMP_USERNAME;
  if (!from) {
    throw new Error('GMAIL_SMP_USERNAME is required when sending emails in development');
  }

  return from;
}

async function sendViaResend({ to, subject, html }: SendEmailArgs): Promise<void> {
  const { error } = await getResendClient().emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }
}

async function sendViaNodemailer({ to, subject, html }: SendEmailArgs): Promise<void> {
  try {
    const result = await getTransport().sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    if (!result) {
      throw new Error('Failed to send email');
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to send email via SMTP';

    throw new Error(message);
  }
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<void> {
  if (useResend()) {
    await sendViaResend({ to, subject, html });
    return;
  }

  await sendViaNodemailer({ to, subject, html });
}
