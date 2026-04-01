import Twilio from "twilio";
import { env } from "@/env";

function getClient() {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio credentials not configured");
  }
  return Twilio(sid, token);
}

/**
 * Send a raw SMS message via Twilio.
 */
export async function sendSMS(to: string, body: string): Promise<void> {
  const from = env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new Error("TWILIO_PHONE_NUMBER not configured");
  }

  const client = getClient();
  await client.messages.create({ to, from, body });
}

/**
 * Send the "you got krunk" notification to a recipient.
 */
export async function sendQueueNotification(
  recipientPhone: string,
  senderName: string,
  queueId: string,
  queueName: string,
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const body = `You just got krunk 🔊 ${senderName} sent you "${queueName}" — ${baseUrl}/queue/${queueId}`;

  await sendSMS(recipientPhone, body);
}
