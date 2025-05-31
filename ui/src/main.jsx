import { ThemeProvider, createTheme } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import PageContainer from './PageContainer.jsx';
import Graph from './graph/Graph.jsx';
import Scoreboard from './scoreboard/Scoreboard.jsx';
import Tree from './tree/Tree.jsx';

import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ThemeProvider theme={darkTheme}>
          <Routes>
            <Route element={<PageContainer />}>
              <Route path="/" element={<Scoreboard />} />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/tree" element={<Tree />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </QueryParamProvider>
    </BrowserRouter>
  </StrictMode>
);
