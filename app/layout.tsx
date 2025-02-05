import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "react-json-view-lite/dist/index.css"
import { initFb } from "@/firebase/initFb"
import { cn } from "@/lib/utils"
import StyledComponentsRegistry from "@/lib/registry"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Curtain Call",
  description: "A tool for immersive theatre",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={cn("min-h-screen font-sans antialiased", inter.variable)}
      >
        <StyledComponentsRegistry>
          <>
            <ToastContainer></ToastContainer>
            {children}
          </>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
