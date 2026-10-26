"use server";
import { z } from "zod";
import { env } from "@/lib/env";
import { mailContact } from "@/lib/email/messages";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  subject: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1, "Write a message.").max(4000),
  website: z.string().max(0).optional(), // honeypot: bots fill it in
});

export type ContactState = { ok: boolean; error?: string };

export async function sendContact(_: ContactState, fd: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Fill in your name, a valid email and a message." };
  if (parsed.data.website) return { ok: true };
  await mailContact(env.contactInbox(), parsed.data);
  return { ok: true };
}
