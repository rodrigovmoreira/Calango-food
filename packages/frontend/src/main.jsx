import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from "./components/ui/provider"; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Kitchen from './pages/Kitchen';
import Settings from './pages/Settings';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);