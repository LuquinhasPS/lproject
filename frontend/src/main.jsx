// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

import AppLayout from './components/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ClientDetailPage from './pages/ClientDetailPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "clientes", element: <ClientDetailPage /> }, // Supondo que você tenha uma página de lista
          { path: "clientes/:clientId", element: <ClientDetailPage /> },
          { path: "projetos/:projectId", element: <ProjectDetailPage /> },
        ]
      }
    ]
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));

// A renderização final SEM o StrictMode
root.render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);