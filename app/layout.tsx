import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import { Toaster } from "sonner";
import { UiProvider } from "@/components/providers/ui-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { BeamBackground } from "@/components/ui/beam-background";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Athlete Dashboard",
  description: "AI-Powered Sports Training Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen flex flex-col md:flex-row selection:bg-indigo-500/30 selection:text-indigo-200`}>
          <ThemeProvider>
            <UiProvider>
              <div className="relative h-full w-full">
                  <SignedIn>
                      <KeyboardShortcuts />
                      <BeamBackground />
                      <div className="flex h-screen w-full overflow-hidden relative z-10">
                          <Sidebar />
                          {children}
                      </div>
                  </SignedIn>
                  <SignedOut>
                      {children}
                  </SignedOut>
                  <Toaster position="top-center" richColors />
              </div>
            </UiProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
