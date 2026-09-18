import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ProfileGate from "@/components/ProfileGate";

export const metadata: Metadata = {
  title: "今天吃什么 · Supper Valet",
  description: "私人晚餐推荐助手：摇一摇，今晚吃这家。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-cream text-brown-dark antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-6 pb-24">
          <ProfileGate>{children}</ProfileGate>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
