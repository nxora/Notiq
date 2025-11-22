import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PrivateRoutes from "./components/PrivateRoutes.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Home from "./pages/Home.jsx";
 import Notes from "./pages/Notes";
import FlashCard from "./pages/FlashCard.jsx";
import Quiz from "./pages/Quiz";
import Settings from "./pages/Settings";
import Default from "./components/Default.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register/>} />
       <Route path="/dashboard" element={<PrivateRoutes> <DashboardLayout title="Home"><Default/></DashboardLayout> </PrivateRoutes>} />

<Route
  path="/notes"
  element={
    <PrivateRoutes>
      <DashboardLayout title="Notes">
        <Notes />
      </DashboardLayout>
    </PrivateRoutes>
  }
/>

<Route
  path="/flashcards"
  element={
    <PrivateRoutes>
      <DashboardLayout title="Flash Cards">
        <FlashCard />
      </DashboardLayout>
    </PrivateRoutes>
  }
/>

<Route
  path="/quiz"
  element={
    <PrivateRoutes>
      <DashboardLayout title="Quiz">
        <Quiz />
      </DashboardLayout>
    </PrivateRoutes>
  }
/>

<Route
  path="/settings"
  element={
    <PrivateRoutes>
      <DashboardLayout title="Settings">
        <Settings />
      </DashboardLayout>
    </PrivateRoutes>
  }
/>
    </Routes>
  );
}

export default App;
