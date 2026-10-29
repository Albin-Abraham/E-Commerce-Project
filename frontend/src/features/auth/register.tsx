import React, { useEffect } from "react";

import { commandBus } from "@core/events/CommandBus";
import { PlatformCommand } from "@core/events/config/shortcuts";
import { AppPaths } from "@shell/paths";
import { NavDropdown } from "@ui/navigation/NavDropdown";
import { LogOut, Settings, User } from "lucide-react";

import { useAuth } from "@shared/hooks/auth/useAuth";
import { Zenith } from "@shared/theme";

/**
 * User Profile Dropdown Component
 */
export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    return commandBus.on(PlatformCommand.Logout, () => {
      logout();
    });
  }, [logout]);

  if (!user) return null;

  const displayName = user.firstName || user.email?.split("@")[0] || "User";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end">
        <span
          className={
            Zenith.text("body") + " font-bold leading-none opacity-100"
          }
        >
          {displayName}
        </span>
        <span className={Zenith.patterns.typography.caption}>
          {Array.isArray(user.role) ? user.role[0] : user.role}
        </span>
      </div>

      <NavDropdown
        label={displayName.charAt(0).toUpperCase()}
        items={[
          {
            label: "Profile",
            description: user.email,
            href: AppPaths.Account.Profile,
            icon: <User className="w-4 h-4" />,
          },
          {
            label: "Settings",
            description: "Platform configurations",
            href: AppPaths.Account.Settings,
            icon: <Settings className="w-4 h-4" />,
          },
          {
            label: "Sign Out",
            description: "End your current session",
            onClick: () => logout(),
            icon: <LogOut className="w-4 h-4 text-destructive" />,
          },
        ]}
      />
    </div>
  );
};

/**
 * Auth Feature Registration
 */
export const registerAuth = () => {
  // Routes live in shell/boot/AuthBoot.tsx and shell boot composition;
  // this feature currently contributes UI components (UserProfile) only.
};
