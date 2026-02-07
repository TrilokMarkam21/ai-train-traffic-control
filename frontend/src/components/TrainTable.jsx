import { useEffect, useState } from "react";
import socket from "../socket/socket";

export default function TrainTable() {
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    socket.on("snapshot", setTrains);
    return () => socket.off("snapshot");
  }, []);

  return (
    <>
      <h3>Live Trains</h3>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Speed</th>
            <th>Delay</th>
            <th>Section</th>
          </tr>
        </thead>
        <tbody>
          {trains.map(t => (
            <tr key={t._id}>
              <td>{t.trainId}</td>
              <td>{t.name}</td>
              <td>{t.speedKmph}</td>
              <td>{t.delayMin}</td>
              <td>{t.currentSection?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
 