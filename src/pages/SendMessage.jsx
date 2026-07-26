import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Clock, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DriverAvatar from '@/components/ui/DriverAvatar';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import FieldError from '@/components/ui/FieldError';

const MAX_MESSAGE_LENGTH = 1000;

const SendMessage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [activeChannels, setActiveChannels] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedDriver],
    queryFn: async () => {
      if (!selectedDriver) return [];
      const { data } = await api.get(`/messages/${selectedDriver}`);
      return data;
    },
    enabled: !!selectedDriver,
    refetchInterval: 3000 // poll every 3s
  });
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const [driversRes, channelsRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/messages/channels/active')
        ]);
        setDrivers(driversRes.data);
        setActiveChannels(channelsRes.data);
        
        const urlParam = searchParams.get('driverId') || searchParams.get('driver');
        if (urlParam) {
          // Check if urlParam matches a driver's ID directly
          let matchedDriver = driversRes.data.find(d => d.id === urlParam);
          
          // If not, check if it matches a driver's name (since active chats might use name as ID)
          if (!matchedDriver) {
             matchedDriver = driversRes.data.find(d => d.name === urlParam);
          }
          
          if (matchedDriver) {
            setSelectedDriver(matchedDriver.id);
          } else if (channelsRes.data.find(c => c.id === urlParam)) {
            setSelectedDriver(urlParam);
          } else {
            setSelectedDriver(urlParam); // Fallback
          }
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load drivers', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [searchParams]);

  const { toast } = useToast();

  const driver = drivers.find(d => d.id === selectedDriver) || activeChannels.find(c => c.id === selectedDriver);


  const handleSend = async () => {
    const trimmed = message.trim();
    if (!selectedDriver) {
      toast({ title: 'Error', description: 'Please select a driver.', variant: 'destructive' });
      return;
    }
    if (!trimmed) {
      setMessageError('Message cannot be empty.');
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setMessageError(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
      return;
    }
    setMessageError('');
    try {
      await api.post('/messages', { driverId: selectedDriver, text: trimmed });
      const driverName = driver?.name || 'Guest Driver';
      toast({ title: 'Message Sent!', description: `Message sent to ${driverName}.` });
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedDriver] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDriver) {
      toast({ title: 'Select a driver first', variant: 'destructive' });
      return;
    }
    try {
      const { data: allViolations } = await api.get(`/violations/driver/${selectedDriver}`);
      // This is labeled a "Daily" summary but the endpoint returns the driver's
      // entire (all-time) confirmed violation history — filter down to today's
      // UTC date, matching the same "today" boundary the rest of the dashboard
      // and the riskScore/daily-reset system use.
      const todayKey = new Date().toISOString().slice(0, 10);
      const driverViolations = allViolations.filter(v => new Date(v.timestamp).toISOString().slice(0, 10) === todayKey);

      const violationCounts = {};
      driverViolations.forEach(v => {
        violationCounts[v.type] = (violationCounts[v.type] || 0) + 1;
      });

      const driverName = driver?.name || 'Guest Driver';
      let summary = `🕛 Daily Violation Summary for ${driverName}\n\n`;
      summary += `Date: ${new Date().toLocaleDateString()}\n`;
      summary += `Total Violations: ${driverViolations.length}\n\n`;

      if (Object.keys(violationCounts).length > 0) {
        summary += `Breakdown:\n`;
        Object.entries(violationCounts).forEach(([type, count]) => {
          summary += `• ${type}: ${count} times\n`;
        });
        summary += `\nPlease drive safely and follow all guidelines. Your performance score will be affected.`;
      } else {
        summary += `No violations recorded. Keep up the good work! 🎉`;
      }
      setMessage(summary);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate summary', variant: 'destructive' });
    }
  };

  if (loading) return <LoadingSpinner label="Loading..." />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Send Message to Driver</h1>
          <p className="text-muted-foreground text-sm">Send personal or daily summary messages</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
        <div className="space-y-2">
          <Label>Select Driver</Label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Choose a driver..." /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Drivers</SelectLabel>
                {drivers.map(d => (
                  <SelectItem key={`driver-${d.id}`} value={d.id}>
                    <div className="flex items-center gap-2">
                      <DriverAvatar photoUrl={d.photoUrl} name={d.name} size="w-6 h-6" textSize="text-[10px]" />
                      {d.name} ({d.email || d.id})
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>

              {(() => {
                // Channels not already covered by a current driver — e.g. a chat thread
                // left over from a since-deleted driver. Computed separately so the
                // group header itself doesn't render when this ends up empty.
                const extraChannels = activeChannels.filter(c => !drivers.find(d => d.name === c.id || d.id === c.id));
                return extraChannels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>App Users (Active Chats)</SelectLabel>
                    {extraChannels.map(c => (
                      <SelectItem key={`channel-${c.id}`} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectGroup>
                );
              })()}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateSummary} className="gap-2">
            <Clock className="w-4 h-4" />
            Generate Daily Summary
          </Button>
        </div>

        {selectedDriver && (
          <div className="space-y-2">
            <Label>Chat History</Label>
            <div className="h-64 overflow-y-auto bg-muted/20 border border-border/50 rounded-md p-4 space-y-3 flex flex-col">
              {messagesLoading ? (
                <div className="flex justify-center my-auto"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground my-auto text-sm">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => {
                  const isManager = msg.senderId === 'dashboard' || msg.senderName === 'Fleet Manager';
                  return (
                    <div key={msg.id || idx} className={`flex items-end gap-2 max-w-[80%] ${isManager ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      {!isManager && <DriverAvatar photoUrl={driver?.photoUrl} name={msg.senderName} size="w-7 h-7" textSize="text-[10px]" />}
                      <div className={`flex flex-col ${isManager ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-muted-foreground mb-1 px-1">{msg.senderName}</span>
                        <div className={`px-4 py-2 rounded-2xl text-sm ${isManager ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={e => { setMessage(e.target.value); setMessageError(''); }}
            rows={4}
            className="bg-muted/50 text-sm"
            placeholder="Type your message here..."
          />
          <div className="flex items-center justify-between">
            <FieldError message={messageError} />
            <span className={`text-xs ml-auto ${message.length > MAX_MESSAGE_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        <Button onClick={handleSend} className="w-full gap-2 font-semibold">
          <Send className="w-4 h-4" />
          Send Message
        </Button>
      </motion.div>
    </div>
  );
};

export default SendMessage;
