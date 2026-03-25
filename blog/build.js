#!/usr/bin/env node

/**
 * Igy Blog Build Script
 * JSON記事データから静的HTMLページを生成するビルドスクリプト
 *
 * Usage: node blog/build.js
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DIST_MODE = process.env.BLOG_DIST === '1'; // dist/blog/ にも出力するフラグ

const SITE_URL = 'https://igy-inc.jp';
const POSTS_PER_PAGE = 10;

// ── ヘルパー関数 ──

function loadCategories() {
    return JSON.parse(readFileSync(join(__dirname, 'categories.json'), 'utf-8'));
}

function loadPosts() {
    const postsDir = join(__dirname, 'posts');
    if (!existsSync(postsDir)) return [];
    const files = readdirSync(postsDir).filter(f => f.endsWith('.json'));
    const posts = files.map(f => JSON.parse(readFileSync(join(postsDir, f), 'utf-8')));
    // 公開日の新しい順にソート
    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return posts;
}

function loadTemplate(name) {
    return readFileSync(join(__dirname, 'templates', name), 'utf-8');
}

function ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}

// DIST_MODE: Viteが生成した本番用アセットのパスを取得
function resolveDistAssets() {
    const distAssetsDir = join(ROOT_DIR, 'dist', 'assets');
    if (!existsSync(distAssetsDir)) return null;

    const files = readdirSync(distAssetsDir);
    const styleCss = files.find(f => f.startsWith('style-') && f.endsWith('.css'));
    const blogCss = files.find(f => f.startsWith('blog-') && f.endsWith('.css'));
    const blogJs = files.find(f => f.startsWith('blog-') && f.endsWith('.js'));
    const mainJs = files.find(f => f.startsWith('main-') && f.endsWith('.js'));

    return {
        styleCss: styleCss ? `/assets/${styleCss}` : null,
        blogCss: blogCss ? `/assets/${blogCss}` : null,
        blogJs: blogJs ? `/assets/${blogJs}` : null,
        mainJs: mainJs ? `/assets/${mainJs}` : null,
    };
}

// DIST_MODE: HTMLの/src/パスを本番アセットパスに置換
function replaceAssetsForDist(html, distAssets) {
    if (!distAssets) return html;
    if (distAssets.styleCss) html = html.replace('/src/style.css', distAssets.styleCss);
    if (distAssets.blogCss) html = html.replace('/src/blog.css', distAssets.blogCss);
    if (distAssets.blogJs) html = html.replace(/\/src\/blog\.js/g, distAssets.blogJs);
    if (distAssets.mainJs) html = html.replace(/\/src\/main\.js/g, distAssets.mainJs);
    // type="module" 属性を維持
    return html;
}

// ブログ画像をdist/にコピー
function copyBlogImagesToDist() {
    const srcImagesDir = join(__dirname, 'images');
    const distImagesDir = join(ROOT_DIR, 'dist', 'blog', 'images');
    if (!existsSync(srcImagesDir)) return;
    ensureDir(distImagesDir);
    const images = readdirSync(srcImagesDir);
    images.forEach(img => {
        copyFileSync(join(srcImagesDir, img), join(distImagesDir, img));
    });
    if (images.length > 0) console.log(`✅ ${images.length} 件のブログ画像を dist/blog/images/ にコピー`);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 目次生成 ──

function generateTOC(bodyHtml) {
    const headingRegex = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    let match;
    const items = [];
    while ((match = headingRegex.exec(bodyHtml)) !== null) {
        items.push({
            level: parseInt(match[1]),
            id: match[2],
            text: match[3].replace(/<[^>]+>/g, '')
        });
    }
    if (items.length === 0) return '';

    let html = '<nav class="blog-toc" aria-label="目次">\n<p class="blog-toc-title">目次</p>\n<ol class="blog-toc-list">\n';
    items.forEach(item => {
        const indent = item.level === 3 ? '  ' : '';
        const cls = item.level === 3 ? ' class="blog-toc-sub"' : '';
        html += `${indent}<li${cls}><a href="#${item.id}">${escapeHtml(item.text)}</a></li>\n`;
    });
    html += '</ol>\n</nav>';
    return html;
}

// ── JSON-LD生成 ──

function generateJsonLd(post) {
    const graph = [
        {
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "image": `${SITE_URL}${post.eyecatch}`,
            "author": {
                "@type": "Person",
                "name": "藤井 拓真",
                "jobTitle": "代表",
                "worksFor": {
                    "@type": "Organization",
                    "name": "Igy",
                    "url": `${SITE_URL}/`
                }
            },
            "publisher": {
                "@type": "Organization",
                "name": "Igy",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${SITE_URL}/logo_full.png`
                }
            },
            "datePublished": post.publishedAt,
            "dateModified": post.modifiedAt,
            "mainEntityOfPage": `${SITE_URL}/blog/${post.slug}.html`
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "TOP",
                    "item": `${SITE_URL}/`
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Blog",
                    "item": `${SITE_URL}/blog/`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": post.title,
                    "item": `${SITE_URL}/blog/${post.slug}.html`
                }
            ]
        }
    ];

    // FAQPage schema if post has faq field
    if (post.faq && Array.isArray(post.faq)) {
        graph.push({
            "@type": "FAQPage",
            "mainEntity": post.faq.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answer
                }
            }))
        });
    }

    return JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graph
    }, null, 2);
}

// ── 関連記事HTML生成 ──

function generateRelatedPosts(currentPost, allPosts, categories) {
    const related = allPosts
        .filter(p => p.slug !== currentPost.slug && p.categories && p.categories.some(c => currentPost.categories && currentPost.categories.includes(c)))
        .slice(0, 3);
    if (related.length === 0) return '';

    let html = '<section class="blog-related">\n<h2 class="blog-related-title">関連記事</h2>\n<div class="blog-related-grid">\n';
    related.forEach(post => {
        const catsHtml = post.categories ? post.categories.map(slug => { const cat = categories.find(c => c.slug === slug); return `<span class="blog-card-category">${cat ? cat.name : slug}</span>`; }).join('') : '';
        html += `<a href="/blog/${post.slug}.html" class="blog-card">
          <div class="blog-card-image-wrapper">
            <img src="${post.eyecatch}" alt="${escapeHtml(post.eyecatchAlt || post.title)}" width="${post.eyecatchWidth || 1200}" height="${post.eyecatchHeight || 630}" loading="lazy" class="blog-card-image">
          </div>
          <div class="blog-card-body">
            <div class="blog-card-tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${catsHtml}</div>
    <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
    <time class="blog-card-date" datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
  </div>
</a>\n`;
    });
    html += '</div>\n</section>';
    return html;
}

// ── 記事カードHTML生成 ──

function generatePostCard(post, categories) {
    const catsHtml = post.categories ? post.categories.map(slug => { const cat = categories.find(c => c.slug === slug); return `<span class="blog-card-category" data-category="${slug}">${cat ? cat.name : slug}</span>`; }).join('') : '';
    const catSlugs = post.categories ? post.categories.join(' ') : '';
    return `<a href="/blog/${post.slug}.html" class="blog-card" id="post-${post.slug}" data-categories="${catSlugs}">
      <div class="blog-card-image-wrapper">
        <img src="${post.eyecatch}" alt="${escapeHtml(post.eyecatchAlt || post.title)}" width="${post.eyecatchWidth || 1200}" height="${post.eyecatchHeight || 630}" loading="lazy" class="blog-card-image">
      </div>
      <div class="blog-card-body">
        <div class="blog-card-tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${catsHtml}</div>
    <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
    <time class="blog-card-date" datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
  </div>
</a>`;
}

// ── ページネーションHTML生成 ──

function generatePagination(currentPage, totalPages, baseUrl) {
    if (totalPages <= 1) return '';
    let html = '<nav class="blog-pagination" aria-label="ページネーション">\n';
    if (currentPage > 1) {
        const prevUrl = currentPage === 2 ? baseUrl : `${baseUrl}?page=${currentPage - 1}`;
        html += `<a href="${prevUrl}" class="blog-pagination-btn blog-pagination-prev">← 前のページ</a>\n`;
    }
    for (let i = 1; i <= totalPages; i++) {
        const url = i === 1 ? baseUrl : `${baseUrl}?page=${i}`;
        const cls = i === currentPage ? ' blog-pagination-active' : '';
        html += `<a href="${url}" class="blog-pagination-btn${cls}">${i}</a>\n`;
    }
    if (currentPage < totalPages) {
        html += `<a href="${baseUrl}?page=${currentPage + 1}" class="blog-pagination-btn blog-pagination-next">次のページ →</a>\n`;
    }
    html += '</nav>';
    return html;
}

// ── 記事ページ生成 ──

function buildArticlePages(posts, categories, distAssets) {
    const template = loadTemplate('article.html');
    const outputDir = join(ROOT_DIR, 'blog');
    ensureDir(outputDir);

    // dist/blog/ にも同時出力
    const distOutputDir = join(ROOT_DIR, 'dist', 'blog');
    if (DIST_MODE) ensureDir(distOutputDir);

    posts.forEach(post => {
        const cat = categories.find(c => c.slug === post.category);
        const toc = generateTOC(post.body);
        const relatedHtml = generateRelatedPosts(post, posts, categories);
        const jsonLd = generateJsonLd(post);

        let html = template
            .replace(/{{TITLE}}/g, escapeHtml(post.title))
            .replace(/{{DESCRIPTION}}/g, escapeHtml(post.description))
            .replace(/{{SLUG}}/g, post.slug)
            .replace(/{{CANONICAL_URL}}/g, `${SITE_URL}/blog/${post.slug}.html`)
            .replace(/{{EYECATCH}}/g, post.eyecatch)
            .replace(/{{EYECATCH_FULL_URL}}/g, `${SITE_URL}${post.eyecatch}`)
            .replace(/{{EYECATCH_ALT}}/g, escapeHtml(post.eyecatchAlt || post.title))
            .replace(/{{EYECATCH_WIDTH}}/g, post.eyecatchWidth || 1200)
            .replace(/{{EYECATCH_HEIGHT}}/g, post.eyecatchHeight || 630)
            .replace(/{{PUBLISHED_DATE}}/g, post.publishedAt)
            .replace(/{{MODIFIED_DATE}}/g, post.modifiedAt)
            .replace(/{{PUBLISHED_DATE_DISPLAY}}/g, formatDate(post.publishedAt))
            .replace(/{{MODIFIED_DATE_DISPLAY}}/g, formatDate(post.modifiedAt))
            .replace(/{{CATEGORY_SLUG}}/g, post.category)
            .replace(/{{CATEGORY_NAME}}/g, cat ? cat.name : post.category)
            .replace(/{{TOC}}/g, toc)
            .replace(/{{BODY}}/g, post.body)
            .replace(/{{RELATED_POSTS}}/g, relatedHtml)
            .replace(/{{JSON_LD}}/g, jsonLd)
            .replace(/{{SITE_URL}}/g, SITE_URL);

        writeFileSync(join(outputDir, `${post.slug}.html`), html, 'utf-8');
        if (DIST_MODE) writeFileSync(join(distOutputDir, `${post.slug}.html`), replaceAssetsForDist(html, distAssets), 'utf-8');
        console.log(`✅ 記事ページ生成: blog/${post.slug}.html`);
    });
}

// ── 一覧ページ生成 ──

function buildListPage(posts, categories, distAssets) {
    const template = loadTemplate('list.html');
    const outputDir = join(ROOT_DIR, 'blog');
    ensureDir(outputDir);

    const distOutputDir = join(ROOT_DIR, 'dist', 'blog');
    if (DIST_MODE) ensureDir(distOutputDir);

    // カテゴリフィルタータブ
    let categoryTabs = '<button class="blog-filter-btn blog-filter-active" data-category="all">すべて</button>\n';
    categories.forEach(cat => {
        const count = posts.filter(p => p.categories && p.categories.includes(cat.slug)).length;
        if (count > 0) {
            categoryTabs += `<button class="blog-filter-btn" data-category="${cat.slug}">${cat.name} (${count})</button>\n`;
        }
    });

    // 全記事カード
    let allCards = '';
    posts.forEach(post => {
        allCards += generatePostCard(post, categories) + '\n';
    });

    // ページネーション
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const pagination = generatePagination(1, totalPages, '/blog/');

    let html = template
        .replace(/{{CATEGORY_TABS}}/g, categoryTabs)
        .replace(/{{POST_CARDS}}/g, allCards)
        .replace(/{{PAGINATION}}/g, pagination)
        .replace(/{{TOTAL_POSTS}}/g, posts.length)
        .replace(/{{SITE_URL}}/g, SITE_URL);

    writeFileSync(join(outputDir, 'index.html'), html, 'utf-8');
    if (DIST_MODE) writeFileSync(join(distOutputDir, 'index.html'), replaceAssetsForDist(html, distAssets), 'utf-8');
    console.log(`✅ 一覧ページ生成: blog/index.html`);
}

// ── カテゴリページ生成 ──

function buildCategoryPages(posts, categories, distAssets) {
    const template = loadTemplate('category.html');
    const outputDir = join(ROOT_DIR, 'blog', 'category');
    ensureDir(outputDir);

    const distOutputDir = join(ROOT_DIR, 'dist', 'blog', 'category');
    if (DIST_MODE) ensureDir(distOutputDir);

    categories.forEach(cat => {
        const catPosts = posts.filter(p => p.categories && p.categories.includes(cat.slug));

        let allCards = '';
        catPosts.forEach(post => {
            allCards += generatePostCard(post, categories) + '\n';
        });

        const totalPages = Math.ceil(catPosts.length / POSTS_PER_PAGE);
        const pagination = generatePagination(1, totalPages, `/blog/category/${cat.slug}.html`);

        let html = template
            .replace(/{{CATEGORY_NAME}}/g, cat.name)
            .replace(/{{CATEGORY_SLUG}}/g, cat.slug)
            .replace(/{{CATEGORY_DESCRIPTION}}/g, cat.description)
            .replace(/{{POST_CARDS}}/g, allCards)
            .replace(/{{PAGINATION}}/g, pagination)
            .replace(/{{TOTAL_POSTS}}/g, catPosts.length)
            .replace(/{{SITE_URL}}/g, SITE_URL);

        writeFileSync(join(outputDir, `${cat.slug}.html`), html, 'utf-8');
        if (DIST_MODE) writeFileSync(join(distOutputDir, `${cat.slug}.html`), replaceAssetsForDist(html, distAssets), 'utf-8');
        console.log(`✅ カテゴリページ生成: blog/category/${cat.slug}.html`);
    });
}

// ── sitemap.xml 更新 ──

function updateSitemap(posts, categories) {
    const sitemapPath = join(ROOT_DIR, 'public', 'sitemap.xml');
    const existingContent = readFileSync(sitemapPath, 'utf-8');

    // 既存のブログURLを削除
    const cleaned = existingContent
        .replace(/\s*<url>\s*<loc>https:\/\/igy-inc\.jp\/blog\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '')
        .replace('</urlset>', '');

    let blogUrls = '';

    // ブログ一覧ページ
    blogUrls += `  <url>
    <loc>${SITE_URL}/blog/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

    // カテゴリページ
    categories.forEach(cat => {
        blogUrls += `  <url>
    <loc>${SITE_URL}/blog/category/${cat.slug}.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    });

    // 記事ページ
    posts.forEach(post => {
        blogUrls += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}.html</loc>
    <lastmod>${post.modifiedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    const newSitemap = cleaned + blogUrls + '</urlset>\n';
    writeFileSync(sitemapPath, newSitemap, 'utf-8');
    console.log(`✅ sitemap.xml を更新しました`);
}

// ── メイン処理 ──

function main() {
    console.log('🚀 Igy Blog ビルド開始...\n');

    const categories = loadCategories();
    const posts = loadPosts();

    console.log(`📄 ${posts.length} 件の記事を検出\n`);

    if (posts.length === 0) {
        console.log('⚠️  記事が見つかりません。blog/posts/ にJSONファイルを追加してください。');
        return;
    }

    // DIST_MODE: アセットパスを解決
    const distAssets = DIST_MODE ? resolveDistAssets() : null;
    if (DIST_MODE && distAssets) {
        console.log('📦 DIST_MODE: 本番アセットパスに置換します');
    }

    buildArticlePages(posts, categories, distAssets);
    buildListPage(posts, categories, distAssets);
    buildCategoryPages(posts, categories, distAssets);
    updateSitemap(posts, categories);

    // DIST_MODE: 画像をdist/にコピー
    if (DIST_MODE) copyBlogImagesToDist();

    console.log('\n✨ ビルド完了!');
}

main();
