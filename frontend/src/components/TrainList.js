import { useEffect, useState } from "react";
import { getTrains } from "../api/api";
import TrainDetail from "./TrainDetail";

export default function TrainList() {
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getTrains();
      setTrains(res.data);
    };
    fetchData();
  }, []);

  return (
    <div className="train-list">
      {trains.map((train) => (
        <TrainDetail key={train._id} train={train} />
      ))}
    </div>
  );
}
