// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'          // opcional
import App from './App.jsx'
import './index.css'                        // aquí carga Tailwind

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
