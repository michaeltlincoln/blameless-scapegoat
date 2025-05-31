import MoodBadIcon from '@mui/icons-material/MoodBad';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useRepos } from './client.js';
import { useRepo } from './params.js';

const pages = [
  { title: 'Scoreboard', path: '/scoreboard' },
  { title: 'Graph', path: '/graph' },
  { title: 'Tree', path: '/tree' },
];

const Nav = () => {
  const [repo, setRepo] = useRepo();

  const onCompleted = useCallback(
    (res) => {
      setRepo(repo || res[0].repo);
    },
    [repo, setRepo]
  );

  const { data } = useRepos({ onCompleted });

  return (
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
            {pages.map(({ title, path }) => (
              <Button
                key={path}
                sx={{ my: 2, color: 'white', display: 'block' }}
                component={Link}
                to={`${path}?repo=${repo}`}
              >
                {title}
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
  );
};

export default Nav;
