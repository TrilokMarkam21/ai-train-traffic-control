import { useState } from "react";
import { updateTrain, deleteTrain } from "../api/api";

export default function TrainDetail({ train }) {
  const [status, setStatus] = useState(train.status);

  const handleUpdate = async () => {
    await updateTrain(train._id, { ...train, status });
    alert("Updated");
  };

  const handleDelete = async () => {
    await deleteTrain(train._id);
    window.location.reload();
  };

  return (
    <div className="train-card">
      <h3>{train.name}</h3>
      <p>Status: {train.status}</p>
      <input
        type="text"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      />
      <button onClick={handleUpdate}>Update</button>
      <button onClick={handleDelete}>Remove</button>
    </div>
  );
}
