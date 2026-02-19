import './style.css'

// ============================================
// Igy Corporate Site - Main JavaScript
// Premium Dynamic Effects
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Hide page loader
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      // Remove loader from DOM after animation
      setTimeout(() => loader.remove(), 500);
    }, 800); // Minimum display time for smooth transition
  }

  initScrollProgress();
  initHeader();
  initMobileMenu();
  initScrollReveal();
  initCharacterStagger();
  initCounterAnimation();
  initContactForm();
  initSmoothScroll();
  initGeometricAnimation();
  initFAQ();
  initStickyBanner();
  initTouchFeedback();
});

// ========== Touch Feedback (スマホ用タップエフェクトの強化) ==========
function initTouchFeedback() {
  // iOSで:activeを有効にするためのハック
  document.body.addEventListener('touchstart', () => { }, { passive: true });

  const touchElements = document.querySelectorAll('.btn-primary, .touch-feedback');

  touchElements.forEach(el => {
    el.addEventListener('touchstart', function () {
      this.classList.add('is-active');
    }, { passive: true });

    el.addEventListener('touchend', function () {
      // 少し遅らせてクラスを外すことでアニメーションを見せる
      setTimeout(() => {
        this.classList.remove('is-active');
      }, 150);
    }, { passive: true });

    // キャンセル時も外す
    el.addEventListener('touchcancel', function () {
      this.classList.remove('is-active');
    }, { passive: true });
  });
}

// ========== Scroll Progress Bar ==========
function initScrollProgress() {
  // Create progress bar element
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.prepend(progressBar);

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    // Calculate progress based on total scrollable height
    // Use document.body.scrollHeight/documentElement as fallback
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ========== Header Scroll Effect ==========
function initHeader() {
  const header = document.getElementById('header');
  const hero = document.getElementById('hero');

  if (!header) return;

  let lastScroll = 0;

  const handleScroll = () => {
    const currentScroll = window.scrollY;

    // Header effect
    if (currentScroll > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }

    lastScroll = currentScroll;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// ... (rest of the file until end)

// ========== Mobile Menu ==========
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-menu-close');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!menuBtn || !mobileMenu) return;

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'mobile-menu-overlay';
  overlay.className = 'fixed inset-0 bg-black/50 z-[9998] opacity-0 pointer-events-none transition-opacity duration-300';
  document.body.appendChild(overlay);

  const menuLinks = mobileMenu.querySelectorAll('a');

  const openMenu = () => {
    mobileMenu.classList.add('open');
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
  };

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  menuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

// ========== Premium Scroll Reveal Animation ==========
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-title, .reveal-right');

  if (revealElements.length === 0) return;

  const isMobile = window.innerWidth < 768;
  const observerOptions = {
    root: null,
    rootMargin: isMobile ? '0px' : '-50px',
    threshold: isMobile ? 0.05 : 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
}

// ========== Character/Word Stagger Animation ==========
function initCharacterStagger() {
  const staggerElements = document.querySelectorAll('.char-stagger, .word-stagger');

  staggerElements.forEach(element => {
    const isCharStagger = element.classList.contains('char-stagger');
    const text = element.textContent;

    if (isCharStagger) {
      // Split by characters
      element.innerHTML = text.split('').map((char, i) => {
        if (char === ' ') return ' ';
        return `<span class="char" style="transition-delay: ${i * 0.03}s">${char}</span>`;
      }).join('');
    } else {
      // Split by words
      element.innerHTML = text.split(' ').map((word, i) => {
        return `<span class="word" style="transition-delay: ${i * 0.1}s">${word}</span>`;
      }).join(' ');
    }
  });

  // Observe stagger elements
  const isMobile = window.innerWidth < 768;
  const observerOptions = {
    root: null,
    rootMargin: isMobile ? '0px' : '-50px',
    threshold: isMobile ? 0.05 : 0.1
  };

  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  staggerElements.forEach(el => {
    staggerObserver.observe(el);
  });
}

// ========== Counter Animation ==========
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-number');

  if (counters.length === 0) return;

  const animateCounter = (counter) => {
    const target = parseInt(counter.dataset.target);
    if (isNaN(target)) return;

    const duration = 2000;
    const startTime = performance.now();

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(target * easedProgress);

      counter.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    requestAnimationFrame(updateCounter);
  };

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        counter.classList.add('animate');
        animateCounter(counter);
        counterObserver.unobserve(counter);
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });
}

// ========== Contact Form ==========
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (!data.name || !data.email || !data.message) {
      showNotification('必須項目を入力してください。', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showNotification('有効なメールアドレスを入力してください。', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '送信中...';
    submitBtn.disabled = true;

    // Formspree/FormSubmitへ送信
    const FORM_ENDPOINT = 'https://formsubmit.co/igy.official.contact@gmail.com';

    try {
      // FormSubmit requires _captcha=false for AJAX if desired, or handle redirect.
      // Here we use fetch to send JSON data (or FormData). FormSubmit supports FormData.
      // Adding hidden fields for FormSubmit configuration can be done in HTML or appended here.
      formData.append('_captcha', 'false'); // Optional: Disable captcha if you want (may require paid plan or confirmation)
      formData.append('_template', 'table'); // Optional: format
      formData.append('_subject', '【Igy】お問い合わせがありました'); // Email subject

      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showNotification('お問い合わせありがとうございます。担当者より折り返しご連絡いたします。', 'success');
        form.reset();
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showNotification('送信に失敗しました。時間をおいて再度お試しいただくか、直接メールにてご連絡ください。', 'error');
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
}

// ========== Notification ==========
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-500 translate-y-full opacity-0`;
  notification.style.transitionTimingFunction = 'cubic-bezier(0.25, 1, 0.5, 1)';

  if (type === 'success') {
    notification.classList.add('bg-green-600', 'text-white');
  } else if (type === 'error') {
    notification.classList.add('bg-red-600', 'text-white');
  } else {
    notification.classList.add('bg-primary', 'text-white');
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      notification.classList.remove('translate-y-full', 'opacity-0');
    });
  });

  setTimeout(() => {
    notification.classList.add('translate-y-full', 'opacity-0');
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// ========== Smooth Scroll ==========
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const header = document.getElementById('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ========== Geometric Background Animation ==========
function initGeometricAnimation() {
  const geometricBg = document.querySelector('.geometric-bg');
  if (!geometricBg) return;

  // Create animated orbs
  const orb1 = document.createElement('div');
  orb1.className = 'geometric-orb geometric-orb-1';
  orb1.style.cssText = `
    top: -100px;
    right: -100px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(100, 255, 218, 0.15) 0%, transparent 70%);
  `;

  const orb2 = document.createElement('div');
  orb2.className = 'geometric-orb geometric-orb-2';
  orb2.style.cssText = `
    bottom: -150px;
    left: -150px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(201, 169, 98, 0.12) 0%, transparent 70%);
  `;

  // Find or create the background container
  const bgContainer = geometricBg.querySelector('.absolute.inset-0.overflow-hidden') || geometricBg;

  // Remove old static orbs and add new animated ones
  const oldOrbs = bgContainer.querySelectorAll('.bg-accent\\/5, .bg-accent-gold\\/5');
  oldOrbs.forEach(orb => orb.style.display = 'none');

  bgContainer.appendChild(orb1);
  bgContainer.appendChild(orb2);

  // Optional: Add mouse parallax effect
  let mouseX = 0, mouseY = 0;
  let orbX = 0, orbY = 0;

  geometricBg.addEventListener('mousemove', (e) => {
    const rect = geometricBg.getBoundingClientRect();
    mouseX = (e.clientX - rect.left - rect.width / 2) / rect.width;
    mouseY = (e.clientY - rect.top - rect.height / 2) / rect.height;
  });

  function animateOrbs() {
    // Smooth interpolation
    orbX += (mouseX - orbX) * 0.02;
    orbY += (mouseY - orbY) * 0.02;

    // Apply subtle movement based on mouse position
    orb1.style.transform = `translate(${orbX * 30}px, ${orbY * 30}px) scale(${1 + Math.sin(Date.now() / 3000) * 0.1})`;
    orb2.style.transform = `translate(${-orbX * 20}px, ${-orbY * 20}px) scale(${1 + Math.cos(Date.now() / 4000) * 0.08})`;

    requestAnimationFrame(animateOrbs);
  }

  animateOrbs();
}

// ========== FAQ Accordion ==========
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  if (faqItems.length === 0) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    if (!question || !answer || !icon) return;

    question.addEventListener('click', () => {
      const isOpen = !answer.classList.contains('hidden');

      if (isOpen) {
        // Close
        answer.style.maxHeight = answer.scrollHeight + 'px';
        requestAnimationFrame(() => {
          answer.style.maxHeight = '0px';
        });

        setTimeout(() => {
          answer.classList.add('hidden');
          answer.style.maxHeight = '';
        }, 300);

        icon.style.transform = 'rotate(0deg)';
      } else {
        // Open
        answer.classList.remove('hidden');
        answer.style.maxHeight = '0px';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease-out';

        requestAnimationFrame(() => {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        });

        setTimeout(() => {
          answer.style.maxHeight = '';
          answer.style.overflow = '';
        }, 300);

        icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// ========== LINE強調型 追従コンバージョンバナー ==========
function initStickyBanner() {
  // 既存の静的バナーを削除（もしあれば）
  const existingBanner = document.getElementById('sticky-contact');
  if (existingBanner) existingBanner.remove();

  // バナーHTML構造を作成
  const bannerHTML = `
    <!-- モバイル用バナー -->
    <div id="sticky-banner-mobile" class="sticky-conversion-banner sticky-banner-mobile">
      <!-- LINEボタン（メイン） -->
      <a href="https://lin.ee/JoZaVcY" target="_blank" rel="noopener noreferrer" class="sticky-banner-btn sticky-banner-line">
        <img src="/assets/images/icon-line-white.png" alt="LINE" class="banner-icon" onerror="this.style.display='none'">
        <span>LINE相談</span>
      </a>
      <!-- お問い合わせボタン（サブ） -->
      <a href="/contact.html" class="sticky-banner-btn sticky-banner-contact">
        <svg class="banner-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>お問い合わせ</span>
      </a>
    </div>

    <!-- デスクトップ用バナー -->
    <div id="sticky-banner-desktop" class="sticky-conversion-banner sticky-banner-desktop">
      <!-- LINEボタン（メイン・大きめ） -->
      <a href="https://lin.ee/JoZaVcY" target="_blank" rel="noopener noreferrer" class="sticky-btn-desktop sticky-btn-line">
        <img src="/assets/images/icon-line-white.png" alt="LINE" class="banner-icon-desktop" onerror="this.style.display='none'">
        <span>LINE相談</span>
      </a>
      <!-- お問い合わせボタン（サブ・控えめ） -->
      <a href="/contact.html" class="sticky-btn-desktop sticky-btn-contact">
        <svg class="banner-icon-svg-desktop" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>お問い合わせ</span>
      </a>
    </div>
  `;

  // bodyの最後に挿入
  document.body.insertAdjacentHTML('beforeend', bannerHTML);

  // 要素を取得
  const mobileBanner = document.getElementById('sticky-banner-mobile');
  const desktopBanner = document.getElementById('sticky-banner-desktop');
  const hero = document.getElementById('hero') || document.querySelector('section');

  // スクロールイベントハンドラ
  const handleScroll = () => {
    const currentScroll = window.scrollY;
    // Hero通過後（または300px以降）に表示
    const showThreshold = hero ? (hero.offsetHeight * 0.6) : 300;

    if (currentScroll > showThreshold) {
      if (mobileBanner) mobileBanner.classList.add('visible');
      if (desktopBanner) desktopBanner.classList.add('visible');
    } else {
      if (mobileBanner) mobileBanner.classList.remove('visible');
      if (desktopBanner) desktopBanner.classList.remove('visible');
    }
  };

  // スクロールイベント登録
  window.addEventListener('scroll', handleScroll, { passive: true });
  // 初期チェック
  handleScroll();
}
