import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Order Wala - Fresh Groceries & Food Delivery",
  description: "Order fresh vegetables, fruits, meat, groceries, and delicious food from local vendors. Fast delivery to your doorstep in Bihar.",
  keywords: ["food delivery", "grocery delivery", "vegetables", "fruits", "meat", "restaurants", "Bihar", "Patna"],
  authors: [{ name: "Rahul Kumar" }],
  openGraph: {
    title: "Order Wala - Fresh Groceries & Food Delivery",
    description: "Your one-stop destination for fresh groceries and delicious food delivery.",
    type: "website",
    locale: "en_IN",
    siteName: "Order Wala",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
