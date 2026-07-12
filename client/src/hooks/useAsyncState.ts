import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

type ErrorMessageBuilder = (err: unknown) => string;

interface UseAsyncStateOptions {
  initialData: string;
  defaultError?: string;
  onError?: ErrorMessageBuilder;
}

interface UseAsyncStateOptionsWithData<T> {
  initialData: T;
  defaultError?: string;
  onError?: ErrorMessageBuilder;
}

export interface AsyncStateResult<T> {
  data: T;
  loading: boolean;
  error: string;
  run: (task: () => Promise<T>) => Promise<void>;
  setData: Dispatch<SetStateAction<T>>;
  setError: Dispatch<SetStateAction<string>>;
}

function toMessage(err: unknown, defaultMessage: string): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  return defaultMessage;
}

export function useAsyncState<T>(options: UseAsyncStateOptionsWithData<T>): AsyncStateResult<T> {
  const { initialData, defaultError = '请求失败', onError } = options;
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const run = useCallback(async (task: () => Promise<T>) => {
    setLoading(true);
    setError('');
    try {
      const next = await task();
      setData(next);
    } catch (err: unknown) {
      setError(onError ? onError(err) : toMessage(err, defaultError));
    } finally {
      setLoading(false);
    }
  }, [defaultError, onError]);

  return { data, loading, error, run, setData, setError };
}

export function useAsyncMessageState(options: UseAsyncStateOptions = { initialData: '' }) {
  return useAsyncState<string>(options);
}
