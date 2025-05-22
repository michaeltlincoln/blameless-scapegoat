import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { LineChart } from '@mui/x-charts/LineChart';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { useCommitSummary } from '../client.js';

const Graph = ({ repo }) => {
  const { data, loading } = useCommitSummary(repo);

  const developers = useMemo(
    () => _.uniq(_.flatMap(data || [], (commit) => _.keys(commit.scoreboard))),
    [data]
  );

  const series = useMemo(
    () =>
      _.map(developers || [], (dev) => ({
        id: dev,
        label: dev,
        dataKey: dev,
      })),
    [developers]
  );

  const dataset = useMemo(
    () =>
      _.sortBy(
        _.map(data || [], (commit) => ({
          date: new Date(commit.commit_date),
          ..._.fromPairs(_.map(developers || [], (dev) => [dev, commit.scoreboard[dev] || 0])),
        })),
        'date'
      ),
    [data, developers]
  );

  if (loading) {
    return <Skeleton variant="rounded" width="100%" height="100%" />;
  }
  return (
    <Box height="100%">
      <LineChart
        dataset={dataset}
        xAxis={[
          {
            id: 'date',
            dataKey: 'date',
            scaleType: 'time',
            min: _.minBy(dataset || [], 'date')?.date,
            max: _.maxBy(dataset || [], 'date')?.date,
            valueFormatter: (date) => date.toLocaleDateString(),
          },
        ]}
        series={series}
        height={800}
      />
    </Box>
  );
};

Graph.propTypes = {
  repo: PropTypes.string.isRequired,
};

export default Graph;
