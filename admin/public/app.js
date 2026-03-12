// ========== State ==========
let allData = [];
let currentFile = null;
let currentFilter = 'all';
let editingId = null;
let editBlocks = [];
let previewWidth = 375;

// ========== DOM ==========
const $pageSelect = document.getElementById('page-select');
const $blockList = document.getElementById('block-list');
const $editorEmpty = document.getElementById('editor-empty');
const $previewIframe = document.getElementById('preview-iframe');
const $previewContainer = document.getElementById('preview-container');
const $toast = document.getElementById('toast');
const $deployModal = document.getElementById('deploy-modal');
// Preview uses proxy path (same origin, no cross-origin issues)
const PREVIEW_BASE = '/preview';

// ========== API ==========
async function fetchBlocks() { return (await fetch('/api/blocks')).json(); }
async function saveBlock(file, lineStart, lineEnd, newInnerHTML) {
    return (await fetch('/api/blocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, lineStart, lineEnd, newInnerHTML }) })).json();
}
async function deployAPI(message) {
    return (await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) })).json();
}

// ========== Helpers ==========
function showToast(msg, type = 'success') {
    $toast.textContent = msg; $toast.className = `toast ${type}`; $toast.style.display = 'block';
    setTimeout(() => $toast.style.display = 'none', 2500);
}

function stripTags(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function parseSegments(innerHTML) {
    const segs = [];
    const parts = innerHTML.split(/(<br\s*(?:class="[^"]*")?\s*\/?>)/gi);
    for (const part of parts) {
        if (!part) continue;
        const brMatch = part.match(/^<br\s*(?:class="([^"]*)")?\s*\/?>$/i);
        if (brMatch) {
            segs.push({ type: 'br', brClass: brMatch[1] || '' });
        } else {
            const text = stripTags(part);
            if (text) segs.push({ type: 'text', text, raw: part });
        }
    }
    return segs;
}

function buildHTML(segs) {
    return segs.map(s => {
        if (s.type === 'br') return s.brClass ? `<br class="${s.brClass}">` : '<br>';
        return s.text;
    }).join('');
}

function brLabel(cls) {
    if (!cls) return '常に改行';
    if (cls.includes('md:hidden') && !cls.includes('hidden md')) return 'SPのみ';
    if (cls.includes('hidden') && cls.includes('md:block')) return 'PCのみ';
    if (cls.includes('sp-br')) return 'SPのみ';
    return cls;
}

function brType(cls) {
    if (!cls) return 'always';
    if (cls.includes('md:hidden') || cls.includes('sp-br')) return 'sp';
    if (cls.includes('hidden') && cls.includes('md:block')) return 'pc';
    return 'always';
}

function escAttr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function isHeading(tag) { return /^h[1-6]$/.test(tag); }

// ========== Page Select ==========
function populatePageSelect() {
    $pageSelect.innerHTML = '<option value="">ページを選択...</option>';
    allData.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.file;
        opt.textContent = `${p.name}（${p.blocks.length}件）`;
        if (p.file === currentFile) opt.selected = true;
        $pageSelect.appendChild(opt);
    });
}

$pageSelect.addEventListener('change', () => {
    currentFile = $pageSelect.value || null;
    editingId = null;
    renderBlocks();
    loadPreview();
});

// ========== Filter Tabs ==========
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderBlocks();
    });
});

// ========== Device Tabs ==========
document.querySelectorAll('.device-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.device-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        previewWidth = parseInt(tab.dataset.width);
        applyPreviewWidth();
    });
});

function applyPreviewWidth() {
    if (previewWidth === 0) {
        $previewIframe.style.width = '100%';
    } else {
        $previewIframe.style.width = previewWidth + 'px';
    }
}

// ========== Preview ==========
function loadPreview() {
    if (!currentFile) {
        $previewIframe.style.display = 'none';
        $previewContainer.querySelector('.preview-empty').style.display = 'flex';
        return;
    }
    const emptyEl = $previewContainer.querySelector('.preview-empty');
    if (emptyEl) emptyEl.style.display = 'none';
    $previewIframe.style.display = 'block';
    const path = currentFile === 'index.html' ? '/' : '/' + currentFile;
    $previewIframe.src = `${PREVIEW_BASE}${path}?t=${Date.now()}`;
    applyPreviewWidth();
}

function refreshPreview() {
    if ($previewIframe.src) {
        const url = new URL($previewIframe.src);
        url.searchParams.set('t', Date.now());
        $previewIframe.src = url.toString();
    }
}

document.getElementById('btn-refresh-preview').addEventListener('click', refreshPreview);

// ========== Render Blocks ==========
function renderBlocks() {
    if (!currentFile) {
        $editorEmpty.style.display = 'flex';
        $blockList.style.display = 'none';
        return;
    }

    const page = allData.find(p => p.file === currentFile);
    if (!page) return;

    $editorEmpty.style.display = 'none';
    $blockList.style.display = 'flex';
    $blockList.innerHTML = '';

    let blocks = page.blocks;
    if (currentFilter === 'heading') blocks = blocks.filter(b => isHeading(b.tag));
    if (currentFilter === 'text') blocks = blocks.filter(b => !isHeading(b.tag));

    blocks.forEach(block => {
        const card = document.createElement('div');
        card.className = 'block-card' + (isHeading(block.tag) ? ' is-heading' : '') + (editingId === block.id ? ' editing' : '');
        card.dataset.id = block.id;

        // Parse display
        const segs = parseSegments(block.innerHTML);
        let displayParts = [];
        segs.forEach(s => {
            if (s.type === 'br') {
                const t = brType(s.brClass);
                displayParts.push(`<span class="br-mark ${t}" title="${brLabel(s.brClass)}">↵</span>`);
            } else {
                displayParts.push(escAttr(s.text));
            }
        });

        card.innerHTML = `
      <div class="block-card-header">
        <span class="block-tag ${block.tag}">${block.tag.toUpperCase()}</span>
        <span class="block-line-info">L${block.lineStart}${block.lineEnd !== block.lineStart ? '-' + block.lineEnd : ''}</span>
      </div>
      <div class="block-display">${displayParts.join('')}</div>
      <div class="block-edit"></div>
    `;

        // Click to edit
        card.querySelector('.block-display').addEventListener('click', () => {
            editingId = block.id;
            editBlocks = parseSegments(block.innerHTML);
            renderBlocks();
        });

        // If editing this block, render edit UI
        if (editingId === block.id) {
            renderEditUI(card.querySelector('.block-edit'), block);
        }

        $blockList.appendChild(card);
    });
}

// ========== Edit UI ==========
function renderEditUI(container, block) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'edit-segments';

    editBlocks.forEach((seg, idx) => {
        if (seg.type === 'br') {
            const row = document.createElement('div');
            row.className = 'edit-br-row';
            const t = brType(seg.brClass);
            row.innerHTML = `
        <span class="edit-br-badge ${t}">↵ ${brLabel(seg.brClass)}</span>
        <button class="edit-br-delete" data-idx="${idx}" title="削除">✕</button>
      `;
            row.querySelector('.edit-br-delete').addEventListener('click', () => {
                editBlocks.splice(idx, 1);
                renderEditUI(container, block);
            });
            wrapper.appendChild(row);
        } else {
            const row = document.createElement('div');
            row.className = 'edit-text-row';
            row.innerHTML = `<input type="text" class="edit-text-input" value="${escAttr(seg.text)}" data-idx="${idx}">`;
            const input = row.querySelector('input');
            input.addEventListener('input', e => { editBlocks[idx].text = e.target.value; });
            wrapper.appendChild(row);

            // Add BR buttons after each text
            const addRow = document.createElement('div');
            addRow.className = 'edit-add-row';
            addRow.innerHTML = `
        <span class="edit-add-label">↳ 改行:</span>
        <button class="btn-add-br" data-idx="${idx}" data-br="">常に</button>
        <button class="btn-add-br" data-idx="${idx}" data-br="md:hidden">SP</button>
        <button class="btn-add-br" data-idx="${idx}" data-br="hidden md:block">PC</button>
      `;
            addRow.querySelectorAll('.btn-add-br').forEach(btn => {
                btn.addEventListener('click', () => {
                    const afterIdx = parseInt(btn.dataset.idx);
                    editBlocks.splice(afterIdx + 1, 0, { type: 'br', brClass: btn.dataset.br });
                    renderEditUI(container, block);
                });
            });
            wrapper.appendChild(addRow);
        }
    });

    container.appendChild(wrapper);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    actions.innerHTML = `
    <button class="btn-cancel-edit">キャンセル</button>
    <button class="btn-save">💾 保存してプレビュー更新</button>
  `;
    actions.querySelector('.btn-cancel-edit').addEventListener('click', () => {
        editingId = null;
        renderBlocks();
    });
    actions.querySelector('.btn-save').addEventListener('click', () => saveCurrentEdit(block));
    container.appendChild(actions);
}

async function saveCurrentEdit(block) {
    const newHTML = buildHTML(editBlocks);
    const page = allData.find(p => p.file === currentFile);
    if (!page) return;

    try {
        const result = await saveBlock(currentFile, block.lineStart, block.lineEnd, newHTML);
        if (result.success) {
            showToast('✅ 保存しました');
            editingId = null;
            // Reload data and refresh preview
            allData = await fetchBlocks();
            renderBlocks();
            // Small delay for Vite HMR
            setTimeout(refreshPreview, 300);
        } else {
            showToast('❌ 保存に失敗しました', 'error');
        }
    } catch (e) {
        showToast('❌ ' + e.message, 'error');
    }
}

// ========== Resize Handle ==========
const $resizeHandle = document.getElementById('resize-handle');
const $editorPane = document.getElementById('editor-pane');
let isResizing = false;

$resizeHandle.addEventListener('mousedown', e => {
    isResizing = true;
    $resizeHandle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(window.innerWidth - 300, e.clientX));
    $editorPane.style.width = newWidth + 'px';
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        $resizeHandle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
});

// ========== Deploy ==========
document.getElementById('btn-deploy').addEventListener('click', () => {
    document.getElementById('deploy-result').style.display = 'none';
    $deployModal.style.display = 'flex';
});
document.getElementById('deploy-modal-close').addEventListener('click', () => $deployModal.style.display = 'none');
document.getElementById('deploy-cancel').addEventListener('click', () => $deployModal.style.display = 'none');
$deployModal.addEventListener('click', e => { if (e.target === $deployModal) $deployModal.style.display = 'none'; });

document.getElementById('deploy-exec').addEventListener('click', async () => {
    const btn = document.getElementById('deploy-exec');
    btn.disabled = true; btn.textContent = '⏳ ...';
    try {
        const result = await deployAPI(document.getElementById('deploy-message').value);
        const $r = document.getElementById('deploy-result');
        $r.style.display = 'block';
        $r.className = 'deploy-result ' + (result.success ? 'success' : 'error');
        $r.textContent = (result.success ? '✅ ' : '❌ ') + result.message;
        if (result.success) showToast('🚀 デプロイ完了！');
    } catch (e) {
        const $r = document.getElementById('deploy-result');
        $r.style.display = 'block'; $r.className = 'deploy-result error'; $r.textContent = '❌ ' + e.message;
    } finally { btn.disabled = false; btn.textContent = '🚀 実行'; }
});

// ========== Keyboard ==========
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (editingId !== null) { editingId = null; renderBlocks(); }
        $deployModal.style.display = 'none';
    }
});

// ========== Init ==========
(async () => {
    allData = await fetchBlocks();
    populatePageSelect();
})();
