# 🗳️ Online Voting System

A full-stack online voting system built with **HTML/CSS/JavaScript** (frontend) and **Node.js + Express + MySQL** (backend).

## 🌐 Live Demo
> Deployed via Vercel + Railway

---

## 📁 Project Structure

```
online-voting-system/
├── frontend/         ← Static HTML pages (served to browser)
│   ├── login.html
│   ├── dashboard.html
│   ├── register.html
│   └── ...
├── backend/          ← Node.js/Express REST API
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── config/
├── database/         ← SQL migration files
│   └── migration_advanced.sql
├── vercel.json       ← Vercel deployment config
└── .gitignore
```

---

## 🚀 Deployment

### Frontend + Backend API → Vercel
1. Connect this GitHub repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `/` (project root)
3. Add these **Environment Variables** in Vercel dashboard:
   - `DB_HOST` → your MySQL cloud host
   - `DB_USER` → database username
   - `DB_PASSWORD` → database password
   - `DB_NAME` → database name
   - `JWT_SECRET` → any long random string
   - `PORT` → 5000

### Database → Railway / PlanetScale
Since Vercel doesn't support MySQL directly, use a cloud MySQL service:
- **Railway** → [railway.app](https://railway.app) (recommended — free tier available)
- **PlanetScale** → [planetscale.com](https://planetscale.com)

After creating your cloud database, run `database/migration_advanced.sql` to set up tables.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/Periyanayakam/voting-system.git
cd voting-system

# 2. Install backend dependencies
cd backend
npm install

# 3. Create .env file in backend/
cp .env.example .env
# Edit .env with your MySQL credentials

# 4. Run database migrations
mysql -u root -p < ../database/migration_advanced.sql

# 5. Start the backend server
npm start
# Server runs at http://localhost:5000
```

---

## 🔑 Default Credentials (local dev)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@voting.com | password123 |
| Voter | john@voting.com | password123 |

---

## ✨ Features

### Admin Dashboard
- 📊 Summary cards (Voters, Elections, Candidates, Votes)
- 🗳️ Create / Edit / Delete Elections
- 👤 Manage Candidates
- 👥 View Registered Voters
- 📈 Live Election Results with vote % bars
- 🏆 Auto winner display

### Voter Dashboard
- Browse active elections
- Cast secure ballot (one vote per election)
- View results after election ends

---

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Deployment | Vercel + Railway |
