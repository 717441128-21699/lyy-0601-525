import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Personnel from "@/pages/Personnel";
import RiskPoints from "@/pages/RiskPoints";
import Patrol from "@/pages/Patrol";
import Incidents from "@/pages/Incidents";
import Equipment from "@/pages/Equipment";
import Review from "@/pages/Review";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/risk-points" element={<RiskPoints />} />
          <Route path="/patrol" element={<Patrol />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/review" element={<Review />} />
        </Route>
      </Routes>
    </Router>
  );
}
