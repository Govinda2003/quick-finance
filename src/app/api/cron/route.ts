import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log(`[CRON] Triggered at ${new Date().toISOString()}`);

    const host = request.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const recipientEmail = process.env.RECIPIENT_EMAIL || "govindatapdia123@gmail.com";

    const refreshResponse = await fetch(`${baseUrl}/api/refresh-news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recipientEmail }),
    });

    const result = await refreshResponse.json();

    if (!refreshResponse.ok || !result.success) {
      console.error("[CRON] refresh-news call failed:", result);
      return NextResponse.json({ success: false, error: "Cron triggered but refresh-news pipeline failed.", detail: result }, { status: 500 });
    }

    console.log(`[CRON] Edition sent. Top story: "${result.edition?.featuredStory?.headline}"`);

    return NextResponse.json({
      success: true,
      message: `Cron executed successfully. Live edition emailed to ${recipientEmail}.`,
      editionId: result.edition?.id,
      topStory: result.edition?.featuredStory?.headline,
    });

  } catch (error: any) {
    console.error("[CRON] Handler error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error during cron execution." }, { status: 500 });
  }
}
