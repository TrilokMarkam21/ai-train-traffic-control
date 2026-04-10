# Ollama Setup Guide for AI Train Traffic Control

## What is Ollama?
Ollama allows you to run large language models locally on your computer for FREE. No API costs, no rate limits.

## Quick Setup (5 minutes)

### Step 1: Download Ollama
Go to https://ollama.ai and download for Windows.

### Step 2: Install
Run the installer and let it complete.

### Step 3: Start Ollama (if not auto-starting)
Open Command Prompt or PowerShell and run:
```bash
ollama serve
```

You should see:
```
Listening on 127.0.0.1:11434
```

This means Ollama is running on http://localhost:11434

### Step 4: Download a Model (one-time)
In another terminal, run:
```bash
ollama pull mistral
```

Or for a smaller model:
```bash
ollama pull llama2
```

This downloads the model (~4GB for mistral, ~7GB for llama2).

### Step 5: Test It Works
```bash
curl http://localhost:11434/api/generate -d "{\"model\":\"mistral\", \"prompt\":\"Hello\", \"stream\":false}"
```

You should get a JSON response.

## Configuration in Your App

The backend will auto-detect Ollama at localhost:11434.

Environment variables you can set:
```bash
OLLAMA_URL=http://localhost:11434      # Where Ollama runs
OLLAMA_MODEL=mistral                    # Which model (mistral, llama2, neural-chat, etc)
OLLAMA_ENABLED=true                     # Enable/disable Ollama explanations
```

## How It's Used

When the system predicts a train delay, it now:
1. ✅ Calls AI Service (XGBoost model) → gets prediction in 10ms
2. ✅ (Optional) Calls Ollama → generates natural language explanation in 500-1000ms

Example output:
```json
{
  "predictedDelay": 19.5,
  "factors": ["High traffic", "Morning peak hour"],
  "aiExplanation": "Train is stuck in morning rush due to high traffic density on the main line. Consider holding freight train 88 to free up capacity.",
  "recommendation": "Monitor closely..."
}
```

## Troubleshooting

### "Connection refused" error
Ollama is not running. Make sure to run `ollama serve` in a terminal.

### "Model not found" error
Run `ollama pull mistral` to download the model first.

### Predictions are slow
Ollama explanations take 500-1000ms. This is normal for LLMs. The AI prediction itself is still fast (10ms).

### Want to disable explanations?
Set environment variable:
```bash
OLLAMA_ENABLED=false
```

This will use the old factor-based explanations instead.

## Performance

- **AI Prediction** (XGBoost): 10-30ms
- **Ollama Explanation**: 500-1000ms
- **Total**: ~1 second (acceptable for traffic control)

Want it faster? Use OLLAMA_ENABLED=false to skip Ollama.
