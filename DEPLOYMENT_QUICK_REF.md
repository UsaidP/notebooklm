# 🚀 Privylm Production Deployment - Quick Reference

## External Services You Need

| Service | Purpose | Get From | Required Keys |
|---------|---------|----------|---------------|
| **Clerk** | Authentication | [clerk.com](https://clerk.com) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **Appwrite** | File Storage | [cloud.appwrite.io](https://cloud.appwrite.io) | `PROJECT_ID`, `BUCKET_ID`, `API_KEY` |
| **Groq** | LLM API | [console.groq.com](https://console.groq.com) | `GROQ_API_KEY` |
| **Embedding Server** | Vector Embeddings | Your existing server | `EMBED_API_URL` |

## Railway Services to Add

1. **PostgreSQL** - Primary database
2. **Redis/Valkey** - Job queues
3. **Qdrant** - Vector database
4. **Server** - Express API (root: `server`, Dockerfile: `Dockerfile.railway`)
5. **Client** - Next.js UI (root: `client`)

## Environment Variables Quick Copy

### Server (20 variables)
```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDISHOST=...
REDISPORT=6379

# Qdrant
QDRANT_URL=http://...
QDRANT_COLLECTION=docs
VECTOR_DIMENSION=1024

# LLM
GROQ_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile

# Embeddings
EMBED_API_URL=https://...
EMBED_MODEL=pplx-embed-v1

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
NEXT_PUBLIC_APPWRITE_BUCKET_ID=...
NEXT_APP_WRITE_API_KEY=...

# Client
CLIENT_URL=https://your-app.up.railway.app

# Node
NODE_ENV=production
```

### Client (10 variables)
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/notebooks
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/notebooks

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
NEXT_PUBLIC_APPWRITE_BUCKET_ID=...

# API
NEXT_PUBLIC_API_URL=https://your-server.up.railway.app
```

## Deployment Commands

### 1. Run Preparation Script
```bash
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

### 2. Run Database Migrations
```bash
railway login
railway link
cd server
DATABASE_URL=<railway-db-url> npx prisma migrate deploy
DATABASE_URL=<railway-db-url> npx prisma generate
```

### 3. Test Health Endpoint
```bash
curl https://your-server.up.railway.app/health
```

## Configuration Updates

### Clerk Dashboard
1. Go to **Deployment** settings
2. Add domain: `https://your-client.up.railway.app`
3. Save

### Appwrite Console
1. Go to **Project Settings** → **Auth**
2. Add domain to **Allowed Origins**: `https://your-client.up.railway.app`
3. Save

## File Structure for Deployment

```
privylm/
├── DEPLOYMENT.md              # Detailed guide
├── DEPLOYMENT_CHECKLIST.md    # Step-by-step checklist
├── DEPLOYMENT_QUICK_REF.md    # This file
├── railway.json               # Railway config
├── Dockerfile.railway         # Production Dockerfile
├── scripts/
│   └── deploy-railway.sh      # Automation script
├── server/
│   ├── .env.example           # Server env template
│   ├── index.js               # Added /health endpoint
│   └── railway.json           # Server Railway config
└── client/
    └── .env.example           # Client env template
```

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Server won't start | Check `DATABASE_URL` format, ensure SSL is enabled |
| PDFs stuck in queue | Verify `REDISHOST` and `REDISPORT` are correct |
| 401 Auth errors | Update Clerk domains with Railway URL |
| 500 Chat errors | Check `GROQ_API_KEY` and `EMBED_API_URL` |
| Prisma errors | Run `prisma generate` after deploy |

## Health Check Response

**Healthy:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-24T...",
  "services": {
    "api": "up",
    "database": "up",
    "qdrant": "up",
    "redis": "up"
  }
}
```

**Unhealthy:** One or more services show `"down"` - check logs and environment variables.

## Cost Breakdown

| Resource | Monthly Cost |
|----------|--------------|
| PostgreSQL | ~$5 |
| Redis | ~$3 |
| Qdrant | ~$5 |
| Server Compute | ~$5-10 |
| Client Compute | ~$3-5 |
| **Total** | **~$21-28** |

Railway includes $5 free credit monthly.

## Support Links

- [Railway Docs](https://docs.railway.app)
- [Clerk Docs](https://clerk.com/docs)
- [Prisma Docs](https://prisma.io/docs)
- [Qdrant Docs](https://qdrant.tech/documentation)
- [Groq Docs](https://console.groq.com/docs)

---

**Need Help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions or [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step tracking.
