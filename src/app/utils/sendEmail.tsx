import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function sendLateEmail(friendEmail: string, minutes: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Late Bot <onboarding@resend.dev>", // Use this for testing
      to: friendEmail,
      subject:
        "CONGRATULATIONS ON A JOB OFFTER! Jk, you are just running late! 🏃‍♂️",
      html: `
          <p>Hey! Yu Ning Model predict ${minutes} minutes</strong> late.</p>
          <p>How does it feel like to be catfished? Please dont make us wait...</p>
        `,
    });

    if (error) {
      return console.error({ error });
    }

    console.log("Email sent successfully!", data?.id);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
