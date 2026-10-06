import {
  ArrowsLeftRightIcon,
  BroadcastIcon,
  CalendarCheckIcon,
  ChatCircleDotsIcon,
  CreditCardIcon,
  CubeIcon,
  GearIcon,
  GiftIcon,
  GlobeIcon,
  HandPalmIcon,
  KeyIcon,
  LightningIcon,
  LockIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  QuestionIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  SimCardIcon,
  StorefrontIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
  WarningIcon,
  WifiSlashIcon,
  WrenchIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

/** Curated icons a workspace can assign to topics and fields. */
export const ICONS: Record<string, Icon> = {
  lightning: LightningIcon,
  calendar: CalendarCheckIcon,
  "wifi-off": WifiSlashIcon,
  receipt: ReceiptIcon,
  swap: ArrowsLeftRightIcon,
  question: QuestionIcon,
  broadcast: BroadcastIcon,
  sim: SimCardIcon,
  truck: TruckIcon,
  package: PackageIcon,
  cart: ShoppingCartIcon,
  card: CreditCardIcon,
  user: UserIcon,
  lock: LockIcon,
  key: KeyIcon,
  wrench: WrenchIcon,
  gear: GearIcon,
  warning: WarningIcon,
  gift: GiftIcon,
  store: StorefrontIcon,
  tag: TagIcon,
  pin: MapPinIcon,
  globe: GlobeIcon,
  phone: PhoneIcon,
  chat: ChatCircleDotsIcon,
  cube: CubeIcon,
  hand: HandPalmIcon,
};

export const ICON_NAMES = Object.keys(ICONS);

export function iconFor(name?: string): Icon | undefined {
  return name ? ICONS[name] : undefined;
}
