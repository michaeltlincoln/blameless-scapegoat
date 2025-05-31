import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';
import _ from 'lodash';
import { useMemo, useState } from 'react';

import { useCommitSummary } from '../client.js';
import { useRepo } from '../params.js';
import GraphSettings from './GraphSettings.jsx';

const Graph = () => {
  const [repo] = useRepo();
  const { data, loading } = useCommitSummary(repo);
  const [filteredDevelopers, setFilteredDevelopers] = useState(null);

  const developers = useMemo(
    () =>
      _.sortBy(_.uniq(_.flatMap(data || [], (commit) => _.keys(commit.scoreboard))), (dev) =>
        dev.toLocaleLowerCase()
      ),
    [data]
  );

  const series = useMemo(
    () =>
      _.map(filteredDevelopers ?? developers, (dev) => ({
        id: dev,
        label: dev,
        dataKey: dev,
        showMark: false,
      })),
    [filteredDevelopers, developers]
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

  const latestCommit = useMemo(() => _.maxBy(data || [], 'commit_date'), [data]);

  if (loading) {
    return <Skeleton variant="rounded" width="100%" height="100%" />;
  }
  return (
    <Stack>
      <GraphSettings
        developers={developers}
        latestCommit={latestCommit}
        setFilteredDevelopers={setFilteredDevelopers}
      />
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
    </Stack>
  );
};

export default Graph;
