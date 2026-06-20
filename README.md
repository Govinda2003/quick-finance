# No-Nonsense Newspaper MVP

A premium digital daily newspaper designed for AI researchers and developers working in finance, fintech, AI, consulting, and MBA domains. It strips out low-value clutter, delivering noise-free, high-signal financial and tech briefings.

This project is built using **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 How to Run the Project

Since Node.js/NPM is not currently detected in your system environment variables, please follow these steps to install Node.js and run the application:

### Step 1: Install Node.js
1. Go to the official website: [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version recommended for most users (v20 or newer).
3. Run the installer and follow the prompt instructions. Ensure that the option to **"Add to PATH"** is checked.
4. Once installation is complete, restart your terminal or IDE and verify by running:
   ```bash
   node -v
   npm -v
   ```

### Step 2: Install Project Dependencies
1. Open your terminal and navigate to the project directory:
   ```bash
   cd d:\Finance\no-nonsense-newspaper
   ```
2. Install the package configurations:
   ```bash
   npm install
   ```

### Step 3: Run the Development Server
1. Launch the local dev server:
   ```bash
   npm run dev
   ```
2. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
3. Use the top navigation bar to toggle between the **Newspaper Front Page**, **Archive List**, and **Settings Panels**.

---

## 📁 Technical Architecture & Project Structure

- **`src/app/page.tsx`**: The main Newspaper front page layout, featuring editorial grids, horizontal stock tickers, main stories, market analyses, company watchlists, and smart reads.
- **`src/app/archive/page.tsx`**: Historical index page that lets you select and load previous morning and evening newspaper editions directly into the home preview.
- **`src/app/settings/page.tsx`**: Watchlist, source, and delivery preferences manager utilizing client-side state.
- **`src/components/`**: Clean UI building blocks:
  - `NewspaperHeader.tsx`: Renders the high-contrast printed masthead.
  - `MarketTicker.tsx`: Renders the horizontal index indices strip.
  - `ArticleCard.tsx`: Standardized news block layout with specific hooks, takeaways, translations, why it matters, and full source reference links.
- **`src/data/mockData.ts`**: Clean static data source mapping to TS interfaces. Default text uses the specific sarcasm parameters and localization requirements.

---

## ⚙️ Backend Integration & Automation Placeholders

This is a frontend MVP containing mock data. Placeholders are integrated in the code to assist in subsequent automation phases:

### 1. Auto-Fetch Edition Loop (12 Hours)
- **Placeholder**: The `Generate Edition` button in `src/app/page.tsx` triggers a simulated scraping cycle.
- **Implementation**: Set up a server cron job or a Next.js API Route `/api/generate` configured with a scheduler (e.g. Vercel Cron or local Node-Cron running `0 */12 * * *`) that triggers:
  1. Fetching RSS headlines from Bloomberg, Reuters, FT, etc.
  2. Running relevance filtering and duplicate removal.
  3. Writing the compiled JSON output to database storage.

### 2. Gmail summaries (Nodemailer / Gmail API)
- **Status**: ✅ **Implemented!** Real email sending is now integrated.
- **Setup Instructions**:
  1. Create a `.env.local` file in the root of the project (template already exists in the repository).
  2. Define the following environment variables in it:
     ```env
     GMAIL_USER=your-email@gmail.com
     GMAIL_APP_PASSWORD=your-16-character-app-password
     ```
  3. **How to generate a Gmail App Password**:
     - Visit your Google Account dashboard: [Google Account Security](https://myaccount.google.com/security)
     - Ensure that **2-Step Verification** is enabled for your account under the *"How you sign in to Google"* section (Google requires this to generate app-specific passwords).
     - Click on **2-Step Verification**, scroll to the very bottom, and select **App passwords** (alternatively, search for *"App passwords"* in the top search bar of your Google account portal).
     - Enter an app name (e.g., `"No-Nonsense Newspaper"`) and click **Create**.
     - Google will generate and display a unique **16-character password** (e.g., `xxxx xxxx xxxx xxxx`).
     - Copy the password and paste it directly as the value of `GMAIL_APP_PASSWORD` in your `.env.local` file.
     - Save the `.env.local` file and restart your local development server if it's currently running.
  4. **Dispatching a Newspaper Edition**:
     - Go to the **Settings** page in the application, update the **Recipient Email**, and click **Save Settings** (which persists the address to `localStorage`).
     - Return to the main **Newspaper** homepage and click the **✉️ Send Test Email** button in the bottom floating panel.
     - The bottom control bar will report a success toast once the email is successfully transmitted through Gmail.

---

## 🌐 Deployment & Automated Scheduling (Vercel Cron)

The newspaper includes automatic edition generation and Gmail delivery scheduled to run every 12 hours.

### Vercel Deployment Steps:

1. **Deploy to Vercel**:
   - Push your code to a GitHub, GitLab, or Bitbucket repository.
   - Go to [Vercel](https://vercel.com) and import the repository.
   - Deploy the project (Vercel automatically detects Next.js configurations).

2. **Configure Environment Variables**:
   In your Vercel Project Dashboard, navigate to **Settings** > **Environment Variables** and add:
   - `GMAIL_USER`: The Gmail address used to send the briefings.
   - `GMAIL_APP_PASSWORD`: The 16-character Google App Password.
   - `RECIPIENT_EMAIL`: The target inbox for automated briefings (default: `govindatapdia123@gmail.com` if not provided).
   - `CRON_SECRET`: A secure random string (automatically generated by Vercel under Vercel Cron settings or defined manually) to protect the `/api/cron` route from unauthorized execution.

3. **Cron Job Schedule**:
   - The [`vercel.json`](file:///d:/Finance/no-nonsense-newspaper/vercel.json) file at the root of the project contains the cron job definition.
   - It is configured with the schedule `0 */12 * * *` (runs every 12 hours) and targets the `/api/cron` path.
   - Vercel will automatically register and trigger this cron job upon deployment.
   - You can monitor execution logs, execution history, and trigger runs manually under the **Cron** tab in your Vercel project dashboard.
