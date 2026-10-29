import * as React from "react";

import { Flex, type FlexProps } from "./Flex";

export type VStackProps = Omit<FlexProps, "direction">;

const VStack = React.forwardRef<HTMLDivElement, VStackProps>(
  ({ className, align = "stretch", ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="col"
        align={align}
        className={className}
        {...props}
      />
    );
  }
);
VStack.displayName = "VStack";

export { VStack };
