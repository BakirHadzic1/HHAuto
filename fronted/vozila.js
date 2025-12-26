document.addEventListener('DOMContentLoaded', () => {
  const ponudaDiv = document.getElementById('ponuda');

  // Fetchaj sa backend-a
  fetch('http://localhost:3000/api/cars')
      .then(response => {
          if (!response.ok) {
              throw new Error('Ne mogu učitati podatke o vozilima');
          }
          return response.json();
      })
      .then(cars => {
          ponudaDiv.innerHTML = '';

          cars.forEach(car => {
              const carCard = document.createElement('div');
              carCard.classList.add('car-card');

              carCard.innerHTML = `
                  <img src="${car.image}" alt="${car.name}">
                  <h3>${car.name}</h3>
                  <p>Godina: ${car.year}</p>
                  <p>Cijena: ${car.price}</p>
                  <button class="details-btn">Pogledaj detalje</button>
              `;

              const detailsBtn = carCard.querySelector('.details-btn');
              detailsBtn.addEventListener('click', () => {
                  alert(
                      `Model: ${car.name}\n` +
                      `Godina: ${car.year}\n` +
                      `Kilometraža: ${car.km}\n` +
                      `Cijena: ${car.price}\n` +
                      `Opis: ${car.description}`
                  );
              });

              ponudaDiv.appendChild(carCard);
          });
      })
      .catch(error => {
          ponudaDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
          console.error(error);
      });
});
