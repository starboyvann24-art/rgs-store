# RGS Store - Frontend Implementation Plan

This document outlines the implementation plan for the frontend of the "RGS STORE" project, a lightweight, modern e-commerce UI built entirely with HTML, Tailwind CSS, and Vanilla JavaScript.

## Goal
To build a static, premium marketplace UI (inspired by Tokopedia) focusing on an excellent mobile-first responsive layout, smooth hover effects, and modern interactions. There will be no backend integration yet; all dynamic components will utilize mock data and placeholder functions that mimic API fetches.

## User Review Required

> [!WARNING]
> You specified **Tailwind CSS (precompiled, no build step)** along with the file `/css/tailwind.css`. 
> I plan to use the **Tailwind Play CDN (`<script src="https://cdn.tailwindcss.com"></script>`)** in the HTML files to ensure we have zero build steps during development while getting all utility classes. I will use the `/css/tailwind.css` file for any custom overrides, base styles, or custom animations not covered by Tailwind utilities out of the box. 
> 
> If you prefer that I strictly download a pre-compiled, static output of Tailwind (so no runtime script is loaded at all), please let me know, though the CDN is usually best for zero-build-step prototyping.

## Proposed Changes

---

### Project Structure & Styling
Setting up the directories and base styles in `c:\Users\admin\evan\public`.

#### [NEW] `c:\Users\admin\evan\public\css\tailwind.css`
- Custom CSS overrides, font imports (Google Fonts: Inter), smooth scrolling, and custom animations/micro-interactions to give it that premium feel.

#### [NEW] `c:\Users\admin\evan\public\js\main.js`
- Global utility functions.
- Setup for responsive navbar (mobile menu toggles).
- Mock global state (e.g., cart item count).

#### [NEW] `c:\Users\admin\evan\public\js\app.js`
- Page-specific logic.
- Mock data arrays (dummy products, dummy cart items, dummy orders).
- Fetch placeholders (`await fetch('/api/products')`) that currently resolve with the mock data to populate the UI.

---

### Pages

#### [NEW] `c:\Users\admin\evan\public\index.html` (Home Page)
- **Navbar**: Logo, search bar, cart icon with badge, user profile menu.
- **Hero Banner**: Smooth animated carousel or static beautiful promo banner.
- **Category Section**: Horizontal scrollable category pills/cards.
- **Product Grid**: Responsive grid (`grid-cols-2` on mobile, up to `grid-cols-5` on desktop).
- **Product Cards**: Image, title, price, rating, hover translation/shadow effects.

#### [NEW] `c:\Users\admin\evan\public\product.html` (Product Detail)
- **Gallery**: Main product image and thumbnails.
- **Info**: Title, pricing, ratings, description.
- **Actions**: Quantity selector (+/- buttons) and "Add to Cart" button with click feedback animation.

#### [NEW] `c:\Users\admin\evan\public\cart.html` (Cart)
- **Items**: List of cart items with image, info, and quantity controls.
- **Summary**: Total price calculation and a sticky (or floating) checkout bar on mobile.
- **Actions**: "Proceed to Checkout" button.

#### [NEW] `c:\Users\admin\evan\public\checkout.html` (Checkout)
- **Order Summary**: List of what's being purchased.
- **Payment Section**: QRIS payment placeholder (a static dummy QR code image).
- **Upload Form**: File input UI for uploading payment proof.

#### [NEW] `c:\Users\admin\evan\public\dashboard.html` (User Dashboard)
- **Sidebar**: Easy navigation for account settings, orders, etc.
- **Order History**: Responsive table/list view for past orders.
- **Badges**: Tailwind styled pills for order statuses (e.g., `Pending`, `Paid`, `Completed`).

#### [NEW] `c:\Users\admin\evan\public\admin.html` (Admin Dashboard)
- **Sidebar**: Admin navigation.
- **Stats Cards**: Revenue, Total Orders, Total Users.
- **Data Tables**: Orders management table.
- **Product Management**: A placeholder UI to show how products can be added/edited/deleted.

## Open Questions

> [!IMPORTANT]
> 1. Are there any specific brand colors (e.g., Tokopedia's distinct green `#03AC0E`) that you specifically want me to use for the primary aesthetic? By default I'll configure Tailwind to use a Tokopedia-like vibrant green theme.
> 2. Is there a specific dummy placeholder image service (e.g., Placehold.co or Unsplash source) you'd prefer I use for the frontend mockups?

## Verification Plan

### Automated/Manual Testing
- I will open up the HTML files in the browser environment using the `browser_subagent` (when possible) or visually inspect the code to ensure Tailwind classes are correctly mapped for a responsive design (testing `sm:`, `md:`, `lg:` breakpoints).
- Verification of page-to-page dummy navigation (clicking "Add to Cart" and moving to the Cart page).
