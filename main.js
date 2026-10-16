// Abhideepam - Main JavaScript v2

document.addEventListener('DOMContentLoaded', function() {
  // Mobile Menu
  const toggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => mobileMenu.classList.toggle('active'));
  }

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Active nav
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Language Toggle
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    const savedLang = localStorage.getItem('abhi-lang') || 'en';
    if (savedLang === 'hi') {
      document.body.classList.add('lang-hi');
      langBtn.innerHTML = '<i class="fas fa-globe"></i> EN';
    }

    langBtn.addEventListener('click', () => {
      document.body.classList.toggle('lang-hi');
      const isHi = document.body.classList.contains('lang-hi');
      localStorage.setItem('abhi-lang', isHi ? 'hi' : 'en');
      langBtn.innerHTML = isHi ? '<i class="fas fa-globe"></i> EN' : '<i class="fas fa-globe"></i> हिं';
    });
  }

  // Counter Animation
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const suffix = counter.dataset.suffix || '';
            const duration = 1800;
            const step = target / (duration / 16);
            let current = 0;
            const update = () => {
              current += step;
              if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString() + suffix;
                requestAnimationFrame(update);
              } else {
                counter.textContent = target.toLocaleString() + suffix;
              }
            };
            update();
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });

    const target = document.querySelector('.stats-bar, .hero-stats');
    if (target) observer.observe(target);
  }

  // Admin action alerts (demo)
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const action = this.classList.contains('edit') ? 'Edit' :
                     this.classList.contains('delete') ? 'Delete' : 'Publish';
      if (action === 'Delete') {
        if (confirm('Are you sure you want to delete this item?')) {
          alert('Item deleted (Demo mode — connect backend for real action)');
        }
      } else {
        alert(action + ' action triggered (Demo mode — connect backend for real functionality)');
      }
    });
  });
});
