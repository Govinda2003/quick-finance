import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildEmailHtml } from "../../../utils/emailTemplate";


export async function POST(request: Request) {
  try {
    const { to, edition } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email address ('to') is required." },
        { status: 400 }
      );
    }

    if (!edition) {
      return NextResponse.json(
        { error: "Edition data is required." },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        {
          error:
            "Gmail SMTP credentials are not configured on the server. Please define GMAIL_USER and GMAIL_APP_PASSWORD in your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Configure Nodemailer Gmail Transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const emailSubject = `🗞️ ${edition.editionName} - ${edition.date} | Quick Finance`;
    const emailHtml = buildEmailHtml(edition);

    // Send the email
    await transporter.sendMail({
      from: `"Quick Finance" <${gmailUser}>`,
      to: to,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, recipient: to });
  } catch (error: any) {
    console.error("Nodemailer error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error occurred while sending the email.",
      },
      { status: 500 }
    );
  }
}
