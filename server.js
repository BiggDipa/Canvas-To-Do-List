const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

const homeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas - Assignment Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .header {
            background: #c0302b;
            color: white;
            padding: 15px 30px;
            display: flex;
            align-items: center;
        }
        .logo { font-size: 24px; font-weight: bold; margin-right: 30px; }
        .nav { display: flex; gap: 25px; font-size: 14px; opacity: 0.9; }
        .container {
            max-width: 900px;
            margin: 30px auto;
            padding: 0 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .card-header {
            color: #c0302b;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #c0302b;
        }
        .task-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        .task-item:hover { background: #f9f9f9; }
        .checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid #ddd;
            border-radius: 3px;
            margin-right: 12px;
        }
        .task-text { flex: 1; font-size: 14px; }
        .course-tag {
            background: #e8f4f8;
            color: #0077b6;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin-right: 10px;
        }
        #browserOverlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0d1117;
            z-index: 10000;
            flex-direction: column;
        }
        #browserOverlay.active { display: flex; }
        .browser-header {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 12px 20px;
            display: flex;
            gap: 12px;
            align-items: center;
        }
        #urlInput {
            flex: 1;
            background: #0d1117;
            border: 1px solid #30363d;
            padding: 10px 16px;
            border-radius: 6px;
            color: #c9d1d9;
            font-size: 14px;
            outline: none;
        }
        #urlInput:focus { border-color: #58a6ff; }
        .nav-btn, .go-btn {
            background: #21262d;
            border: 1px solid #30363d;
            color: #c9d1d9;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        }
        .nav-btn:hover, .go-btn:hover { background: #30363d; }
        .go-btn {
            background: #238636;
            border-color: #238636;
        }
        .go-btn:hover { background: #2ea043; }
        .close-btn {
            background: #da3633;
            border-color: #da3633;
            color: white;
        }
        .close-btn:hover { background: #f85149; }
        #contentFrame {
            flex: 1;
            width: 100%;
            border: none;
            background: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">⚡ Canvas</div>
        <div class="nav">
            <span>Dashboard</span>
            <span>Courses</span>
            <span>Calendar</span>
            <span>Inbox</span>
        </div>
    </div>
    <div class="container">
        <div class="card">
            <div class="card-header">Upcoming Assignments</div>
            <div class="task-item">
                <div class="checkbox"></div>
                <span class="course-tag">Honors Precalculus</span>
                <span class="task-text">Continutity WS 2</span>
            </div>
            <div class="task-item">
                <div class="checkbox"></div>
                <span class="course-tag">English 2H</span>
                <span class="task-text">Research Paper: Step 3</span>
            </div>
            <div class="task-item">
                <div class="checkbox"></div>
                <span class="course-tag">French 2</span>
                <span class="task-text">La Marche-Writing Reflection</span>
            </div>
        </div>
    </div>
    <div id="browserOverlay">
        <div class="browser-header">
            <button class="nav-btn" onclick="history.back()">←</button>
            <button class="nav-btn" onclick="history.forward()">→</button>
            <input type="text" id="urlInput" placeholder="Enter URL (e.g., youtube.com)">
            <button class="go-btn" onclick="navigate()">Go</button>
            <button class="close-btn" onclick="toggleBrowser()">Close [Esc]</button>
        </div>
        <iframe id="contentFrame" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"></iframe>
    </div>
    <script>
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                toggleBrowser();
            }
            if (e.key === 'Escape') {
                document.getElementById('browserOverlay').classList.remove('active');
            }
        });
        function toggleBrowser() {
            const overlay = document.getElementById('browserOverlay');
            overlay.classList.toggle('active');
            if (overlay.classList.contains('active')) {
                document.getElementById('urlInput').focus();
            }
        }
        function navigate() {
            const input = document.getElementById('urlInput').value.trim();
            if (!input) return;
            let url = input;
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }
            document.getElementById('contentFrame').src = '/browse?url=' + encodeURIComponent(url);
        }
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') navigate();
        });
    </script>
</body>
</html>`;

function rewriteUrls(html, baseUrl) {
    const $ = cheerio.load(html);
    $('a[href]').each(function() {
        const href = $(this).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('data:')) {
            try {
                const absolute = new URL(href, baseUrl).href;
                $(this).attr('href', '/browse?url=' + encodeURIComponent(absolute));
            } catch(e) {}
        }
    });
    $('img[src]').each(function() {
        const src = $(this).attr('src');
        if (src) {
            try {
                const absolute = new URL(src, baseUrl).href;
                $(this).attr('src', '/resource?url=' + encodeURIComponent(absolute));
            } catch(e) {}
        }
    });
    $('img[srcset]').each(function() {
        const srcset = $(this).attr('srcset');
        if (srcset) {
            const newSrcset = srcset.split(',').map(part => {
                const [url, descriptor] = part.trim().split(/\s+/);
                try {
                    const absolute = new URL(url, baseUrl).href;
                    return '/resource?url=' + encodeURIComponent(absolute) + ' ' + (descriptor || '');
                } catch(e) { return part; }
            }).join(', ');
            $(this).attr('srcset', newSrcset);
        }
    });
    $('link[rel="stylesheet"]').each(function() {
        const href = $(this).attr('href');
        if (href) {
            try {
                const absolute = new URL(href, baseUrl).href;
                $(this).attr('href', '/resource?url=' + encodeURIComponent(absolute));
            } catch(e) {}
        }
    });
    $('script[src]').each(function() {
        const src = $(this).attr('src');
        if (src) {
            try {
                const absolute = new URL(src, baseUrl).href;
                $(this).attr('src', '/resource?url=' + encodeURIComponent(absolute));
            } catch(e) {}
        }
    });
    $('video source[src], audio source[src]').each(function() {
        const src = $(this).attr('src');
        if (src) {
            try {
                const absolute = new URL(src, baseUrl).href;
                $(this).attr('src', '/resource?url=' + encodeURIComponent(absolute));
            } catch(e) {}
        }
    });
    const interceptScript = `
    <script>
    (function() {
        const basePath = '/browse?url=';
        const resPath = '/resource?url=';
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && url.startsWith('http')) {
                url = basePath + encodeURIComponent(url);
            }
            return originalFetch(url, options);
        };
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if (typeof url === 'string' && url.startsWith('http')) {
                url = basePath + encodeURIComponent(url);
            }
            return originalOpen.call(this, method, url, async, user, password);
        };
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.action && form.action.startsWith('http')) {
                e.preventDefault();
                const action = basePath + encodeURIComponent(form.action);
                const formData = new FormData(form);
                const params = new URLSearchParams(formData);
                window.location.href = action + '&' + params.toString();
            }
        }, true);
    })();
    </script>
    `;
    $('head').append(interceptScript);
    return $.html();
}

app.get('/browse', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL required');
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': targetUrl
            },
            redirect: 'follow'
        });
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const html = await response.text();
            const finalUrl = response.url;
            const rewritten = rewriteUrls(html, finalUrl);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(rewritten);
        } else {
            const buffer = await response.buffer();
            res.setHeader('Content-Type', contentType);
            res.send(buffer);
        }
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

app.get('/resource', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL required');
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': targetUrl
            }
        });
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const buffer = await response.buffer();
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(buffer);
    } catch (error) {
        res.status(500).send('Error loading resource');
    }
});

app.post('/browse', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL required');
    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': req.headers['user-agent'],
                'Referer': targetUrl
            },
            body: new URLSearchParams(req.body).toString()
        });
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const html = await response.text();
            const finalUrl = response.url;
            const rewritten = rewriteUrls(html, finalUrl);
            res.setHeader('Content-Type', 'text/html');
            res.send(rewritten);
        } else {
            const buffer = await response.buffer();
            res.setHeader('Content-Type', contentType);
            res.send(buffer);
        }
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

app.get('/', (req, res) => {
    res.send(homeHTML);
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
