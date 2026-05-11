const initApp = () => {
  const grid = document.getElementById('grid');
  const progressBar = document.getElementById('progressBar');
  
  if (!grid) return;

  // 1. Progress State
  let learnedTricks = [];
  try {
    const saved = localStorage.getItem('learnedTricks');
    if (saved) learnedTricks = JSON.parse(saved);
  } catch (e) {
    learnedTricks = [];
  }

  const cards = grid.querySelectorAll('.trick-card');
  
  const updateProgress = () => {
    if (!progressBar) return;
    const percentage = (learnedTricks.length / cards.length) * 100;
    progressBar.style.width = `${percentage}%`;
  };

  // 2. Setup Cards & Mouse Animations
  cards.forEach(card => {
    const id = card.dataset.id;
    if (learnedTricks.includes(id)) {
      card.classList.add('learned');
      const btn = card.querySelector('.btn-learned');
      if (btn) btn.textContent = 'Mastered';
    }

    // Tilt and Glow Logic
    card.addEventListener('mousemove', (e) => {
      if (card.classList.contains('expanded')) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update Glow Position
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // 3D Tilt Calculation
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (centerY - y) / 15; // Max 10-15 degrees
      const rotateY = (x - centerX) / 15;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });

    // Interaction Logic
    card.addEventListener('click', (e) => {
      const isButton = e.target.closest('.btn-learned');
      if (isButton) {
        e.stopPropagation();
        const id = card.dataset.id;
        const index = learnedTricks.indexOf(id);
        if (index === -1) {
          learnedTricks.push(id);
          card.classList.add('learned');
          isButton.textContent = 'Mastered';
        } else {
          learnedTricks.splice(index, 1);
          card.classList.remove('learned');
          isButton.textContent = 'Mark as Learned';
        }
        localStorage.setItem('learnedTricks', JSON.stringify(learnedTricks));
        updateProgress();
        return;
      }
      
      const isExpanded = card.classList.contains('expanded');
      cards.forEach(c => {
        c.classList.remove('expanded');
        c.style.transform = ''; // Reset any tilt
      });
      
      if (!isExpanded) {
        card.classList.add('expanded');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // 3. Shadow Playground
  const shadowBox = document.getElementById('shadowBox');
  const sliders = document.querySelectorAll('.shadow-slider');
  if (shadowBox && sliders.length) {
    const updateShadow = () => {
      let x = 0, y = 0, b = 0;
      sliders.forEach(s => {
        if (s.dataset.prop === 'x') x = s.value;
        if (s.dataset.prop === 'y') y = s.value;
        if (s.dataset.prop === 'blur') b = s.value;
      });
      shadowBox.style.boxShadow = `${x}px ${y}px ${b}px rgba(0,0,0,0.3)`;
    };
    sliders.forEach(s => s.addEventListener('input', updateShadow));
    updateShadow();
  }

  updateProgress();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
