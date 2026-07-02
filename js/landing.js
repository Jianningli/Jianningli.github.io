// Landing page entrance animations
document.addEventListener('DOMContentLoaded', () => {
  // Staggered reveal on load — everything is CSS animation driven
  // Additional JS: subtle parallax on orbs
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 0.4;
      orb.style.transform = `translate(${x * factor}px, ${y * factor}px) scale(1)`;
    });
  });

  // Modal Logic for Monthly Highlights
  const highlightBtn = document.getElementById('highlightBtn');
  const highlightModal = document.getElementById('highlightModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (highlightBtn && highlightModal && closeModalBtn) {
    highlightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      highlightModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
      highlightModal.classList.remove('active');
    });

    // Close on click outside
    highlightModal.addEventListener('click', (e) => {
      if (e.target === highlightModal) {
        highlightModal.classList.remove('active');
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && highlightModal.classList.contains('active')) {
        highlightModal.classList.remove('active');
      }
    });
    
    // Highlight Selection Logic
    const highlightSelect = document.getElementById('highlightSelect');
    const highlightPdfEmbed = document.getElementById('highlightPdfEmbed');
    const highlightFullLink = document.getElementById('highlightFullLink');
    const modalBadge = document.getElementById('modalBadge');

    const highlightData = {
      skull_thickness: {
        pdf: 'monthlyResearchHighlights/skull_uncertainty_thickness.pdf',
        link: 'https://www.nature.com/articles/s41598-026-54679-7',
        isNew: true
      },
      computational_rct: {
        pdf: 'monthlyResearchHighlights/overviews_computational_rct.pdf',
        link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12731382/',
        isNew: false
      }
      // Future past highlights can be added here
    };

    if (highlightSelect && highlightPdfEmbed) {
      highlightSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const data = highlightData[val];
        if (data) {
          // Re-create the embed element to ensure the browser loads the new PDF
          const oldEmbed = document.getElementById('highlightPdfEmbed');
          const newEmbed = document.createElement('embed');
          newEmbed.id = 'highlightPdfEmbed';
          newEmbed.src = data.pdf;
          newEmbed.type = 'application/pdf';
          newEmbed.width = '100%';
          newEmbed.height = '100%';
          newEmbed.className = 'full-pdf';
          oldEmbed.parentNode.replaceChild(newEmbed, oldEmbed);
          
          if (highlightFullLink) {
            highlightFullLink.href = data.link;
          }
          
          if (modalBadge) {
            modalBadge.style.display = data.isNew ? 'inline-block' : 'none';
          }
        }
      });
    }
  }
});
