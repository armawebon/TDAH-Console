import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Focus Flow Architect",
  description: "Tu sistema de productividad inteligente para TDAH",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${geist.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
