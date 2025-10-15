/**
 * Animaciones y Efectos Interactivos para DEMO-UIC
 * Efectos sutiles pero eficientes para presentación profesional
 */

class PageAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.setupScrollReveal();
    this.setupHeaderScroll();
    this.setupHoverEffects();
    this.setupFormAnimations();
    this.setupParallax();
  }

  // Animaciones de revelación al hacer scroll
  setupScrollReveal() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    // Elementos que se revelarán al hacer scroll
    const revealElements = document.querySelectorAll('.cuadrooferta, .uvptext, .formulario, .sobrelauniv');
    revealElements.forEach(el => {
      el.classList.add('scroll-reveal');
      observer.observe(el);
    });
  }

  // Efecto de blur en header al hacer scroll
  setupHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScrollTop = scrollTop;
    });
  }

  // Efectos de hover sutiles
  setupHoverEffects() {
    // Efecto magnético sutil en botones importantes
    const buttons = document.querySelectorAll('input.button, a.button, .cuadrooferta');

    buttons.forEach(button => {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        button.style.transform = `translate(${deltaX * 2}px, ${deltaY * 2}px) scale(1.02)`;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
    });

    // Efecto de brillo en títulos
    const titles = document.querySelectorAll('h1, h2, h3');
    titles.forEach(title => {
      title.addEventListener('mouseenter', () => {
        title.style.textShadow = '0 0 20px rgba(54, 148, 95, 0.3)';
      });

      title.addEventListener('mouseleave', () => {
        title.style.textShadow = '';
      });
    });
  }

  // Animaciones del formulario
  setupFormAnimations() {
    const form = document.querySelector('.formulario');
    const inputs = form?.querySelectorAll('input, select');

    inputs?.forEach(input => {
      // Animación de focus
      input.addEventListener('focus', () => {
        input.parentElement?.classList.add('focused');
      });

      input.addEventListener('blur', () => {
        input.parentElement?.classList.remove('focused');
      });

      // Validación visual
      input.addEventListener('input', () => {
        if (input.checkValidity()) {
          input.classList.add('valid');
          input.classList.remove('invalid');
        } else {
          input.classList.add('invalid');
          input.classList.remove('valid');
        }
      });
    });

    // Animación de envío
    const submitButton = document.querySelector('input.button[type="submit"]');
    submitButton?.addEventListener('click', () => {
      if (form?.checkValidity()) {
        form.classList.add('submitting');
        submitButton.value = 'Enviando...';

        // Simular envío (quitar en producción)
        setTimeout(() => {
          form.classList.remove('submitting');
          submitButton.value = 'Enviar Información';
        }, 2000);
      }
    });
  }

  // Efecto parallax sutil
  setupParallax() {
    const parallaxElements = document.querySelectorAll('.modeloe, .formayuic');

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;

      parallaxElements.forEach(element => {
        element.style.transform = `translateY(${rate * 0.1}px)`;
      });
    });
  }
}

// Efectos adicionales de micro-interacciones
class MicroInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.setupButtonRipples();
    this.setupImageZoom();
    this.setupTextHighlight();
  }

  // Efecto ripple en botones
  setupButtonRipples() {
    const buttons = document.querySelectorAll('input.button, a.button, button');

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        button.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  }

  // Zoom sutil en imágenes
  setupImageZoom() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      img.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)';
        img.style.transition = 'transform 0.3s ease';
      });

      img.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
      });
    });
  }

  // Highlight en texto importante
  setupTextHighlight() {
    const importantText = document.querySelectorAll('h1, h2, h3, .rc700, .rc400');

    importantText.forEach(text => {
      text.addEventListener('mouseenter', () => {
        text.style.color = '#36945F';
        text.style.transition = 'color 0.3s ease';
      });

      text.addEventListener('mouseleave', () => {
        text.style.color = '';
      });
    });
  }
}

// Loading animation inicial
class LoadingEffects {
  constructor() {
    this.init();
  }

  init() {
    this.setupLoadingStates();
    this.setupProgressiveLoading();
  }

  setupLoadingStates() {
    // Simular carga inicial
    document.body.classList.add('loading');

    window.addEventListener('load', () => {
      setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
      }, 100);
    });
  }

  setupProgressiveLoading() {
    // Cargar elementos progresivamente
    const elements = document.querySelectorAll('section, .cuadrooferta, .uvptext');

    elements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';

      setTimeout(() => {
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }
}

// Inicializar todas las animaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new PageAnimations();
  new MicroInteractions();
  new LoadingEffects();

  // Performance: reducir animaciones si el usuario prefiere menos movimiento
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
  }
});

// Efectos de scroll adicionales
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const rate = scrolled * -0.5;

  // Efecto parallax sutil en elementos específicos
  const parallaxElements = document.querySelectorAll('.verdemod, .fotomodedos');
  parallaxElements.forEach(element => {
    element.style.transform = `translateY(${rate * 0.05}px)`;
  });
});
