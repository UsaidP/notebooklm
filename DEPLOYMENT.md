# 🚀 Production Deployment Guide - Railway

This guide walks you through deploying Privylm to production on Railway.com.

---

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] GitHub account and repository
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] Clerk account for authentication
- [ ] Appwrite account (cloud or self-hosted) for file storage
- [ ] Groq API key for LLM access
- [ ] Embedding service endpoint (self-hosted or external)
- [ ] All local development working correctly

---

## Step 1: Prepare Your GitHub Repository

### 1.1 Initialize Git (if not already done)

```bash
cd /Volumes/Secondry/Privylm
git status
```

### 1.2 Create a `.gitignore` for sensitive files

Ensure these files are **NOT** committed:

```bash
# Add to root .gitignore if not exists
cat >> .gitignore << EOF

# Environment files
.env
.env.local
.env.production

# Generated files
server/generated/
client/.next/
server/node_modules/
client/node_modules/

# Logs
*.log
npm-debug.log*
EOF
```

### 1.3 Push to GitHub

```bash
git add .
git commit -m "Initial production release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/privylm.git
git push -u origin main
```

---

## Step 2: Set Up External Services

### 2.1 Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and sign in
2. Create a new application
3. Configure settings:
   - **Session token expiry:** 60 days
   - **Allowed origins:** Add your Railway domain (will get this later)
4. Get your keys from **API Keys** section:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 2.2 Appwrite Storage

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) or self-host
2. Create a new project
3. Create a storage bucket:
   - Enable **File Security**
   - Set maximum file size (e.g., 50MB)
   - Allow PDF files only
4. Get your credentials:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_BUCKET_ID`
   - `NEXT_APP_WRITE_API_KEY` (create API key with write permissions)

### 2.3 Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Sign in
3. Create API key in **API Keys** section
4. Save the key: `GROQ_API_KEY`

### 2.4 Embedding Service

You have two options:

**Option A: Use the existing custom embedding server**
- Deploy your embedding server separately (e.g., Modal, RunPod, or self-hosted)
- Get the endpoint URL: `EMBED_API_URL`

**Option B: Use a managed embedding service**
- Sign up for a service like Cohere, OpenAI, or Voyage AI
- Update `server/src/services/embeddings.js` to use the new provider

---

## Step 3: Create Railway Project

### 3.1 Create New Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `privylm` repository
5. Select **"Deploy from monorepo"** (we have client + server)

---

## Step 4: Set Up Railway Services

You'll need **4 separate services** in your Railway project:

### 4.1 PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning
3. Click on the PostgreSQL service
4. Go to **"Variables"** tab
5. Copy the `DATABASE_URL` value

### 4.2 Qdrant Vector Database

1. Click **"New"** → **"Service"**
2. Search for **"Qdrant"** in the Railway marketplace
3. Deploy the Qdrant service
4. Go to **"Variables"** tab
5. Copy:
   - `QDRANT_URL` (usually `http://qdrant:6333` internally)
   - `QDRANT_API_KEY` (if enabled)

### 4.3 Redis (Valkey)

1. Click **"New"** → **"Database"** → **"Redis"** (or Valkey)
2. Wait for provisioning
3. Go to **"Variables"** tab
4. Copy:
   - `REDIS_URL` or note `REDISHOST` and `REDISPORT`

### 4.4 Deploy Server Service

1. Click **"New"** → **"Service"** → **"GitHub Repo"**
2. Select your `privylm` repository
3. Configure the service:
   - **Name:** `privylm-server`
   - **Root Directory:** `server`
   - **Dockerfile Path:** `Dockerfile.railway`
4. Click **"Deploy"**

### 4.5 Deploy Client Service

1. Click **"New"** → **"Service"** → **"GitHub Repo"**
2. Select your `privylm` repository again
3. Configure the service:
   - **Name:** `privylm-client`
   - **Root Directory:** `client`
   - **Start Command:** `npm run start`
4. Click **"Deploy"**

---

## Step 5: Configure Environment Variables

### 5.1 Server Environment Variables

Go to **privylm-server** → **"Variables"** tab → **"Edit Variables"**

Add these variables:

```bash
# Database
DATABASE_URL=<your Railway PostgreSQL URL>

# Redis
REDISHOST=<your Railway Redis host>
REDISPORT=6379

# Qdrant
QDRANT_URL=<your Railway Qdrant URL>
QDRANT_COLLECTION=docs
VECTOR_DIMENSION=1024

# LLM
GROQ_API_KEY=<your Groq API key>
LLM_MODEL=llama-3.3-70b-versatile

# Embeddings
EMBED_API_URL=<your embedding service URL>
EMBED_MODEL=pplx-embed-v1

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your project ID>
NEXT_PUBLIC_APPWRITE_BUCKET_ID=<your bucket ID>
NEXT_APP_WRITE_API_KEY=<your API key>

# Client URL (will get this after client deployment)
CLIENT_URL=https://your-app.up.railway.app

# Node environment
NODE_ENV=production
```

### 5.2 Client Environment Variables

Go to **privylm-client** → **"Variables"** → **"Edit Variables"**

Add these variables:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/notebooks
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/notebooks

# Appwrite (public keys are safe for frontend)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your project ID>
NEXT_PUBLIC_APPWRITE_BUCKET_ID=<your bucket ID>

# API URL (your Railway server URL)
NEXT_PUBLIC_API_URL=https://your-server.up.railway.app
```

---

## Step 6: Configure Railway Settings

### 6.1 Server Settings

1. Go to **privylm-server** → **"Settings"**
2. Set **Healthcheck Path:** `/health` (you may need to add this endpoint)
3. Set **Restart Policy:** `On Failure`
4. Enable **Public Networking**
5. Copy the generated domain (e.g., `privylm-server.up.railway.app`)

### 6.2 Client Settings

1. Go to **privylm-client** → **"Settings"**
2. Set **Healthcheck Path:** `/`
3. Enable **Public Networking**
4. Copy the generated domain (e.g., `privylm-client.up.railway.app`)

### 6.3 Update Environment Variables

Go back to **privylm-server** variables and update:
```bash
CLIENT_URL=https://privylm-client.up.railway.app
```

Go back to **privylm-client** variables and add:
```bash
NEXT_PUBLIC_API_URL=https://privylm-server.up.railway.app
```

---

## Step 7: Database Migration

### 7.1 Run Prisma Migrations

You need to run migrations on the Railway PostgreSQL:

**Option A: Run locally with Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
cd server
DATABASE_URL=<Railway PostgreSQL URL> npx prisma migrate deploy
DATABASE_URL=<Railway PostgreSQL URL> npx prisma generate
```

**Option B: Add migration script to package.json**

In `server/package.json`, add:
```json
"scripts": {
  "migrate": "prisma migrate deploy",
  "generate": "prisma generate"
}
```

Then in Railway server settings, add to **Deploy** → **Pre-Deploy Command**:
```bash
npm run migrate && npm run generate
```

---

## Step 8: Configure Clerk for Production

1. Go to **Clerk Dashboard** → **Your Application**
2. Go to **"Deployment"** settings
3. Add your production domains:
   - `https://privylm-client.up.railway.app`
   - `https://privylm-server.up.railway.app` (if using Clerk on backend)
4. Update **CORS origins** if needed

---

## Step 9: Configure Appwrite for Production

1. Go to **Appwrite Console** → **Your Project**
2. Go to **Settings** → **Auth**
3. Add your Railway domains to **Allowed Origins**:
   - `https://privylm-client.up.railway.app`
4. Update bucket permissions if needed

---

## Step 10: Test Deployment

### 10.1 Health Checks

```bash
# Test server health
curl https://privylm-server.up.railway.app/health

# Test client
curl https://privylm-client.up.railway.app
```

### 10.2 Test Authentication

1. Visit your client URL
2. Sign up with a test account
3. Verify redirect to `/notebooks`

### 10.3 Test PDF Upload

1. Create a notebook
2. Upload a small PDF
3. Check if it processes successfully (check Railway logs)

### 10.4 Test Chat

1. After PDF is indexed, try chatting
2. Verify RAG responses include document context

---

## Step 11: Monitor & Debug

### Railway Logs

1. Go to each service → **"Deployments"** tab
2. Click on the latest deployment
3. View **Logs** in real-time

### Common Issues & Fixes

**Issue: Server won't start**
```
Check logs for:
- Missing environment variables
- Database connection errors
- Prisma generation errors
```

**Issue: PDFs not processing**
```
Check:
- Redis connection (REDISHOST/REDISPORT)
- Worker logs in server service
- Qdrant connection
```

**Issue: Authentication fails**
```
Check:
- Clerk keys are correct
- Domains are added in Clerk dashboard
- CORS settings on server
```

**Issue: 500 errors on chat**
```
Check:
- GROQ_API_KEY is valid
- EMBED_API_URL is accessible
- Qdrant collection exists
```

---

## Step 12: Custom Domain (Optional)

### 12.1 Add Custom Domain to Railway

1. Go to **privylm-client** → **"Settings"**
2. Scroll to **"Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Update DNS records as instructed

### 12.2 Update Environment Variables

Update Clerk, Appwrite, and CORS settings with your custom domain.

---

## Step 13: Set Up Monitoring

### Railway Monitoring

- **Metrics:** View CPU, memory, and network usage in Railway dashboard
- **Alerts:** Set up Railway alerts for deployment failures
- **Usage:** Monitor your Railway credit usage

### Application Monitoring

Consider adding:
- **Sentry** for error tracking
- **Logtail** or **Papertrail** for log aggregation
- **Uptime Robot** for external monitoring

---

## 🎉 Post-Deployment Checklist

- [ ] Authentication working
- [ ] PDF upload successful
- [ ] Background processing working (check worker logs)
- [ ] Vector search returning results
- [ ] Chat responses accurate
- [ ] Error handling graceful
- [ ] Logs clean (no repeated errors)
- [ ] Database migrations applied
- [ ] Backups configured (Railway auto-backs up PostgreSQL)

---

## 🔧 Maintenance

### Updating the Application

```bash
# Make changes locally
git add .
git commit -m "Fix: description"
git push origin main

# Railway will auto-deploy
# Monitor deployment in Railway dashboard
```

### Database Backups

Railway PostgreSQL includes automatic backups. To restore:
1. Go to PostgreSQL service → **"Backups"**
2. Select a backup point
3. Click **"Restore"**

### Scaling

If you need more resources:
1. Go to service → **"Settings"**
2. Increase **CPU** or **Memory**
3. Railway will redeploy with new resources

---

## 📞 Support Resources

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Clerk Docs:** [clerk.com/docs](https://clerk.com/docs)
- **Prisma Docs:** [prisma.io/docs](https://prisma.io/docs)
- **Qdrant Docs:** [qdrant.tech/documentation](https://qdrant.tech/documentation)

---

**Estimated Deployment Time:** 30-45 minutes
**Railway Cost:** ~$5-20/month depending on usage (PostgreSQL + Redis + compute)

Good luck with your deployment! 🚀
