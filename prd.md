PRODUCT REQUIREMENTS DOCUMENT (PRD)

Product Name

RGS STORE

---

1. Overview

RGS STORE adalah platform marketplace digital modern yang terinspirasi dari e-commerce besar seperti Tokopedia, dengan fokus pada penjualan produk digital (akun, voucher, top up). Platform menyediakan pengalaman belanja cepat, aman, dan profesional dengan sistem pembayaran QRIS dan dashboard interaktif.

---

2. Objectives

- Membangun marketplace digital skala besar
- Memberikan pengalaman user seperti e-commerce premium
- Menyediakan sistem admin dan dashboard profesional
- Mendukung transaksi cepat dan aman

---

3. User Roles

User (Buyer)

- Register & login
- Browse produk
- Tambah ke keranjang
- Checkout
- Lihat riwayat transaksi
- Lihat status order

Admin

- Kelola produk
- Kelola transaksi
- Verifikasi pembayaran
- Monitoring performa toko

---

4. Core Features

Authentication

- Register & login
- JWT/session
- Logout

Product System

- List produk (grid modern)
- Detail produk
- Kategori & filter
- Search produk

Shopping Cart

- Tambah ke keranjang
- Edit jumlah
- Hapus item

Order System

- Checkout multi produk
- Status:
  - pending
  - paid
  - processing
  - completed
  - cancelled

Payment System

- QRIS payment
- Upload bukti (opsional)
- Verifikasi manual

User Dashboard

- Profil user
- Riwayat transaksi
- Status order
- Saldo (future)

Admin Dashboard

- Statistik penjualan

- Total revenue

- Total user

- Total order

- Grafik transaksi

- CRUD produk

- Manajemen order

- Konfirmasi pembayaran

---

5. User Flow

User masuk website
→ Login/Register
→ Browse produk
→ Tambah ke keranjang
→ Checkout
→ QRIS muncul
→ Bayar
→ Verifikasi admin
→ Order selesai

---

6. System Architecture

Client (Browser)
↓
Frontend (UI Marketplace)
↓
Backend API (Node.js + Express)
↓
Database (MySQL)

---

7. Database Overview

Tables:

- users
- products
- orders
- order_items
- payments
- admins
- categories (optional)

---

8. Tech Stack

- Frontend: React / HTML + Tailwind CSS
- Backend: Node.js + Express
- Database: MySQL
- Hosting: Hypercloud Host

---

9. UI / UX Design Guidelines

- Style: Modern marketplace (Tokopedia-style)
- Warna utama: Hijau + Biru
- Layout:
  - Navbar dengan search
  - Sidebar kategori
  - Grid produk
  - Card produk modern
- Responsif (mobile-first)

---

10. Dashboard Design

User Dashboard

- Profile card
- Order history table
- Status badge (warna)
- Quick action button

Admin Dashboard

- Cards:
  - Total Revenue
  - Total Orders
  - Total Users
- Grafik penjualan
- Table transaksi
- CRUD produk panel

---

11. Development Flow

Planning
→ UI/UX Design
→ Database (ERD)
→ Backend Development
→ Frontend Development
→ Integration
→ Testing
→ Deployment

---

12. Security

- Password hashing (bcrypt)
- JWT authentication
- Input validation
- Anti SQL Injection

---

13. Future Features

- Auto delivery produk
- Sistem saldo user
- Payment gateway otomatis
- Notifikasi WhatsApp
- Multi-vendor (seller banyak)

---

14. Success Metrics

- Conversion rate tinggi
- Transaksi harian meningkat
- User aktif
- Revenue stabil