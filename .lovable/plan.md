

# Clean Madurai – AI-Powered Urban Cleanliness Platform

## Overview
A single React web application (mobile-responsive) with role-based access for Citizens, Students, Ward Officers, and City Admins. Uses Lovable Cloud (Supabase) for backend and Lovable AI for waste image classification.

---

## Phase 1: Foundation & Authentication

### 1. Authentication System
- Email + password signup/login with role selection (Citizen, Student, Ward Officer, Admin)
- User roles stored in a secure `user_roles` table (not on profiles)
- Profiles table with name, email, ward_id, total_points, badge_level
- Role-based route protection and navigation

### 2. Database Schema
- **profiles** – user details, points, badge level
- **user_roles** – role assignments (citizen, student, ward_officer, admin)
- **reports** – garbage reports with image, GPS, waste type, status, timestamps
- **wards** – ward data with report counts and cleanliness scores
- **leaderboard** – weekly rankings (individual, ward, street, school)
- **rewards** – redeemable rewards catalog
- **schools & families** – for student ambassador tracking
- Storage bucket for report images

---

## Phase 2: Citizen Features

### 3. Report Garbage Module
- Photo capture/upload interface
- GPS auto-detection via browser geolocation
- Ward and street auto-assignment based on location
- AI waste classification (Plastic, Organic, Construction, Mixed) using Lovable AI with confidence score
- Report submission with status tracking (pending → assigned → resolved)

### 4. Gamification & Leaderboard
- Points system: +10 submitted, +20 validated, +30 resolved
- Badge progression: Bronze → Silver → Gold → Platinum
- Leaderboard views: Individual, Ward-wise, Street-wise, School-wise
- Visual badge display on user profile

### 5. Rewards System
- Browse available rewards with points required
- Redeem rewards (local discounts, certificates, digital badges)
- Redemption history

---

## Phase 3: Student Ambassador Features

### 6. Student Module
- Add and track up to 10 families
- Family participation tracking
- "Clean Ambassador" badge progression
- School-wise leaderboard integration

---

## Phase 4: Ward Officer Features

### 7. Ward Officer Dashboard
- View reports filtered by assigned ward
- Mark reports as resolved with timestamps
- SLA timer tracking per report
- Report status management

---

## Phase 5: Admin Dashboard

### 8. Live Garbage Heatmap
- Map visualization of unresolved reports
- Color-coded zones: Green (0-3), Yellow (4-7), Red (8+)
- Filters by ward and date range

### 9. Cleanliness Score Engine
- Automated score calculation per ward/street
- Cleanest Ward, Top 10 Streets, Most Improved Area rankings
- Weekly score updates

### 10. Complaint Management Panel
- View all reports city-wide
- Assign reports to ward officers
- Status updates and SLA tracking
- Auto-escalation alerts for reports unresolved after 48 hours

### 11. Analytics Dashboard
- Reports per day chart
- Waste type distribution pie chart
- Resolution time trends line chart
- Citizen participation growth chart

---

## Phase 6: AI & Predictions

### 12. AI Waste Classification
- Edge function calling Lovable AI (Gemini) to classify waste from uploaded images
- Returns waste type + confidence score
- Auto-tags reports on submission

### 13. High-Risk Zone Prediction
- Historical complaint density analysis
- Predicted hotspot areas displayed on admin dashboard
- Probability scores per zone

---

## Design & UX
- **Green-based civic theme** – clean, modern, trustworthy
- **Mobile-first responsive design** for citizen use on phones
- **Clear navigation** – role-based sidebar/nav showing only relevant sections
- **Map visualizations** for heatmaps and report locations
- **Gamified elements** – badges, points, and leaderboard prominently displayed
- **Minimal clutter** – focused, task-oriented interfaces

