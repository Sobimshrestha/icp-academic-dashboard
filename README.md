ICP Digital Dean

An intelligent academic scheduling and campus information system for Informatics College Pokhara (ICP).

Overview

ICP Digital Dean is a frontend-based web platform that visualizes academic schedules, room availability, and campus activity in real time.

It transforms static schedule data into an interactive system that helps students quickly understand:

their timetable
room availability
ongoing classes
free time slots across campus

The system is designed to later support automation through email-based updates and an admin dashboard.

Features
Live Academic Schedule
Displays structured timetable data in real time
Highlights current, upcoming, and completed classes
Filters by year, group, and day
Room Availability System
Shows whether rooms are free or occupied
Displays current class running in each room
Provides detailed room timeline with free slots
Campus Map View
Visual grid representation of campus rooms
Live status indicators for each room
Hover tooltips with class details
Schedule Intelligence Engine
Computes time-based class status
Detects free and occupied time blocks
Identifies schedule overlaps for groups
Social Sync (Free Time Matching)
Finds overlapping free time between two groups
Useful for meetings or collaborative planning
Detailed Timeline Drawer
Deep view of any room’s schedule
Shows full-day breakdown of sessions and free periods
Global Search
Search rooms, modules, and schedules instantly
Project Structure
icp-digital-dean/
│
├── archive/              # Backup / old versions of assets or data
├── CV_Rabinbold/         # Custom font assets
├── data/                 # Future structured data storage
├── docs/                 # Documentation and reference files
├── frontend/             # Optional separation for scalable frontend modules
├── Images/               # UI assets, icons, and visuals
│
├── scripts/              # Core JavaScript logic (UI + scheduling engine)
│
├── index.html            # Main application entry point
├── schedule_data.js      # Core schedule dataset
└── README.md
How It Works
Schedule data is stored in schedule_data.js
Frontend JavaScript processes and renders the schedule dynamically
The system calculates:
Current time status
Room occupancy
Free and busy time blocks
UI updates automatically at regular intervals (live system behavior)
Technology Stack
HTML5
Tailwind CSS
Vanilla JavaScript
Static data-driven architecture (no backend yet)
Planned Features
Email-Based Automation System
Detects college emails automatically
Extracts:
Holiday notices
Class cancellations
Room changes
Updates schedule data automatically
Admin Dashboard
Visual interface for managing schedules
Add/edit/delete classes without touching code
Role-based access for faculty/admin
Backend Integration (Future)
Python-based email parser
API layer for schedule updates
Database migration from static JS to dynamic storage
Notifications System
Real-time alerts for schedule changes
Email / web push notifications
Mobile Application
Cross-platform student timetable access
Vision

The goal of ICP Digital Dean is to build a self-updating academic ecosystem that reduces confusion and improves communication by making campus information:

Real-time
Automated
Centralized
Intelligent
About

Developed for Informatics College Pokhara (ICP) as a step toward a smarter, data-driven academic environment.