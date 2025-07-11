// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ClientDetailPage from './pages/ClientDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // <-- 1. IMPORTAR
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import AppLayout from './components/AppLayout.jsx'; // <-- Importe o novo layout

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      // O elemento agora é o AppLayout
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "clientes", element: <ClientsPage /> },
          { path: "clientes/:clientId", element: <ClientDetailPage /> },
          { path: "projetos/:projectId", element: <ProjectDetailPage /> },
        ]
      }
    ]
  },
]);



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);