# 🎉 EventHub – Event Management System

A simplified, multi-role Event Management System built with **React** and **Supabase**, enabling users to browse and purchase events, vendors to create and manage them, and admins to oversee the entire platform.

---

## 🚀 Features

### 👤 User
- Register and log in with role selection
- Browse all available events in a catalog
- Add events to cart and checkout
- View past orders in order history
- Manage membership plans (upgrade, renew, cancel)

### 🛍️ Vendor
- Create and publish new events with details
- View and manage own events
- Track orders placed for their events

### 🛡️ Admin
- Monitor all users, vendors, events, and orders
- Manage membership plans across the system
- Enforce role-based access and system integrity

---

## 🧠 Tech Stack

- **Frontend**: React, Tailwind CSS, React Router, Context API
- **Backend**: Supabase (Auth, Database, Row Level Security)
- **Deployment**: Vercel, Rendor

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/apoorv0011/EMS.git
cd EMS

# Install dependencies
npm install

# Start the development server
npm run dev
