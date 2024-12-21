// Optional: Add a smooth transition for dropdown opening
document.querySelectorAll('.dropdown-container').forEach(dropdown => {
    dropdown.addEventListener('mouseenter', () => {
      const menu = dropdown.querySelector('.dropdown-menu');
      menu.style.display = 'block';
      setTimeout(() => {
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(0)';
      }, 10);
    });
  
    dropdown.addEventListener('mouseleave', () => {
      const menu = dropdown.querySelector('.dropdown-menu');
      menu.style.opacity = '0';
      menu.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        menu.style.display = 'none';
      }, 300);
    });
  });
  
 