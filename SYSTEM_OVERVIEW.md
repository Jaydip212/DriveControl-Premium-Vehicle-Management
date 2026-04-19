# 🛡️ DriveControl Premium - System Overview

Welcome to the **DriveControl Enterprise Vehicle Management System**. This document provides a complete breakdown of the system architecture, features, and operational modules.

---

## 🚀 Core Features & Modules

### 1. 📊 Enterprise Dashboard
- **Real-time Stats**: 4-column high-performance monitoring (Vehicles, Revenue, Active Trips, Pending Tasks).
- **Financial Trajectory**: Interactive high-fidelity charts showing revenue vs. expense trends.
- **System Health**: Automated uptime and managed asset tracking.

### 2. 🚛 Fleet & Personnel Management
- **Vehicles Module**: Add, track, and manage all taxis, cabs, and heavy vehicles. Status tracking (Available, On Trip, Maintenance).
- **Drivers & Workers**: Detailed staff profiles with role-based dashboard access.
- **Attendance/Payroll**: Integrated salary management for both drivers and workshop staff.

### 3. 💰 Financial Operations
- **Sales/Cashbook**: Record all daily sales and driver earnings.
- **Bank & Finance**: Manage deposits, withdrawals, and real-time bank balance tracking.
- **Workshop Expenses**: Log spare parts purchases and maintenance costs.

### 4. 🛠️ Inventory & Maintenance
- **Spare Parts Inventory**: Track stock levels for critical vehicle parts.
- **Low Stock Alerts**: Visual indicators when parts reach the Minimum Stock Level (MSL).
- **Workshop Logs**: History of vehicle repairs and spare parts usage.

---

## 🛠️ Technical Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Styling** | Custom Glassmorphic CSS Design System |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (JWT based) |
| **Icons** | Lucide Icons (Premium Set) |
| **Development** | Vite (Build Tool) |

---

## 🔐 System Roles (RBAC)

- **SuperAdmin**: Full system control, financial reports, and system settings.
- **Admin**: Fleet management, payroll, and workshop expense approval.
- **Worker/Attendant**: Daily sales entries, vehicle check-ins, and part tracking.

---

## 📦 File Structure

- `/src/style.css`: Global design system and premium visuals.
- `/src/main.js`: Core application logic and routing.
- `/src/lib/supabase.js`: Database connection layer.
- `/enterprise_schema.sql`: Complete database structure for Supabase.
- `/.env`: Environment configuration for live deployment.

---
*Enterprise Solution designed by **Jayvik Labs** for premium vehicle fleet management.*
