/* Admin UI Logic */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Highlight Active Nav
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.admin-nav a');
    
    navLinks.forEach(link => {
        if(currentPath.includes(link.getAttribute('href'))) {
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    // 2. Simple Table Row Click (Optional UX)
    // const rows = document.querySelectorAll('.data-table tbody tr');
    // rows.forEach(row => {
    //     row.addEventListener('click', (e) => {
    //         if(e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
    //             const link = row.querySelector('a.btn-secondary');
    //             if(link) window.location.href = link.href;
    //         }
    //     });
    // });
});
