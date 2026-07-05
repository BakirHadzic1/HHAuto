document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) {
      year.textContent = new Date().getFullYear();
    }

    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");

    if (contactForm && formStatus) {
      contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        formStatus.textContent = "Hvala na poruci. Za najbrži odgovor pozovite nas na (+387) 61 696 704.";
        contactForm.reset();
      });
    }

    
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    const navAnchors = document.querySelectorAll(".nav-links a");
  
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("open");
        hamburger.classList.toggle("open");
      });
  
      navAnchors.forEach(a => {
        a.addEventListener("click", () => {
          navLinks.classList.remove("open");
          hamburger.classList.remove("open");
        });
      });
    }
  
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;
  
    let currentIndex = 0;
  
    function showSlide(index) {
      slides.forEach(s => s.classList.remove("active"));
      slides[index].classList.add("active");
    }
  
    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }
  
    setInterval(nextSlide, 3000);
  });
  
