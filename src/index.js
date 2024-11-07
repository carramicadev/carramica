import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './AuthContext';
import SwProvider from './components/SwProvider';
import FullScreenDialog from './components/Update';

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <SwProvider>
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider maxSnack={20} autoHideDuration={3000}>
          <AuthProvider>

            <App />
          </AuthProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </React.StrictMode>
    <FullScreenDialog />
  </SwProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
