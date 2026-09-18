import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ProfileGate from "@/components/ProfileGate";
import TopBar from "@/components/TopBar";

const caprasimo = Caprasimo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-caprasimo",
});

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "今天吃什么 · Supper Valet",
  description: "私人晚餐推荐助手：摇一摇，今晚吃这家。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`h-full ${caprasimo.variable} ${figtree.variable}`}>
      <body className="min-h-full antialiased" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-7 pb-24">
          <ProfileGate>
            <TopBar />
            {children}
          </ProfileGate>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
