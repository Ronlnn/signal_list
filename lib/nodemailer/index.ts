import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";
import {t} from "@/lib/i18n";

const RESEND_API_URL = 'https://api.resend.com/emails';

type EmailPayload = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

function getResendFrom() {
    return process.env.RESEND_FROM || 'Signalist <onboarding@resend.dev>';
}

async function sendEmail({ to, subject, text, html }: EmailPayload) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
        const res = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: getResendFrom(),
                to: [to],
                subject,
                text,
                html,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(`Resend email failed: ${res.status} ${errorText}`);
        }

        return;
    }

    if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
        throw new Error('Email provider is not configured. Set RESEND_API_KEY or NODEMAILER credentials.');
    }

    await transporter.sendMail({
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to,
        subject,
        text,
        html,
    });
}

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    await sendEmail({
        to: email,
        subject: t('email.welcomeSubject'),
        text: t('email.welcomeText'),
        html: htmlTemplate,
    });
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    await sendEmail({
        to: email,
        subject: t('email.newsSubject', { date }),
        text: t('email.newsText'),
        html: htmlTemplate,
    });
};
