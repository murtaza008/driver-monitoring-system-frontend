import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DriverAvatar from '@/components/ui/DriverAvatar';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const Messages = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['activeChannels'],
    queryFn: async () => {
      const [driversRes, channelsRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/messages/channels/active')
      ]);
      
      const dbDrivers = driversRes.data;
      const activeChats = channelsRes.data;
      
      const channelMap = new Map();
      
      activeChats.forEach(c => {
        const matchedDriver = dbDrivers.find(d => d.id === c.id || d.name === c.id);
        channelMap.set(c.id, { 
          id: c.id, 
          name: c.name || c.id, 
          type: 'active',
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime) : null,
          lastMessageSender: c.lastMessageSender,
          photoUrl: matchedDriver?.photoUrl,
          firstName: matchedDriver?.firstName,
          lastName: matchedDriver?.lastName
        });
      });
      
      dbDrivers.forEach(d => {
        if (!channelMap.has(d.id) && !channelMap.has(d.name)) {
          channelMap.set(d.id, { 
            id: d.id, 
            name: d.name, 
            type: 'driver',
            photoUrl: d.photoUrl,
            firstName: d.firstName,
            lastName: d.lastName
          });
        }
      });
      
      // Return active chats first, ordered by recent messages
      const arr = Array.from(channelMap.values());
      arr.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) return b.lastMessageTime - a.lastMessageTime;
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        if (a.type === 'active' && b.type !== 'active') return -1;
        if (a.type !== 'active' && b.type === 'active') return 1;
        return a.name.localeCompare(b.name);
      });
      return arr;
    }
  });

  const filtered = useMemo(() => {
    return channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));
  }, [search, channels]);

  if (isLoading) return <LoadingSpinner label="Loading messages..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground text-sm">Select a driver or active chat to view messages</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search drivers or chats..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
      </div>

      <div className="grid gap-3">
        {filtered.map((channel, i) => (
          <motion.div 
            key={channel.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/send-message?driver=${channel.id}`)}
            className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <DriverAvatar photoUrl={channel.photoUrl} name={channel.name} size="w-10 h-10" textSize="text-sm" />
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-semibold text-foreground truncate">{channel.name}</p>
                {channel.lastMessage ? (
                  <p className={`text-xs truncate mt-0.5 ${channel.lastMessageSender !== 'Fleet Manager' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {channel.lastMessageSender === 'Fleet Manager' || channel.lastMessageSender === 'dashboard' ? 'You: ' : ''}{channel.lastMessage}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">{channel.type === 'active' ? 'Active Chat' : 'Registered Driver'}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {channel.lastMessageTime && (
                <span className="text-[10px] text-muted-foreground">
                  {channel.lastMessageTime.toLocaleDateString() === new Date().toLocaleDateString() 
                    ? channel.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : channel.lastMessageTime.toLocaleDateString()}
                </span>
              )}
              {channel.lastMessage && channel.lastMessageSender !== 'Fleet Manager' && channel.lastMessageSender !== 'dashboard' && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">No drivers or active chats found.</div>
        )}
      </div>
    </div>
  );
};

export default Messages;
