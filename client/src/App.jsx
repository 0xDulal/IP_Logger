import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Globe,
  Monitor,
  MapPin,
  Clock,
  Shield,
  Smartphone,
  Server
} from 'lucide-react';

const socket = io('/');

function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial logs
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      });

    socket.on('new-log', (newLog) => {
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    });

    return () => {
      socket.off('new-log');
    };
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Visitor Analytics</h1>
          <p className="text-text-dim flex items-center gap-2">
            <span className="live-indicator"></span> Real-time traffic monitoring active
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm text-text-dim">Connected Nodes</p>
          <p className="text-2xl font-mono">01</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id || log.timestamp}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="glass p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between"
            >
              <div className="flex gap-4 items-center">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  {log.device === 'Mobile' ? <Smartphone size={24} className="text-indigo-400" /> : <Monitor size={24} className="text-indigo-400" />}
                </div>
                <div>
                  <h3 className="text-xl font-mono font-bold">{log.ip}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-text-dim">
                    <span className="flex items-center gap-1"><Monitor size={14} /> {log.browser}</span>
                    <span className="flex items-center gap-1"><Server size={14} /> {log.os}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:flex gap-8 items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-text-dim uppercase tracking-wider mb-1">Location</span>
                  <span className="flex items-center gap-1"><MapPin size={16} className="text-rose-400" /> {log.city}, {log.country}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-text-dim uppercase tracking-wider mb-1">Time</span>
                  <span className="flex items-center gap-1 text-amber-400"><Clock size={16} /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && !loading && (
          <div className="w-full text-center py-20 glass">
            <Activity className="mx-auto mb-4 text-text-dim opacity-20" size={48} />
            <p className="text-text-dim">No traffic detected yet. Access /log to see results.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
