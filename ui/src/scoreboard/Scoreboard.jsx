import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Typography } from '@mui/material';
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
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCommitSummary } from '../client.js';
import { useRepo } from '../params.js';

const UP_COLOR = 'lightgreen';
const DOWN_COLOR = 'lightcoral';
const STICKY_COL_STYLE = {
  position: 'sticky',
  left: 0,
  bgcolor: 'background.paper',
  zIndex: 1,
};

const BlameCell = ({ count, prevCount = null }) => {
  if (_.isNil(prevCount)) return count.toLocaleString();

  const diff = count - prevCount;
  const diffSign = diff >= 0 ? '+' : '';
  const color = diff > 0 ? UP_COLOR : diff < 0 ? DOWN_COLOR : 'text.secondary';

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color }}>
        {count.toLocaleString()}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1, color }}>
        {diffSign}
        {diff.toLocaleString()}
      </Typography>
    </Stack>
  );
};

BlameCell.propTypes = {
  count: PropTypes.number.isRequired,
  prevCount: PropTypes.number,
};

const NameCell = ({ name, placement, prevPlacement = null }) => {
  const diff = prevPlacement ? prevPlacement - placement : 0;
  const color = diff > 0 ? UP_COLOR : diff < 0 ? DOWN_COLOR : 'text.secondary';

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {placement}. {name}
      </Typography>
      {diff !== 0 && (
        <Stack direction="row" alignItems="center" sx={{ color }}>
          {diff > 0 ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
          <Typography variant="caption">{Math.abs(diff).toLocaleString()}</Typography>
        </Stack>
      )}
    </Stack>
  );
};

NameCell.propTypes = {
  name: PropTypes.string.isRequired,
  placement: PropTypes.number.isRequired,
  prevPlacement: PropTypes.number,
};

const Scoreboard = () => {
  const [repo] = useRepo();
  const [sortCommit, setSortCommit] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const onCompleted = useCallback((res) => {
    setSortCommit((prev) =>
      _.some(prev, (c) => c.commit_hash === prev)
        ? prev
        : _.maxBy(res, (d) => new Date(d.commit_date))?.commit_hash
    );
  }, []);

  const { data, loading } = useCommitSummary(repo, { onCompleted });

  const columns = useMemo(
    () => [
      { key: 'name', title: 'Name' },
      ..._.map(
        _.orderBy(data || [], (d) => new Date(d.commit_date), 'desc'),
        (commit) => ({
          key: commit.commit_hash,
          title: new Date(commit.commit_date).toLocaleDateString(),
          commitHash: commit.commit_hash,
          totalLines: commit.total_lines,
          totalFiles: commit.total_files,
        })
      ),
    ],
    [data]
  );

  const developers = useMemo(
    () => _.uniq(_.flatMap(data || [], (commit) => _.keys(commit.scoreboard))),
    [data]
  );

  const rows = useMemo(
    () =>
      _.map(developers || [], (developer) => ({
        name: developer,
        ..._.fromPairs(
          _.map(data || [], (commit) => [commit.commit_hash, commit.scoreboard[developer] || 0])
        ),
      })),
    [data, developers]
  );

  const sortedRows = useMemo(() => _.orderBy(rows, [sortCommit], 'desc'), [rows, sortCommit]);

  const prevSortedRows = useMemo(() => {
    const idx = _.findIndex(columns, (col) => col.key === sortCommit);
    const prevCommit = idx >= 0 && idx < columns.length - 1 ? columns[idx + 1].key : null;
    return prevCommit ? _.orderBy(sortedRows, [prevCommit], 'desc') : sortedRows;
  }, [sortedRows, columns, sortCommit]);

  const getPrevPlacement = useCallback(
    (developer) => {
      const idx = _.findIndex(prevSortedRows, (row) => row.name === developer);
      return idx >= 0 ? idx + 1 : null;
    },
    [prevSortedRows]
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
          {sortedRows.map((row, idx) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ fontWeight: 'bold', textWrap: 'nowrap', ...STICKY_COL_STYLE }}>
                <NameCell
                  name={row.name}
                  placement={idx + 1}
                  prevPlacement={getPrevPlacement(row.name)}
                />
              </TableCell>
              {_.map(columns.slice(1), (col, idx, cols) => (
                <TableCell align="right" key={col.key}>
                  <BlameCell count={row[col.key]} prevCount={row[cols[idx + 1]?.key]} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', ...STICKY_COL_STYLE }}>Total Lines</TableCell>
            {_.map(columns.slice(1), (col, idx, cols) => (
              <TableCell key={col.key} align="right">
                <BlameCell count={col.totalLines} prevCount={cols[idx + 1]?.totalLines} />
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', ...STICKY_COL_STYLE }}>Total Files</TableCell>
            {_.map(columns.slice(1), (col, idx, cols) => (
              <TableCell key={col.key} align="right">
                <BlameCell count={col.totalFiles} prevCount={cols[idx + 1]?.totalFiles} />
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default Scoreboard;
