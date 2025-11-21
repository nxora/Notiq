import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PrivateRoutes from "./components/PrivateRoutes.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Home from "./pages/Home.jsx";
 import Notes from "./pages/Notes";
import Flashcard from "./pages/Flashcard";
import Quiz from "./pages/Quiz";
import Settings from "./pages/Settings";
import IllustrationSlide from "./components/IllustrationSlide.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register/>} />
       <Route path="/dashboard" element={<PrivateRoutes> <DashboardLayout title="Home"><IllustrationSlide/> </DashboardLayout> </PrivateRoutes>} />

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
        <Flashcard />
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
