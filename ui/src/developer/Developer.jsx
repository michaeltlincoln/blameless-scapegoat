import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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
          <Typography variant="caption" color={count > 0 ? 'lightgreen' : 'text.disabled'}>
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

const Developer = () => {
  const [repo] = useRepo();
  const [developer, setDeveloper] = useState(null);
  const [selectedCommit, setSelectedCommit] = useState('');

  useEffect(() => {
    // Reset local state when repo changes
    if (repo) {
      setDeveloper(null);
      setSelectedCommit('');
    }
  }, [repo]);

  const onCompletedCommitSummary = useCallback((res) => {
    const latestCommit = _.maxBy(res, (d) => new Date(d.commit_date));
    const maxDeveloper = _.maxBy(
      Object.entries(latestCommit?.scoreboard || {}),
      ([, count]) => count
    )?.[0];
    setSelectedCommit((prev) => prev || latestCommit?.commit_hash);
    setDeveloper(maxDeveloper);
  }, []);

  const { data: commitSummary, loading: commitSummaryLoading } = useCommitSummary(repo, {
    onCompleted: onCompletedCommitSummary,
  });
  const { data: commitBlame, loading: blameLoading } = useCommitBlame(selectedCommit);
  const { data: directoryStructure, loading: directoryStructureLoading } =
    useDirectoryStructure(selectedCommit);

  const rootNodes = useMemo(
    () => _.sortBy(_.toPairs(directoryStructure || []), ([k]) => k),
    [directoryStructure]
  );

  const commitBlameForDeveloper = useMemo(
    () => (developer ? _.filter(commitBlame || [], (b) => b.author === developer) : []),
    [commitBlame, developer]
  );

  const countsByFile = useMemo(
    () =>
      _.reduce(
        commitBlameForDeveloper,
        (acc, b) => {
          acc[b.file_path] = acc[b.file_path] || 0;
          acc[b.file_path] += b.lines;
          return acc;
        },
        {}
      ),
    [commitBlameForDeveloper]
  );

  const countsByAuthor = useMemo(
    () =>
      _.reduce(
        commitBlame,
        (acc, b) => {
          acc[b.author] = acc[b.author] || 0;
          acc[b.author] += b.lines;
          return acc;
        },
        {}
      ),
    [commitBlame]
  );

  return (
    <Stack alignItems="center">
      <Stack spacing={2} maxWidth={640} width="100%">
        {commitSummaryLoading ? (
          <Skeleton variant="rounded" width="100%" height={50} sx={{ flexShrink: 0 }} />
        ) : (
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Developer"
              value={developer || ''}
              onChange={(e) => {
                setDeveloper(e.target.value);
              }}
              sx={{ width: '100%' }}
            >
              {_.map(
                _.sortBy(
                  _.uniq(_.flatMap(commitSummary || [], (commit) => _.keys(commit.scoreboard))),
                  (dev) => dev.toLocaleLowerCase()
                ),
                (dev) => (
                  <MenuItem key={dev} value={dev}>
                    <Stack direction="row" alignItems="flex-end" spacing={1}>
                      <Typography>{dev}</Typography>
                      <Typography variant="caption" color="text.disabled">
                        ({(countsByAuthor[dev] || 0).toLocaleString()} lines)
                      </Typography>
                    </Stack>
                  </MenuItem>
                )
              )}
            </TextField>
            <TextField
              select
              label="Commit"
              value={selectedCommit}
              onChange={(e) => {
                setSelectedCommit(e.target.value);
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
          </Stack>
        )}
        {commitSummaryLoading || directoryStructureLoading || blameLoading ? (
          <Skeleton variant="rounded" width="100%" height="100%" />
        ) : !directoryStructure ? null : (
          <Stack direction="column" sx={{ flexGrow: 1 }}>
            <Typography variant="overline">{repo}</Typography>
            <Box>
              <SimpleTreeView multiSelect expansionTrigger="iconContainer">
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
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

export default Developer;
