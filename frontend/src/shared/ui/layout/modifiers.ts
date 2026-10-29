export type SpacingScale =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "auto";

export interface ModifierProps {
  m?: SpacingScale;
  mt?: SpacingScale;
  mb?: SpacingScale;
  ml?: SpacingScale;
  mr?: SpacingScale;
  mx?: SpacingScale;
  my?: SpacingScale;
  p?: SpacingScale;
  pt?: SpacingScale;
  pb?: SpacingScale;
  pl?: SpacingScale;
  pr?: SpacingScale;
  px?: SpacingScale;
  py?: SpacingScale;
}

// Tailwind JIT requires complete strings to exist in the source code.
// We cannot dynamically construct classes like `m-${val}`.
const classMap = {
  m: {
    none: "m-0",
    xs: "m-1",
    sm: "m-2",
    md: "m-4",
    lg: "m-6",
    xl: "m-8",
    "2xl": "m-12",
    auto: "m-auto",
  },
  mt: {
    none: "mt-0",
    xs: "mt-1",
    sm: "mt-2",
    md: "mt-4",
    lg: "mt-6",
    xl: "mt-8",
    "2xl": "mt-12",
    auto: "mt-auto",
  },
  mb: {
    none: "mb-0",
    xs: "mb-1",
    sm: "mb-2",
    md: "mb-4",
    lg: "mb-6",
    xl: "mb-8",
    "2xl": "mb-12",
    auto: "mb-auto",
  },
  ml: {
    none: "ml-0",
    xs: "ml-1",
    sm: "ml-2",
    md: "ml-4",
    lg: "ml-6",
    xl: "ml-8",
    "2xl": "ml-12",
    auto: "ml-auto",
  },
  mr: {
    none: "mr-0",
    xs: "mr-1",
    sm: "mr-2",
    md: "mr-4",
    lg: "mr-6",
    xl: "mr-8",
    "2xl": "mr-12",
    auto: "mr-auto",
  },
  mx: {
    none: "mx-0",
    xs: "mx-1",
    sm: "mx-2",
    md: "mx-4",
    lg: "mx-6",
    xl: "mx-8",
    "2xl": "mx-12",
    auto: "mx-auto",
  },
  my: {
    none: "my-0",
    xs: "my-1",
    sm: "my-2",
    md: "my-4",
    lg: "my-6",
    xl: "my-8",
    "2xl": "my-12",
    auto: "my-auto",
  },
  p: {
    none: "p-0",
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
    "2xl": "p-12",
    auto: "p-auto",
  },
  pt: {
    none: "pt-0",
    xs: "pt-1",
    sm: "pt-2",
    md: "pt-4",
    lg: "pt-6",
    xl: "pt-8",
    "2xl": "pt-12",
    auto: "pt-auto",
  },
  pb: {
    none: "pb-0",
    xs: "pb-1",
    sm: "pb-2",
    md: "pb-4",
    lg: "pb-6",
    xl: "pb-8",
    "2xl": "pb-12",
    auto: "pb-auto",
  },
  pl: {
    none: "pl-0",
    xs: "pl-1",
    sm: "pl-2",
    md: "pl-4",
    lg: "pl-6",
    xl: "pl-8",
    "2xl": "pl-12",
    auto: "pl-auto",
  },
  pr: {
    none: "pr-0",
    xs: "pr-1",
    sm: "pr-2",
    md: "pr-4",
    lg: "pr-6",
    xl: "pr-8",
    "2xl": "pr-12",
    auto: "pr-auto",
  },
  px: {
    none: "px-0",
    xs: "px-1",
    sm: "px-2",
    md: "px-4",
    lg: "px-6",
    xl: "px-8",
    "2xl": "px-12",
    auto: "px-auto",
  },
  py: {
    none: "py-0",
    xs: "py-1",
    sm: "py-2",
    md: "py-4",
    lg: "py-6",
    xl: "py-8",
    "2xl": "py-12",
    auto: "py-auto",
  },
} as const;

export function getModifierClasses(props: ModifierProps): string[] {
  const classes: string[] = [];

  if (props.m) classes.push(classMap.m[props.m]);
  if (props.mt) classes.push(classMap.mt[props.mt]);
  if (props.mb) classes.push(classMap.mb[props.mb]);
  if (props.ml) classes.push(classMap.ml[props.ml]);
  if (props.mr) classes.push(classMap.mr[props.mr]);
  if (props.mx) classes.push(classMap.mx[props.mx]);
  if (props.my) classes.push(classMap.my[props.my]);

  if (props.p) classes.push(classMap.p[props.p]);
  if (props.pt) classes.push(classMap.pt[props.pt]);
  if (props.pb) classes.push(classMap.pb[props.pb]);
  if (props.pl) classes.push(classMap.pl[props.pl]);
  if (props.pr) classes.push(classMap.pr[props.pr]);
  if (props.px) classes.push(classMap.px[props.px]);
  if (props.py) classes.push(classMap.py[props.py]);

  return classes;
}

export function extractModifiers<T extends ModifierProps>(
  props: T
): { modifiers: ModifierProps; rest: Omit<T, keyof ModifierProps> } {
  const { m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py, ...rest } =
    props;
  return {
    modifiers: { m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py },
    rest: rest as Omit<T, keyof ModifierProps>,
  };
}
