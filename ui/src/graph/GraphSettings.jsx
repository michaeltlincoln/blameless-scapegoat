import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const initialSettings = {
  excludedDevelopers: [],
  topNDevelopers: '',
  minimumLines: '',
};

const GraphSettings = ({ developers, latestCommit = null, setFilteredDevelopers }) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    excludedDevelopers: [],
    topNDevelopers: '',
    minimumLines: '',
  });

  const debouncedSetFilteredDevelopers = useDebouncedCallback(setFilteredDevelopers, 500);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const excludedDevelopersSet = new Set(newSettings.excludedDevelopers);

    const filteredDevelopers = _.filter(developers, (dev) => {
      if (excludedDevelopersSet.has(dev)) return false;

      if (latestCommit) {
        const minLinesParsed = parseFloat(newSettings.minimumLines);
        if (
          newSettings.minimumLines &&
          minLinesParsed &&
          minLinesParsed > (latestCommit.scoreboard[dev] || 0)
        )
          return false;

        const topNDevelopersParsed = parseFloat(newSettings.topNDevelopers);
        if (newSettings.topNDevelopers && topNDevelopersParsed) {
          const topNDeveloperSet = new Set(
            _.slice(
              _.sortBy(developers, (dev) => -latestCommit.scoreboard[dev] || 0),
              0,
              topNDevelopersParsed
            )
          );

          if (!topNDeveloperSet.has(dev)) return false;
        }
      }

      return true;
    });

    if (key === 'excludedDevelopers') {
      setFilteredDevelopers(filteredDevelopers);
    } else {
      debouncedSetFilteredDevelopers(filteredDevelopers);
    }
  };

  return (
    <>
      <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
        <IconButton onClick={() => setOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Configure Graph</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2}>
            <Stack>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Excluded Developers
              </Typography>
              <Button
                onClick={() =>
                  handleChange(
                    'excludedDevelopers',
                    settings.excludedDevelopers.length === 0 ? developers : []
                  )
                }
              >
                {settings.excludedDevelopers.length === 0 ? 'Select All' : 'Unselect All'}
              </Button>
              <FormGroup>
                {developers.map((dev) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.excludedDevelopers.includes(dev)}
                        onChange={(e, newChecked) =>
                          handleChange(
                            'excludedDevelopers',
                            newChecked
                              ? [...settings.excludedDevelopers, dev]
                              : _.filter(settings.excludedDevelopers, (d) => d !== dev)
                          )
                        }
                      />
                    }
                    label={dev}
                    key={dev}
                  />
                ))}
              </FormGroup>
            </Stack>
            <Stack direction="column" spacing={3} sx={{ py: 1 }}>
              <TextField
                label="Top N Developers"
                type="number"
                value={settings.topNDevelopers}
                onChange={(e) => handleChange('topNDevelopers', e.target.value)}
              />
              <TextField
                label="Minimum Lines"
                type="number"
                value={settings.minimumLines}
                onChange={(e) => handleChange('minimumLines', e.target.value)}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFilteredDevelopers(null);
              setSettings(initialSettings);
              setOpen(false);
            }}
          >
            Reset
          </Button>
          <Button onClick={() => setOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

GraphSettings.propTypes = {
  developers: PropTypes.array.isRequired,
  latestCommit: PropTypes.object,
  setFilteredDevelopers: PropTypes.func.isRequired,
};

export default GraphSettings;
