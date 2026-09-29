import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import "./globals.css";
import AuthGate from "@/components/AuthGate";
import AutoRefresh from "@/components/AutoRefresh";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { LocaleProvider } from "@/lib/i18n";

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
        <LocaleProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-7 pb-24">
            <AuthGate>
              {/* 身份就绪后才跑后台刷新；它不渲染任何东西 */}
              <AutoRefresh />
              <TopBar />
              {children}
            </AuthGate>
          </div>
          <BottomNav />
        </LocaleProvider>
      </body>
    </html>
  );
}
