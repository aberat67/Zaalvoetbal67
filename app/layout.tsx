
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zaalvoetbal | Samen voetballen",
  description:
    "Het online platform voor onze zaalvoetbalwedstrijden, inschrijvingen, teams en statistieken.",
  applicationName: "Zaalvoetbal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        {children}
      </body>
    </html>
  );
}
