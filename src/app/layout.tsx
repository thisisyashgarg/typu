import type { Metadata } from "next"
import { Nunito_Sans } from "next/font/google"
import "./globals.css"

const inter = Nunito_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Typu",
  description: "A simple tool to generate TypeScript types from cURL commands.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className={inter.className}>{children}</body>
    </html>
  )
}
