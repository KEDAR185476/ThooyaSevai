ThooyaSevai – AI-Driven Urban Cleanliness & Environmental Governance Platform
Overview

ThooyaSevai is an AI-powered civic technology platform designed to transform urban cleanliness management into a transparent, data-driven, and community-powered governance system.

The platform integrates:

Real-time geo-tagged waste reporting

AI-based waste classification and disposal guidance

Ward-level cleanliness ranking and analytics

Youth-driven community participation (1 Student = 1 Street initiative)

Waste marketplace for recyclable materials

Smart bin integration

Air quality monitoring with automated authority alerts

ThooyaSevai enables authorities, citizens, and youth to collaborate in improving urban sanitation, environmental health, and national cleanliness ranking performance.

Core Objectives

Increase citizen participation in waste reporting and segregation.

Reduce grievance redressal time through SLA-based tracking.

Improve waste segregation compliance at source.

Enable data-driven ward-level sanitation planning.

Integrate environmental monitoring with cleanliness governance.

Align directly with national cleanliness evaluation parameters.

System Architecture
Frontend

React 18

TypeScript

Vite

Tailwind CSS

shadcn/ui components

React Router v6 (role-based routing)

TanStack React Query (state management)

Recharts (analytics)

Backend

Lovable Cloud (Authentication, PostgreSQL, Storage, Edge Functions)

Row-Level Security (RLS) enabled on all tables

JWT-based secure authentication

AI Integration

Gemini 2.5 Flash (multimodal waste classification)

Gemini 3 Flash Preview (structured extraction & data parsing)

Environmental Integration

Smart Bin Monitoring

Air Quality Monitoring Sensors

Authority alert system for critical pollution levels

Authentication & Role System

Supported Roles:

Citizen

Student

Ward Officer

Admin

Scrap Dealer

Features:

Email + password authentication

Role-based access control

Protected routes

Persistent sessions

Secure user_roles separation from profiles

Major Features
1. Garbage Reporting System

Photo upload or camera capture

Automatic GPS detection

AI waste classification

Confidence scoring

Auto ward and street mapping

Status flow: Pending → Assigned → Resolved

48-hour SLA tracking with escalation

2. AI Waste Analysis

The AI engine returns:

Waste type

Confidence score

Reuse suggestions

Proper disposal method

Environmental impact score

Benefits of proper disposal

Harms of improper disposal

Includes rate-limit handling and structured JSON fallback.

3. Gamification & Leaderboard

Points for reporting, validation, resolution

Badge tiers: Bronze, Silver, Gold, Platinum

Weekly leaderboard:

Individual

Ward-wise

Street-wise

School-wise

4. Youth Movement – 1 Student = 1 Street

Street claiming system

Invite-based neighbor participation

Family participation tracking

Weekly eco-task assignments

Point multiplier for active neighborhoods

Clean Ambassador badge progression

5. Live Heatmap & Analytics Dashboard

Admin Features:

Real-time garbage density heatmap

Ward cleanliness scoring

Complaint management

Resolution time tracking

Monthly awards display

Street-level performance trends

6. Waste Marketplace

Citizens:

List recyclable waste with photo and GPS

Categorize waste (Plastic, Paper, Metal, E-waste, Glass)

Scrap Dealers:

Browse listings

Make offers

Track transaction status

Status Flow:
Open → Offered → Accepted → Collected → Cancelled

7. Smart Bin Integration

Smart bins provide:

Fill-level monitoring

Location-based tracking

Overflow alerts

Real-time data syncing with dashboard

This improves proactive waste collection efficiency.

8. Air Quality Monitoring

Integrated air quality sensors monitor:

Pollution levels

Environmental risk scores

Area-based air quality trends

If pollution exceeds safe thresholds:

Automated alerts sent to authorities

Risk severity classification

Preventive action recommendations

This ensures both visible cleanliness and environmental health are managed together.

AI Edge Functions

analyze-waste

parse-city-data

explain-street

explain-ward

predict-hotspots

These functions enable intelligent automation, natural-language reasoning, structured extraction, and hotspot prediction.

Database Schema

Core Tables:

profiles

user_roles

reports

wards

leaderboard

rewards

redemptions

schools

families

family_participation

street_assignments

waste_listings

dealer_offers

All tables use Row-Level Security policies.

Admin Capabilities

City-wide complaint oversight

Ward performance tracking

AI-powered bulk data import

Hotspot prediction (48-hour forward forecast)

Cleanliness score explanation

Public display dashboard for institutions

Cleanliness Score Formula

Cleanliness Score =
(resolved_reports / total_reports) × 100 − overflow_penalty

Scores are updated dynamically to reflect real-time ward performance.

Expected Impact

3X increase in citizen participation

40–50% reduction in complaint resolution time

50% reduction in garbage hotspot zones

Improved waste segregation compliance

Increased transparency in sanitation governance

Alignment with national cleanliness ranking parameters

Environmental monitoring integration for healthier urban living

Security

JWT-based authentication

Row-Level Security on all tables

Role-based route protection

Controlled update access for officers and admins

Vision

ThooyaSevai transforms urban sanitation from a complaint-driven process into a performance-driven governance ecosystem. By integrating AI, community participation, environmental monitoring, and digital transparency, the platform enables cities to transition toward sustainable, accountable, and data-backed cleanliness management.
