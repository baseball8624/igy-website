import './blog.css';

// ============================================
// Igy Blog - JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initCategoryFilter();
    initSmoothScrollTOC();
});

// ========== Mobile Menu ==========
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const closeBtn = document.getElementById('mobile-menu-close');

    if (!btn || !menu) return;

    function openMenu() {
        menu.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menu.classList.remove('open');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', openMenu);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    // メニュー外クリックで閉じる
    document.addEventListener('click', (e) => {
        if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
            closeMenu();
        }
    });

    // メニュー内リンククリックで閉じる
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// ========== Category Filter ==========
function initCategoryFilter() {
    const filterContainer = document.getElementById('blog-filter');
    const grid = document.getElementById('blog-grid');

    if (!filterContainer || !grid) return;

    const buttons = filterContainer.querySelectorAll('.blog-filter-btn');
    const cards = grid.querySelectorAll('.blog-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            // アクティブ状態を更新
            buttons.forEach(b => b.classList.remove('blog-filter-active'));
            btn.classList.add('blog-filter-active');

            // カードのフィルタリング
            cards.forEach(card => {
                const catSlugs = card.dataset.categories ? card.dataset.categories.split(' ') : [];

                if (category === 'all' || catSlugs.includes(category)) {
                    card.style.display = '';
                    // フェードインアニメーション
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    requestAnimationFrame(() => {
                        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.style.display = 'none';
                }
            });

            // フィルタ結果が0件の場合のメッセージ
            const visibleCards = grid.querySelectorAll('.blog-card:not([style*="display: none"])');
            let noPostsMsg = grid.querySelector('.blog-no-posts');

            if (visibleCards.length === 0) {
                if (!noPostsMsg) {
                    noPostsMsg = document.createElement('p');
                    noPostsMsg.className = 'blog-no-posts';
                    noPostsMsg.textContent = 'このカテゴリの記事はまだありません。';
                    grid.appendChild(noPostsMsg);
                }
                noPostsMsg.style.display = '';
            } else if (noPostsMsg) {
                noPostsMsg.style.display = 'none';
            }
        });
    });
}

// ========== Smooth Scroll for TOC ==========
function initSmoothScrollTOC() {
    const tocLinks = document.querySelectorAll('.blog-toc a');

    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetEl = document.getElementById(targetId);

            if (targetEl) {
                const headerOffset = 80;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}
