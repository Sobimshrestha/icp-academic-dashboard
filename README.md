# ICP Digital Dean

An intelligent academic scheduling and campus information system for **Informatics College Pokhara (ICP)**.

---

## Overview

ICP Digital Dean is a frontend-based web platform that visualizes academic schedules, room availability, and campus activity in real time and made completely with help of AI.

It transforms static schedule data into an interactive system that helps students quickly understand their timetable, room availability, ongoing classes, and free time slots across campus.

The system is designed to later support automation through email-based updates and an admin dashboard.

---

## Features

### Live Academic Schedule
- Displays structured timetable data in real time
- Highlights current, upcoming, and completed classes
- Filters by year, group, and day

### Room Availability System
- Shows whether rooms are free or occupied
- Displays current class running in each room
- Provides detailed room timeline with free slots

### Campus Map View
- Visual grid representation of campus rooms
- Live status indicators for each room
- Hover tooltips with class details

### Schedule Intelligence Engine
- Computes time-based class status
- Detects free and occupied time blocks
- Identifies schedule overlaps for groups

### Social Sync (Free Time Matching)
- Finds overlapping free time between two groups
- Useful for meetings or collaborative planning

### Detailed Timeline Drawer
- Deep view of any room’s schedule
- Shows full-day breakdown of sessions and free periods

### Global Search
- Search rooms, modules, and schedules instantly

---

## Project Structure

```text
icp-digital-dean/
│
├── archive/              # Backup or old versions of assets/data
├── CV_Rabinbold/         # Custom font assets
├── data/                 # Future structured data storage
├── docs/                 # Documentation and reference files
├── frontend/             # Optional frontend separation for scaling
├── Images/               # UI assets, icons, and visuals
│
├── scripts/              # Core JavaScript logic (UI + scheduling engine)
│
├── index.html            # Main application entry point
├── schedule_data.js      # Core schedule dataset
└── README.md