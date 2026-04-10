import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            borderRadius: '12px',
            background: '#0D0D0F',
            color: '#F5F2ED',
          },
          success: { iconTheme: { primary: '#1A9E8F', secondary: '#F5F2ED' } },
          error:   { iconTheme: { primary: '#E85C3A', secondary: '#F5F2ED' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
