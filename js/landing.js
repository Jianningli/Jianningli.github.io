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
});
