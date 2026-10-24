# Security Specification for HAMDAR Fashion Wear

## 1. Data Invariants
1. Products can be read by any public visitor (active catalog browsing).
2. Only authorized administrators (verified email or admins collection) can create, update, or delete products.
3. Customers can create orders with validated schema, non-empty customer name, phone, address, and positive total amount.
4. Orders can only be read, updated, or deleted by authorized administrators to protect customer PII (phone number, delivery address, order notes).
5. Global site settings (`/settings/general`) can be read by any visitor, but only modified by administrators.
6. Admin documents (`/admins/{userId}`) can only be read and written by administrators.
7. User `alriachybachir11@gmail.com` is bootstrapped as the initial superadmin.

## 2. The Dirty Dozen Payloads (Negative Security Assertions)
1. **Unauthenticated Product Injection**: An unauthenticated client attempts to create `/products/hack-1` -> MUST FAIL.
2. **Unauthenticated Product Price Alteration**: An unauthenticated client attempts to update `/products/hmd-001` with `price: 0.01` -> MUST FAIL.
3. **Public Orders Scraping**: An unauthenticated visitor attempts to list `/orders` to steal customer phone numbers and addresses -> MUST FAIL.
4. **Order Tampering by Random User**: An authenticated non-admin user attempts to change an order's status to `delivered` without authorization -> MUST FAIL.
5. **Admin Role Self-Elevation**: A random user attempts to write to `/admins/{their_uid}` with `role: "admin"` -> MUST FAIL.
6. **Corrupt Order Creation**: A client submits an order missing required `customerName`, `customerPhone`, or `totalAmount` -> MUST FAIL.
7. **Negative Price Order Injection**: A client attempts to create an order with `totalAmount: -50.00` -> MUST FAIL.
8. **Malicious Oversized String (Denial of Wallet)**: A client attempts to write a 1MB payload to an order note -> MUST FAIL (bounded to 1000 chars).
9. **Settings Hijacking**: An unauthorized user attempts to update `/settings/general` to divert WhatsApp orders to a fraudulent number -> MUST FAIL.
10. **Product Deletion Attack**: An unauthenticated user attempts to delete `/products/hmd-001` -> MUST FAIL.
11. **Email Spoofing without Verification**: A user with spoofed `email: "alriachybachir11@gmail.com"` but `email_verified: false` attempts admin writes -> MUST FAIL.
12. **Ghost Field Injection in Products**: An attacker attempts to inject unauthorized hidden RBAC fields into product documents -> MUST FAIL.
