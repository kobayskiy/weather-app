class WeatherApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchForm = document.getElementById('searchForm');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }
    }

    async handleSearch(event) {
        event.preventDefault();
        
        const cityInput = document.getElementById('cityInput');
        const cityName = cityInput.value.trim();
        
        if (!cityName) {
            alert('Введите название города');
            return;
        }
        
        try {
            const data = await weatherAPI.getFullWeatherByCity(cityName);
            console.log('Погода получена:', data);
            alert(`Погода в ${data.city}: ${data.current.temp}°C, ${data.current.description}`);
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});