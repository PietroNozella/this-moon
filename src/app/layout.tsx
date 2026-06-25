import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChunkFlow",
  description: "Sistema pessoal de aprendizado de ingles por chunks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
