"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
	date = new Date();
	id = (Date.now() + "").slice(-10);
	// clicks = 0;
	constructor(coords, distance, duration) {
		this.coords = coords;
		this.distance = distance;
		this.duration = duration;
	}
	_setDescription() {
		// prettier-ignore
		const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
		this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
			months[this.date.getMonth()]
		} ${this.date.getDate()}`;
	}
	// _click() {
	// 	this.clicks++;
	// }
}

class Running extends Workout {
	type = "running";
	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration);
		this.cadence = cadence;
		this.calcPace();
		this._setDescription();
	}
	calcPace() {
		// pace=time/distance
		this.pace = this.duration / this.distance;
		return this.pace;
	}
}

class Cycling extends Workout {
	type = "cycling";
	constructor(coords, distance, duration, elevationGain) {
		super(coords, distance, duration, elevationGain);
		this.elevationGain = elevationGain;
		this.calcSpeed();
		this._setDescription();
	}
	calcSpeed() {
		this.speed = this.distance / (this.duration / 60); //duration is in minutes converting to hours
	}
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

class App {
	#map;
	#mapEvent;
	#workouts = [];
	#mapZoomLevel = 13;
	constructor() {
		this._getPosition();
		//displaying workout(pin) on map
		form.addEventListener("submit", this._newWorkout.bind(this));
		// toggling b/w elevations and cadence
		inputType.addEventListener("change", this._toggleElevationFeild);
		//move to marker
		containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
		// get local data
		this._getLocalStorage();
	}

	_getPosition() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				this._loadMap.bind(this),
				function () {
					alert("Sorry could not find your location");
				}
			);
		}
	}

	_loadMap(position) {
		// console.log(position);
		const { latitude } = position.coords;
		const { longitude } = position.coords;
		const coords = [latitude, longitude];

		// load map(leaflet code)
		this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
		L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.#map);

		// show form
		this.#map.on("click", this._showForm.bind(this));

		// show markers form localStorage
		this.#workouts.forEach((work) => {
			this._renderWorkoutMarker(work);
		});
	}

	_showForm(mapE) {
		this.#mapEvent = mapE;
		form.classList.remove("hidden");
		inputDistance.focus();
	}

	_hideForm() {
		// clear fields
		inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value =
			"";
		form.style.display = "none";
		form.classList.add("hidden");
		setTimeout(() => (form.style.display = "grid"), 1000);
	}

	_newWorkout(e) {
		e.preventDefault();
		const { lat, lng } = this.#mapEvent.latlng;
		// check if data is valid
		const type = inputType.value;
		const distance = +inputDistance.value;
		const duration = +inputDuration.value;
		let workout;

		const validInputs = (...inputs) =>
			inputs.every((inp) => Number.isFinite(inp));
		const allPostive = (...inputs) => inputs.every((inp) => inp > 0);

		// if workout running,create running object
		if (type === "running") {
			const cadence = +inputCadence.value;
			if (
				!validInputs(distance, duration, cadence) ||
				!allPostive(distance, duration, cadence)
			)
				return alert("Enter positive numbers only");
			workout = new Running([lat, lng], distance, duration, cadence);
		}

		// if workout cycling,create cycling object
		if (type === "cycling") {
			const elevation = +inputElevation.value;
			if (
				!validInputs(distance, duration, elevation) ||
				!allPostive(distance, duration)
			)
				return alert("Enter positive numbers only");
			workout = new Cycling([lat, lng], distance, duration, elevation);
		}

		// add new object to workout array
		this.#workouts.push(workout);

		// render workout marker(pin)
		this._renderWorkoutMarker(workout);

		// hide form
		this._hideForm();

		// render workout activites
		this._renderWorkout(workout);

		// set local storage to all workouts
		this._setLocalStorage();
	}

	_renderWorkoutMarker(workout) {
		// console.log(lat, lng);
		L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxWidth: 250,
					minWidth: 200,
					autoClose: false,
					closeOnClick: false,
					className: `${workout.type}-popup`,
				})
			)
			.setPopupContent(
				`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
			)
			.openPopup();
	}

	// toggle b/w elevation and cadence
	_toggleElevationFeild() {
		inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
		inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
	}

	_renderWorkout(workout) {
		let html = `<li class="workout workout--${workout.type}" data-id="${
			workout.id
		}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
							workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
						}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
				</div>`;
		if (workout.type === "running") {
			html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
		}
		if (workout.type === "cycling") {
			html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
		}
		form.insertAdjacentHTML("afterend", html);
	}

	_moveToPopup(e) {
		const workoutEl = e.target.closest(".workout");
		if (!workoutEl) return;
		const workout = this.#workouts.find(
			(work) => work.id === workoutEl.dataset.id
		);
		this.#map.setView(workout.coords, this.#mapZoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});

		// workout._click();
	}

	_setLocalStorage() {
		localStorage.setItem("workouts", JSON.stringify(this.#workouts));
	}
	_getLocalStorage() {
		const data = JSON.parse(localStorage.getItem("workouts"));
		console.log(data);

		if (!data) return;

		this.#workouts = data;

		this.#workouts.forEach((work) => {
			this._renderWorkout(work);
		});
	}
	_reset() {
		localStorage.removeItem("workouts");
		location.reload();
	}
}
const app = new App();
