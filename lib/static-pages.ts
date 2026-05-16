import { STORE_NAME, SUPPORT_EMAIL } from "./constants";

export type StaticPageSection = {
  heading: string;
  body: string[];
};

export type StaticPage = {
  slug: string;
  label: string;
  title: string;
  description: string;
  intro: string;
  sections: StaticPageSection[];
};

export const STATIC_PAGES: Record<string, StaticPage> = {
  "how-it-works": {
    slug: "how-it-works",
    label: "How It Works",
    title: "How It Works",
    description: `Learn how shopping, checkout, and fulfilment work on ${STORE_NAME}.`,
    intro:
      "Browse products, choose the options you want, add them to cart, and place your order through the checkout flow.",
    sections: [
      {
        heading: "Browse and choose",
        body: [
          "Open the shop, explore available products, and review images, pricing, stock, and available options like size or color where applicable.",
          "If a product offers custom selections, choose the combination you want before adding it to cart.",
        ],
      },
      {
        heading: "Checkout",
        body: [
          "Review your cart, confirm product selections, and enter your shipping details carefully.",
          "Once the order is placed, your order reference and selected product options remain attached to that order for tracking and admin review.",
        ],
      },
      {
        heading: "Fulfilment",
        body: [
          "After confirmation, the order moves through status updates such as pending, shipped, and delivered.",
          "If you need help with an order after placing it, contact support with your order reference.",
        ],
      },
    ],
  },
  "contact-us": {
    slug: "contact-us",
    label: "Contact Us",
    title: "Contact Us",
    description: `Get in touch with ${STORE_NAME} support for orders, product questions, or general help.`,
    intro:
      "For order support, product questions, or website issues, contact the support team using the details below.",
    sections: [
      {
        heading: "Support email",
        body: [
          SUPPORT_EMAIL,
          "Please mention your order reference and the email or phone number used during checkout so the team can help faster.",
        ],
      },
      {
        heading: "Response window",
        body: [
          "Support requests are reviewed during standard business hours and answered in the order they are received.",
          "Urgent issues related to damaged delivery, wrong items, or address updates should be reported as early as possible.",
        ],
      },
    ],
  },
  faqs: {
    slug: "faqs",
    label: "FAQ'S",
    title: "Frequently Asked Questions",
    description: `Common shopping and order questions for ${STORE_NAME}.`,
    intro:
      "This page covers the most common questions customers ask before and after placing an order.",
    sections: [
      {
        heading: "Orders",
        body: [
          "Order status updates are visible after checkout and may also be reviewed by admin for support and fulfilment purposes.",
          "If you need to make a change after ordering, contact support as soon as possible.",
        ],
      },
      {
        heading: "Products",
        body: [
          "Some products may include selectable size and color options depending on the catalog setup.",
          "Availability depends on live stock. If a product is sold out, it may be restocked later at the store's discretion.",
        ],
      },
      {
        heading: "Shipping and returns",
        body: [
          "Shipping timelines, return handling, and refund eligibility are governed by the dedicated policy pages linked in the footer.",
        ],
      },
    ],
  },
  "about-us": {
    slug: "about-us",
    label: "About Us",
    title: "About Us",
    description: `About ${STORE_NAME} and the focus of the store.`,
    intro:
      `${STORE_NAME} is built to showcase products in a clean catalog experience with real product data, order handling, and admin controls.`,
    sections: [
      {
        heading: "What we do",
        body: [
          "The store focuses on presenting products clearly, handling checkout flows, and making it easy to manage customers, products, collections, and orders from the admin side.",
        ],
      },
      {
        heading: "Customer experience",
        body: [
          "The storefront is designed to stay simple, fast, and product-focused so shoppers can quickly move from discovery to checkout.",
        ],
      },
    ],
  },
  "privacy-policy": {
    slug: "privacy-policy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    description: `Understand how ${STORE_NAME} stores and uses customer information.`,
    intro:
      "This page explains the broad categories of customer information stored for account access, cart handling, checkout, and order processing.",
    sections: [
      {
        heading: "What is collected",
        body: [
          "The store may collect customer account details, shipping information, cart contents, and order records required to operate the ecommerce flow.",
          "Payment gateway integration can introduce additional payment metadata depending on the provider setup.",
        ],
      },
      {
        heading: "How data is used",
        body: [
          "Customer data is used to authenticate accounts, process orders, support fulfilment, and provide order history inside the storefront and admin area.",
        ],
      },
      {
        heading: "Access and retention",
        body: [
          "Administrative users may access relevant customer and order information needed to manage orders and support requests.",
          "Order history may be retained for operational, support, and record-keeping purposes unless a separate retention policy is defined.",
        ],
      },
    ],
  },
  "refund-policy": {
    slug: "refund-policy",
    label: "Refund Policy",
    title: "Refund Policy",
    description: `Refund handling rules for orders placed through ${STORE_NAME}.`,
    intro:
      "Refund eligibility depends on order condition, delivery status, and the issue being reported.",
    sections: [
      {
        heading: "Eligibility",
        body: [
          "Refund requests are generally reviewed for wrong item delivery, verified damage, or approved return cases under the store's return rules.",
        ],
      },
      {
        heading: "Review process",
        body: [
          "Customers may be asked to share order details, images, or additional information before a refund decision is made.",
        ],
      },
      {
        heading: "Completion",
        body: [
          "Approved refunds are processed back through the applicable payment method or store-approved refund route.",
        ],
      },
    ],
  },
  "shipping-policy": {
    slug: "shipping-policy",
    label: "Shipping Policy",
    title: "Shipping Policy",
    description: `Shipping and delivery guidelines for ${STORE_NAME}.`,
    intro:
      "Shipping timelines depend on product readiness, delivery location, and the courier process used for the order.",
    sections: [
      {
        heading: "Processing",
        body: [
          "Orders are prepared after confirmation and then handed over for shipment based on operational capacity and item availability.",
        ],
      },
      {
        heading: "Delivery",
        body: [
          "Delivery estimates are indicative and can vary due to logistics delays, regional limitations, weather, or public holidays.",
        ],
      },
      {
        heading: "Address accuracy",
        body: [
          "Customers are responsible for entering a complete and correct shipping address during checkout.",
        ],
      },
    ],
  },
  "terms-and-conditions": {
    slug: "terms-and-conditions",
    label: "Terms and Conditions",
    title: "Terms and Conditions",
    description: `Terms governing the use of ${STORE_NAME} and orders placed on the website.`,
    intro:
      "By using the website and placing an order, customers agree to the store's operational, checkout, and fulfilment terms.",
    sections: [
      {
        heading: "Use of the website",
        body: [
          "Product listings, pricing, stock levels, and policies may be updated when needed to keep the storefront accurate and operational.",
        ],
      },
      {
        heading: "Orders and fulfilment",
        body: [
          "Orders may be reviewed, confirmed, updated, or cancelled if there is a stock issue, pricing issue, or verification problem.",
        ],
      },
      {
        heading: "Policies",
        body: [
          "Refunds, shipping, and privacy handling are subject to the related policy pages linked in the footer.",
        ],
      },
    ],
  },
};

export const STATIC_PAGE_LINKS = Object.values(STATIC_PAGES).map(({ slug, label }) => ({
  href: `/pages/${slug}`,
  label,
}));
