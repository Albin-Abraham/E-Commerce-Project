import React from "react";

import {
  Activity,
  AlertCircle,
  AlignLeft,
  ArrowRight,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Circle,
  Code,
  Edit,
  Edit2,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  Hash,
  HelpCircle,
  Home,
  Info,
  LayoutGrid,
  Link,
  List,
  Loader2,
  Lock,
  Mail,
  Map,
  MapPin,
  Minus,
  Monitor,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trash2,
  Type,
  User,
  UserCheck,
  UserCircle,
  Briefcase,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  Network,
  X,
} from "lucide-react";

/**
 * Shared Icon Registry
 *
 * This file is the Single Source of Truth for all icons in the Zenith Platform.
 * It provides both:
 * 1. Static Exports: For hardcoded UI elements (tree-shakable).
 * 2. Dynamic Registry: For schema-driven icons (runtime resolution).
 */

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  eye: Eye,
  "eye-off": EyeOff,
  info: Info,
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle2,
  "help-circle": HelpCircle,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  loader: Loader2,
  "loader-2": Loader2,
  search: Search,
  user: User,
  mail: Mail,
  type: Type,
  "align-left": AlignLeft,
  hash: Hash,
  calendar: Calendar,
  list: List,
  "check-square": CheckSquare,
  circle: Circle,
  lock: Lock,
  phone: Phone,
  link: Link,
  plus: Plus,
  trash: Trash2,
  "trash-2": Trash2,
  globe: Globe,
  cart: ShoppingCart,
  grid: LayoutGrid,
  package: Package,
  "chevron-left": ChevronLeft,
  refresh: RefreshCw,
  star: Star,
  bag: ShoppingBag,
  x: X,
  minus: Minus,
  "arrow-right": ArrowRight,
  grip: GripVertical,
  edit: Edit,
  "edit-2": Edit2,
  code: Code,
  monitor: Monitor,
  check: Check,
  building: Building,
  "building-2": Building2,
  "map-pin": MapPin,
  home: Home,
  map: Map,
  "user-check": UserCheck,
  "user-circle": UserCircle,
  activity: Activity,
  settings: Settings,
  briefcase: Briefcase,
  "credit-card": CreditCard,
  dollar: DollarSign,
  file: FileText,
  network: Network,
};

/**
 * Dynamic Icon Resolver
 * Useful for resolving icons from metadata/database strings.
 */
export function getIcon(name: string): React.ComponentType<any> | null {
  if (!name) return null;

  const lowerName = name.toLowerCase();
  if (ICON_MAP[lowerName]) return ICON_MAP[lowerName];

  // Try digit-separated kebab-case: "Building2" -> "building-2", "CheckCircle2" -> "check-circle"
  const kebabWithDigits = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
    .toLowerCase();
  if (ICON_MAP[kebabWithDigits]) return ICON_MAP[kebabWithDigits];

  // Try standard kebab-case: "CheckSquare" -> "check-square"
  const standardKebab = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
  if (ICON_MAP[standardKebab]) return ICON_MAP[standardKebab];

  // Try camelCase conversion
  const camelName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  if (ICON_MAP[camelName]) return ICON_MAP[camelName];

  return null;
}

export {
  ICON_MAP,
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  User,
  Mail,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Circle,
  Lock,
  Phone,
  Link,
  Plus,
  Trash2,
  Globe,
  ShoppingCart,
  LayoutGrid,
  Package,
  ChevronLeft,
  RefreshCw,
  Star,
  ShoppingBag,
  X,
  Minus,
  ArrowRight,
  GripVertical,
  Edit,
  Edit2,
  Code,
  Monitor,
  Check,
};
