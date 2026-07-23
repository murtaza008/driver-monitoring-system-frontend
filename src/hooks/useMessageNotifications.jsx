import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

// Persists across DashboardLayout remounts (every route change re-creates the
// layout), so we don't lose track of what's already been notified about, and
// don't re-fire for the same message after navigating.
const lastSeenByDriver = new Map();
let seeded = false;

const isFromDriver = (sender) => sender && sender !== 'Fleet Manager' && sender !== 'dashboard';

export function useMessageNotifications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  // Deliberately a DIFFERENT queryKey from Messages.jsx's ['activeChannels'] —
  // React Query caches by key only, so sharing a key with a query that returns
  // a differently-shaped payload (Messages.jsx converts lastMessageTime to a
  // Date; this hook doesn't need to) caused whichever queryFn resolved last to
  // silently overwrite the other's cache entry, crashing Messages.jsx's render.
  const { data: channels = [] } = useQuery({
    queryKey: ['messageNotificationsPoll'],
    queryFn: async () => {
      const { data } = await api.get('/messages/channels/active');
      return data;
    },
    refetchInterval: 6000,
  });

  useEffect(() => {
    if (!channels.length) return;

    if (!seeded) {
      // First load in this session: just record current state, don't notify
      // for messages that were already there before we started watching.
      channels.forEach(c => {
        if (c.lastMessageTime) lastSeenByDriver.set(c.id, new Date(c.lastMessageTime).getTime());
      });
      seeded = true;
      return;
    }

    channels.forEach(c => {
      if (!c.lastMessageTime || !isFromDriver(c.lastMessageSender)) return;
      const ts = new Date(c.lastMessageTime).getTime();
      const prev = lastSeenByDriver.get(c.id) || 0;
      if (ts <= prev) return;
      lastSeenByDriver.set(c.id, ts);

      const alreadyViewing = locationRef.current.pathname === '/send-message'
        && new URLSearchParams(locationRef.current.search).get('driver') === c.id;
      if (alreadyViewing) return;

      toast({
        title: `New message from ${c.name}`,
        description: c.lastMessage,
        action: (
          <ToastAction altText="View" onClick={() => navigate(`/send-message?driver=${c.id}`)}>
            View
          </ToastAction>
        ),
      });
    });
  }, [channels, toast, navigate]);
}
