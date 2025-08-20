"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Clock,
  Command,
  Edit2,
  FileText,
  Frame,
  GalleryVerticalEnd,
  Inbox,
  Mail,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  User,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Kiran K",
    email: "user@example.com",
    avatar: "/avatars/default.jpg",
  },
  teams: [
    {
      name: "Personal",
      logo: User,
      plan: "Free",
    },
    {
      name: "Acme Corp.",
      logo: GalleryVerticalEnd,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
      isActive: false,
      items: [],
    },
    {
      title: "Compose",
      url: "/compose",
      icon: Edit2,
      items: [],
    },
    {
      title: "Templates",
      url: "/templates",
      icon: FileText,
      items: [],
    },
    {
      title: "Sent",
      url: "/sent",
      icon: Send,
      items: [],
    },
    {
      title: "Drafts",
      url: "/drafts",
      icon: Mail,
      items: [],
    },
    {
      title: "Follow-Ups",
      url: "/followups",
      icon: Clock,
      items: [],
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: Users,
      items: [],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: PieChart,
      items: [],
    },
    {
      title: "Users",
      url: "/users",
      icon: User,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [],
    },
  ],

}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
