import type { Metadata } from "next";
import { Inter } from "next/font/google";

import VoiceCommandProvider from "@/components/voice/VoiceCommandProvider";
import AccessibilityProfileProvider from "@/app/AccessibilityProfileContext";
import AssistantProvider from "@/contexts/AssistantContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import GlobalLoadingSpinner from "@/components/ui/GlobalLoadingSpinner";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NavAI — Accessible Navigation",
  description:
    "AI-powered navigation for people with disabilities. Voice-controlled, wheelchair-friendly, indoor & outdoor.",
  keywords: [
    "accessibility",
    "navigation",
    "wheelchair",
    "blind",
    "deaf",
    "indoor maps",
    "voice commands",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasValidAuth = true;

  const layoutContent = (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AccessibilityProfileProvider>
          <NavigationProvider>
            <AssistantProvider>
              <VoiceCommandProvider>
                <GlobalLoadingSpinner />
                <Navbar hasValidAuth={!!hasValidAuth} />
                <main id="main-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                  {children}
                </main>
                <AssistantPanel />
              </VoiceCommandProvider>
            </AssistantProvider>
          </NavigationProvider>
        </AccessibilityProfileProvider>

      </body>
    </html>
  );

  return layoutContent;
}
