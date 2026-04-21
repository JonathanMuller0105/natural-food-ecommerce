import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Importamos o provedor da sacola que criamos no passo anterior
import { CartProvider } from "./context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Natural Food | Catálogo Saudável",
  description: "Sua saúde em primeiro lugar. Produtos orgânicos e sem restrições.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-gray-900">
        {/* 2. Envolvemos todo o site com o CartProvider para a sacola funcionar em qualquer página */}
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}