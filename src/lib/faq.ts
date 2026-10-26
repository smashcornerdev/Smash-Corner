import { L } from "./config";

/* FAQ (spec §3, on the Contact page since v4.60). Placeholder wording. */
export const FAQ: [q: string, a: string][] = [
  ["How do I book a court?", "Choose a court, date and time on the Book page, add it to your cart and send your request. Once an admin approves it, we email you the payment details. Pay within 24 hours and upload your proof of payment. " + L[0]],
  ["When is my booking confirmed?", "After you pay and an admin checks your proof of payment. You get an email once it is confirmed. " + L[1]],
  ["Which payment methods do you accept?", "BDO, BPI, GCash and Maya. " + L[2]],
  ["Can I cancel or reschedule online?", "No. Please contact us and an admin will update your booking. See the Booking Policy for refunds."],
  ["What is the waitlist?", "If a slot is taken, apply for the waitlist. Once an admin approves you, you are in line. If the slot frees up, the first person in line gets an email with a link that holds the slot for 2 hours."],
  ["Can I rent equipment?", "Yes: rackets, paddles and balls, charged per item, per hour. " + L[3]],
  ["What are your opening hours?", "Daily, 7:00 AM to 10:00 PM, in 1-hour slots."],
  ["Do I need an account?", "No. You book as a guest with your name, number and email."],
];
