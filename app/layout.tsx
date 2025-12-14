import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import { Toaster } from "sonner";
import { UiProvider } from "@/components/providers/ui-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { BeamBackground } from "@/components/ui/beam-background";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { GuideTourProvider, GuideTourOverlay } from "@/components/guide-tour";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

const roboto = Roboto({ weight: ['300', '400', '500', '700'], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Athlete Dashboard",
  description: "AI-Powered Sports Training Dashboard",
};

// Disable static generation to avoid Clerk API calls during build
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${roboto.className} bg-background text-foreground antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}>
          <ThemeProvider>
            <UiProvider>
              <GuideTourProvider>
                <SignedIn>
                  <div className="relative h-full w-full">
                    <KeyboardShortcuts />
                    <BeamBackground />
                    <div className="flex h-screen w-full overflow-hidden relative z-10">
                      <Sidebar />
                      {children}
                    </div>
                    <GuideTourOverlay />
                  </div>
                </SignedIn>
                <SignedOut>
                  <div className="min-h-screen w-full">
                    {children}
                  </div>
                </SignedOut>
                <Toaster position="top-center" richColors />
              </GuideTourProvider>
            </UiProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

