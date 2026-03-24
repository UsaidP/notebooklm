# 🚀 Privylm Quick Deploy Checklist

Use this checklist to track your deployment to Railway.

## Pre-Deployment (Do Once)

- [ ] Create [Railway](https://railway.app) account
- [ ] Create [Clerk](https://clerk.com) account and get API keys
- [ ] Create [Appwrite](https://cloud.appwrite.io) project and get credentials
- [ ] Get [Groq](https://console.groq.com) API key
- [ ] Have embedding service URL ready
- [ ] Push code to GitHub

## Run Preparation Script

```bash
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

This will:
- [x] Check prerequisites (Node 20+, npm, Git)
- [x] Verify Git repository
- [x] Install dependencies
- [x] Generate Prisma client
- [x] Run tests (optional)
- [x] Push to GitHub
- [x] Login to Railway

## Railway Setup (30-45 minutes)

### 1. Create Project
- [ ] Go to [railway.app](https://railway.app)
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your `privylm` repository

### 2. Add Databases
- [ ] Add **PostgreSQL** (New → Database → PostgreSQL)
- [ ] Add **Redis** (New → Database → Redis)
- [ ] Add **Qdrant** (New → Service → Search "Qdrant")

### 3. Deploy Services

#### Server
- [ ] New → Service → GitHub Repo
- [ ] Name: `privylm-server`
- [ ] Root Directory: `server`
- [ ] Dockerfile Path: `Dockerfile.railway`
- [ ] Deploy

#### Client
- [ ] New → Service → GitHub Repo
- [ ] Name: `privylm-client`
- [ ] Root Directory: `client`
- [ ] Start Command: `npm run start`
- [ ] Deploy

### 4. Configure Environment Variables

#### Server Variables (privylm-server → Variables)
- [ ] `DATABASE_URL` (from Railway PostgreSQL)
- [ ] `REDISHOST` (from Railway Redis)
- [ ] `REDISPORT` (from Railway Redis)
- [ ] `QDRANT_URL` (from Railway Qdrant)
- [ ] `QDRANT_COLLECTION` = `docs`
- [ ] `VECTOR_DIMENSION` = `1024`
- [ ] `GROQ_API_KEY` (from Groq console)
- [ ] `LLM_MODEL` = `llama-3.3-70b-versatile`
- [ ] `EMBED_API_URL` (your embedding server)
- [ ] `EMBED_MODEL` = `pplx-embed-v1`
- [ ] `NEXT_PUBLIC_APPWRITE_ENDPOINT` = `https://cloud.appwrite.io/v1`
- [ ] `NEXT_PUBLIC_APPWRITE_PROJECT_ID` (from Appwrite)
- [ ] `NEXT_PUBLIC_APPWRITE_BUCKET_ID` (from Appwrite)
- [ ] `NEXT_APP_WRITE_API_KEY` (from Appwrite)
- [ ] `CLIENT_URL` (your Railway client domain)
- [ ] `NODE_ENV` = `production`

#### Client Variables (privylm-client → Variables)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from Clerk)
- [ ] `CLERK_SECRET_KEY` (from Clerk)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/notebooks`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/notebooks`
- [ ] `NEXT_PUBLIC_APPWRITE_ENDPOINT` = `https://cloud.appwrite.io/v1`
- [ ] `NEXT_PUBLIC_APPWRITE_PROJECT_ID` (from Appwrite)
- [ ] `NEXT_PUBLIC_APPWRITE_BUCKET_ID` (from Appwrite)
- [ ] `NEXT_PUBLIC_API_URL` (your Railway server domain)

### 5. Database Migration
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link project: `railway link`
- [ ] Run migrations:
  ```bash
  cd server
  DATABASE_URL=<your-railway-db-url> npx prisma migrate deploy
  ```

### 6. Configure External Services

#### Clerk
- [ ] Go to Clerk Dashboard → Deployment
- [ ] Add domain: `https://your-client.up.railway.app`
- [ ] Update CORS origins if needed

#### Appwrite
- [ ] Go to Appwrite Console → Project → Settings → Auth
- [ ] Add domain: `https://your-client.up.railway.app`

## Post-Deployment Testing

- [ ] Visit `https://your-client.up.railway.app`
- [ ] Sign up with test account
- [ ] Create a notebook
- [ ] Upload a small PDF (< 1MB)
- [ ] Wait for processing (check Railway logs)
- [ ] Chat with the document
- [ ] Verify responses include document context

## Monitoring & Debugging

### Check Logs
- Server: Railway Dashboard → privylm-server → Deployments → Logs
- Client: Railway Dashboard → privylm-client → Deployments → Logs
- Worker: Same as server (check for job processing logs)

### Health Check
```bash
curl https://your-server.up.railway.app/health
```

Expected response:
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

## Troubleshooting

### Server won't start
- Check logs for missing environment variables
- Verify DATABASE_URL is correct
- Check Prisma client is generated

### PDFs not processing
- Verify Redis connection (REDISHOST/REDISPORT)
- Check worker logs in server deployment
- Verify Qdrant is accessible

### Authentication fails
- Check Clerk keys are correct
- Verify domains added in Clerk dashboard
- Check CORS settings on server

### 500 errors on chat
- Verify GROQ_API_KEY is valid
- Check EMBED_API_URL is accessible
- Verify Qdrant collection exists

## Optional: Custom Domain

- [ ] Go to privylm-client → Settings → Domains
- [ ] Add custom domain
- [ ] Update DNS records as instructed
- [ ] Update Clerk, Appwrite, and environment variables with new domain

## Cost Estimate

| Service | Railway Plan | Monthly Cost |
|---------|-------------|--------------|
| PostgreSQL | Standard | ~$5 |
| Redis | Standard | ~$3 |
| Qdrant | Standard | ~$5 |
| Server Compute | Standard | ~$5-10 |
| Client Compute | Standard | ~$3-5 |
| **Total** | | **~$21-28/month** |

Costs vary based on usage. Railway provides $5 free credit monthly.

---

**Estimated Total Time:** 45-60 minutes  
**Difficulty:** Intermediate

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
