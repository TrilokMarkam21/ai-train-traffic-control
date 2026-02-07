import { useEffect, useState } from "react";
import API from "../api/api";

export default function Home() {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    API.get("/health")
      .then((res) => setStatus(res.data.message))
      .catch((err) => {
        console.error(err);
        setStatus("Backend connection failed ❌");
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Train Traffic Control System</h1>
      <p>{status}</p>
    </div>
  );
}
