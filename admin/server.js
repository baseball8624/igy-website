import http from 'http';
const { createServer } = http;
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const PORT = 3456;

// Target HTML files
const TARGET_FILES = [
    'index.html',
    'message.html',
    'contact.html',
    'services/marketing.html',
    'services/ai.html',
    'services/analytics.html',
    'blog/google-ads-vs-meta-ads.html',
];

const PAGE_NAMES = {
    'index.html': 'トップページ',
    'message.html': '代表ご挨拶',
    'contact.html': 'お問い合わせ',
    'services/marketing.html': 'Webマーケティング総合支援',
    'services/ai.html': 'AI導入・業務自動化',
    'services/analytics.html': 'データ分析・改善',
    'blog/google-ads-vs-meta-ads.html': 'ブログ: Google広告 vs Meta広告',
};

/**
 * Extract all text-containing elements (h1-h6 and p) from HTML.
 */
function extractTextBlocks(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const blocks = [];
    let id = 0;

    const openTagRe = /(<(h[1-6]|p)\b[^>]*>)/i;
    let inBlock = false;
    let currentTag = '';
    let currentOpenTag = '';
    let currentInner = '';
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!inBlock) {
            const match = line.match(openTagRe);
            if (match) {
                currentTag = match[2].toLowerCase();
                currentOpenTag = match[1];
                startLine = i + 1;
                const afterOpen = line.slice(line.indexOf(match[0]) + match[0].length);
                const closeRe = new RegExp(`</${currentTag}>`, 'i');
                const closeMatch = afterOpen.match(closeRe);
                if (closeMatch) {
                    currentInner = afterOpen.slice(0, closeMatch.index);
                    // Skip empty or script/style blocks
                    const plainText = currentInner.replace(/<[^>]*>/g, '').trim();
                    if (plainText.length > 0) {
                        blocks.push({
                            id: id++,
                            tag: currentTag,
                            innerHTML: currentInner.trim(),
                            lineStart: startLine,
                            lineEnd: startLine,
                        });
                    }
                } else {
                    inBlock = true;
                    currentInner = afterOpen;
                }
            }
        } else {
            const closeRe = new RegExp(`</${currentTag}>`, 'i');
            const closeMatch = line.match(closeRe);
            if (closeMatch) {
                currentInner += '\n' + line.slice(0, closeMatch.index);
                inBlock = false;
                const plainText = currentInner.replace(/<[^>]*>/g, '').trim();
                if (plainText.length > 0) {
                    blocks.push({
                        id: id++,
                        tag: currentTag,
                        innerHTML: currentInner.trim(),
                        lineStart: startLine,
                        lineEnd: i + 1,
                    });
                }
                currentInner = '';
            } else {
                currentInner += '\n' + line;
            }
        }
    }

    return blocks;
}

function getAllBlocks() {
    const result = [];
    for (const file of TARGET_FILES) {
        const fullPath = join(ROOT, file);
        if (!existsSync(fullPath)) continue;
        const blocks = extractTextBlocks(fullPath);
        if (blocks.length > 0) {
            result.push({ file, name: PAGE_NAMES[file] || file, blocks });
        }
    }
    return result;
}

function replaceBlock(file, lineStart, lineEnd, newInnerHTML) {
    const fullPath = join(ROOT, file);
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const section = lines.slice(lineStart - 1, lineEnd).join('\n');
    const tagMatch = section.match(/(<(?:h[1-6]|p)[^>]*>)([\s\S]*?)(<\/(?:h[1-6]|p)>)/i);
    if (!tagMatch) return false;

    const openTag = tagMatch[1];
    const closeTag = tagMatch[3];
    const closeTagLine = lines[lineEnd - 1];
    const indent = closeTagLine.match(/^(\s*)/)?.[1] || '';

    let newSection;
    if (newInnerHTML.includes('\n') || newInnerHTML.length > 80) {
        const contentIndent = indent + '    ';
        newSection = `${openTag}\n${contentIndent}${newInnerHTML.trim()}\n${indent}${closeTag}`;
    } else {
        newSection = `${openTag}${newInnerHTML.trim()}${closeTag}`;
    }

    lines.splice(lineStart - 1, lineEnd - lineStart + 1, ...newSection.split('\n'));
    writeFileSync(fullPath, lines.join('\n'), 'utf-8');
    return true;
}

function deploy(message) {
    try {
        execSync('git add -A', { cwd: ROOT, encoding: 'utf-8' });
        execSync(`git commit -m "${message || '管理画面からテキストを更新'}"`, { cwd: ROOT, encoding: 'utf-8' });
        execSync('git push origin main', { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' });
        return { success: true, message: 'デプロイが完了しました。Vercelで自動的に反映されます。' };
    } catch (e) {
        return { success: false, message: e.message || e.toString() };
    }
}

// ========== HTTP Server ==========
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp' };

// Auto-detect Vite dev server port
let VITE_PORT = null;

async function detectVitePort() {
    for (const port of [5173, 5174, 5175, 5176, 5177]) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:${port}/`, { timeout: 500 }, (res) => {
                    res.resume();
                    resolve();
                });
                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(); });
            });
            VITE_PORT = port;
            console.log(`  ✅ Vite dev server detected at port ${port}`);
            return;
        } catch { }
    }
    console.log(`  ⚠️  Vite dev server not found. Run 'npm run dev' in another terminal.`);
}

/**
 * Proxy request to Vite dev server
 */
function proxyToVite(req, res, targetPath) {
    if (!VITE_PORT) {
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666;"><div style="text-align:center"><h2>⚠️ Viteサーバー未起動</h2><p>別ターミナルで <code>npm run dev</code> を実行してください</p></div></body></html>');
        return;
    }

    const proxyReq = http.request({
        hostname: 'localhost',
        port: VITE_PORT,
        path: targetPath,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${VITE_PORT}` },
    }, (proxyRes) => {
        // Remove X-Frame-Options if present
        const headers = { ...proxyRes.headers };
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
        // Vite might have restarted, try to re-detect
        VITE_PORT = null;
        detectVitePort();
        res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="padding:40px;font-family:sans-serif;color:#666;">プレビューの読み込みに失敗しました。ページをリロードしてください。</body></html>');
    });

    req.pipe(proxyReq);
}

const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // API Routes
    if (url.pathname === '/api/blocks' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getAllBlocks()));
        return;
    }

    if (url.pathname === '/api/blocks' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const { file, lineStart, lineEnd, newInnerHTML } = JSON.parse(body);
                const success = replaceBlock(file, lineStart, lineEnd, newInnerHTML);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    if (url.pathname === '/api/deploy' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            const { message } = JSON.parse(body || '{}');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(deploy(message)));
        });
        return;
    }

    // Proxy /preview/* to Vite dev server
    if (url.pathname.startsWith('/preview/') || url.pathname === '/preview') {
        const targetPath = url.pathname.replace(/^\/preview/, '') || '/';
        proxyToVite(req, res, targetPath + url.search);
        return;
    }

    // Proxy Vite's internal paths (for HMR, assets, etc.)
    if (url.pathname.startsWith('/@') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/images/')) {
        proxyToVite(req, res, url.pathname + url.search);
        return;
    }

    // Static files from admin/public/
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    const fullPath = join(__dirname, 'public', filePath);
    if (!existsSync(fullPath)) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = extname(fullPath);
    res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(readFileSync(fullPath));
});

server.listen(PORT, async () => {
    console.log(`\n  🎛️  テキスト管理ツール起動中`);
    console.log(`  → http://localhost:${PORT}`);
    await detectVitePort();
    console.log('');
});

