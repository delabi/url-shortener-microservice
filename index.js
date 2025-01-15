require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const CircularJSON = require('circular-json');
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({ extended: false }));

let urlCounter = 1;
const urlDatabase = {};

app.post('/api/shorturl', (req, res, next) => {
  const url = req.body.url;
  const urlPattern = /^(http|https):\/\/[^ "]+$/;

  if (!urlPattern.test(url)) {
    return res.json({ error: 'invalid url' });
  }

  const options = { all: true };

  try {
    const hostname = new URL(url).hostname;
    dns.lookup(hostname, options, (err, addresses) => {
      if (err) {
        return res.status(400).json({ error: 'invalid url' });
      }
      req.url = url;
      next();
    });
  } catch (err) {
    return res.status(400).json({ error: 'invalid url' });
  }

  console.log("Request:" + url);
}, (req, res) => {
  const shortUrl = urlCounter++;
  urlDatabase[shortUrl] = req.url;
  console.log("Url Database: ", JSON.stringify(urlDatabase, null, 2));
  res.json({ original_url: req.url, short_url: shortUrl });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  console.log("ShortURL: " + shortUrl);

  const originalUrl = urlDatabase[shortUrl];
  console.log("Original URL: " + originalUrl);

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});