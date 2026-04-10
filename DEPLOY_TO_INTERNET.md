# DEPLOY TO INTERNET - Simple Step-by-Step (NO Ollama)

## ✅ Your System is Ready!

You have:
- ✅ XGBoost model trained
- ✅ LSTM model trained
- ✅ Backend configured
- ✅ OLLAMA_ENABLED=false (already set)

**Ready to deploy!**

---

## STEP 1: Choose Hosting Platform

Pick **ONE** (all support Node.js + Python):

| Provider | Cost | Setup | Recommended |
|----------|------|-------|------------|
| **DigitalOcean** | $5-20/mo | 20 min | ✅ **BEST** |
| AWS Lightsail | $5-20/mo | 25 min | ✅ Good |
| Linode | $5-20/mo | 25 min | ✅ Good |
| Heroku | $50+/mo | 10 min | ⚠️ Expensive |

**I recommend: DigitalOcean** (easiest + cheapest)

---

## STEP 2: Create Server (DigitalOcean Example)

1. Go to https://digitalocean.com
2. Click **Create** → **Droplet**
3. Choose:
   - **Region**: Nearest to you
   - **OS**: Ubuntu 22.04
   - **Size**: $6/month (2GB RAM, 1 vCPU)
   - **Authentication**: SSH Key (easier than password)
4. Click **Create Droplet**
5. Wait 30 seconds for server to start
6. Copy the IP address (e.g., `165.232.123.456`)

---

## STEP 3: Deploy Your Code

Open Terminal and run these commands (copy-paste):

```bash
# 1. SSH into your server (replace with your IP)
ssh root@your_server_ip

# Example: ssh root@165.232.123.456
# Answer "yes" if asked about fingerprint

# 2. Update system
apt update && apt upgrade -y

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 4. Install Python
apt install -y python3 python3-pip python3-venv git

# 5. Clone your project
git clone your_github_repo_url
cd ai-train-traffic-control

# 6. Setup AI Service
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 7. Setup Backend
cd ../backend
npm install

# 8. Setup Frontend
cd ../frontend
npm install && npm run build

# 9. Create .env file (IMPORTANT!)
cd ..
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# MongoDB (your connection string)
MONGO_URI=mongodb+srv://Trilok123:123@cluster0.x8or3ck.mongodb.net/test-train-project
JWT_SECRET=your_secret_key_change_this

# AI Microservice
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=5000

# Frontend for CORS
FRONTEND_URL=https://your-domain.com

# AI Explanations (DISABLED for production - no Ollama)
OLLAMA_ENABLED=false

# Logging
LOG_LEVEL=info
EOF

# 10. Install PM2 (keeps services running)
npm install -g pm2

# 11. Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ai-service',
      script: 'python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000',
      cwd: 'ai-service',
      env: {
        PYTHONUNBUFFERED: 1
      }
    },
    {
      name: 'backend',
      script: 'npm start',
      cwd: 'backend',
      instances: 2,
      exec_mode: 'cluster'
    }
  ]
};
EOF

# 12. Start all services
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-restart on server restart

# 13. Install Nginx (web server)
apt install -y nginx

# 14. Configure Nginx
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    server_name _;

    # Serve frontend
    root /root/ai-train-traffic-control/frontend/dist;
    index index.html;

    # API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 15. Test and restart Nginx
nginx -t  # Should say "configuration successful"
systemctl restart nginx

# 16. Check services are running
pm2 list  # Should show ai-service and backend as online
systemctl status nginx  # Should show active

echo "✅ Deployment complete!"
```

---

## STEP 4: Test It Works

```bash
# Check each service

# 1. Check backend
curl http://localhost:5000/api/health
# Should return: { "status": "ok" }

# 2. Check AI Service
curl http://localhost:8000/health
# Should return: { "status": "ok" }

# 3. Check frontend (from your browser or computer)
# Visit: http://your_server_ip
# Should see your app working!

# 4. Make a test prediction
curl -X POST http://your_server_ip/api/prediction \
  -H "Content-Type: application/json" \
  -d '{"trainNumber":"42","trackStatus":"Congested","currentDelay":15,"priority":1}'

# Should return prediction with delay + factors
```

---

## STEP 5 (Optional): Set Up Domain

If you want a nice domain instead of IP:

1. Buy domain (GoDaddy, Namecheap, etc.)
2. Set DNS to point to your server IP
3. Install free SSL (HTTPS):
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

---

## STEP 6: Monitor Your System

```bash
# SSH into server
ssh root@your_server_ip

# Check if services running
pm2 list

# View logs
pm2 logs ai-service      # AI service logs
pm2 logs backend         # Backend logs
pm2 monit                # Real-time monitoring

# Check resource usage
free -h                  # RAM usage
df -h                    # Disk usage
top                      # CPU usage (press q to exit)
```

---

## What Your Users Will See

When users visit your app and make a prediction:

```json
{
  "success": true,
  "data": {
    "predictedDelay": 19.3,
    "conflictRisk": "MEDIUM",
    "confidence": 0.92,
    "factors": [
      "High traffic density on section",
      "Train already delayed by 15 min",
      "Yellow signal — reduced speed"
    ],
    "recommendation": "Monitor Train #42 closely. Prepare contingency plan.",
    "source": "ai_model"
  }
}
```

**No Ollama, no delays, just fast predictions!** ✅

---

## Troubleshooting

### "Connection refused" error
```bash
# Check if services are running
pm2 list

# If not running, restart
pm2 start ecosystem.config.js

# Check logs
pm2 logs
```

### "Cannot find module" error
```bash
# AI Service dependencies missing
cd ai-service
pip install -r requirements.txt

# Backend dependencies missing
cd backend
npm install
```

### "Port already in use"
```bash
# Check what's using port 5000
lsof -i :5000

# Kill process if needed
kill -9 <PID>

# Restart services
pm2 restart all
```

### "MongoDB connection failed"
```bash
# Check MongoDB connection string in .env
# Make sure MONGO_URI is correct and IP whitelist allows server IP
# Test from server:
python3 -c "import pymongo; pymongo.MongoClient('your_connection_string')"
```

---

## Maintenance

### Weekly
- Check logs for errors: `pm2 logs`
- Monitor resource usage: `free -h`

### Monthly
- Update dependencies: `npm update`, `pip install --upgrade -r requirements.txt`
- Check Nginx: `systemctl status nginx`

### When Users Report Issues
```bash
# SSH in and check logs
ssh root@your_server_ip
pm2 logs backend -n 50      # Last 50 lines
pm2 logs ai-service -n 50
```

---

## Cost Breakdown

| Item | Cost/Month | Notes |
|------|-----------|-------|
| DigitalOcean Server | $6 | 2GB RAM, 1 vCPU |
| MongoDB Atlas | $0 | Free tier (5GB) |
| Domain | $10 | Optional |
| SSL Certificate | $0 | Free (Certbot) |
| **TOTAL** | **~$6/month** | ✅ Very cheap! |

---

## Security Tips

1. **Change MongoDB password** (don't use default!)
2. **Change JWT secret** in .env
3. **Keep server updated**: `apt update && apt upgrade -y`
4. **Use HTTPS** (SSL certificate - free via Certbot)
5. **Monitor logs** for suspicious activity

---

## QUICK REFERENCE

```bash
# Common commands on server

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Remove all processes
pm2 delete all

# Check status
pm2 list
pm2 status

# Tail logs in real-time
pm2 logs --lines 100 --follow
```

---

## YOU'RE READY! 🚀

**Summary:**
1. ✅ Models trained (XGBoost + LSTM)
2. ✅ Backend configured (OLLAMA_ENABLED=false)
3. ✅ Follow deployment steps above
4. ✅ Test with curl commands
5. ✅ Share URL with users
6. ✅ Monitor logs

**Time to deploy: 30-45 minutes**

**What users get: Fast, accurate predictions with zero delays!**

---

## Need Help?

If something fails:
1. Read error message carefully
2. Check logs: `pm2 logs`
3. Make sure all services running: `pm2 list`
4. Check MongoDB connection string in .env
5. Restart everything: `pm2 restart all`

**Your system WILL work when deployed correctly.**
