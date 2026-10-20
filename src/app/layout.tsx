import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Học Tiếng Anh",
  description: "Web app học tiếng Anh cho gia đình",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Học Tiếng Anh",
  },
  other: {
    // Next.js chỉ tự sinh "mobile-web-app-capable" (chuẩn mới). Thêm tag
    // Apple cũ để splash screen vẫn hoạt động trên các bản iOS trước 26.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers session={session}>
          <Header />
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
