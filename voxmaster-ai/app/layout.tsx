import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/lib/context/app-context";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VoxMaster AI - Unified Vocal Intelligence Platform",
  description: "Automated vocal technique analysis, voice biometrics, and generative synthesis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            {children}
            <Toaster richColors closeButton />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
