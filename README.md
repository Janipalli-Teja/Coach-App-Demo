# 🏆 Coach App

### **Sports Academy Management System**

> A modern, all-in-one **mobile application** built for sports coaches and academy administrators to manage **students, attendance, fees, and performance analytics** — all in real time.

<p align="center">
  <b>📱 Android & iOS • ⚡ Real-time • 📊 Analytics-Driven • 🌙 Dark Mode</b>
</p>

---

## 🌟 Why Coach App?

Managing a sports academy shouldn’t require notebooks, spreadsheets, or manual follow-ups.

**Coach App** simplifies everything:

* Track students effortlessly
* Record attendance in seconds
* Monitor fee payments clearly
* Generate professional reports instantly

Built with **performance, scalability, and premium UI** in mind.

---

## ✨ Core Features

### 📊 Smart Dashboard

* **Real-time analytics** for active students & attendance
* **Quick actions**: Mark attendance, add fees, view reports
* **Multi-branch view**: Switch branches or view combined insights

---

### 👥 Student Management

* **Digital student directory** with advanced filters
* **Detailed profiles**: Personal info, contacts & joining dates
* **Profile photos** via **Cloudinary integration**
* **Attendance heatmaps** for trend analysis

---

### 📅 Attendance & Fee Management

* **Bulk attendance marking** (Morning / Evening sessions)
* **Monthly fee tracking** (Paid / Pending)
* **Revenue insights** by branch and session
* **Edit historical records** anytime

---

### 📈 Reports & Data Export

* **Master Excel Report**

  * Student directory
  * Complete fee history
* **Monthly batch registers** (Attendance + Fees)
* **Context-aware exports**

  * Branch-wise
  * Session-wise
  * Analytics-based
* **One-tap sharing** via Email / WhatsApp
* Built using **XLSX + Expo Sharing**

---

### 🎨 Premium UI / UX

* 🌗 **Light & Dark Mode**
* ✨ Glassmorphic cards & custom alerts
* 🎞 Smooth animations with Reanimated
* 📱 Optimized for **Android & iOS**

---

## 🛠 Tech Stack

| Layer                | Technology                 |
| -------------------- | -------------------------- |
| **Framework**        | React Native (Expo SDK 54) |
| **Routing**          | Expo Router (File-based)   |
| **Auth & DB**        | Firebase Auth & Firestore  |
| **Image Storage**    | Cloudinary                 |
| **State Management** | React Context API          |
| **Animations**       | React Native Reanimated    |
| **Reports**          | XLSX                       |
| **Sharing**          | Expo Sharing               |

---

## 🚀 Getting Started

### ✅ Prerequisites

* **Node.js** (LTS)
* **Expo Go App** (Mobile) or Emulator

---

### 📥 Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project
cd Coach-App-Demo

# Install dependencies
npm install
```

---

### 🔐 Environment Setup

Create a `.env` file in the root directory
(Refer to `.env.example`)

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

---

### ▶️ Run the App

```bash
npx expo start
```

Scan the QR code using **Expo Go** or launch it on an emulator.

---

## 📁 Project Structure

```plaintext
Coach-App-Demo/
│
├── app/            # Expo Router screens & layouts
├── components/     # Reusable UI components
├── services/       # Firebase, Cloudinary & Export logic
├── hooks/          # Custom business logic hooks
├── contexts/       # Theme & Authentication providers
├── constants/      # Colors, styles & static configs
├── types/          # TypeScript interfaces
└── assets/         # Images & fonts
```

---

## 📌 Use Cases

* Sports Academies
* Coaching Centers
* Training Institutes
* Multi-branch sports organizations

---

## ❤️ Built With Passion

Designed and developed to **simplify academy management** and help coaches focus on what truly matters — **training champions**.

---

If you want, I can also:

* Add **screenshots section**
* Create **badges** (Expo, Firebase, Platform)
* Write a **short GitHub description**
* Make a **portfolio-ready version**
* Optimize for **open-source contributions**

Just tell me 👍
