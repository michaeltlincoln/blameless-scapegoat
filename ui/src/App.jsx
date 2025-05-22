import MoodBadIcon from '@mui/icons-material/MoodBad';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import _ from 'lodash';
import { useCallback, useState } from 'react';

import { useRepos } from './client.js';
import Graph from './graph/Graph.jsx';
import Scoreboard from './scoreboard/Scoreboard.jsx';
import Tree from './tree/Tree.jsx';

import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const PAGE_SCOREBOARD = 'Scoreboard';
const PAGE_GRAPH = 'Graph';
const PAGE_TREE = 'Tree';
const pages = [PAGE_SCOREBOARD, PAGE_GRAPH, PAGE_TREE];

function App() {
  const [page, setPage] = useState(PAGE_SCOREBOARD);
  const [repo, setRepo] = useState('');

  const onCompleted = useCallback((res) => {
    setRepo((prev) => prev || res[0].repo);
  }, []);

  const { data } = useRepos({ onCompleted });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static">
            <Container maxWidth="xl">
              <Toolbar disableGutters>
                <MoodBadIcon sx={{ mr: 1 }} />
                <Typography
                  variant="h6"
                  noWrap
                  component="a"
                  sx={{
                    mr: 2,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  BLAMELESS
                </Typography>

                <Box sx={{ flexGrow: 1, display: 'flex' }}>
                  {pages.map((page) => (
                    <Button
                      key={page}
                      sx={{ my: 2, color: 'white', display: 'block' }}
                      onClick={() => setPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </Box>

                <Box>
                  <TextField
                    select
                    label="Repository"
                    value={repo}
                    onChange={(e) => {
                      setRepo(e.target.value);
                    }}
                    sx={{ width: 200 }}
                    size="small"
                  >
                    {_.map(_.sortBy(data || [], 'repo'), (repo) => (
                      <MenuItem key={repo.repo} value={repo.repo}>
                        {repo.repo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Toolbar>
            </Container>
          </AppBar>
          <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
            {!repo ? (
              <Stack
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Stack sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="text.secondary">
                    Select a repository from the menu to get started
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    If you do not see any repositories, ensure you have run{' '}
                    <code>calculate_blame.py</code> at least once
                  </Typography>
                </Stack>
              </Stack>
            ) : (
              <>
                {page === PAGE_SCOREBOARD && <Scoreboard repo={repo} />}
                {page === PAGE_GRAPH && <Graph repo={repo} />}
                {page === PAGE_TREE && <Tree repo={repo} />}
              </>
            )}
          </Box>
        </Box>
      </main>
    </ThemeProvider>
  );
}

export default App;
