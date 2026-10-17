import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTable } from '../hooks/useTable';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { save } from '../services/data';
import { dateLabel } from '../lib/utils';
import { PageHeading, Empty, Loading } from '../components/Shared';
import { Button } from '../components/ui/button';
export default function Notifications() {
  const { profile } = useAuth();
  const { rows, loading, error, refresh } = useTable('notifications');
  return (
    <>
      <PageHeading
        title="You’re in the loop."
        description="All your campus updates, in one place."
        action={
          <Button
            variant="outline"
            disabled={!rows.some((r) => !r.read)}
            onClick={async () => {
              if (!profile) return;
              const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', profile.id)
                .eq('read', false);
              if (error) toast.error(error.message);
              else await refresh();
            }}
          >
            <CheckCheck size={17} />
            Mark all as read
          </Button>
        }
      />
      {error && <p className="error-box">{error}</p>}
      {loading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty title="All quiet for now" text="We’ll keep you posted when something new happens." />
      ) : (
        <div className="panel">
          {rows
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
            .map((n) => (
              <article key={n.id} className={`notification-row ${n.read ? '' : 'unread'}`}>
                <span className="card-icon">
                  <Bell size={20} />
                </span>
                <div>
                  <h3>{String(n.title)}</h3>
                  <p>{String(n.message)}</p>
                  <small>{dateLabel(String(n.created_at))}</small>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void save('notifications', { read: true }, n.id)
                        .then(refresh)
                        .catch((e) => toast.error(e.message))
                    }
                  >
                    Mark read
                  </Button>
                )}
              </article>
            ))}
        </div>
      )}
    </>
  );
}
