export type FulfillmentType = "DELIVERY" | "SELF_PICKUP";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

/** A `Charger` row with all Decimal columns flattened to numbers. */
export type ChargerView = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  /** Where to load the photo from, or null to draw the placeholder. */
  imageSrc: string | null;
  /** True when the photo is an upload rather than an external link. */
  hasUploadedImage: boolean;
  price: number;
  discount: number;
  /** `price` with `discount` already applied — what the customer pays. */
  finalPrice: number;
  stock: number;
  isAvailable: boolean;
  /** `isAvailable` and in stock. */
  isPurchasable: boolean;
};

export type CartItem = {
  chargerId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type OrderSummary = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: FulfillmentType;
};

export type OrderItemView = {
  id: string;
  chargerId: string;
  chargerName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderView = {
  id: string;
  /** Set when the order was placed by a signed-in customer. */
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryAddress: string | null;
  orderType: FulfillmentType;
  deliveryFee: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  rejectionNote: string | null;
  createdAt: string;
  items: OrderItemView[];
};

/** Where customers collect self-pickup orders. */
export type PickupDetails = {
  shopName: string | null;
  shopAddress: string | null;
  shopPhone: string | null;
  pickupHours: string | null;
  /** False when the shop has not filled any of this in yet. */
  hasAddress: boolean;
};

export type SessionUserView = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

/** Shape returned by every Server Action so forms can render feedback. */
export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};
