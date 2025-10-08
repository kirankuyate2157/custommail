"use client";

import { ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (url) => {
    router.push(url);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            item.items?.some((sub) => pathname === sub.url);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive}
              className='group/collapsible'
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <button
                    onClick={() => handleNavigate(item.url)}
                    className={`w-full text-left rounded-lg ${
                      isActive ? "bg-gray-800 text-white" : ""
                    }`}
                  >
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {/* <ChevronRight
                        className={`ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${
                          isActive ? "text-white" : ""
                        }`}
                      /> */}
                    </SidebarMenuButton>
                  </button>
                </CollapsibleTrigger>

                {item.items?.length > 0 && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <button
                                onClick={() => handleNavigate(subItem.url)}
                                className={`w-full text-left ${
                                  isSubActive
                                    ? "bg-gray-800/60 text-white"
                                    : "text-gray-300 hover:text-white"
                                }`}
                              >
                                <span>{subItem.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
