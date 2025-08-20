import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Page() {
  return (
    <main className='flex flex-col  items-center h-screen'>
      <h1>Kways Custom Email App </h1>
      <p>
        Welcome to the Kways Custom Email App. Here you can manage your inbox,
        send bulk emails, create custom templates, and analyze your email
        performance.
      </p>
    </main>
  );
}
