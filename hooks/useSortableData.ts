import { useState, useMemo } from 'react';
import { TestCase } from '../types';

type SortDirection = 'ascending' | 'descending';

// Making key a generic that extends string, and is a key of T
type SortableKey<T> = keyof T;

interface SortConfig<T> {
  key: SortableKey<T>;
  direction: SortDirection;
}

export const useSortableData = <T extends TestCase>(items: T[], config: SortConfig<T> | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Handle array type for compliance
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (Array.isArray(valA) && Array.isArray(valB)) {
            const strA = valA.join(', ');
            const strB = valB.join(', ');
            if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: SortableKey<T>) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
