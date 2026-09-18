document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) {
      year.textContent = new Date().getFullYear();
    }

    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");

    if (contactForm && formStatus) {
      contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : "";
        const formData = new FormData(contactForm);

        formStatus.className = "form-status";
        formStatus.textContent = "Slanje poruke...";
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Šalje se...";
        }

        try {
          const response = await fetch(contactForm.action, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json"
            }
          });

          if (!response.ok) {
            throw new Error("Slanje trenutno nije dostupno.");
          }

          formStatus.classList.add("success");
          formStatus.textContent = "Hvala na poruci. Javit ćemo se u najkraćem roku.";
          contactForm.reset();
        } catch (error) {
          formStatus.classList.add("error");
          formStatus.textContent = "Poruka nije poslana. Pišite direktno na hhauto.ba@icloud.com ili pozovite (+387) 61 696 704.";
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          }
        }
      });
    }

    
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    const navAnchors = document.querySelectorAll(".nav-links a");
  
    if (hamburger && navLinks) {
      const setMenu = (open) => {
        navLinks.classList.toggle("open", open);
        hamburger.classList.toggle("open", open);
        document.body.classList.toggle("menu-open", open);
        hamburger.setAttribute("aria-expanded", String(open));
        hamburger.setAttribute("aria-label", open ? "Zatvori meni" : "Otvori meni");
      };

      hamburger.addEventListener("click", () => {
        setMenu(!navLinks.classList.contains("open"));
      });
  
      navAnchors.forEach(a => {
        a.addEventListener("click", () => {
          setMenu(false);
        });
      });

      document.addEventListener("click", (event) => {
        if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
          setMenu(false);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 768) setMenu(false);
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
  
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(nextSlide, 5000);
    }
  });
  
