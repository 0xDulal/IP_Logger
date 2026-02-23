const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const UAParser = require('ua-parser-js');
const axios = require('axios');
const { insertLog, getAllLogs, deleteLog, clearAllLogs } = require('./database');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

// Serving static files (dashboard)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

const getGeo = async (ip) => {
    try {
        // Note: localhost/private IPs will return fail.
        if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) {
            return { city: 'Localhost', region: 'Local', country: 'Local' };
        }
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        if (response.data.status === 'success') {
            return {
                city: response.data.city,
                region: response.data.regionName,
                country: response.data.country
            };
        }
    } catch (error) {
        console.error('Geo lookup error:', error.message);
    }
    return { city: 'Unknown', region: 'Unknown', country: 'Unknown' };
};

app.get('/api/logs', (req, res) => {
    res.json(getAllLogs());
});

app.delete('/api/logs/all', (req, res) => {
    clearAllLogs();
    io.emit('logs-cleared');
    res.json({ success: true });
});

app.delete('/api/logs/:id', (req, res) => {
    deleteLog(req.params.id);
    io.emit('log-deleted', req.params.id);
    res.json({ success: true });
});

// Primary endpoint/middleware for logging
app.get('/log', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const geo = await getGeo(ip);

    const logEntry = {
        ip,
        device: result.device.model || result.device.type || 'Desktop',
        os: `${result.os.name} ${result.os.version}`,
        browser: `${result.browser.name} ${result.browser.version}`,
        ...geo
    };

    const savedLog = insertLog(logEntry);

    // Broadcast to all connected dashboard clients
    io.emit('new-log', savedLog);

    res.send(`
    <html>
      <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
        <div style="text-align: center; border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; background: rgba(30,41,59,0.7);">
          <h1>Logged Successfully</h1>
          <p>Your visit has been recorded.</p>
        </div>
      </body>
    </html>
  `);
});

// Fallback to React app
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
    console.log(`Log URL: http://localhost:${PORT}/log`);
});
