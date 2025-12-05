import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "一闪 - 让简单，变伟大",
  description: "AI 助手，通过对话创建闪应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

