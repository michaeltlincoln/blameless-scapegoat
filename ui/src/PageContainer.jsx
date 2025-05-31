import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Outlet } from 'react-router-dom';

import Nav from './Nav.jsx';
import { useRepo } from './params.js';

const PageContainer = () => {
  const [repo] = useRepo();

  return (
    <>
      <CssBaseline />
      <main>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Nav />
          <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto', position: 'relative' }}>
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
              <Outlet />
            )}
          </Box>
        </Box>
      </main>
    </>
  );
};

export default PageContainer;
