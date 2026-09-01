// Thin Twilio wrapper. Needs these env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM   e.g. 'whatsapp:+14155238886' (Twilio sandbox) or your approved WhatsApp sender
//   TWILIO_SMS_FROM        your Twilio SMS-capable phone number, e.g. '+1XXXXXXXXXX'
//
// Uses Twilio's plain REST API via fetch — no SDK dependency needed.

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const API_BASE = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
}

async function sendMessage(from: string, to: string, body: string): Promise<boolean> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
  });
  if (!res.ok) {
    console.error('Twilio send failed:', await res.text());
    return false;
  }
  return true;
}

// Tries WhatsApp first (cheaper, richer); falls back to plain SMS if that fails
// (e.g. the client's number isn't opted in to WhatsApp, or hasn't messaged
// your Twilio sandbox number yet — required by Twilio's sandbox for testing).
export async function notifyClientQuoteReady(phone: string, botRequestId: number, paymentUrl: string, amountUsd: number): Promise<void> {
  const body = `Your custom bot request is ready to order! Price: $${amountUsd}. Pay here to proceed: ${paymentUrl}`;

  const whatsappOk = await sendMessage(process.env.TWILIO_WHATSAPP_FROM!, `whatsapp:${phone}`, body);
  if (whatsappOk) return;

  await sendMessage(process.env.TWILIO_SMS_FROM!, phone, body);
}
