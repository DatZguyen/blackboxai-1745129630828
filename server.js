const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for tracking links and visitor locations
const trackingLinks = {}; // { linkId: { createdAt, visitors: [{ lat, lng, timestamp }], redirectUrlAllowed, redirectUrlDenied } }

// Endpoint to create a new tracking link
app.post('/api/create-link', (req, res) => {
  const { redirectUrlAllowed, redirectUrlDenied } = req.body;
  const linkId = uuidv4();
  trackingLinks[linkId] = {
    createdAt: Date.now(),
    visitors: [],
    redirectUrlAllowed: redirectUrlAllowed || null,
    redirectUrlDenied: redirectUrlDenied || null,
  };
  res.json({ linkId, trackingUrl: `${req.protocol}://${req.get('host')}/track.html?id=${linkId}` });
});

// Endpoint to receive visitor location data and permission status
app.post('/api/track/:id', (req, res) => {
  const linkId = req.params.id;
  const { lat, lng, permissionGranted } = req.body;
  if (!trackingLinks[linkId]) {
    return res.status(404).json({ error: 'Tracking link not found' });
  }
  if (permissionGranted) {
    trackingLinks[linkId].visitors.push({ lat, lng, timestamp: Date.now() });
    res.json({ status: 'Location recorded', redirectUrl: trackingLinks[linkId].redirectUrlAllowed });
  } else {
    res.json({ status: 'Permission denied', redirectUrl: trackingLinks[linkId].redirectUrlDenied });
  }
});

// Endpoint to get visitor locations for a tracking link
app.get('/api/locations/:id', (req, res) => {
  const linkId = req.params.id;
  if (!trackingLinks[linkId]) {
    return res.status(404).json({ error: 'Tracking link not found' });
  }
  res.json({ visitors: trackingLinks[linkId].visitors });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the tracking page
app.get('/track.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

// Serve the map page
app.get('/map.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

app.listen(port, () => {
  console.log(`Tracking link server running at http://localhost:${port}`);
});
