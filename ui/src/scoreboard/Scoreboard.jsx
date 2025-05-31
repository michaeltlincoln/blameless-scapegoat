import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCommitSummary } from '../client.js';
import { useRepo } from '../params.js';

const getColors = (cols, idx, getCount) => {
  const prevCol = cols[idx + 1];
  if (!prevCol) return {};
  const prevCount = getCount(prevCol);
  const currCount = getCount(cols[idx]);
  if (prevCount === currCount) return {};
  if (prevCount < currCount) return { bgcolor: 'lightgreen', color: 'black' };
  return { bgcolor: 'lightcoral', color: 'black' };
};

const Scoreboard = () => {
  const [repo] = useRepo();
  const [sortCommit, setSortCommit] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const onCompleted = useCallback((res) => {
    setSortCommit((prev) =>
      _.some(prev, (c) => c.commit_hash === prev) ? prev : _.maxBy(res, 'commit_date')?.commit_hash
    );
  }, []);

  const { data, loading } = useCommitSummary(repo, { onCompleted });

  const columns = useMemo(
    () => [
      { key: 'name', title: 'Name' },
      ..._.map(_.orderBy(data || [], 'commit_date', 'desc'), (commit) => ({
        key: commit.commit_hash,
        title: new Date(commit.commit_date).toLocaleDateString(),
        commitHash: commit.commit_hash,
        totalLines: commit.total_lines,
        totalFiles: commit.total_files,
      })),
    ],
    [data]
  );

  const developers = useMemo(
    () => _.uniq(_.flatMap(data || [], (commit) => _.keys(commit.scoreboard))),
    [data]
  );

  const rows = useMemo(
    () =>
      _.orderBy(
        _.map(developers || [], (developer) => ({
          name: developer,
          ..._.fromPairs(
            _.map(data || [], (commit) => [commit.commit_hash, commit.scoreboard[developer] || 0])
          ),
        })),
        [sortCommit],
        'desc'
      ),
    [data, developers, sortCommit]
  );

  useEffect(() => {
    if (copiedHash) {
      const timeout = setTimeout(() => {
        setCopiedHash(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [copiedHash]);

  if (loading) {
    return <Skeleton variant="rounded" width="100%" height="100%" />;
  }
  return (
    <TableContainer component={Paper} sx={{ height: '100%', width: '100%' }}>
      <Table sx={{ minWidth: 650 }} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
            {_.map(columns.slice(1), (col) => (
              <TableCell key={col.key} sx={{ fontWeight: 'bold' }}>
                <Tooltip
                  title={col.commitHash}
                  placement="top-start"
                  arrow
                  onClick={() => {
                    navigator.clipboard.writeText(col.commitHash);
                    setCopiedHash(col.commitHash);
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={0.2}>
                    <pre style={{ margin: 0, fontSize: '0.6rem', cursor: 'pointer' }}>
                      {col.commitHash.slice(0, 8)}
                    </pre>
                    <Zoom in={copiedHash === col.commitHash}>
                      <CheckCircleIcon color="success" sx={{ fontSize: '0.8rem' }} />
                    </Zoom>
                  </Stack>
                </Tooltip>
                <TableSortLabel
                  active={col.key === sortCommit}
                  direction="desc"
                  onClick={() => setSortCommit(col.key)}
                >
                  {col.title}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ fontWeight: 'bold', textWrap: 'nowrap' }}>
                {idx + 1}. {row.name}
              </TableCell>
              {_.map(columns.slice(1), (col, idx, cols) => (
                <TableCell
                  align="right"
                  key={col.key}
                  sx={{ ...getColors(cols, idx, (c) => row[c.key]) }}
                >
                  {row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Total Lines</TableCell>
            {_.map(columns.slice(1), (col, idx, cols) => (
              <TableCell
                key={col.key}
                sx={{
                  fontWeight: 'bold',
                  ...getColors(cols, idx, (c) => c.totalLines),
                }}
                align="right"
              >
                {col.totalLines}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Total Files</TableCell>
            {_.map(columns.slice(1), (col, idx, cols) => (
              <TableCell
                key={col.key}
                sx={{
                  fontWeight: 'bold',
                  ...getColors(cols, idx, (c) => c.totalFiles),
                }}
                align="right"
              >
                {col.totalFiles}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default Scoreboard;
