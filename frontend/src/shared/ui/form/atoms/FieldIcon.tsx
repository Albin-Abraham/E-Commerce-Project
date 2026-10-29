import React from "react";
import { getIcon } from "@shared/icons";

export interface FieldIconProps {
  iconName?: string;
  className?: string;
}

export const FieldIcon: React.FC<FieldIconProps> = ({
  iconName,
  className = "text-foreground/40 shrink-0 inline-flex items-center",
}) => {
  if (!iconName) return null;

  const IconComponent = getIcon(iconName);
  if (!IconComponent) return null;

  return (
    <div className={className}>
      <IconComponent size={18} />
    </div>
  );
};

FieldIcon.displayName = "FieldIcon";
