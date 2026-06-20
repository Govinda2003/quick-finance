export function buildEmailHtml(edition: any) {
  const tickerHtml = edition.tickerData
    .map(
      (item: any) => `
      <span style="display: inline-block; margin-right: 15px; font-family: monospace; font-size: 11px; color: ${
        item.isUp ? "#16a34a" : "#dc2626"
      };">
        <strong>${item.symbol}</strong> ${item.value} (${item.change})
      </span>
    `
    )
    .join("");

  const formatArticle = (art: any, sectionName?: string) => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
      ${
        sectionName
          ? `<span style="font-family: sans-serif; font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #7f1d1d; text-transform: uppercase; display: block; margin-bottom: 4px;">${sectionName}</span>`
          : ""
      }
      <h3 style="font-family: Georgia, serif; font-size: 18px; margin: 0 0 6px 0; color: #1c1917; line-height: 1.3;">
        ${art.headline}
      </h3>
      <p style="font-family: Georgia, serif; font-style: italic; font-size: 12px; color: #57534e; margin: 0 0 10px 0;">
        ${art.hook}
      </p>
      <ul style="font-family: sans-serif; font-size: 13px; color: #44403c; margin: 0 0 12px 0; padding-left: 20px; line-height: 1.5;">
        ${art.takeaways.map((takeaway: string) => `<li style="margin-bottom: 4px;">${takeaway}</li>`).join("")}
      </ul>
      <div style="font-family: Georgia, serif; font-style: italic; background-color: #f5f5f4; border-left: 3px solid #7f1d1d; padding: 8px 12px; font-size: 13px; color: #1c1917; margin-bottom: 10px;">
        ${art.translation}
      </div>
      <p style="font-family: sans-serif; font-size: 12px; color: #44403c; margin: 0 0 10px 0;">
        <strong>Why it matters:</strong> ${art.whyThisMatters}
      </p>
      <p style="font-family: sans-serif; font-size: 12px; color: #44403c; margin: 0 0 10px 0;">
        <strong>What to watch:</strong> ${art.whatToWatch}
      </p>
      <div style="font-family: monospace; font-size: 10px; color: #78716c; text-transform: uppercase;">
        Source: ${art.sourceName} | <a href="${art.sourceUrl}" style="color: #7f1d1d; text-decoration: none; font-weight: bold;">Read Full Article &rarr;</a>
      </div>
    </div>
  `;

  const formatSmartRead = (read: any) => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
      <h3 style="font-family: Georgia, serif; font-size: 16px; margin: 0 0 4px 0; color: #1c1917; line-height: 1.3;">
        ${read.headline}
      </h3>
      <p style="font-family: Georgia, serif; font-style: italic; font-size: 12px; color: #57534e; margin: 0 0 10px 0;">
        ${read.hook}
      </p>
      <ul style="font-family: sans-serif; font-size: 13px; color: #44403c; margin: 0 0 12px 0; padding-left: 20px; line-height: 1.5;">
        ${read.takeaways.map((takeaway: string) => `<li style="margin-bottom: 4px;">${takeaway}</li>`).join("")}
      </ul>
      <div style="font-family: Georgia, serif; font-style: italic; background-color: rgba(127, 29, 29, 0.05); border-left: 3px solid #7f1d1d; padding: 10px 12px; font-size: 12px; color: #1c1917; margin-bottom: 10px;">
        <strong style="display: block; font-family: sans-serif; font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #7f1d1d; text-transform: uppercase; margin-bottom: 4px;">🧠 Brain Upgrade Question:</strong>
        "${read.brainUpgrade}"
      </div>
      <div style="font-family: monospace; font-size: 10px; color: #78716c; text-transform: uppercase;">
        Source: ${read.sourceName} | <a href="${read.sourceUrl}" style="color: #7f1d1d; text-decoration: none; font-weight: bold;">Read Full &rarr;</a>
      </div>
    </div>
  `;

  // Main Email Template
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${edition.editionName} - ${edition.date}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-text-size-adjust: 100%;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 680px; margin: 20px auto; background-color: #fcf9f2; border: 1px solid #d6d3d1; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          
          <!-- Header Masthead -->
          <tr>
            <td style="padding: 30px 40px 15px 40px; text-align: center; border-bottom: 3px double #1c1917;">
              <span style="font-family: sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 3px; color: #78716c; text-transform: uppercase; display: block; margin-bottom: 8px;">
                NO-NONSENSE SIGNAL
              </span>
              <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 900; letter-spacing: 1px; color: #1c1917; margin: 0; text-transform: uppercase;">
                Quick Finance
              </h1>
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #57534e; margin: 5px 0 0 0;">
                Smart Money, Simply Explained
              </p>
            </td>
          </tr>

          <!-- Metadata Bar -->
          <tr>
            <td style="padding: 10px 40px; border-bottom: 1px solid #1c1917; background-color: #f5f5f4; font-family: Georgia, serif; font-size: 11px; font-weight: bold; color: #57534e; text-transform: uppercase;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: Georgia, serif; font-size: 11px; font-weight: bold; color: #57534e;">ISSUE NO. ${edition.number}</td>
                  <td align="center" style="font-family: Georgia, serif; font-size: 11px; font-weight: bold; color: #57534e;">${edition.editionName}</td>
                  <td align="right" style="font-family: Georgia, serif; font-size: 11px; font-weight: bold; color: #57534e;">${edition.date}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Market Indices Strip -->
          <tr>
            <td style="padding: 10px 40px; background-color: #1e293b; text-align: center;">
              <div style="width: 100%;">
                ${tickerHtml}
              </div>
            </td>
          </tr>

          <!-- Market Summary Commentary -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fcf9f2; border-bottom: 1px solid #e2e8f0;">
              <div style="border: 1px solid #1c1917; padding: 15px; background-color: #fafaf9;">
                <h2 style="font-family: Georgia, serif; font-size: 15px; text-transform: uppercase; font-weight: bold; text-align: center; margin: 0 0 10px 0; border-bottom: 2px solid #1c1917; padding-bottom: 8px; color: #1c1917;">
                  Market Commentary
                </h2>
                <h3 style="font-family: Georgia, serif; font-size: 14px; font-weight: bold; margin: 0 0 10px 0; color: #1c1917; line-height: 1.4;">
                  ${edition.marketSummary.headline}
                </h3>
                <div style="font-family: sans-serif; font-size: 12px; color: #44403c; line-height: 1.5; margin-bottom: 10px;">
                  <strong>Driver:</strong> ${edition.marketSummary.driver}<br/>
                  <strong style="display: inline-block; margin-top: 4px;">Sentiment:</strong> ${edition.marketSummary.sentiment}
                </div>
                <div style="border-left: 2px solid #7f1d1d; padding-left: 10px; font-family: Georgia, serif; font-size: 13px; color: #1c1917; font-weight: bold; font-style: italic; background-color: #f5f5f4; padding: 6px 10px; margin-bottom: 10px;">
                  ${edition.marketSummary.translation}
                </div>
                <div style="font-family: sans-serif; font-size: 12px; color: #44403c; margin-top: 8px;">
                  <strong>What to Watch Next:</strong> ${edition.marketSummary.whatToWatchNext}
                </div>
              </div>
            </td>
          </tr>

          <!-- Featured Story -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              ${formatArticle(edition.featuredStory, "★ FEATURE STORY")}
            </td>
          </tr>

          <!-- Sections Row -->
          <tr>
            <td style="padding: 10px 40px 10px 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #1c1917; padding-bottom: 4px; margin: 0 0 20px 0; color: #1c1917;">
                AI & FinTech Radar
              </h2>
              ${edition.aiFintechRadar.map((art: any) => formatArticle(art)).join("")}
            </td>
          </tr>

          <tr>
            <td style="padding: 10px 40px 10px 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #1c1917; padding-bottom: 4px; margin: 0 0 20px 0; color: #1c1917;">
                Strategy & MBA Desk
              </h2>
              ${edition.consultingMbaDesk.map((art: any) => formatArticle(art)).join("")}
            </td>
          </tr>

          <tr>
            <td style="padding: 10px 40px 10px 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #1c1917; padding-bottom: 4px; margin: 0 0 20px 0; color: #1c1917;">
                Watchlist Activity
              </h2>
              ${edition.companyWatchlist.map((art: any) => formatArticle(art)).join("")}
            </td>
          </tr>

          <!-- Agenda Section -->
          <tr>
            <td style="padding: 20px 40px 10px 40px; background-color: #fafaf9; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
              <h2 style="font-family: Georgia, serif; font-size: 16px; font-weight: bold; text-transform: uppercase; text-align: center; border-bottom: 2px solid #1c1917; padding-bottom: 6px; margin: 0 0 15px 0; color: #1c1917;">
                Agenda: What to Watch
              </h2>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: sans-serif; font-size: 12px; line-height: 1.5; color: #44403c;">
                ${edition.whatToWatchNext
                  .map(
                    (item: any) => `
                  <tr>
                    <td style="padding-bottom: 12px; vertical-align: top; width: 40%;">
                      <strong style="color: #7f1d1d; font-family: Georgia, serif; text-transform: uppercase; font-size: 12px;">${item.event}</strong>
                    </td>
                    <td style="padding-bottom: 12px; vertical-align: top; padding-left: 15px;">
                      ${item.actionable}
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            </td>
          </tr>

          <!-- Smart Reads Section -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; text-transform: uppercase; text-align: center; border-bottom: 2px solid #1c1917; padding-bottom: 6px; margin: 0 0 20px 0; color: #1c1917;">
                Smart Reads & Cognitive Upgrades
              </h2>
              ${edition.smartReads.map((read: any) => formatSmartRead(read)).join("")}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; border-top: 4px double #1c1917; background-color: #f5f5f4; font-family: Georgia, serif; font-size: 10px; font-weight: bold; color: #57534e; text-transform: uppercase; letter-spacing: 2px;">
              NO-NONSENSE BRIEFING © 2026 | Front Page Edition | ESTABLISHED 2026
            </td>
          </tr>
          
        </table>
      </body>
    </html>
  `;
}
