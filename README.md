# GardenWebsite

Interactive garden map prototype.
Learning course i created for myself trying to learn both frontend and backend while creating a solution for my personal issue of constantly forgetting what exists where and when was the last time i took care of it.
The current state of the project is pretty barebones and at an early phase.

## Live demo
- GitHub Pages: https://deividvosar.github.io/GardenWebsite/

## Repositories
- **Frontend (this repo):** React + Vite, hosted on GitHub Pages
- **Backend API repo:** Java + Spring Boot (REST)
  - Github repo: https://github.com/DeividVosar/GardenWebsite-Backend

## Hosting / Infrastructure
- **Frontend:** GitHub Pages
- **Backend:** Render (free tier)
- **Database:** Neon (PostgreSQL, free tier)

### Free-tier limitation (important)
Render + Neon can go to sleep when idle.  
That means the **first load after inactivity can be slow** (cold start).

Render/Neon can go to sleep when idle, so the **first load after inactivity may take a bit**.
The UI shows **“Waking server…”** until pins load.

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


## Tech
- Frontend: React + Vite
- Backend: Java + Spring Boot (REST API)
- Hosting: GitHub Pages (Frontend) + Render (backend)
- Database: PostgreSQL (Neon)


## Future plans (Very cut down and top level...Seriously i have hundreds of ideas in my own notepad)
- Calendar / task list view (what needs doing,upcoming tasks etc)
- Multi-map support (outside, greenhouse, indoor floors)
- Plant care tracking: watering + fertilising + seasonal tasks
- Status indicators on pins (ok / soon / urgent)
- Editable & Custom fields per plant (User own created and fully customisable fields)
- Notifications/reminders
- Mobile version (Because who checks their outdoor garden while sitting indoors)
- Multi-user/Multi device sync (For sharing with your partner or having the same view on mobile and pc)

