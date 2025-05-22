import axios from 'axios';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';

const BASE_URL = 'http://127.0.0.1:5000';

const client = axios.create({
  baseURL: BASE_URL,
});

export default client;

const getRepos = async () => {
  const response = await client.get('/repos');
  return response.data;
};

const getCommitSummary = async (repoName) => {
  const response = await client.get(`/commit_summary?repo_name=${repoName}`);
  return response.data;
};

const getCommitBlame = async (commitHash) => {
  const response = await client.get(`/commit_blame?commit_hash=${commitHash}`);
  return response.data;
};

const getDirectoryStructure = async (commitHash) => {
  const response = await client.get(`/directory_structure?commit_hash=${commitHash}`);
  return response.data;
};

const useData = (fn, { onCompleted = _.noop, onError = _.noop } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fn()
      .then((res) => {
        setData(res);
        setError(null);
        onCompleted(res);
      })
      .catch((err) => {
        setError(err);
        onError(err);
      })
      .finally(() => setLoading(false));
  }, [fn, onCompleted, onError]);

  return { data, loading, error };
};

export const useRepos = (options) => {
  return useData(getRepos, options);
};

export const useCommitSummary = (repoName, options) => {
  return useData(
    useCallback(() => (repoName ? getCommitSummary(repoName) : Promise.resolve()), [repoName]),
    options
  );
};

export const useCommitBlame = (commitHash, options) => {
  return useData(
    useCallback(() => (commitHash ? getCommitBlame(commitHash) : Promise.resolve()), [commitHash]),
    options
  );
};

export const useDirectoryStructure = (commitHash, options) => {
  return useData(
    useCallback(
      () => (commitHash ? getDirectoryStructure(commitHash) : Promise.resolve()),
      [commitHash]
    ),
    options
  );
};
