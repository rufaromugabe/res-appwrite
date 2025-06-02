import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  CircleCheck,
  CloudUpload,
  Inbox,
  LogOut,
  Users,
  SquareArrowOutUpRightIcon,
  UserRound,
  Menu,
  X,
  Activity,
  Settings,
  Building,
  Home,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
import clsx from "clsx";

export function AppDrawer({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDrawerAndNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href); // Navigate to the selected link
  };  const navigationItems = React.useMemo(() => {
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
    <div className="flex flex-col h-screen w-screen">
      {/* Header */}
      <header className="h-16 bg-blue-900 text-white shadow z-50 flex items-center px-4 flex-shrink-0">
        {/* Drawer Toggle Button (Only visible on small screens) */}
        <Button
          variant="ghost"
          onClick={toggleDrawer}
          className="flex items-center space-x-2"
        >
          <Menu className="h-10 w-10" />
        </Button>

        {/* App Title */}
        <h1 className="ml-4 text-xl font-semibold">Res Portal</h1>

        {/* Right side - Placeholder */}
        <div className="ml-auto flex items-center space-x-4">
          <p> {user?.name || "User"}</p>
        </div>
      </header>

      {/* Drawer (Visible only on small screens) */}
      <div
        className={clsx(
          "fixed inset-0 z-50 w-64 h-full bg-white shadow-lg transition-transform md:hidden",
          {
            "translate-x-0": isOpen,
            "-translate-x-full": !isOpen,
          }
        )}
      >
        {/* Close Button */}
        <button
          onClick={toggleDrawer}
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900"
        >
          <X className="h-6 w-6" />
        </button>

        <SidebarHeader className="py-6 px-4">
          <div className="flex items-center justify-center">
            <Image src={Logo} alt="logo" width={200} height={200} />
          </div>
        </SidebarHeader>
        <SidebarContent className="py-2">
          <SidebarMenu className="space-y-4">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <button
                    onClick={() => closeDrawerAndNavigate(item.href)} // Close the drawer and navigate
                    className="w-full h-fit"
                  >
                    <div className="flex flex-col items-center w-full space-y-1">
                      <item.icon className="h-6 w-6 text-blue-900" />
                      <p className="text-xs">{item.title}</p>
                    </div>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Button
                  variant="outline"
                  className="w-full justify-center text-red-600 border-red-600 hover:bg-red-100"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>      {/* Overlay to close the drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleDrawer}
          role="button"
          tabIndex={-1}
        ></div>
      )}

      {/* Content */}
      <main className="flex-1 h-full overflow-auto">
        <div className="w-full h-full p-4">{children}</div>
      </main>
    </div>
  );
}
