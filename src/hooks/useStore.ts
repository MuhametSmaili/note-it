import { getFromStorage, LocalStorage } from '@utils/storage';
import { useEffect, useState } from 'react';

export function useStore<T extends keyof LocalStorage>(keyOfStorage: T, refetch = false) {
  const [result, setResult] = useState<LocalStorage[T]>();

  useEffect(() => {
    let ignore = false;

    getFromStorage(keyOfStorage).then((res) => {
      if (!ignore) {
        setResult(res);
      }
    });

    return () => {
      ignore = true;
    };
  }, [keyOfStorage, refetch]);

  return result;
}
