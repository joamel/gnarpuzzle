# GNARP Puzzle Game - Deployment Guide

## Miljövariabel Setup

### Client (.env)
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Client (.env.production)
```
VITE_API_URL=https://gnarp-backend.onrender.com
VITE_SOCKET_URL=https://gnarp-backend.onrender.com
```

### Server (.env)
```
PORT=3001
CLIENT_URL=http://localhost:5173
```

## Render Deployment

1. **Ladda upp till GitHub:**
   ```bash
   git add .
   git commit -m "Deploy ready"
   git push
   ```

2. **Skapa Render services:**
   - Gå till Render Dashboard
   - Välj "New Blueprint"
   - Connecta GitHub repo
   - Render läser automatiskt `render.yaml`

3. **Uppdatera URLs:**
   Efter deployment, uppdatera:
   - `client/.env.production` - byt till rätt backend URL
   - `server` miljövariable CLIENT_URL - byt till rätt frontend URL

## URL Structure
- Frontend: `https://gnarp-frontend.onrender.com`  
- Backend: `https://gnarp-backend.onrender.com`

## Local Development
```bash
# Start backend
cd server && npm run dev

# Start frontend (ny terminal)
cd client && npm run dev
```