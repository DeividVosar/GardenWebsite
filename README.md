# GardenWebsite

Interactive garden map prototype.
Learning course i created for myself trying to learn both frontend and backend while creating a solution for my personal issue of constantly forgetting what exists where and when was the last time i took care of it.
This repo currently showcases the early and very barebones version.

## Live demo
- GitHub Pages: https://deividvosar.github.io/GardenWebsite/

## What works right now

- Background garden image shown as the map
- Zoom + pan
- Mode switch (top-left):
  - **View**: inspect existing pins
  - **Edit**: add and move pins
- Pin popup:
  - **Mark as watered** updates the plant’s “last watered” date to now
  - **More details** opens the details panel
- Details panel:
  - View/edit some fields
  - Basic validation (e.g. name/type can’t be empty; non-numeric frequency resets to “unknown”)


## Current focus
- Connecting the backend for real data persistence (save/load maps + pins)

## Tech
- Frontend: React + Vite
- Hosting: GitHub Pages
- Backend (In progress): Java + Spring Boot (REST API), PostgreSQL(Databse), Flyway(Migrations)

## Future plans (Very cut down and top level...Seriously i have hundreds of ideas in my own notepad)
- Calendar / task list view (what needs doing,upcoming tasks etc)
- Multi-map support (outside, greenhouse, indoor floors)
- Plant care tracking: watering + fertilising + seasonal tasks
- Status indicators on pins (ok / soon / urgent)
- Editable & Custom fields per plant (User own created and fully customisable fields)
- Notifications/reminders
- Mobile version (Because who checks their outdoor garden while sitting indoors)
- Multi-user/Multi device sync (For sharing with your partner or having the same view on mobile and pc)

