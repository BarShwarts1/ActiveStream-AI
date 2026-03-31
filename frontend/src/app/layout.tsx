import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import AppSidebar from "../components/AppSidebar";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ActiveStream AI",
  description: "ActiveStream AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${assistant.variable} font-sans antialiased bg-[#020617] text-white flex h-screen overflow-hidden`}
      >
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Navbar />
          <main className="flex-1 overflow-y-auto relative bg-[#020617]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
