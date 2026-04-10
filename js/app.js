/* ====================================
   蒲草书屋 - 核心应用逻辑
   ==================================== */

// ---- 从 localStorage 同步后台编辑的数据（如有）----
(function syncFromAdmin() {
  const KEYS = {
    articles: 'pugrassbookhouse_articles',
    categories: 'pugrassbookhouse_categories',
    tags: 'pugrassbookhouse_tags',
  };
  try {
    const savedArticles = localStorage.getItem(KEYS.articles);
    const savedCategories = localStorage.getItem(KEYS.categories);
    const savedTags = localStorage.getItem(KEYS.tags);
    if (savedArticles) {
      // 将 data.js 的 ARTICLES 替换为 localStorage 版本
      const parsed = JSON.parse(savedArticles);
      ARTICLES.length = 0;
      parsed.forEach(a => ARTICLES.push(a));
    }
    if (savedCategories) {
      const parsed = JSON.parse(savedCategories);
      CATEGORIES.length = 0;
      parsed.forEach(c => CATEGORIES.push(c));
    }
    if (savedTags) {
      const parsed = JSON.parse(savedTags);
      TAGS.length = 0;
      parsed.forEach(t => TAGS.push(t));
    }
  } catch(e) {
    console.warn('[蒲草书屋] localStorage 数据加载失败，使用默认数据', e);
  }
})();

// ---- 全局状态 ----
const AppState = {
  currentPage: 'home',     // home | article | tags | about
  currentArticleId: null,
  currentCategory: 'all',
  currentTag: null,
  searchQuery: '',
};

// ---- 路由 ----
const Router = {
  navigate(page, params = {}) {
    AppState.currentPage = page;
    Object.assign(AppState, params);
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 更新 URL hash
    const hash = page === 'home' ? '#' : `#${page}${params.id ? '/' + params.id : ''}`;
    history.pushState({ page, ...params }, '', hash);
  },

  render() {
    const { currentPage } = AppState;
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(`page-${currentPage}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('fade-in');
    }

    // 更新导航高亮
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === currentPage);
    });

    // 渲染页面内容
    switch (currentPage) {
      case 'home': renderHome(); break;
      case 'article': renderArticle(AppState.currentArticleId); break;
      case 'tags': renderTags(); break;
      case 'about': renderAbout(); break;
    }
  },

  init() {
    // 处理 hash 路由
    window.addEventListener('popstate', (e) => {
      if (e.state) {
        AppState.currentPage = e.state.page;
        AppState.currentArticleId = e.state.id || null;
        this.render();
        window.scrollTo(0, 0);
      }
    });
    this.render();
  }
};

// ---- 工具函数 ----
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getFilteredArticles() {
  let articles = [...ARTICLES];
  if (AppState.currentCategory !== 'all') {
    articles = articles.filter(a => a.category === AppState.currentCategory);
  }
  if (AppState.searchQuery) {
    const q = AppState.searchQuery.toLowerCase();
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    );
  }
  if (AppState.currentTag) {
    articles = articles.filter(a => a.tags.includes(AppState.currentTag));
  }
  return articles;
}

// ---- 文章卡片组件 ----
function renderArticleCard(article, featured = false) {
  const tagsHTML = article.tags.slice(0, 3).map(t => {
    const tagData = TAGS.find(tag => tag.id === t);
    return tagData ? `<span class="tag" onclick="filterByTag('${t}')">${tagData.name}</span>` : '';
  }).join('');

  const coverStyle = `background: ${article.coverColor};`;

  if (featured) {
    return `
      <article class="article-card featured fade-in" onclick="goToArticle('${article.id}')">
        <div class="card-image">
          <div class="card-placeholder" style="${coverStyle}">
            <span style="font-size:48px">${article.coverEmoji}</span>
          </div>
        </div>
        <div class="card-content">
          <span class="card-category">${article.categoryIcon} ${article.categoryName}</span>
          <h2 class="card-title">${article.title}</h2>
          <p class="card-excerpt">${article.excerpt}</p>
          <div class="card-tags">${tagsHTML}</div>
          <div class="card-meta">
            <span class="date">${formatDate(article.date)}</span>
            <span class="read-time">${article.readTime}阅读</span>
          </div>
        </div>
      </article>`;
  }

  return `
    <article class="article-card fade-in" onclick="goToArticle('${article.id}')">
      <div class="card-image">
        <div class="card-placeholder" style="${coverStyle}">
          <span style="font-size:36px">${article.coverEmoji}</span>
        </div>
      </div>
      <div class="card-content">
        <span class="card-category">${article.categoryIcon} ${article.categoryName}</span>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-excerpt">${article.excerpt}</p>
        <div class="card-tags">${tagsHTML}</div>
        <div class="card-meta">
          <span class="date">${formatDate(article.date)}</span>
          <span class="read-time">${article.readTime}阅读</span>
        </div>
      </div>
    </article>`;
}

// ---- 渲染首页 ----
function renderHome() {
  const articles = getFilteredArticles();

  // 渲染过滤器按钮
  const filterContainer = document.getElementById('filter-buttons');
  if (filterContainer) {
    filterContainer.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-btn ${AppState.currentCategory === cat.id ? 'active' : ''}"
        onclick="setCategory('${cat.id}')">
        <span class="cat-icon">${cat.icon}</span>
        ${cat.name}
        <span style="opacity:0.6; font-size:11px">${cat.count}</span>
      </button>
    `).join('');
  }

  // 渲染文章列表
  const gridContainer = document.getElementById('articles-grid');
  if (gridContainer) {
    if (articles.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--color-gray-light)">
          <div style="font-size:40px; margin-bottom:12px">🔍</div>
          <p>没有找到相关文章</p>
        </div>`;
    } else {
      const featured = articles.find(a => a.featured);
      const rest = articles.filter(a => !a.featured || AppState.currentCategory !== 'all');

      let html = '';
      if (featured && AppState.currentCategory === 'all' && !AppState.searchQuery) {
        html += renderArticleCard(featured, true);
        rest.filter(a => !a.featured).forEach(a => { html += renderArticleCard(a); });
      } else {
        articles.forEach(a => { html += renderArticleCard(a); });
      }
      gridContainer.innerHTML = html;
    }
  }

  // 渲染侧边栏分类
  const catList = document.getElementById('sidebar-categories');
  if (catList) {
    catList.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(cat => `
      <div class="category-item" onclick="setCategory('${cat.id}')">
        <div class="category-item-left">
          <span>${cat.icon}</span>
          <span>${cat.name}</span>
        </div>
        <span class="category-count">${cat.count}</span>
      </div>
    `).join('');
  }

  // 渲染侧边栏标签云
  const tagsCloud = document.getElementById('sidebar-tags');
  if (tagsCloud) {
    tagsCloud.innerHTML = TAGS.map(tag => `
      <span class="tag" onclick="filterByTag('${tag.id}')">${tag.name}</span>
    `).join('');
  }
}

// ---- 渲染文章详情 ----
function renderArticle(id) {
  const article = ARTICLES.find(a => a.id === id);
  if (!article) {
    Router.navigate('home');
    return;
  }

  const container = document.getElementById('article-content');
  if (!container) return;

  // 渲染 Markdown
  const htmlContent = marked.parse(article.content);

  const tagsHTML = article.tags.map(t => {
    const tagData = TAGS.find(tag => tag.id === t);
    return tagData ? `<span class="tag" onclick="filterByTag('${t}')">${tagData.name}</span>` : '';
  }).join('');

  container.innerHTML = `
    <div class="article-breadcrumb">
      <a href="#" onclick="goHome()">首页</a>
      <span class="sep">/</span>
      <span class="cat-crumb" onclick="setCategory('${article.category}')" style="cursor:pointer;color:var(--color-accent)">${article.categoryName}</span>
      <span class="sep">/</span>
      <span style="color:var(--color-gray-dark)">${article.title.slice(0, 20)}…</span>
    </div>

    <header class="article-header">
      <div class="article-category-badge">${article.categoryIcon} ${article.categoryName}</div>
      <h1 class="article-title">${article.title}</h1>
      <p class="article-desc">${article.excerpt}</p>
      <div class="article-meta-row">
        <span>${formatDate(article.date)}</span>
        <div class="dot"></div>
        <span>${article.readTime}阅读</span>
      </div>
    </header>

    <div class="article-cover">
      <div class="card-placeholder" style="background:${article.coverColor}; height:100%; display:flex; align-items:center; justify-content:center; font-size:72px">
        ${article.coverEmoji}
      </div>
    </div>

    <div class="article-body">
      ${htmlContent}
    </div>

    <footer class="article-footer">
      <div class="article-footer-tags">
        <span class="label">标签：</span>
        ${tagsHTML}
      </div>
    </footer>
  `;

  // 代码高亮
  if (typeof hljs !== 'undefined') {
    container.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
  }

  // 生成目录
  const tocContainer = document.getElementById('article-toc');
  if (tocContainer) {
    const headings = container.querySelectorAll('h2, h3');
    if (headings.length > 0) {
      const tocItems = Array.from(headings).map((h, i) => {
        const id = `heading-${i}`;
        h.id = id;
        const level = h.tagName.toLowerCase();
        return `<li class="toc-item ${level}"><a href="#${id}" onclick="event.preventDefault(); scrollToHeading('${id}')">${h.textContent}</a></li>`;
      });
      tocContainer.innerHTML = `
        <div class="toc-widget">
          <div class="widget-title">📑 目录</div>
          <ul class="toc-list">
            ${tocItems.join('')}
          </ul>
        </div>
      `;
      // 设置目录滚动监听
      setupTocObserver();
    } else {
      tocContainer.innerHTML = '';
    }
  }

  // 填充文章侧边栏标签云
  const articleTagsEl = document.getElementById('article-page-tags');
  if (articleTagsEl) {
    articleTagsEl.innerHTML = TAGS.slice(0, 8).map(tag =>
      `<span class="tag" onclick="filterByTag('${tag.id}')">${tag.name}</span>`
    ).join('');
  }

  // 渲染相关文章
  const relatedContainer = document.getElementById('related-articles');
  if (relatedContainer) {
    const related = ARTICLES
      .filter(a => a.id !== id && a.category === article.category)
      .slice(0, 3);

    if (related.length > 0) {
      relatedContainer.innerHTML = `
        <div class="related-section">
          <div class="related-inner">
            <h2 class="section-title">相关阅读</h2>
            <div class="related-grid">
              ${related.map(a => renderArticleCard(a)).join('')}
            </div>
          </div>
        </div>`;
    } else {
      relatedContainer.innerHTML = '';
    }
  }
}

// ---- 目录滚动高亮 ----
function setupTocObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const tocItem = document.querySelector(`.toc-item a[href="#${id}"]`)?.parentElement;
      if (tocItem) {
        if (entry.isIntersecting) {
          document.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
          tocItem.classList.add('active');
        }
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  document.querySelectorAll('[id^="heading-"]').forEach(el => observer.observe(el));
}

function scrollToHeading(id) {
  const el = document.getElementById(id);
  if (el) {
    const offset = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
}

// ---- 渲染标签页 ----
function renderTags() {
  const tagsGrid = document.getElementById('tags-grid');
  if (tagsGrid) {
    // 按文章数排序的分类
    const allCategories = CATEGORIES.filter(c => c.id !== 'all');
    const allTags = TAGS;

    tagsGrid.innerHTML = `
      <div style="margin-bottom:32px">
        <h2 class="widget-title" style="font-size:15px;color:var(--color-black);margin-bottom:16px">✦ 按类别</h2>
        <div class="tags-grid">
          ${allCategories.map(cat => `
            <div class="tag-card ${AppState.currentTag === cat.id ? 'selected' : ''}"
              onclick="setTagFilter('${cat.id}', 'category')">
              <span class="tag-emoji">${cat.icon}</span>
              <span class="tag-name">${cat.name}</span>
              <span class="tag-count">${cat.count} 篇</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <h2 class="widget-title" style="font-size:15px;color:var(--color-black);margin-bottom:16px">✦ 按标签</h2>
        <div class="tags-grid">
          ${allTags.map(tag => `
            <div class="tag-card ${AppState.currentTag === tag.id ? 'selected' : ''}"
              onclick="setTagFilter('${tag.id}', 'tag')">
              <span class="tag-emoji">🏷</span>
              <span class="tag-name">${tag.name}</span>
              <span class="tag-count">${tag.count} 篇</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 渲染标签文章列表
  renderTagArticles();
}

function setTagFilter(id, type) {
  if (type === 'category') {
    AppState.currentTag = id;
    AppState.currentCategory = id;
  } else {
    AppState.currentTag = id;
    AppState.currentCategory = 'all';
  }
  renderTags();
}

function renderTagArticles() {
  const container = document.getElementById('tag-articles');
  if (!container) return;

  const articles = getFilteredArticles();
  const tagName = AppState.currentTag
    ? (CATEGORIES.find(c => c.id === AppState.currentTag)?.name ||
       TAGS.find(t => t.id === AppState.currentTag)?.name || AppState.currentTag)
    : '全部';

  if (AppState.currentTag && articles.length > 0) {
    container.innerHTML = `
      <div class="tag-articles-section">
        <h2>${tagName} · ${articles.length} 篇文章</h2>
        <div class="articles-grid">
          ${articles.map(a => renderArticleCard(a)).join('')}
        </div>
      </div>
    `;
  } else if (AppState.currentTag && articles.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--color-gray-light)">
        <div style="font-size:40px; margin-bottom:12px">📭</div>
        <p>该标签下暂无文章</p>
      </div>`;
  } else {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--color-gray-light)">
        <div style="font-size:40px; margin-bottom:12px">👆</div>
        <p>选择一个分类或标签查看相关文章</p>
      </div>`;
  }
}

// ---- 渲染关于页面 ----
function renderAbout() {
  // 静态内容，不需要动态渲染
}

// ---- 全局操作函数 ----
function goToArticle(id) {
  Router.navigate('article', { currentArticleId: id });
}

function goHome() {
  AppState.currentCategory = 'all';
  AppState.currentTag = null;
  AppState.searchQuery = '';
  Router.navigate('home');
}

function setCategory(cat) {
  AppState.currentCategory = cat;
  AppState.currentTag = null;
  Router.navigate('home');
}

function filterByTag(tagId) {
  AppState.currentTag = tagId;
  AppState.currentCategory = 'all';
  Router.navigate('tags');
  setTagFilter(tagId, 'tag');
}

// ---- 搜索 ----
function handleSearch(query) {
  AppState.searchQuery = query;
  AppState.currentCategory = 'all';
  if (AppState.currentPage !== 'home') {
    Router.navigate('home');
  } else {
    renderHome();
  }
}

// ---- 移动端菜单 ----
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.classList.toggle('open');
}

// ---- 返回顶部 ----
function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---- 初始化 ----
document.addEventListener('DOMContentLoaded', () => {
  Router.init();
  setupBackToTop();

  // 搜索框
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handleSearch(e.target.value.trim());
      }, 300);
    });
  }

  // 移动端菜单关闭
  document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const menuBtn = document.querySelector('.nav-menu-btn');
    if (navLinks && navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
});
