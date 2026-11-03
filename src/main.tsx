import * as React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as any).React = React;

createRoot(document.getElementById('root')!).render(<App />);
