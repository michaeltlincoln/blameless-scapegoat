import { StringParam, useQueryParam, withDefault } from 'use-query-params';

export const useRepo = () => useQueryParam('repo', withDefault(StringParam, ''));
