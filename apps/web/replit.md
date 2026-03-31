# Cirrus Global HRM Application (Teamflect)

## Overview
In-house HRM (Human Resource Management) application for Cirrus Global Inc. Built to replace the third-party Teamflect Microsoft application with a fully customized solution.

**Current State:** Frontend design/prototype phase with mock data. Backend to be added later.

## Brand Colors
- Primary Brand Blue: `#00A6E3`
- Deep Charcoal Brown: `#403D32`
- Soft Light Background Blue: `#F4FCFF`

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Icons:** Lucide React
- **Backend:** TBD (user will add dedicated backend later)

## Project Structure
```
client/                  # React frontend (Vite)
├── public/
│   └── cirrus-logo.webp # Company logo
├── src/
│   ├── components/      # React components (to be expanded)
│   ├── data/
│   │   └── mockData.ts  # Mock data for development
│   ├── App.tsx          # Main dashboard page
│   ├── App.css          # Dashboard styles
│   ├── index.css        # Global styles & CSS variables
│   └── main.tsx         # React entry point
├── vite.config.ts       # Vite config (port 5000, all hosts allowed)
└── package.json
attached_assets/         # Design references and logos
```

## User Roles
1. **Administrator (HR)** - Admin Center, impersonate users
2. **Manager** - Conduct performance reviews for direct reports
3. **Employee** - View own reviews, provide feedback

## Features (Planned)
- Login & Registration with email verification
- Profile Dashboard with employee information
- Home Page (Intranet) with policies, handbook, feedback, birthdays
- KPI tracking
- Performance Reviews
- Surveys
- Feedback (Company, Employee, Received, Given)
- Recognitions with points and rewards

## Running the App
```bash
cd client && npm run dev
```
Runs on port 5000.

## Recent Changes
- 2026-02-16: Initial frontend setup with React + Vite + TypeScript
- 2026-02-16: Built HRM dashboard matching Teamflect design with brand colors
- 2026-02-16: Added mock data for stats, policies, birthdays, anniversaries, new members
- 2026-02-16: Moved navigation to collapsible vertical sidebar (Home, KPI, Reviews, Surveys, Feedback, Recognitions)
- 2026-02-16: Added profile popup on user name click with user details and logout button

## User Preferences
- Frontend in React
- Mock data for now, dedicated backend to be added later
