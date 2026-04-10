/**
 * Backend Discovery Service
 * Automatically detects the backend URL by trying common ports
 * and fetching the /api/config endpoint
 */

const COMMON_PORTS = [5000, 5001, 5002, 5003, 5004, 5005, 8000, 8001, 3000, 3001];
const TIMEOUT = 2000; // 2 seconds per attempt

async function checkBackendOnPort(port: number): Promise<string | null> {
  try {
    const url = `http://localhost:${port}/api/config`;
    const response = await Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT)
      ),
    ]);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Backend found on port ${port}:`, data.data);
      return `http://localhost:${port}`;
    }
  } catch (error) {
    // Port not available, continue to next
  }
  return null;
}

async function discoverBackendUrl(): Promise<string> {
  console.log("🔍 Discovering backend URL...");

  // Try each common port
  for (const port of COMMON_PORTS) {
    const backendUrl = await checkBackendOnPort(port);
    if (backendUrl) {
      console.log(`🎉 Backend discovered at ${backendUrl}`);
      localStorage.setItem("backendUrl", backendUrl);
      return backendUrl;
    }
  }

  // Fallback to environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    console.log(`📝 Using VITE_API_URL from .env: ${envUrl}`);
    return envUrl;
  }

  // Ultimate fallback
  const fallback = "http://localhost:5000";
  console.warn(`⚠️  Could not discover backend. Using fallback: ${fallback}`);
  return fallback;
}

export function getBackendUrl(): string {
  // Check if we have a stored URL
  const stored = localStorage.getItem("backendUrl");
  if (stored) {
    console.log(`📌 Using stored backend URL: ${stored}`);
    return stored;
  }

  // Return env or fallback (discovery happens on app init)
  return import.meta.env.VITE_API_URL || "http://localhost:5000";
}

export { discoverBackendUrl };
