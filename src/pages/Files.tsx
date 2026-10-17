import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { download } from '../services/data';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { PageHeading, Loading, Empty } from '../components/Shared';
const buckets = [
  'avatars',
  'assignments',
  'submissions',
  'study-materials',
  'notices',
  'event-images',
];
export default function Files() {
  const [bucket, setBucket] = useState('assignments');
  const [files, setFiles] = useState<{ name: string; id: string; size: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string>();
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
      if (error) throw error;
      const nested = await Promise.all(
        (data || [])
          .filter((f) => !f.id)
          .map(async (folder) => {
            const { data, error } = await supabase.storage
              .from(bucket)
              .list(folder.name, { limit: 1000 });
            if (error) throw error;
            return (data || []).map((f) => ({
              id: f.id,
              name: `${folder.name}/${f.name}`,
              size: Number(f.metadata?.size || 0),
            }));
          }),
      );
      setFiles(nested.flat());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [bucket]);
  return (
    <>
      <PageHeading
        title="Uploaded files"
        description="Manage private campus documents and images. Deleting a file can break its linked record."
      />
      <select
        aria-label="Storage bucket"
        value={bucket}
        onChange={(e) => setBucket(e.target.value)}
      >
        {buckets.map((b) => (
          <option key={b}>{b}</option>
        ))}
      </select>
      {error && <p className="error-box">{error}</p>}
      {loading ? (
        <Loading />
      ) : !files.length ? (
        <Empty title="No files in this bucket" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td>{f.name.split('/').at(-1)}</td>
                  <td>{Math.ceil(f.size / 1024)} KB</td>
                  <td>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void download(bucket, f.name).catch((e) => toast.error(e.message))
                      }
                    >
                      Download
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleting(f.name)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="Delete this file?"
        description="The file will no longer be available to anyone, including from linked records."
      >
        <Button
          variant="destructive"
          onClick={async () => {
            if (!deleting) return;
            const { error } = await supabase.storage.from(bucket).remove([deleting]);
            if (error) toast.error(error.message);
            else {
              setDeleting(undefined);
              await load();
            }
          }}
        >
          Permanently delete
        </Button>
      </Dialog>
    </>
  );
}
