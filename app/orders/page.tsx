import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersPageContent } from "@/components/orders/orders-page";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <AccountShell title="Orders">
      <OrdersPageContent />
    </AccountShell>
  );
}
