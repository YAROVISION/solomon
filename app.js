// ==========================================================================
// Логіка та інтерактивність веб-сайту «Притчі царя Соломона»
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const data = window.SOLOMON_DATA;
  if (!data || !data.chapters) {
    console.error("Дані притч не завантажені.");
    return;
  }

  // --- State Management ---
  const state = {
    currentChapter: 1,
    viewMode: 'single', // 'single' або 'all'
    theme: localStorage.getItem('solomon_theme') || 'royal',
    fontSize: localStorage.getItem('solomon_font_size') || 'md',
    bookmarks: JSON.parse(localStorage.getItem('solomon_bookmarks') || '[]'),
    activeQuoteIndex: 0,
    currentCommentaryKey: null
  };

  // --- DOM Elements ---
  const body = document.body;
  const readingProgress = document.getElementById('reading-progress');
  const chaptersScroll = document.getElementById('chapters-scroll');
  const readerContent = document.getElementById('reader-content');
  const currentChapterLabel = document.getElementById('current-chapter-label');
  const prevChapterBtn = document.getElementById('btn-prev-chapter');
  const nextChapterBtn = document.getElementById('btn-next-chapter');
  const featuredQuoteText = document.getElementById('featured-quote-text');
  const featuredQuoteTag = document.getElementById('featured-quote-tag');
  const featuredQuoteCite = document.getElementById('featured-quote-cite');
  const nextQuoteBtn = document.getElementById('btn-next-quote');
  const copyQuoteBtn = document.getElementById('btn-copy-quote');
  
  // Theme Controls
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const currentThemeName = document.getElementById('current-theme-name');
  const currentThemeDot = document.getElementById('current-theme-dot');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Font Size Buttons
  const fontSizeBtns = document.querySelectorAll('.btn-font-size');

  // Search Elements
  const searchOpenBtn = document.getElementById('btn-open-search');
  const searchModal = document.getElementById('search-modal');
  const searchCloseBtn = document.getElementById('btn-close-search');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  // Bookmark Drawer
  const bookmarksOpenBtn = document.getElementById('btn-open-bookmarks');
  const bookmarksDrawer = document.getElementById('bookmarks-drawer');
  const bookmarksDrawerOverlay = document.getElementById('bookmarks-overlay');
  const bookmarksCloseBtn = document.getElementById('btn-close-bookmarks');
  const bookmarksList = document.getElementById('bookmarks-list');
  const bookmarksCountBadge = document.getElementById('bookmarks-count');

  // Share Modal
  const shareModal = document.getElementById('share-modal');
  const shareCloseBtn = document.getElementById('btn-close-share');
  const sharePreviewText = document.getElementById('share-preview-text');
  const sharePreviewCite = document.getElementById('share-preview-cite');
  const btnCopyShareText = document.getElementById('btn-copy-share-text');

  // Commentary Modal Elements
  const commentaryModal = document.getElementById('commentary-modal');
  const commentaryCloseBtn = document.getElementById('btn-close-commentary');
  const commentaryBadge = document.getElementById('commentary-modal-badge');
  const commentaryTitle = document.getElementById('commentary-modal-title');
  const commentaryContent = document.getElementById('commentary-modal-content');
  const commentarySourceFile = document.getElementById('commentary-source-file');
  const btnPrevCommentary = document.getElementById('btn-prev-commentary');
  const btnNextCommentary = document.getElementById('btn-next-commentary');

  // --- Initialize Application ---
  initTheme();
  initFontSize();
  renderChapterSelector();
  renderFeaturedQuote();
  renderReader();
  updateBookmarksUI();
  setupEventListeners();
  setupScrollProgress();

  // --- Theme Functions ---
  function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('solomon_theme', theme);
    
    if (theme === 'parchment') {
      body.setAttribute('data-theme', 'parchment');
      currentThemeName.textContent = 'Книга притчей';
      currentThemeDot.style.backgroundColor = '#8C2D19';
    } else if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
      currentThemeName.textContent = 'Царська ніч';
      currentThemeDot.style.backgroundColor = '#D4AF37';
    } else {
      body.removeAttribute('data-theme');
      currentThemeName.textContent = 'Царська мудрість';
      currentThemeDot.style.backgroundColor = '#C5A059';
    }

    themeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.themeVal === theme);
    });
  }

  function initTheme() {
    setTheme(state.theme);
  }

  // --- Font Size Functions ---
  function setFontSize(size) {
    state.fontSize = size;
    localStorage.setItem('solomon_font_size', size);
    body.setAttribute('data-font-size', size);

    fontSizeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
  }

  function initFontSize() {
    setFontSize(state.fontSize);
  }

  // --- Chapter Selection Ribbon ---
  function renderChapterSelector() {
    chaptersScroll.innerHTML = '';
    data.chapters.forEach(ch => {
      const chip = document.createElement('button');
      chip.className = `chapter-chip ${ch.chapter === state.currentChapter ? 'active' : ''}`;
      chip.textContent = ch.chapter;
      chip.title = `Глава ${ch.chapter}`;
      chip.addEventListener('click', () => {
        goToChapter(ch.chapter);
      });
      chaptersScroll.appendChild(chip);
    });
  }

  function updateChapterSelectorActive() {
    const chips = chaptersScroll.querySelectorAll('.chapter-chip');
    chips.forEach((chip, index) => {
      chip.classList.toggle('active', (index + 1) === state.currentChapter);
    });
    // Scroll chip into view smoothly
    const activeChip = chaptersScroll.querySelector('.chapter-chip.active');
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // --- Roman Numerals Helper ---
  function toRoman(num) {
    const romanMap = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    let n = num;
    while (n >= 30) { result += 'XXX'; n -= 30; }
    while (n >= 20) { result += 'XX'; n -= 20; }
    while (n >= 10) { result += 'X'; n -= 10; }
    if (n === 9) return result + 'IX';
    if (n >= 5) { result += 'V'; n -= 5; }
    if (n === 4) return result + 'IV';
    while (n >= 1) { result += 'I'; n -= 1; }
    return result;
  }

  // --- Reader Content Renderer ---
  function renderReader() {
    readerContent.innerHTML = '';

    if (state.viewMode === 'single') {
      const chData = data.chapters.find(c => c.chapter === state.currentChapter);
      if (chData) {
        readerContent.appendChild(createChapterSection(chData));
      }
      currentChapterLabel.textContent = `Глава ${state.currentChapter}`;
      prevChapterBtn.disabled = state.currentChapter <= 1;
      nextChapterBtn.disabled = state.currentChapter >= data.chapters.length;
    } else {
      data.chapters.forEach(chData => {
        readerContent.appendChild(createChapterSection(chData));
      });
      currentChapterLabel.textContent = 'Усі притчі (Глави 1–31)';
      prevChapterBtn.disabled = true;
      nextChapterBtn.disabled = true;
    }
    updateChapterSelectorActive();
  }

  function createChapterSection(chData) {
    const section = document.createElement('article');
    section.className = 'chapter-section';
    section.id = `chapter-${chData.chapter}`;

    const roman = toRoman(chData.chapter);

    section.innerHTML = `
      <div class="chapter-header">
        <span class="chapter-number-roman">Розділ ${roman}</span>
        <h2 class="chapter-title">Глава ${chData.chapter}</h2>
        <div class="ornament-divider">
          <div class="ornament-line"></div>
          <div class="ornament-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
            </svg>
          </div>
          <div class="ornament-line"></div>
        </div>
      </div>
      <div class="verses-list">
        ${chData.verses.map(v => {
          const isBookmarked = state.bookmarks.some(b => b.chapter === chData.chapter && b.verse === v.verse);
          const commKey = `${chData.chapter}-${v.verse}`;
          const hasCommentary = data.commentaries && data.commentaries[commKey];

          return `
            <div class="verse-item ${hasCommentary ? 'has-commentary-item' : ''}" data-chapter="${chData.chapter}" data-verse="${v.verse}" id="v-${chData.chapter}-${v.verse}">
              <span class="verse-number">${v.verse}</span>
              <div class="verse-text">
                ${v.text}
                ${hasCommentary ? `
                  <button class="btn-commentary-badge" data-ch="${chData.chapter}" data-v="${v.verse}" title="Читати тлумачення вірша">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span>Тлумачення</span>
                  </button>
                ` : ''}
              </div>
              <div class="verse-actions-bar">
                ${hasCommentary ? `
                  <button class="btn-verse-mini btn-open-comm-mini" title="Відкрити тлумачення" data-ch="${chData.chapter}" data-v="${v.verse}" style="color: var(--accent);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </button>
                ` : ''}
                <button class="btn-verse-mini btn-copy-verse" title="Копіювати вірш" data-ch="${chData.chapter}" data-v="${v.verse}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button class="btn-verse-mini btn-bookmark-verse ${isBookmarked ? 'bookmarked' : ''}" title="Зберегти в закладки" data-ch="${chData.chapter}" data-v="${v.verse}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <button class="btn-verse-mini btn-share-verse" title="Поділитися цитатою" data-ch="${chData.chapter}" data-v="${v.verse}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    return section;
  }

  // --- Featured Aphorism (Цитата дня / Афоризми) ---
  function renderFeaturedQuote() {
    const quote = data.famousQuotes[state.activeQuoteIndex];
    if (!quote) return;
    featuredQuoteTag.textContent = quote.tag;
    featuredQuoteText.textContent = `«${quote.text}»`;
    featuredQuoteCite.textContent = `— Притчі Соломона ${quote.ch}:${quote.v}`;
  }

  function nextQuote() {
    state.activeQuoteIndex = (state.activeQuoteIndex + 1) % data.famousQuotes.length;
    renderFeaturedQuote();
  }

  // --- Navigation & View Mode ---
  function goToChapter(num) {
    if (num < 1 || num > data.chapters.length) return;
    state.currentChapter = num;
    if (state.viewMode === 'all') {
      const el = document.getElementById(`chapter-${num}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      renderReader();
      const readerEl = document.getElementById('reader-section');
      if (readerEl) {
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 60;
        const targetPos = readerEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
        window.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
      }
    }
    updateChapterSelectorActive();
  }

  // --- Commentary Modal Functions ---
  function openCommentaryModal(chapterNum, verseNum) {
    const key = `${chapterNum}-${verseNum}`;
    const comm = data.commentaries && data.commentaries[key];
    if (!comm) return;

    state.currentCommentaryKey = key;
    commentaryBadge.textContent = `Притчі ${chapterNum}:${verseNum}`;
    commentaryTitle.textContent = comm.title || `Тлумачення вірша ${chapterNum}:${verseNum}`;
    commentaryContent.innerHTML = comm.html;
    commentarySourceFile.textContent = `text/${comm.file}`;

    // Update Prev / Next buttons state
    const commKeys = Object.keys(data.commentaries);
    const currIdx = commKeys.indexOf(key);
    btnPrevCommentary.disabled = currIdx <= 0;
    btnNextCommentary.disabled = currIdx >= commKeys.length - 1;

    commentaryModal.classList.add('open');
    commentaryContent.scrollTop = 0;
  }

  function closeCommentaryModal() {
    commentaryModal.classList.remove('open');
  }

  function stepCommentary(direction) {
    const commKeys = Object.keys(data.commentaries);
    const currIdx = commKeys.indexOf(state.currentCommentaryKey);
    const targetIdx = currIdx + direction;
    if (targetIdx >= 0 && targetIdx < commKeys.length) {
      const nextKey = commKeys[targetIdx];
      const parts = nextKey.split('-');
      openCommentaryModal(Number(parts[0]), Number(parts[1]));
    }
  }

  // --- Toast Notification ---
  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  // --- Verse Actions ---
  function copyVerse(chapterNum, verseNum) {
    const ch = data.chapters.find(c => c.chapter === chapterNum);
    const v = ch?.verses.find(item => item.verse === verseNum);
    if (v) {
      const citation = `«${v.text}»\n(Притчі Соломона ${chapterNum}:${verseNum})`;
      navigator.clipboard.writeText(citation).then(() => {
        showToast(`Вірш ${chapterNum}:${verseNum} скопійовано!`);
      });
    }
  }

  function toggleBookmark(chapterNum, verseNum) {
    const index = state.bookmarks.findIndex(b => b.chapter === chapterNum && b.verse === verseNum);
    const ch = data.chapters.find(c => c.chapter === chapterNum);
    const v = ch?.verses.find(item => item.verse === verseNum);

    if (index >= 0) {
      state.bookmarks.splice(index, 1);
      showToast(`Вірш ${chapterNum}:${verseNum} видалено із закладок`);
    } else if (v) {
      state.bookmarks.unshift({
        chapter: chapterNum,
        verse: verseNum,
        text: v.text,
        addedAt: new Date().toLocaleDateString()
      });
      showToast(`Вірш ${chapterNum}:${verseNum} збережено в закладки!`);
    }

    localStorage.setItem('solomon_bookmarks', JSON.stringify(state.bookmarks));
    updateBookmarksUI();
    renderReader();
  }

  function openShareModal(chapterNum, verseNum) {
    const ch = data.chapters.find(c => c.chapter === chapterNum);
    const v = ch?.verses.find(item => item.verse === verseNum);
    if (!v) return;

    sharePreviewText.textContent = `«${v.text}»`;
    sharePreviewCite.textContent = `— Притчі Соломона ${chapterNum}:${verseNum}`;
    shareModal.classList.add('open');
  }

  function updateBookmarksUI() {
    bookmarksCountBadge.textContent = state.bookmarks.length;
    if (state.bookmarks.length === 0) {
      bookmarksList.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 32px 0;">Закладок поки немає.<br>Натискайте іконку прапорця біля віршів, щоб зберегти їх сюди.</p>`;
      return;
    }

    bookmarksList.innerHTML = state.bookmarks.map(b => `
      <div class="bookmark-item">
        <div class="bookmark-meta">
          <span class="bookmark-ref">Притчі ${b.chapter}:${b.verse}</span>
          <button class="btn-verse-mini btn-remove-bm" data-ch="${b.chapter}" data-v="${b.verse}" title="Видалити">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="bookmark-text">«${b.text}»</div>
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          <button class="btn-quote-action btn-jump-bm" data-ch="${b.chapter}" data-v="${b.verse}" style="font-size: 0.75rem; padding: 4px 8px;">
            Читати в контексті →
          </button>
        </div>
      </div>
    `).join('');
  }

  // --- Search Engine ---
  function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      searchResults.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Введіть щонайменше 2 символи для пошуку...</p>`;
      return;
    }

    const matches = [];
    data.chapters.forEach(ch => {
      ch.verses.forEach(v => {
        if (v.text.toLowerCase().includes(q)) {
          matches.push({
            chapter: ch.chapter,
            verse: v.verse,
            text: v.text
          });
        }
      });
    });

    if (matches.length === 0) {
      searchResults.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Нічого не знайдено за запитом "${query}".</p>`;
      return;
    }

    searchResults.innerHTML = matches.slice(0, 50).map(m => {
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const highlighted = m.text.replace(regex, '<mark>$1</mark>');
      return `
        <div class="search-result-item" data-ch="${m.chapter}" data-v="${m.verse}">
          <div class="search-res-title">Притчі ${m.chapter}:${m.verse}</div>
          <div class="search-res-text">${highlighted}</div>
        </div>
      `;
    }).join('');
  }

  // --- Scroll Progress Bar ---
  function setupScrollProgress() {
    window.addEventListener('scroll', () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? (window.pageYOffset / totalScroll) * 100 : 0;
      readingProgress.style.width = `${progress}%`;
    }, { passive: true });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme Switcher Dropdown
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeDropdown.classList.remove('show');
    });

    themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        setTheme(opt.dataset.themeVal);
        themeDropdown.classList.remove('show');
      });
    });

    // Font Size Switches
    fontSizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setFontSize(btn.dataset.size);
      });
    });

    // View Mode Toggle
    document.querySelectorAll('.btn-view-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-view-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.dataset.mode;
        renderReader();
      });
    });

    // Chapter Prev / Next
    prevChapterBtn.addEventListener('click', () => {
      if (state.currentChapter > 1) {
        goToChapter(state.currentChapter - 1);
      }
    });

    nextChapterBtn.addEventListener('click', () => {
      if (state.currentChapter < data.chapters.length) {
        goToChapter(state.currentChapter + 1);
      }
    });

    // Aphorism Card Actions
    nextQuoteBtn.addEventListener('click', nextQuote);
    copyQuoteBtn.addEventListener('click', () => {
      const q = data.famousQuotes[state.activeQuoteIndex];
      const text = `«${q.text}»\n— Притчі Соломона ${q.ch}:${q.v}`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Афоризм скопійовано!');
      });
    });

    // Reader Delegated Events (Verse Click / Actions / Commentary)
    readerContent.addEventListener('click', (e) => {
      // Commentary badge click
      const commBtn = e.target.closest('.btn-commentary-badge') || e.target.closest('.btn-open-comm-mini');
      if (commBtn) {
        e.stopPropagation();
        openCommentaryModal(Number(commBtn.dataset.ch), Number(commBtn.dataset.v));
        return;
      }

      // Copy verse
      const copyBtn = e.target.closest('.btn-copy-verse');
      if (copyBtn) {
        e.stopPropagation();
        copyVerse(Number(copyBtn.dataset.ch), Number(copyBtn.dataset.v));
        return;
      }

      // Bookmark verse
      const bmBtn = e.target.closest('.btn-bookmark-verse');
      if (bmBtn) {
        e.stopPropagation();
        toggleBookmark(Number(bmBtn.dataset.ch), Number(bmBtn.dataset.v));
        return;
      }

      // Share verse
      const shareBtn = e.target.closest('.btn-share-verse');
      if (shareBtn) {
        e.stopPropagation();
        openShareModal(Number(shareBtn.dataset.ch), Number(shareBtn.dataset.v));
        return;
      }

      // If clicked on verse text of verse 1..6 with commentary
      const verseItem = e.target.closest('.verse-item.has-commentary-item');
      if (verseItem && !e.target.closest('button')) {
        openCommentaryModal(Number(verseItem.dataset.chapter), Number(verseItem.dataset.verse));
      }
    });

    // Commentary Modal Events
    commentaryCloseBtn.addEventListener('click', closeCommentaryModal);
    commentaryModal.addEventListener('click', (e) => {
      if (e.target === commentaryModal) {
        closeCommentaryModal();
      }
    });

    btnPrevCommentary.addEventListener('click', () => stepCommentary(-1));
    btnNextCommentary.addEventListener('click', () => stepCommentary(1));

    // Search Modal
    searchOpenBtn.addEventListener('click', () => {
      searchModal.classList.add('open');
      searchInput.value = '';
      searchInput.focus();
      searchResults.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Введіть слово або фразу для пошуку у всіх 31 главах...</p>`;
    });

    searchCloseBtn.addEventListener('click', () => {
      searchModal.classList.remove('open');
    });

    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('open');
      }
    });

    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(searchInput.value);
      }, 250);
    });

    searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item) {
        const ch = Number(item.dataset.ch);
        const v = Number(item.dataset.v);
        searchModal.classList.remove('open');
        goToChapter(ch);
        setTimeout(() => {
          const verseEl = document.getElementById(`v-${ch}-${v}`);
          if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseEl.style.backgroundColor = 'var(--highlight)';
            setTimeout(() => { verseEl.style.backgroundColor = ''; }, 2000);
          }
        }, 150);
      }
    });

    // Bookmarks Drawer
    bookmarksOpenBtn.addEventListener('click', () => {
      bookmarksDrawer.classList.add('open');
      bookmarksDrawerOverlay.classList.add('open');
    });

    const closeBookmarks = () => {
      bookmarksDrawer.classList.remove('open');
      bookmarksDrawerOverlay.classList.remove('open');
    };

    bookmarksCloseBtn.addEventListener('click', closeBookmarks);
    bookmarksDrawerOverlay.addEventListener('click', closeBookmarks);

    bookmarksList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-bm');
      if (removeBtn) {
        toggleBookmark(Number(removeBtn.dataset.ch), Number(removeBtn.dataset.v));
        return;
      }

      const jumpBtn = e.target.closest('.btn-jump-bm');
      if (jumpBtn) {
        const ch = Number(jumpBtn.dataset.ch);
        const v = Number(jumpBtn.dataset.v);
        closeBookmarks();
        goToChapter(ch);
        setTimeout(() => {
          const verseEl = document.getElementById(`v-${ch}-${v}`);
          if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseEl.style.backgroundColor = 'var(--highlight)';
            setTimeout(() => { verseEl.style.backgroundColor = ''; }, 2000);
          }
        }, 150);
      }
    });

    // Share Modal
    shareCloseBtn.addEventListener('click', () => {
      shareModal.classList.remove('open');
    });

    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.classList.remove('open');
      }
    });

    btnCopyShareText.addEventListener('click', () => {
      const text = `${sharePreviewText.textContent}\n${sharePreviewCite.textContent}`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Цитату скопійовано!');
        shareModal.classList.remove('open');
      });
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') {
        if (commentaryModal.classList.contains('open')) {
          btnPrevCommentary.click();
        } else if (state.currentChapter > 1) {
          goToChapter(state.currentChapter - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (commentaryModal.classList.contains('open')) {
          btnNextCommentary.click();
        } else if (state.currentChapter < data.chapters.length) {
          goToChapter(state.currentChapter + 1);
        }
      } else if (e.key === '/') {
        e.preventDefault();
        searchOpenBtn.click();
      } else if (e.key === 'Escape') {
        commentaryModal.classList.remove('open');
        searchModal.classList.remove('open');
        shareModal.classList.remove('open');
        closeBookmarks();
      }
    });
  }
});
