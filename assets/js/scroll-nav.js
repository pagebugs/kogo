/**
 * Scroll Navigation Logic
 * Updates the active state of navigation dots based on the currently visible section.
 */
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('#page-nav a');
  const sections = document.querySelectorAll('section');
  const container = document.querySelector('.scroll-container'); // Get scroll container

  // intersectionObserver Options
  // Detect center of viewport relative to the container or viewport
  const observerOptions = {
    root: null, // Use viewport as root (works for both window scroll and container scroll)
    rootMargin: '-50% 0px -50% 0px', // Check center line
    threshold: 0
  };

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));

        // Add active class to the link corresponding to the visible section
        const activeLink = document.querySelector(`#page-nav a[href="#${entry.target.id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe all sections that have IDs matching the nav links
  navLinks.forEach(link => {
    const targetId = link.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      observer.observe(targetSection);
    }
  });
});
