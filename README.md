# HAMDAR Fashion Wear — E-Commerce & Admin Platform

A modern, responsive e-commerce web application and administrative management suite for **HAMDAR Fashion Wear**, built with React, TypeScript, Tailwind CSS, and an Express full-stack backend with atomic data persistence.

---

## 🌟 Key Features

### 1. Modern Fashion Storefront
- **Brand Aesthetic**: Minimalist white background, bold black typography, subtle neutral surfaces, and red accents (`#dc2626`).
- **Promotional Ribbon**: Live customizable announcement banner (e.g. Express Delivery across Lebanon).
- **Hero Showcase**: High-impact editorial photography featuring models in modern streetwear, matching the uploaded visual reference.
- **Category Banners**: Dedicated shortcuts for **Men**, **Women**, and **Shoes**.
- **Interactive Product Catalog**: Instant search, department switcher, category chips, and price sorting.
- **Product Detail Modal**: High-res image gallery, variant selectors (sizes, colors), real-time stock availability, and dual purchase actions.

### 2. Two Distinct Shop Departments
- **Men's Shop**:
  - WhatsApp: `+961 76 320 279` ([wa.me/96176320279](https://wa.me/96176320279))
  - Facebook: [HAMDAR Men Official](https://www.facebook.com/share/1E7SjfVSzt/?mibextid=wwXIfr)
- **Women's Shop**:
  - WhatsApp: `+961 81 612 154` ([wa.me/96181612154](https://wa.me/96181612154))
  - Facebook: [HAMDAR Women Official](https://www.facebook.com/share/1FzvXxuDSb/?mibextid=wwXIfr)
- **Dedicated Department Banners & Routing**: Direct access from the top navigation bar, hero buttons, and category cards.

### 3. Shopping Bag & WhatsApp Ordering
- **Persistent Cart**: Automatically retained across browser reloads via `localStorage`.
- **Mixed-Department Detection**: Intelligently separates Men's and Women's products in mixed carts and offers dedicated WhatsApp order dispatch buttons to each coordinator.
- **Online Checkout**: Customer verification (Name, Phone, Delivery Address, City, Notes) with unique Order References (e.g. `#1025`) and Cash on Delivery (COD) terms.
- **Server-Side Price Validation**: Recalculates subtotal and delivery fees on the backend against database catalog records to prevent tampered prices.

### 4. Administrator Control Center (`/admin` or lock icon)
- **Sleek 4-Digit PIN Pad**: Matches the reference mockup with 4-dot progress indicator and lockout security.
- **Brute-Force Protection**: Locks out after 5 consecutive failed attempts for 5 minutes.
- **Salted Password & PIN Hashing**: Uses Node.js `crypto.scryptSync` with random 16-byte salts (no plaintext stored).
- **Dashboard Overview**: Metrics for Total Products, Total Orders, Low Stock Alerts, and Total Revenue.
- **Product Management**: Create, edit, hide/publish, upload product images, adjust sizes and colors, and delete products.
- **Order Management**: View order lines, update statuses (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`), and record courier notes.
- **Inventory Tracking**: Live stock levels and quick inline stock editor with low-stock warnings.
- **Website Content Management**: Change store name, promo announcements, hero banners, WhatsApp numbers, Facebook URLs, currency, and delivery fee.
- **Security Credentials**: Change the 4-digit PIN (requires current PIN + 2x new PIN entry) and account password.

---

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Start the full-stack dev server (Express backend + Vite frontend on port 3000)
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Initial Admin Credentials
- Default PIN: `1234`
- Default Password: `admin1234`
- *Note:* Upon your first login, visit the **PIN & Security** tab to set your own confidential 4-digit PIN and password.

---

## 🗄️ Persistence & Storage
- **Firebase Firestore**: Connected to Cloud Firestore database `ai-studio-hamdarfashionwea-344b8442-63e9-4679-9e28-0e4755597de6` in project `sturdy-buttress-4pthm`.
- **Firebase Authentication**: Integrated with Google Sign-in provider for administrative identity verification.
- **Security Rules**: Enforced and deployed via `firestore.rules` with strict schema validation and admin access control.
- **Catalog & Orders**: Persisted with atomic failover in `data/store.json` and synchronized in real time to Firestore `/orders/{orderId}`.
- **Image Uploads**: Handled by `/api/upload` and saved directly to `public/uploads/`.
