import TrainTable from "../components/TrainTable";
import AIPredictor from "../components/AIPredictor";

export default function Dashboard() {
  return (
    <div>
      <h1>🚆 AI Train Traffic Control Dashboard</h1>
      <TrainTable />
      <AIPredictor />
    </div>
  );
}
