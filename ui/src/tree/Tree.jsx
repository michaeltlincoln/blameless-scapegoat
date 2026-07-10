import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCommitBlame, useCommitSummary, useDirectoryStructure } from '../client.js';
import { useRepo } from '../params.js';

const NestedTreeItem = ({ parent, child, path, countsByFile = {} }) => {
  const currPath = [...path, parent];
  const currPathStr = currPath.join('/');
  const nextNodePairs = useMemo(
    () => (_.isString(child) ? [] : _.sortBy(_.toPairs(child || []), ([k]) => k)),
    [child]
  );
  const count = useMemo(
    () =>
      Object.keys(countsByFile || {}).reduce((acc, filePath) => {
        if (filePath.startsWith(currPathStr)) {
          acc += countsByFile[filePath];
        }
        return acc;
      }, 0),
    [countsByFile, currPathStr]
  );

  return (
    <TreeItem
      itemId={currPathStr}
      label={
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body2" noWrap>
            {parent}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {count.toLocaleString()}
          </Typography>
        </Stack>
      }
    >
      {_.map(nextNodePairs || [], ([nextParent, nextChild]) => (
        <NestedTreeItem
          key={nextParent}
          parent={nextParent}
          child={nextChild}
          path={currPath}
          countsByFile={countsByFile}
        />
      ))}
    </TreeItem>
  );
};

NestedTreeItem.propTypes = {
  parent: PropTypes.string.isRequired,
  child: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  path: PropTypes.arrayOf(PropTypes.string).isRequired,
  countsByFile: PropTypes.objectOf(PropTypes.number),
};

const Tree = () => {
  const [repo] = useRepo();
  const [selectedCommit, setSelectedCommit] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    // Reset local state when repo changes
    if (repo) {
      setSelectedCommit('');
      setSelectedItems([]);
    }
  }, [repo]);

  const onCompletedCommitSummary = useCallback((res) => {
    setSelectedCommit((prev) => prev || _.maxBy(res, (d) => new Date(d.commit_date))?.commit_hash);
  }, []);

  const onCompletedDirectoryStructure = useCallback((res) => {
    setSelectedItems((prev) => (prev.length > 0 ? prev : _.keys(res || {})));
  }, []);

  const { data: commitSummary, loading: commitSummaryLoading } = useCommitSummary(repo, {
    onCompleted: onCompletedCommitSummary,
  });
  const { data: commitBlame, loading: blameLoading } = useCommitBlame(selectedCommit);
  const { data: directoryStructure, loading: directoryStructureLoading } = useDirectoryStructure(
    selectedCommit,
    { onCompleted: onCompletedDirectoryStructure }
  );

  const handleSelectedItemsChange = (event, ids) => {
    setSelectedItems(ids);
  };

  const handleSelectAll = () => {
    setSelectedItems((oldSelected) =>
      oldSelected.length === 0 ? _.keys(directoryStructure || {}) : []
    );
  };

  const rootNodes = useMemo(
    () => _.sortBy(_.toPairs(directoryStructure || []), ([k]) => k),
    [directoryStructure]
  );

  const countsByAuthor = useMemo(
    () =>
      _.reduce(
        commitBlame,
        (acc, b) => {
          if (_.some(selectedItems, (item) => b.file_path.startsWith(item))) {
            acc[b.author] = acc[b.author] || 0;
            acc[b.author] += b.lines;
          }
          return acc;
        },
        {}
      ),
    [commitBlame, selectedItems]
  );

  const countsByFile = useMemo(
    () =>
      _.reduce(
        commitBlame,
        (acc, b) => {
          acc[b.file_path] = acc[b.file_path] || 0;
          acc[b.file_path] += b.lines;
          return acc;
        },
        {}
      ),
    [commitBlame]
  );

  const totalLines = useMemo(() => _.sumBy(_.values(countsByAuthor)), [countsByAuthor]);
  const series = useMemo(
    () => [
      {
        arcLabel: (item) => `${Math.round((item.value * 10000) / totalLines) / 100}%`,
        arcLabelMinAngle: 15,
        arcLabelRadius: '60%',
        data: _.map(countsByAuthor, (count, author) => ({
          id: author,
          value: count,
          label: author,
        })),
      },
    ],
    [countsByAuthor, totalLines]
  );

  return (
    <Stack direction="row" spacing={2} sx={{ height: '100%' }}>
      <Stack
        component={Paper}
        overflow="auto"
        spacing={2}
        p={2}
        sx={{ minHeight: 352, minWidth: 250 }}
      >
        {commitSummaryLoading ? (
          <Skeleton variant="rounded" width="100%" height={50} sx={{ flexShrink: 0 }} />
        ) : (
          <TextField
            select
            label="Commit"
            value={selectedCommit}
            onChange={(e) => {
              setSelectedCommit(e.target.value);
              setSelectedItems([]);
            }}
            sx={{ width: '100%' }}
          >
            {_.map(
              _.orderBy(commitSummary || [], (d) => new Date(d.commit_date), 'desc'),
              (commit) => (
                <MenuItem key={commit.commit_hash} value={commit.commit_hash}>
                  {new Date(commit.commit_date).toLocaleDateString()}
                </MenuItem>
              )
            )}
          </TextField>
        )}
        {commitSummaryLoading || directoryStructureLoading ? (
          <Skeleton variant="rounded" width="100%" height="100%" />
        ) : !directoryStructure ? null : (
          <Stack direction="column" sx={{ flexGrow: 1 }}>
            <Typography variant="overline">{repo}</Typography>
            <Box>
              <SimpleTreeView
                selectedItems={selectedItems}
                onSelectedItemsChange={handleSelectedItemsChange}
                multiSelect
                expansionTrigger="iconContainer"
              >
                {_.map(rootNodes || [], ([parent, child]) => (
                  <NestedTreeItem
                    key={parent}
                    parent={parent}
                    child={child}
                    path={[]}
                    countsByFile={countsByFile}
                  />
                ))}
              </SimpleTreeView>
            </Box>
            <Button onClick={handleSelectAll} sx={{ mt: 1 }}>
              {selectedItems.length === 0 ? 'Select all' : 'Unselect all'}
            </Button>
          </Stack>
        )}
      </Stack>
      <Stack flexGrow={1} overflow="auto">
        {commitSummaryLoading || blameLoading ? (
          <Skeleton variant="rounded" width="100%" height="100%" />
        ) : commitBlame ? (
          <PieChart series={series} width={640} height={640} />
        ) : null}
      </Stack>
    </Stack>
  );
};

export default Tree;
