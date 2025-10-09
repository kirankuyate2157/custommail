
"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata = {
//   title: "Kways Custom Email App",
//   description: "A Kways custom email App for managing your inbox, send bulk emails, custom templates, analytics and more.",
// };
 const metadata = {
  title: "Kways Custom Email App | Bulk Email & Templates",
  description:
    "Manage your inbox, send bulk emails, create custom templates, track analytics, and more with Kways custom email app.",
  keywords: [
    "custom email app",
    "bulk email sender",
    "email templates",
    "email analytics",
    "inbox management",
    "Kways"
  ],
  authors: [{ name: "Kways Team" }],
  openGraph: {
    title: "Kways Custom Email App",
    description:
      "Send bulk emails, manage inbox, track analytics with Kways custom email app.",
    url: "https://your-vercel-project.vercel.app",
    siteName: "Kways Email App",
    images: [
      {
        url: "https://your-vercel-project.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kways Email App Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kways Custom Email App",
    description:
      "Manage inbox, send bulk emails, create templates & track analytics.",
    images: ["https://your-vercel-project.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (<html lang="en">
    <head><script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Kways Custom Email App",
          url: "https://your-vercel-project.vercel.app",
          description:
            "A custom email app to send bulk emails, create templates, manage inbox, and track analytics.",
          applicationCategory: "CommunicationApplication",
          operatingSystem: "All",
        }),
      }}
    />
    </head>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header
            className="flex h-16 shrink-0 items-center bg-sidebar-accent/40 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Kways
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Custom Mails</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}

          </div>
        </SidebarInset>
      </SidebarProvider>  </body>
  </html>
  );
}
