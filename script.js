const BACKEND_API_URL = 'https://pohodvsesvit.onrender.com/api/weather'; 

const ROW_MAP = {
    'icon': 0,
    'cloudiness': 1,
    'temperature': 2,
    'humidity': 3,
    'wind': 4,
    'feelsLike': 5
};

const SELECTORS = {
    cityInput: '#location',
    cityDisplay: '.city h2',
    cityCaption: '.weather-table caption',
    weatherTableBody: '.weather-table tbody',
    cityDatalist: '#city-suggestions',
    errorMessage: '#error-message',
};

const VALID_CITIES = [
    'Стокгольм', 'Гетеборг', 'Мальме', 'Уппсала', 'Вестерос', 
    'Еребру', 'Лінчепінг', 'Гельсінборг', 'Норчепінг', 'Євле'
];

const cityInputElement = document.querySelector(SELECTORS.cityInput);



function displayError(message) {
    const errorEl = document.querySelector(SELECTORS.errorMessage);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block'; 
    }
}

function clearError() {
    const errorEl = document.querySelector(SELECTORS.errorMessage);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none'; // Приховуємо
    }
}

@param {string} mainWeather - Основна категорія (Clear, Rain, Snow, Drizzle, Clouds, Atmosphere, Thunderstorm).
 * @param {string} timePeriod - Час доби ('ніч', 'ранок', 'день', 'вечір').
 * @returns {string} - Назва файлу іконки (наприклад, 'sun_icon.svg').
 */
function getIconPath(mainWeather, timePeriod) {
    
    const isNight = timePeriod.includes('ніч');
    switch (mainWeather) {
        case 'Clear':
            // Ясно
            return isNight ? 'moon_stars_icon.svg' : 'sun_icon.svg';

        case 'Clouds':
            // Хмарно
            return 'moon_cloud_icon.svg'; 

        case 'Rain':
        case 'Drizzle':
            // Дощ/Мряка
            return 'rain_icon.svg'; 
        
        case 'Thunderstorm':
            // Гроза
            return 'cloud_strong_lightning_icon.svg'; 

        case 'Snow':
            // Сніг (Використовуємо заглушку, як ми домовилися)
            return 'rain_icon.svg';

        case 'Atmosphere':
            // Туман/Димка (Використовуємо заглушку, як ми домовилися)
            return 'moon_cloud_icon.svg'; 

        default:
            // Невідома погода
            return 'moon_cloud_icon.svg'; 
    }
}

async function fetchWeatherData(city) {
    if (!city) {
        throw new Error("Назва міста не може бути порожньою");
    }

    try {
    const urlWithCity = `${BACKEND_API_URL}?city=${encodeURIComponent(city)}`;
    const response = await fetch(urlWithCity, {
        method: 'GET', 
        headers: {
            'Accept': 'application/json',
        }
    });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Помилка сервера' }));
            throw new Error(`Помилка HTTP ${response.status}: ${errorData.message || 'Невідома помилка'}`);
        }

        const data = await response.json();
        
        if (!data || typeof data.city !== 'string' || !Array.isArray(data.forecast) || data.forecast.length !== 8) {
            throw new Error("Некоректна структура прогнозу (очікується масив з 8 точок)");
        }
        return data;
    }
    catch (error) {
        console.error("Помилка під час одержання даних про погоду:", error);
        throw new Error(`Не вдалося одержати дані про погоду: ${error.message}`);
    }
}

function updateWeatherUI(cityName, forecastData) {
    const tbody = document.querySelector(SELECTORS.weatherTableBody); 
    if (!tbody) {
        console.error(`Елемент таблиці (${SELECTORS.weatherTableBody}) не знайдено.`);
        return;
    }

    document.querySelector(SELECTORS.cityDisplay).textContent = cityName;
    
    const captionEl = document.querySelector(SELECTORS.cityCaption);
    if (captionEl) {
        captionEl.textContent = `Прогноз погоди для міста ${cityName}`;
    }

    const rows = tbody.querySelectorAll('tr');
    const timePeriods = ['ніч', 'ранок', 'день', 'вечір', 'ніч', 'ранок', 'день', 'вечір'];

    forecastData.forEach((dataPoint, index) => {
        const columnIndex = index + 1; 
        const { temp, feelsLike, humidity, windSpeed, clouds, mainWeather, description } = dataPoint;
        
        const iconCell = rows[ROW_MAP.icon].cells[columnIndex]; 
        if (iconCell) {
            const imgElement = iconCell.querySelector('img');
            if (imgElement) {
                // Використовує додану функцію getIconPath
                imgElement.src = `img/${getIconPath(mainWeather, timePeriods[index])}`; 
                imgElement.alt = description; 
            }
        }

        if (rows[ROW_MAP.cloudiness].cells[columnIndex]) {
            rows[ROW_MAP.cloudiness].cells[columnIndex].textContent = `${clouds}%`;
        }
        
        if (rows[ROW_MAP.temperature].cells[columnIndex]) {
            rows[ROW_MAP.temperature].cells[columnIndex].textContent = `${Math.round(temp)}°C`;
        }
        
        if (rows[ROW_MAP.humidity].cells[columnIndex]) {
            rows[ROW_MAP.humidity].cells[columnIndex].textContent = `${humidity}%`;
        }
        
        if (rows[ROW_MAP.wind].cells[columnIndex]) {
            rows[ROW_MAP.wind].cells[columnIndex].textContent = `${windSpeed}`; 
        }
        
        if (rows[ROW_MAP.feelsLike].cells[columnIndex]) {
            rows[ROW_MAP.feelsLike].cells[columnIndex].textContent = `${Math.round(feelsLike)}°C`;
        }
    });
}


async function getWeatherForCity(cityValue) {
    clearError();
    
    try {
        const result = await fetchWeatherData(cityValue); 
        updateWeatherUI(result.city, result.forecast); 
    } catch (error) {
        console.error("Глобальна помилка в обробці прогнозу:", error);
        displayError(error.message); 
    }
}

function handleCitySelection() {
        const selectedCity = cityInputElement.value.trim(); 
    
    if (selectedCity && VALID_CITIES.includes(selectedCity)) {
        getWeatherForCity(selectedCity);
    } else {
        displayError("Будь ласка, оберіть місто ВИКЛЮЧНО зі списку, що випадає.");
        cityInputElement.value = '';
    }
}

function populateDatalist() {
    const datalist = document.querySelector(SELECTORS.cityDatalist);
    if (datalist) {
        VALID_CITIES.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
    }
}

function initApp() {
    // 1. Заповнюємо список міст
    populateDatalist();

    // 2. Налаштовуємо слухачів подій
    if (cityInputElement) {
        // Обробка 'change' (після вибору зі списку або підтвердження введення)
        cityInputElement.addEventListener('change', handleCitySelection);
        
        // Обробка натискання Enter
        cityInputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                handleCitySelection();
            }
        });
    } else {
        console.error(`Елемент вводу міста (${SELECTORS.cityInput}) не знайдено в DOM.`);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
