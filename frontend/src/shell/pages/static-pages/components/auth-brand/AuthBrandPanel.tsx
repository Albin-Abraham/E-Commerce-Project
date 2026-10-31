import React from "react";
import type { AuthPersona } from "../../configs/auth-personas";
import { CustomerBrandExperience } from "./CustomerBrandExperience";
import { PartnerBrandExperience } from "./PartnerBrandExperience";
import { StaffBrandExperience } from "./StaffBrandExperience";

export interface AuthBrandPanelProps {
  persona?: AuthPersona;
}

export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({
  persona = "customer",
}) => {
  if (persona === "staff") {
    return <StaffBrandExperience />;
  }
  if (persona === "partner") {
    return <PartnerBrandExperience />;
  }
  return <CustomerBrandExperience />;
};

export default AuthBrandPanel;
