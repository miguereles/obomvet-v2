import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Pets from "./pages/pets";
import Dashboard from "./pages/dashboard";
import ReportInput from "./pages/criarEmergencia";
import Home from './pages/home'; 
import Features from './pages/features'; 
import About from './pages/about';
import './styles/app.css';
import { getToken } from './utils/auth';
import ClinicPage from "./pages/clinicPage";
import RegisteredClinicPage from "./pages/registeredClinicPage";
import { DarkModeProvider } from "./accessibility/DarkModeContext";
import 'tippy.js/dist/tippy.css';
// ❌ O import de 'IniciarEmergencia' foi removido
import AcompanhamentoEmergencia from "./pages/acompanhamentoEmergencia";
import { useVLibras } from "./accessibility/useVlibras";


function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = getToken();
  return token ? children : <Navigate to="/" />;
}


export default function App() {
  React.useEffect(() => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      console.log('Permissão de notificações:', permission);
    });
  }
}, []);

  useVLibras();
    
    

  return (
    <DarkModeProvider>
      <div vw="true" className="enabled">
        <div vw-access-button="true" className="active"></div>
        <div vw-plugin-wrapper="true">
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>

      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          {/* ❌ A rota "/iniciar-emergencia" foi removida */}
          <Route path="/reportInput" element={<ReportInput />} />
          <Route path="/emergencia/:id" element={<AcompanhamentoEmergencia />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/clinicPage" element={<ClinicPage />} />
          <Route path="/registeredClinicPage" element={<RegisteredClinicPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}