"use client";

import { useEffect, useState } from "react";
import { ChevronDown, MapPin, ShoppingBag, UserCircle2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/hooks/use-auth";
import type {
  AdminUserDetail,
  AdminUserSummary,
  AdminUsersSummary,
  PaginationMeta,
} from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOrderReference,
  formatOrderStatus,
  formatPaymentStatus,
  formatShipmentStatus,
} from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminPagination } from "./admin-pagination";
import { AdminMetricCard } from "./admin-metric-card";

const USERS_PER_PAGE = 8;
const USER_CART_ITEMS_PER_PAGE = 4;
const USER_ORDERS_PER_PAGE = 3;

export function UserAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminUsersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userDetails, setUserDetails] = useState<Record<string, AdminUserDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [cartPages, setCartPages] = useState<Record<string, number>>({});
  const [orderPages, setOrderPages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    void adminApi
      .listUsers(token, {
        page: currentPage,
        pageSize: USERS_PER_PAGE,
        search: query || undefined,
      })
      .then((response) => {
        if (!cancelled) {
          if (response.pagination.totalPages < currentPage) {
            setCurrentPage(response.pagination.totalPages);
            return;
          }

          setUsers(response.users);
          setPagination(response.pagination);
          setSummary(response.summary);
          setExpandedUserId((activeUserId) =>
            activeUserId && response.users.some((user) => user.id === activeUserId)
              ? activeUserId
              : null,
          );
          setError("");
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load users.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, initialized, isAdmin, query, token]);

  const expandedCartPage = expandedUserId ? (cartPages[expandedUserId] ?? 1) : 1;
  const expandedOrderPage = expandedUserId ? (orderPages[expandedUserId] ?? 1) : 1;

  useEffect(() => {
    if (!initialized || !token || !isAdmin || !expandedUserId) {
      return;
    }

    let cancelled = false;
    const targetUserId = expandedUserId;

    void adminApi
      .getUserDetail(token, targetUserId, {
        cartPage: expandedCartPage,
        cartPageSize: USER_CART_ITEMS_PER_PAGE,
        orderPage: expandedOrderPage,
        orderPageSize: USER_ORDERS_PER_PAGE,
      })
      .then((response) => {
        if (!cancelled) {
          setUserDetails((current) => ({
            ...current,
            [targetUserId]: response.user,
          }));
          setCartPages((current) => ({
            ...current,
            [targetUserId]: response.user.cartPagination.page,
          }));
          setOrderPages((current) => ({
            ...current,
            [targetUserId]: response.user.ordersPagination.page,
          }));
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setDetailErrors((current) => ({
            ...current,
            [targetUserId]:
              caughtError instanceof Error ? caughtError.message : "Unable to load user details.",
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading((current) => ({ ...current, [targetUserId]: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [expandedCartPage, expandedOrderPage, expandedUserId, initialized, isAdmin, token]);

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading users...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can review user and customer data."
        title="Admin access required."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          hint={`${summary?.adminCount ?? 0} admin accounts`}
          label="Customers"
          value={summary?.customerCount ?? 0}
        />
        <AdminMetricCard
          hint="Accounts with at least one order"
          label="Buyers"
          value={summary?.buyersCount ?? 0}
        />
        <AdminMetricCard
          hint="Users with a saved latest address"
          label="Addresses"
          value={summary?.usersWithAddress ?? 0}
        />
        <AdminMetricCard
          hint="Total accounts in the website"
          label="All users"
          value={pagination?.total ?? 0}
        />
      </div>

      <div className="rounded-[1.8rem] border border-white/8 bg-[#1b2028] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Users</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">People using the website</h3>
          </div>
          <input
            className="w-full rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 lg:max-w-xs"
            onChange={(event) => {
              setLoading(true);
              setError("");
              setQuery(event.target.value);
              setCurrentPage(1);
              setExpandedUserId(null);
            }}
            placeholder="Search users..."
            value={query}
          />
        </div>

        {loading ? <p className="mt-5 text-sm text-white/55">Refreshing users...</p> : null}
        {error ? <p className="mt-5 text-sm text-red-200">{error}</p> : null}

        {users.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
            {(pagination?.total ?? 0) === 0 ? "No users are available yet." : "No users matched this search yet."}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-white/8">
            <div className="hidden grid-cols-[1.35fr_0.75fr_0.8fr_0.8fr_0.9fr] gap-4 border-b border-white/8 bg-black/30 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45 md:grid">
              <span>User</span>
              <span>Joined</span>
              <span>Orders</span>
              <span>Spend</span>
              <span>Address</span>
            </div>
            <div className="divide-y divide-white/8">
              {users.map((user) => {
                const detail = userDetails[user.id];
                const latestAddress = detail?.latestAddress ?? user.latestAddress;
                const currentCartPage = detail?.cartPagination.page ?? cartPages[user.id] ?? 1;
                const currentOrderPage = detail?.ordersPagination.page ?? orderPages[user.id] ?? 1;
                const isDetailLoading = detailLoading[user.id] ?? false;
                const detailError = detailErrors[user.id] ?? "";

                return (
                <div className="bg-black/15 px-5 py-4" key={user.id}>
                  <div className="grid gap-4 md:grid-cols-[1.35fr_0.75fr_0.8fr_0.8fr_0.9fr] md:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/12 text-cyan-300">
                          <UserCircle2 className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-stone-100">{user.name}</p>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                            user.role === "ADMIN"
                              ? "bg-cyan-300 text-slate-950"
                              : "bg-white/8 text-white/65",
                          )}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/55">{user.email}</p>
                      <p className="mt-2 text-xs text-white/45 md:hidden">
                        Last order: {user.lastOrderAt ? formatDateTime(user.lastOrderAt) : "No orders yet"}
                      </p>
                    </div>
                    <div className="text-sm text-white/55">{formatDate(user.createdAt)}</div>
                    <div className="text-sm text-stone-100">{user.totalOrders}</div>
                    <div className="text-sm text-stone-100">{formatCurrency(user.totalSpend)}</div>
                    <div className="text-sm text-stone-100">
                      {latestAddress ? `${latestAddress.city}, ${latestAddress.state}` : "Not available"}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      User ID: {user.id}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      Updated: {formatDateTime(user.updatedAt)}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      Cart items: {detail?.cartItems ?? user.cartItems}
                    </div>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-100 transition hover:border-cyan-300 hover:text-cyan-200"
                      onClick={() => {
                        const shouldExpand = expandedUserId !== user.id;

                        if (shouldExpand) {
                          setDetailLoading((current) => ({ ...current, [user.id]: true }));
                          setDetailErrors((current) => ({ ...current, [user.id]: "" }));
                        }

                        setExpandedUserId((current) => (current === user.id ? null : user.id));
                        setCartPages((current) => ({
                          ...current,
                          [user.id]: current[user.id] ?? 1,
                        }));
                        setOrderPages((current) => ({
                          ...current,
                          [user.id]: current[user.id] ?? 1,
                        }));
                      }}
                      type="button"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition",
                          expandedUserId === user.id ? "rotate-180" : "",
                        )}
                      />
                      {expandedUserId === user.id ? "Hide details" : "View details"}
                    </button>
                  </div>

                  {expandedUserId === user.id ? (
                    <div className="mt-5 space-y-4">
                      {isDetailLoading && !detail ? (
                        <div className="rounded-[1.4rem] border border-white/8 bg-black/25 p-4 text-sm text-white/55">
                          Loading user details...
                        </div>
                      ) : null}
                      {detailError && !detail ? (
                        <div className="rounded-[1.4rem] border border-white/8 bg-black/25 p-4 text-sm text-red-200">
                          {detailError}
                        </div>
                      ) : null}

                      {detail ? (
                        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                          <div className="rounded-[1.4rem] border border-white/8 bg-black/25 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                              Account details
                            </p>
                            <div className="mt-4 space-y-2 text-sm text-white/60">
                              <p>
                                User ID: <span className="text-white">{detail.id}</span>
                              </p>
                              <p>
                                Email: <span className="text-white">{detail.email}</span>
                              </p>
                              <p>
                                Role: <span className="text-white">{detail.role}</span>
                              </p>
                              <p>
                                Joined: <span className="text-white">{formatDateTime(detail.createdAt)}</span>
                              </p>
                              <p>
                                Updated: <span className="text-white">{formatDateTime(detail.updatedAt)}</span>
                              </p>
                              <p>
                                Last order:{" "}
                                <span className="text-white">
                                  {detail.lastOrderAt ? formatDateTime(detail.lastOrderAt) : "No orders yet"}
                                </span>
                              </p>
                              <p>
                                Total orders: <span className="text-white">{detail.totalOrders}</span>
                              </p>
                              <p>
                                Lifetime spend:{" "}
                                <span className="text-white">{formatCurrency(detail.totalSpend)}</span>
                              </p>
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-white/8 bg-black/25 p-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-cyan-300" />
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                                Latest address
                              </p>
                            </div>
                            {detail.latestAddress ? (
                              <div className="mt-4 space-y-2 text-sm text-white/60">
                                <p className="text-white">{detail.latestAddress.fullName}</p>
                                <p>{detail.latestAddress.phone}</p>
                                <p>{detail.latestAddress.line1}</p>
                                {detail.latestAddress.line2 ? <p>{detail.latestAddress.line2}</p> : null}
                                <p>
                                  {detail.latestAddress.city}, {detail.latestAddress.state}
                                </p>
                                <p>
                                  {detail.latestAddress.postalCode}, {detail.latestAddress.country}
                                </p>
                                {detail.latestAddress.notes ? (
                                  <p>Note: {detail.latestAddress.notes}</p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-white/55">
                                This user has not placed an order with an address yet.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {detail ? (
                      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                        <div className="rounded-[1.4rem] border border-white/8 bg-black/25 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                                Current cart
                              </p>
                              <h4 className="mt-2 text-lg font-semibold text-white">
                                {detail?.cartPagination.total
                                  ? `${detail.cartPagination.total} line item(s)`
                                  : "Cart is empty"}
                              </h4>
                            </div>
                            <ShoppingBag className="h-5 w-5 text-cyan-300" />
                          </div>
                          {isDetailLoading ? (
                            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/45">
                              Refreshing details...
                            </p>
                          ) : null}
                          {detail?.cart && detail.cartPagination.total > 0 ? (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center justify-between text-sm text-white/55">
                                <span>Subtotal</span>
                                <span className="text-white">{formatCurrency(detail.cart.subtotal)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-white/55">
                                <span>Last updated</span>
                                <span className="text-white">{formatDateTime(detail.cart.updatedAt)}</span>
                              </div>
                              <div className="space-y-2">
                                {detail.cart.items.map((item) => (
                                  <div
                                    className="rounded-[1.1rem] border border-white/8 bg-white/4 px-3 py-3"
                                    key={item.id}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-medium text-white">{item.product.name}</p>
                                        <p className="mt-1 text-xs text-white/45">
                                          {item.product.collection.name} | Qty {item.quantity}
                                        </p>
                                        {item.selectedSize || item.selectedColor ? (
                                          <p className="mt-1 text-xs text-white/45">
                                            {item.selectedSize ? `Size: ${item.selectedSize}` : "Size: default"}
                                            {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                                          </p>
                                        ) : null}
                                      </div>
                                      <p className="text-sm text-white">
                                        {formatCurrency(item.product.price * item.quantity)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <AdminPagination
                                currentPage={currentCartPage}
                                itemLabel="cart items"
                                onPageChange={(page) => {
                                  setDetailLoading((current) => ({ ...current, [user.id]: true }));
                                  setDetailErrors((current) => ({ ...current, [user.id]: "" }));
                                  setCartPages((current) => ({ ...current, [user.id]: page }));
                                }}
                                pageSize={detail.cartPagination.pageSize}
                                totalItems={detail.cartPagination.total}
                                totalPages={detail.cartPagination.totalPages}
                              />
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-white/55">
                              No products are sitting in this cart right now.
                            </p>
                          )}
                        </div>

                        <div className="rounded-[1.4rem] border border-white/8 bg-black/25 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                            Order history
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-white">
                            {detail?.ordersPagination.total
                              ? `${detail.ordersPagination.total} order(s)`
                              : "No orders yet"}
                          </h4>
                          {isDetailLoading ? (
                            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/45">
                              Refreshing details...
                            </p>
                          ) : null}
                          {detail?.ordersPagination.total ? (
                            <div className="mt-4 space-y-4">
                              {detail.orders.map((order) => (
                                <div className="rounded-[1.2rem] border border-white/8 bg-white/4 p-4" key={order.id}>
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-white">
                                          {formatOrderReference(order.id)}
                                        </p>
                                        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/65">
                                          Order: {order.shipment ? formatShipmentStatus(order.shipment.status) : formatOrderStatus(order.status)}
                                        </span>
                                        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/65">
                                          Payment: {formatPaymentStatus(order.paymentStatus)}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-xs text-white/45">
                                        {formatDateTime(order.createdAt)} | {order.paymentProvider}
                                        {order.paymentReference ? ` | Ref ${order.paymentReference}` : ""}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold text-white">
                                      {formatCurrency(order.totalAmount)}
                                    </p>
                                  </div>

                                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                                    <div className="space-y-2">
                                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                                        Items
                                      </p>
                                      {order.items.map((item) => (
                                        <div
                                          className="rounded-[1rem] border border-white/8 bg-black/20 px-3 py-3"
                                          key={item.id}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="text-sm text-white">{item.product.name}</p>
                                              <p className="mt-1 text-xs text-white/45">
                                                Qty {item.quantity} | {item.product.collection.name}
                                              </p>
                                              {item.selectedSize || item.selectedColor ? (
                                                <p className="mt-1 text-xs text-white/45">
                                                  {item.selectedSize ? `Size: ${item.selectedSize}` : "Size: default"}
                                                  {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                                                </p>
                                              ) : null}
                                            </div>
                                            <p className="text-sm text-white">
                                              {formatCurrency(item.price * item.quantity)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="space-y-2">
                                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                                        Shipping address
                                      </p>
                                      <div className="rounded-[1rem] border border-white/8 bg-black/20 px-3 py-3 text-sm text-white/60">
                                        <p className="text-white">{order.address.fullName}</p>
                                        <p>{order.address.phone}</p>
                                        <p>{order.address.line1}</p>
                                        {order.address.line2 ? <p>{order.address.line2}</p> : null}
                                        <p>
                                          {order.address.city}, {order.address.state}
                                        </p>
                                        <p>
                                          {order.address.postalCode}, {order.address.country}
                                        </p>
                                        {order.address.notes ? (
                                          <p className="mt-2 text-xs text-white/45">
                                            Note: {order.address.notes}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <AdminPagination
                                currentPage={currentOrderPage}
                                itemLabel="orders"
                                onPageChange={(page) => {
                                  setDetailLoading((current) => ({ ...current, [user.id]: true }));
                                  setDetailErrors((current) => ({ ...current, [user.id]: "" }));
                                  setOrderPages((current) => ({ ...current, [user.id]: page }));
                                }}
                                pageSize={detail.ordersPagination.pageSize}
                                totalItems={detail.ordersPagination.total}
                                totalPages={detail.ordersPagination.totalPages}
                              />
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-white/55">
                              This account has not placed an order yet.
                            </p>
                          )}
                        </div>
                      </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          </div>
        )}
        <AdminPagination
          currentPage={pagination?.page ?? currentPage}
          itemLabel="users"
          onPageChange={(page) => {
            setLoading(true);
            setError("");
            setCurrentPage(page);
            setExpandedUserId(null);
          }}
          pageSize={pagination?.pageSize ?? USERS_PER_PAGE}
          totalItems={pagination?.total ?? 0}
          totalPages={pagination?.totalPages ?? 1}
        />
      </div>
    </div>
  );
}
