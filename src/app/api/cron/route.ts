import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MOCK_EDITIONS } from "../../../data/mockData";
import { buildEmailHtml } from "../../../utils/emailTemplate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Secure the cron endpoint against unauthorized external calls
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Determine morning vs evening edition details
    const now = new Date();
    const hour = now.getHours();
    // Default to morning edition if hour is between 4am and 4pm
    const isMorning = hour >= 4 && hour < 16;
    const editionName = isMorning ? "Morning Edition" : "Evening Edition";

    // 3. Format current date (e.g. "Saturday, June 20, 2026")
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = now.toLocaleDateString("en-US", dateOptions);

    // 4. Calculate incremental issue number
    // Reference date: June 20, 2026 (Issue No. 128)
    const refDate = new Date("2026-06-20");
    const msDiff = now.getTime() - refDate.getTime();
    const daysDiff = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    const number = 128 + daysDiff * 2 + (isMorning ? 0 : 1);

    // 5. Select template edition
    const baseEdition = isMorning
      ? MOCK_EDITIONS[0]
      : MOCK_EDITIONS.find((e) => e.editionName === "Evening Edition") || MOCK_EDITIONS[0];

    // 6. Dynamically update tickers with random price changes (-1.5% to +1.5%)
    const tickerData = baseEdition.tickerData.map((ticker) => {
      const cleanValue = ticker.value.replace(/[^0-9.-]/g, "");
      const valueNum = parseFloat(cleanValue);
      if (isNaN(valueNum)) return ticker;

      const pct = (Math.random() * 3 - 1.5) / 100;
      const newValue = valueNum * (1 + pct);
      const diff = newValue - valueNum;
      const isUp = diff >= 0;
      const sign = isUp ? "+" : "";
      const change = `${sign}${(pct * 100).toFixed(2)}%`;

      let valueStr = newValue.toFixed(2);
      if (ticker.value.startsWith("$")) {
        valueStr = `$${newValue.toFixed(2)}`;
      } else if (ticker.value.startsWith("₹")) {
        valueStr = `₹${Math.round(newValue).toLocaleString("en-IN")}`;
      } else {
        valueStr = Math.round(newValue).toLocaleString("en-US");
      }

      return {
        ...ticker,
        value: valueStr,
        change,
        isUp,
      };
    });

    // Construct the final dynamically-generated edition
    const generatedEdition = {
      ...baseEdition,
      editionName,
      date: formattedDate,
      number,
      tickerData,
    };

    // 7. Verify mail configuration
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const recipientEmail = process.env.RECIPIENT_EMAIL || "govindatapdia123@gmail.com";

    if (!gmailUser || !gmailPass) {
      console.warn("Cron triggered: GMAIL_USER or GMAIL_APP_PASSWORD not defined. Skipping email sending.");
      return NextResponse.json({
        success: true,
        message: "Edition generated successfully, but email dispatch skipped due to missing credentials.",
        edition: generatedEdition,
      });
    }

    // 8. Configure Nodemailer Gmail Transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const emailSubject = `🗞️ ${generatedEdition.editionName} - ${generatedEdition.date} | Quick Finance`;
    const emailHtml = buildEmailHtml(generatedEdition);

    // Send the automated email
    await transporter.sendMail({
      from: `"Quick Finance" <${gmailUser}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Automated edition successfully generated and dispatched to ${recipientEmail}.`,
      edition: generatedEdition,
    });
  } catch (error: any) {
    console.error("Cron handler error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error occurred during automated cron execution.",
      },
      { status: 500 }
    );
  }
}
