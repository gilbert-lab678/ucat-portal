import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({subsets:['latin'], variable:'--font-sans'});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 min-h-screen overflow-x-hidden transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
