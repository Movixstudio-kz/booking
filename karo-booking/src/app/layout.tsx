import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KARO Booking — онлайн-запись для бизнеса",
  description: "Современная платформа для управления онлайн-записью клиентов.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
