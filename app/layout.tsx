import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { Navbar } from "@/components/layout/Navbar";
import "mapbox-gl/dist/mapbox-gl.css";
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
  title: "ywae — ပြည်မြို့ကို စူးစမ်းလေ့လာပါ",
  description: "ပြည်မြို့ရှိ စားသောက်ဆိုင်များ၊ ဟိုတယ်များ၊ ဘုရားစေတီများနှင့် အခြားနေရာများကို AI အကူအညီဖြင့် ရှာဖွေပါ။",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="my"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="h-full flex flex-col overflow-hidden">
        <SupabaseProvider>
          <ToastProvider />
          <Navbar />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
