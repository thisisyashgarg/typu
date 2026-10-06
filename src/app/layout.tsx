import type { Metadata } from "next"
import { Nunito_Sans, Roboto_Mono } from "next/font/google"
import "./globals.css"

const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  adjustFontFallback: false,
})
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Typu",
  description: "Generate TypeScript types from cURL commands or JSON.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
