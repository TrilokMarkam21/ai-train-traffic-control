import { useState } from "react";
import { predictDelay } from "../api/aiApi";

export default function AIPredictor() {
  const [data, setData] = useState({});
  const [result, setResult] = useState(null);

  const submit = async () => {
    const res = await predictDelay(data);
    setResult(res);
  };

  return (
    <>
      <h3>AI Delay Prediction</h3>
      <input placeholder="Train ID" onChange={e => setData({...data, trainId: e.target.value})} />
      <button onClick={submit}>Predict</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </>
  );
}
