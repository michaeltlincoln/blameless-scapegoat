import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { PieChart } from '@mui/x-charts/PieChart';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';

import { useCommitBlame, useCommitSummary, useDirectoryStructure } from '../client.js';
import { useRepo } from '../params.js';

const NestedTreeItem = ({ parent, child, path }) => {
  const nextPath = [...path, parent];
  const nextNodePairs = useMemo(
    () => (_.isString(child) ? [] : _.sortBy(_.toPairs(child || []), ([k]) => k)),
    [child]
  );
  return (
    <TreeItem itemId={nextPath.join('/')} label={parent}>
      {_.map(nextNodePairs || [], ([nextParent, nextChild]) => (
        <NestedTreeItem key={nextParent} parent={nextParent} child={nextChild} path={nextPath} />
      ))}
    </TreeItem>
  );
};

NestedTreeItem.propTypes = {
  parent: PropTypes.string.isRequired,
  child: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  path: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const Tree = () => {
  const [repo] = useRepo();
  const [selectedCommit, setSelectedCommit] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const onCompletedCommitSummary = useCallback((res) => {
    setSelectedCommit((prev) => prev || _.maxBy(res, 'commit_date')?.commit_hash);
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
    <Stack spacing={2}>
      {commitSummaryLoading ? (
        <Skeleton variant="rounded" width="100%" height="50px" />
      ) : (
        <div>
          <TextField
            select
            label="Commit"
            value={selectedCommit}
            onChange={(e) => {
              setSelectedCommit(e.target.value);
              setSelectedItems([]);
            }}
            sx={{ width: 200 }}
          >
            {_.map(_.orderBy(commitSummary || [], 'commit_date', 'desc'), (commit) => (
              <MenuItem key={commit.commit_hash} value={commit.commit_hash}>
                {new Date(commit.commit_date).toLocaleDateString()}
              </MenuItem>
            ))}
          </TextField>
        </div>
      )}
      {blameLoading || directoryStructureLoading ? (
        <Skeleton variant="rounded" width="100%" height="100%" />
      ) : !commitBlame || !directoryStructure ? null : (
        <Stack direction="row" spacing={2}>
          <Stack direction="column" spacing={2} sx={{ flexGrow: 1 }}>
            <div>
              <Button onClick={handleSelectAll}>
                {selectedItems.length === 0 ? 'Select all' : 'Unselect all'}
              </Button>
            </div>
            <Box sx={{ minHeight: 352, minWidth: 250 }}>
              <SimpleTreeView
                selectedItems={selectedItems}
                onSelectedItemsChange={handleSelectedItemsChange}
                multiSelect
              >
                {_.map(rootNodes || [], ([parent, child]) => (
                  <NestedTreeItem key={parent} parent={parent} child={child} path={[]} />
                ))}
              </SimpleTreeView>
            </Box>
          </Stack>
          <Box sx={{ flexGrow: 1 }}>
            <PieChart series={series} width={640} height={640} />
          </Box>
        </Stack>
      )}
    </Stack>
  );
};

export default Tree;
