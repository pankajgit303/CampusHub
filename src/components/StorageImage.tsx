import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export function StorageImage({
  bucket,
  path,
  alt,
  className,
}: {
  bucket: string;
  path: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    void supabase.storage
      .from(bucket)
      .createSignedUrl(path, 300)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl || '');
      });
    return () => {
      active = false;
    };
  }, [bucket, path]);
  return url ? <img src={url} alt={alt} className={className} loading="lazy" /> : null;
}
