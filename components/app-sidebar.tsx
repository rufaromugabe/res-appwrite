"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Activity,
  Archive,
  CircleCheck,
  CloudUpload,
  Inbox,
  LogOut,
  SquareArrowOutUpRightIcon,
  UserRound,
  Users,
  Building,
  Home,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Image from "next/image";
import Logo from "@/public/hit_logo.png";
import { useAuthContext } from "@/hooks/useAuthContext"; 
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { title } from "process";

export function AppSidebar() {
  const { user, role, loading, signOut } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const navigationItems = React.useMemo(() => {
    if (!role) return [];

    const items = [];

    if (role === "user") {
      items.push(
        { title: "Profile", icon: UserRound, href: "/student/profile" },
        { title: "Application", icon: SquareArrowOutUpRightIcon, href: "/student/application" },
        { title: "Room Selection", icon: Home, href: "/student/room-selection" },
        { title: "Payments", icon: DollarSign, href: "/student/payments" }
      );
    } else if (role === "admin") {
      items.push(
        { title: "Accounts", icon: Users, href: "/admin/accounts" },
        { title: "Applications", icon: Inbox, href: "/admin/applications" },
        { title: "Accepted", icon: CircleCheck, href: "/admin/accepted" },
        { title: "Hostels", icon: Building, href: "/admin/hostels" },
        { title: "Payments", icon: DollarSign, href: "/admin/payments" },
        // { title: "Archived", icon: Archive, href: "/admin/archived" },
        { title: "Activity logs", icon: Activity, href: "/admin/logs" },
        {title: "Settings", icon: Settings, href: "/admin/settings"}
      );
    }

    // Common items
    // items.push({ title: "Published", icon: CloudUpload, href: "/accepted-students" });

    return items;
  }, [role]);

  if (loading || !role) {
    return null;
  }
  return (
    <Sidebar className=" w-[150px] h-9/10 bg-gradient-to-br from-blue-100 to-blue-300 rounded-2xl shadow-xl border border-blue-200/50 m-4 overflow-auto backdrop-blur-sm">
      <SidebarHeader className="py-6 px-4 border-b border-blue-200/30">
        <div className="flex items-center justify-center">
          <Image src={Logo} alt="logo" width={200} height={200} />
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarMenu className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="w-full h-fit">
                  <div className="flex items-center w-full ">
                    <item.icon className="h-6 w-6 text-blue-900" />
                    <p className="pl-1 text-xs">{item.title}</p>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
