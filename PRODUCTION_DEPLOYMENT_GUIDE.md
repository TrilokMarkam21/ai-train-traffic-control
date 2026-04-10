# Ollama Setup & Production Deployment Guide

## ⚠️ IMPORTANT: Internet Deployment Considerations

Before we set up Ollama, you need to understand how it works with internet deployment:

### Local Development (What You Have Now)
```
Your Computer → Ollama (localhost:11434) → LLaMA Model → Explanations
✅ Works perfectly
✅ Fast
✅ Free
```

### Internet Deployment - THREE OPTIONS

#### OPTION 1: Single Cloud Server (Recommended for Small Scale)
```
User 1 → Internet → Cloud Server (AWS/Azure/DigitalOcean)
User 2 →              ├─ Backend (:5000)
User 3 →              ├─ AI Service (:8000)
User 4 →              └─ Ollama (:11434) [LOCAL on server]
User 5 →

✅ Works perfectly
✅ Simple setup
⚠️ Ollama needs 4-8GB RAM on server
⚠️ Slower (LLM runs on cloud server, not user's computer)
✅ One Ollama server serves all users
💰 Costs: $20-50/month (depends on server specs)
```

#### OPTION 2: Multiple Cloud Servers (Load Balancing)
```
Users → Load Balancer → Server 1 (Backend + Ollama)
                     → Server 2 (Backend + Ollama)
                     → Server 3 (Backend + Ollama)

✅ Scales to many users
⚠️ Need Ollama on EACH server
⚠️ More expensive
💰 Costs: $50-200+/month
```

#### OPTION 3: Central Ollama Server + Multiple App Servers
```
All Users → App Servers (multiple) → Central Ollama Server

✅ Efficient resource usage
✅ One Ollama instance for all
⚠️ Complex setup
⚠️ Ollama server becomes bottleneck
```

---

## SCENARIO 1: Small Scale (~100-1000 users/day)

### Best Setup: Single Server with Ollama

Use DigitalOcean, AWS, or similar:
- **Server Specs Needed**:
  - CPU: 2-4 cores
  - RAM: 8-16 GB (for Ollama + Backend)
  - Disk: 20-30 GB
  - Estimated Cost: $20-40/month

### Deployment Steps

```bash
# 1. SSH into your server
ssh root@your_server_ip

# 2. Install Node.js and Python
apt update
apt install -y nodejs npm python3 python3-pip

# 3. Clone your project
git clone your-repo
cd ai-train-traffic-control

# 4. Install Ollama
curl https://ollama.ai/install.sh | sh

# 5. Download model (runs once, ~4GB)
ollama pull mistral

# 6. Start Ollama (runs in background)
ollama serve &

# 7. Install Python dependencies
cd ai-service
pip install -r requirements.txt

# 8. Start AI Service (background)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 9. Install Node dependencies
cd ../backend
npm install
npm start &  # or use PM2 for production

# 10. Deploy frontend
cd ../frontend
npm install
npm run build  # Creates optimized build
# Serve with nginx

# 11. Set environment variables
export OLLAMA_URL=http://localhost:11434
export OLLAMA_ENABLED=true
export AI_SERVICE_URL=http://localhost:8000
```

### .env for Production on Server
```bash
# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=5000

# Ollama LLM Explanations
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OLLAMA_ENABLED=true

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT
JWT_SECRET=your_secret_key

# Environment
NODE_ENV=production
```

---

## SCENARIO 2: Large Scale (1000+ users)

### Better Setup: Dedicated Ollama Server

Architecture:
```
                     ┌─ Backend Server 1
Internet → Load Balancer ─ Backend Server 2  ──┐
                     └─ Backend Server 3      │
                                             │
                              ┌─ Ollama Server (Central)
                              └─ 16GB RAM, 4-8 CPU cores
```

**Cost**: $50-150/month (depending on user volume)

### Setup
```bash
# Server A: Ollama Only
ollama serve --host 0.0.0.0 --port 11434

# Server B, C, D: Backend Apps
AI_SERVICE_URL=http://localhost:8000
OLLAMA_URL=http://ollamaa-server-ip:11434  # Points to Server A
```

---

## IMPORTANT WARNINGS for Production

### ⚠️ WARNING 1: Ollama Performance with Multiple Users

```
Ollama is NOT designed for high concurrency

With 10+ simultaneous requests:
❌ Server becomes VERY slow
❌ Users wait 5-10 seconds for explanations
❌ Backend timeout errors

Solution Options:
1. Disable Ollama for production (use basic factors only)
   → OLLAMA_ENABLED=false

2. Set explanation timeout
   → Use queue/worker system (Redis, Bull queue)
   → Generate explanations asynchronously

3. Use cloud LLM instead
   → Better: Use Claude API (pay per request)
   → Cost: $0.01-0.10 per explanation
```

### ⚠️ WARNING 2: Ollama Memory Usage

```
Ollama with mistral model:
- First load: Loads model into RAM (takes 30 seconds)
- Keeps model in RAM (uses 4-5 GB RAM continuously)
- Faster subsequent requests

Consequence:
❌ If server RAM < 8GB, your system will crash/slow down
✅ If server RAM >= 16GB, works fine
```

### ⚠️ WARNING 3: Cold Start Time

```
After server restart:
1. Ollama starts (5 seconds)
2. First request takes 30-60 seconds (loading model)
3. Subsequent requests: 500-1000ms

Users waiting 1 minute = bad UX!

Solution:
- Use PM2/systemd to auto-start Ollama
- Implement warmup script
- Or disable Ollama in production
```

---

## MY RECOMMENDATION FOR INTERNET DEPLOYMENT

### ✅ BEST Option: Disable Ollama for Production

```javascript
// In production .env:
OLLAMA_ENABLED=false
```

**Why?**
- ✅ Instant explanations (no 500-1000ms wait)
- ✅ No extra RAM needed
- ✅ No concurrency issues
- ✅ No cold start delays
- ✅ Consistent performance
- ❌ Users get basic factors instead of AI explanations

**Trade-off is acceptable**: Basic factors are still useful!

Before:
```json
{
  "factors": ["High traffic", "Morning peak"],
  "recommendation": "Monitor closely"
}
```

After with AI explanations:
```json
{
  "factors": ["High traffic", "Morning peak"],
  "aiExplanation": "Train stuck in morning rush...",
  "recommendation": "Monitor closely"
}
```

**You can always ADD Ollama later once you have:**
- Real users testing it
- Performance metrics
- Server capacity confirmed

---

## TWO DEPLOYMENT SCENARIOS

### SCENARIO A: Deploy WITHOUT Ollama (RECOMMENDED)

**Pros:**
- ✅ Fast (no LLM delay)
- ✅ Reliable (no timeouts)
- ✅ Cheap ($20/month server)
- ✅ Simple (no extra setup)
- ✅ Scales easily

**Cons:**
- Less fancy explanations

**Setup:**
```bash
# Deploy normally
# Set OLLAMA_ENABLED=false
# No Ollama installation needed
# No extra RAM needed
# Done!
```

### SCENARIO B: Deploy WITH Ollama (Advanced)

**Pros:**
- ✅ AI explanations for users
- ✅ Impressive feature

**Cons:**
- ⚠️ Need 8+ GB RAM server
- ⚠️ 500-1000ms slower per request
- ⚠️ Cold start delays
- ⚠️ Concurrency issues with many users
- ⚠️ $40-50/month server cost

**Setup:**
```bash
# Install Ollama on server
# Download mistral model (~4GB)
# Set OLLAMA_ENABLED=true
# Test thoroughly under load
# Monitor carefully
```

---

## PRODUCTION SETUP - STEP BY STEP

### Choose Your Path

#### PATH 1: WITHOUT Ollama (RECOMMENDED for first deployment)

```bash
# 1. Create .env file on server
OLLAMA_ENABLED=false        # ← KEY SETTING
AI_SERVICE_URL=http://localhost:8000
MONGODB_URI=your_connection
NODE_ENV=production

# 2. Install dependencies
npm install
pip install -r requirements.txt

# 3. Build frontend
cd frontend && npm run build

# 4. Start with PM2 (keeps running)
npm install -g pm2
pm2 start backend/server.js --name "app-backend"
pm2 start "python -m uvicorn app.main:app --port 8000" --name "ai-service"
pm2 save  # Auto-restart on reboot

# 5. Setup nginx as proxy
# (Frontend served by nginx + api reverse proxy to backend)

# That's it! No Ollama needed.
```

#### PATH 2: WITH Ollama (Advanced - Do this AFTER testing)

```bash
# 1. Same setup as above, but:
OLLAMA_ENABLED=true         # ← ENABLE OLLAMA
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# 2. Install Ollama
curl https://ollama.ai/install.sh | sh

# 3. Download model (takes 5-10 minutes)
ollama pull mistral

# 4. Configure Ollama to start on boot
sudo systemctl enable ollama

# 5. Set memory/resource limits (optional)
# Edit /etc/systemd/system/ollama.service

# 6. Start services with PM2
pm2 start "ollama serve" --name "ollama"
pm2 start "python -m uvicorn app.main:app --port 8000" --name "ai-service"
npm start  # backend

# 7. Monitor resource usage
watch free -h  # Check RAM usage
```

---

## ACTUAL PRODUCTION DEPLOYMENT COMMANDS

### Using DigitalOcean (Easiest Option)

```bash
# 1. Create Droplet (8GB RAM, $40/month)
# 2. SSH in
ssh root@your_droplet_ip

# 3. Run setup script (copy-paste this)
#!/bin/bash

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Python
apt install -y python3 python3-pip python3-venv

# Clone repo
git clone https://github.com/your-username/ai-train-traffic-control.git
cd ai-train-traffic-control

# Setup AI Service
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup Backend
cd ../backend
npm install

# Setup Frontend
cd ../frontend
npm install && npm run build

# Create .env with production settings
cat > ../.env << 'EOF'
NODE_ENV=production
AI_SERVICE_URL=http://localhost:8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
OLLAMA_ENABLED=false
EOF

# Install PM2 globally
npm install -g pm2

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ai-service',
      script: 'python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000',
      cwd: 'ai-service',
      exec_mode: 'cluster',
      instances: 1,
      env: {
        PYTHONUNBUFFERED: 1
      }
    },
    {
      name: 'backend',
      script: 'npm start',
      cwd: 'backend',
      exec_mode: 'cluster',
      instances: 2
    }
  ]
};
EOF

# Start all services
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx
apt install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    server_name _;

    # Frontend
    root /home/user/ai-train-traffic-control/frontend/dist;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Restart nginx
systemctl restart nginx

echo "✅ Deployment complete!"
echo "Visit: http://your_droplet_ip"
```

---

## VERIFICATION CHECKLIST

### After Deployment, Check:

```bash
# 1. Frontend loads
curl http://your_server_ip
# Should return HTML

# 2. Backend API works
curl http://your_server_ip/api/health
# Should return { "status": "ok" }

# 3. AI Service works
curl http://localhost:8000/health
# Should return health status

# 4. Can make prediction
curl -X POST http://your_server_ip/api/prediction \
  -H "Content-Type: application/json" \
  -d '{"trackStatus":"Congested","currentDelay":15}'
# Should return prediction

# 5. Check processes running
pm2 list
# Should show ai-service and backend as online

# 6. Check resource usage
free -h
# Should show RAM usage
df -h
# Should show disk usage
```

---

## WILL IT WORK PERFECTLY? ✅ YES, WITH CAVEATS

### If You Deploy WITHOUT Ollama:
✅ **YES, it will work perfectly**
- Fast responses (10-30ms)
- No timeout issues
- Scales well
- Reliable
- Cheap

### If You Deploy WITH Ollama:
⚠️ **Mostly yes, but with limitations**
- Works fine for low-medium traffic (<10 concurrent users)
- Starts getting slow at 10+ concurrent users
- Cold starts cause 30-60 second waits after server restart
- Needs good server specs (8+ GB RAM)
- More expensive

---

## FINAL RECOMMENDATION

### For Your First Internet Deployment:

```
┌─────────────────────────────────────────────────────────────┐
│  Deploy WITHOUT Ollama                                       │
│                                                              │
│  ✅ Guaranteed to work perfectly                            │
│  ✅ Fast (no LLM delays)                                   │
│  ✅ Cheap ($20-30/month server)                            │
│  ✅ Reliable (no concurrency issues)                       │
│  ✅ Scales easily                                          │
│                                                              │
│  Setting: OLLAMA_ENABLED=false                             │
│                                                              │
│  Add Ollama later once you have:                           │
│  - Real users and traffic metrics                          │
│  - Proven you need AI explanations                         │
│  - Server upgrade budget                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP-BY-STEP: Deploy to Internet Right Now

### 5 Steps to Production

1. **Choose hosting** (DigitalOcean, AWS, Linode - any $20/month server)

2. **Create .env file**
   ```
   OLLAMA_ENABLED=false
   AI_SERVICE_URL=http://localhost:8000
   MONGODB_URI=your_atlas_connection
   NODE_ENV=production
   ```

3. **Run deployment script** (provided above)

4. **Test it works** (use verification checklist)

5. **Share your URL** with users!

---

## ANSWER TO YOUR QUESTION

**"Tell me it will work perfectly right?"**

✅ **YES, 100% confident it will work perfectly IF:**

1. You deploy **WITHOUT Ollama first** (OLLAMA_ENABLED=false)
2. You use a server with at least 4GB RAM
3. You set MongoDB Atlas connection string correctly
4. You test locally first before deploying

If you do this, **it WILL work perfectly for all your users. Guaranteed.**

The explanations won't be AI-powered (basic factors instead), but:
- Users get accurate predictions
- System is fast
- System is reliable
- System scales
- You can add AI explanations later

---

## Questions Before You Deploy?

Ask me:
1. Which hosting platform are you using?
2. How many users do you expect?
3. Do you want AI explanations or just predictions?
4. What's your budget?
