// ============================================
// MAIN.JS — Navigation & interactions
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Sidebar nav active state on scroll ----
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(sec => observer.observe(sec));

  // ---- Mobile hamburger ----
  const sidebar = document.getElementById('sidebar');
  const hamburgers = document.querySelectorAll('.hamburger');

  hamburgers.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  });

  // Close sidebar when clicking a nav link on mobile
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 900) {
        sidebar.classList.remove('open');
      }
    });
  });

  // ---- Smooth reveal on scroll ----
  const revealEls = document.querySelectorAll('.project-card, .pub-item, .news-item, .talk-item, .teach-card, .book-card');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${i * 0.05}s`;
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });

  // ---- Dynamic Latest Publications Modal ----
  const pubList = document.querySelector('.pub-list');
  const modalContent = document.getElementById('dynamicModalContent');

  if (pubList && modalContent) {
    const topPubs = Array.from(pubList.querySelectorAll('.pub-item')).slice(0, 3);
    modalContent.innerHTML = topPubs.map(pub => {
      const year = pub.querySelector('.pub-year')?.textContent || '';
      const titleEl = pub.querySelector('.pub-title');
      const venue = pub.querySelector('.pub-venue')?.innerHTML || '';
      const authors = pub.querySelector('.pub-authors')?.textContent || '';
      const links = pub.querySelector('.pub-links')?.innerHTML || '';

      return `
        <div class="modal-pub-item">
          <span class="modal-pub-year">${year}</span>
          <div class="modal-pub-body">
            <p class="modal-pub-title">${titleEl?.outerHTML || ''}</p>
            <p class="modal-pub-venue">${venue}</p>
            <p class="modal-pub-authors">${authors}</p>
            <div class="pub-links">${links}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Add revealed class handler
  document.head.insertAdjacentHTML('beforeend', `<style>
    .revealed { opacity: 1 !important; transform: translateY(0) !important; }
  </style>`);

});
