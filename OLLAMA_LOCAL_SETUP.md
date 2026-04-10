# Quick Ollama Setup - For Local Development Only

## What is Ollama?
Ollama lets you run LLaMA/Mistral AI models on your computer for **FREE**. No cost, no signup, no API keys.

---

## 5-MINUTE LOCAL SETUP

### Step 1: Download Ollama
1. Go to https://ollama.ai
2. Click **Download**
3. Select **Windows**
4. Run the installer

### Step 2: Install
- Click through installer (default settings OK)
- It will install Ollama and start automatically

### Step 3: Download Model
Open **Command Prompt** or **PowerShell** and run:

```bash
ollama pull mistral
```

Wait for it to download (~4 GB, takes 5-10 minutes)

You'll see:
```
pulling manifest
pulling abc123...
✓ Downloaded complete
```

### Step 4: Test Ollama is Running

Open Command Prompt:

```bash
curl http://localhost:11434/api/generate -d "{\"model\":\"mistral\",\"prompt\":\"Hello\",\"stream\":false}"
```

You should get a JSON response with AI text. If yes: ✅ Ollama is working!

### Step 5: Enable in Your App

In `backend/.env`, add:

```bash
OLLAMA_ENABLED=true
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

### Step 6: Start Everything

```bash
# Terminal 1: AI Service
cd ai-service
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Backend
cd backend
npm start

# Terminal 3: Frontend
cd frontend
npm run dev
```

**That's it!** Your system now has AI explanations!

---

## How to Use

When you make a prediction, you'll now see:

```json
{
  "predictedDelay": 19.5,
  "factors": ["High traffic", "Morning peak"],
  "aiExplanation": "Train #42 is heavily delayed due to morning rush hour congestion...",
  "recommendation": "Consider holding freight train #88"
}
```

---

## Ollama Control Commands

```bash
# See what models you have
ollama list

# Download another model (smaller, faster)
ollama pull llama2
ollama pull neural-chat

# Stop Ollama (if needed)
taskkill /IM ollama.exe /F

# Start Ollama again
ollama serve
```

---

## Troubleshooting

### "Connection refused" error
**Ollama is not running**
- Solution: Run `ollama serve` in Command Prompt
- Or restart Ollama from System Tray

### "Model not found" error
**Model didn't download**
- Solution: Run `ollama pull mistral` again

### Predictions very slow (20+ seconds)
**Normal!** First time takes 30-60 seconds to load model into RAM. Next requests are faster (500-1000ms).

### Want to disable AI explanations?
```bash
# In backend/.env
OLLAMA_ENABLED=false
```

This makes predictions instant (no 500-1000ms LLM delay).

---

## That's All For Local Development!

For **PRODUCTION DEPLOYMENT**, read:
👉 **`PRODUCTION_DEPLOYMENT_GUIDE.md`**

Key point: **Don't use Ollama in production** (unless you follow the advanced guide).

---

## Summary

**Local Development (Right Now):**
```
✅ Ollama must be running (ollama serve)
✅ Download model (ollama pull mistral)
✅ Set OLLAMA_ENABLED=true
✅ Enjoy AI explanations!
```

**Internet Deployment (Later):**
```
⚠️ Careful! Read PRODUCTION_DEPLOYMENT_GUIDE.md first
⚠️ Recommended: Disable Ollama for production
✅ Can add it later with proper setup
```
