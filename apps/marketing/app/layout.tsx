import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { MarketingFooter, MarketingHeader } from "@hireflow/ui";
import { APP_NAME, FUNCTIONAL_LINE, TAGLINE } from "@hireflow/shared";
import { appUrl } from "../lib/site";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3002"),
  title: {
    default: `${APP_NAME} — ${TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: FUNCTIONAL_LINE,
  openGraph: {
    title: `${APP_NAME} — ${TAGLINE}`,
    description: FUNCTIONAL_LINE,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: APP_NAME, description: FUNCTIONAL_LINE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <MarketingHeader appUrl={appUrl} />
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <MarketingFooter />
      </body>
    </html>
  );
}
