"use client";

import * as React from "react";
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
  Trash,
  User,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

export const data = {
  user: {
    name: "Kiran K",
    email: "kiran@kmail.com",
    avatar: "/avatars/default.jpg",
  },
  teams: [
    {
      name: "Personal",
      logo: User,
      plan: "Free",
    },
    // {
    //   name: "Acme Corp.",
    //   logo: GalleryVerticalEnd,
    //   plan: "Pro",
    // },
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
      title: "Follow-Ups",
      url: "/followups",
      icon: Clock,
      items: [],
    },
    {
      title: "Templates",
      url: "/templates",
      icon: FileText,
      items: [],
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Edit2,
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
      title: "Archived",
      url: "/archived",
      icon: Trash,
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
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <BrandLogo />
        {/* <TeamSwitcher teams={data.teams} /> */}
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

function BrandLogo() {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <div
      className={`transition-all duration-300 ${
        isMobile ? "w-full justify-between px-3" : "justify-center"
      } flex items-center`}
    >
      {/* Logo + Mail Branding */}
      <div
        className={`flex items-center transition-all duration-300 ${
          isCollapsed && !isMobile ? "flex-col " : "flex-row gap-2"
        } justify-center py-3`}
      >
        <Image
          src='/K-WAYS.png'
          alt='K-Ways Logo'
          width={isCollapsed ? 80 : 140}
          height={40}
          className='object-contain transition-all duration-300'
          priority
        />

        <span
          className='text-sm font-medium font-quicksand text-gray-400 tracking-wide'
          style={{
            fontFamily: "'Quicksand', sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          Mail
        </span>
      </div>

      {/* Mobile Menu Toggle Button (only visible on mobile) */}
      {isMobile && (
        <button
          onClick={() => setOpenMobile(!openMobile)}
          className='p-2 rounded-md hover:bg-gray-800/30 transition-colors duration-200'
          aria-label='Toggle sidebar'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={2}
            stroke='currentColor'
            className='w-6 h-6 text-gray-400'
          >
            {openMobile ? (
              // Close Icon
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M6 18L18 6M6 6l12 12'
              />
            ) : (
              // Menu Icon
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4 6h16M4 12h16M4 18h16'
              />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}

// function BrandLogo() {
//   const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
//   return (
//     <div className='transition-all duration-300'>
//       <div
//         className={`flex items-center ${
//           state == "collapsed" ? "flex-col" : "flex-row"
//         } justify-center  py-3`}
//       >
//         <Image
//           src='/K-WAYS.png'
//           alt='K-Ways Logo'
//           width={140}
//           height={40}
//           className='object-contain'
//           priority
//         />
//         <span className='text-sm  text-bottom font-medium text-gray-400 tracking-wide'>
//           Mail
//         </span>
//       </div>
//       {/* {state == "collapsed" || isMobile ? (
//         <Image
//           src='/logo.png'
//           alt='Kways'
//           width={35}
//           height={35}
//           className='mx-auto'
//           priority
//         />
//       ) : (
//         <Image
//           src='/K-WAYS.png'
//           alt='Kways Full Logo'
//           width={150}
//           height={40}
//           className='mx-auto'
//           priority
//         />
//       )} */}
//     </div>
//   );
// }
