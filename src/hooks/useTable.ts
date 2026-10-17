import { useCallback, useEffect, useState } from 'react';
import { list, type Row, type Table } from '../services/data';
import { supabase } from '../lib/supabase';
export function useTable(table: Table) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await list(table));
    } catch (e) {
      setError(e instanceof Error ? e.message : String((e as { message?: string }).message || e));
    } finally {
      setLoading(false);
    }
  }, [table]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!['notices', 'notifications'].includes(table)) return;
    const channel = supabase
      .channel(`${table}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => void refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, refresh]);
  return { rows, loading, error, refresh };
}
