class WeatherAPI {
    constructor() {
        this.apiKey = null;
        this.initApiKey();
    }

    initApiKey() {
        if (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) {
            this.apiKey = CONFIG.API_KEY;
            console.log('API ключ загружен');
        } else {
            console.error('API ключ не найден. Создайте js/config.js');
        }
    }

    async getCoordinates(cityName) {
        if (!this.apiKey) return null;
        
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${this.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon,
                name: data[0].name,
                country: data[0].country
            };
        }
        return null;
    }

    async getCurrentWeather(lat, lon) {
        if (!this.apiKey) return null;
        
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${this.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            description: data.weather[0].description,
            icon: data.weather[0].icon
        };
    }

    async getForecast(lat, lon) {
        if (!this.apiKey) return null;
        
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${this.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const dailyForecasts = [];
        const processedDates = new Set();
        
        for (const item of data.list) {
            const date = item.dt_txt.split(' ')[0];
            const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
            
            if (!processedDates.has(date) && hour >= 11 && hour <= 14) {
                processedDates.add(date);
                dailyForecasts.push({
                    date: date,
                    temp: Math.round(item.main.temp),
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                });
            }
            if (dailyForecasts.length >= 5) break;
        }
        
        return dailyForecasts;
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            show ? overlay.classList.add('active') : overlay.classList.remove('active');
        }
    }

    async getFullWeatherByCity(cityName) {
        this.showLoading(true);
        
        try {
            const coords = await this.getCoordinates(cityName);
            if (!coords) throw new Error('Город не найден');
            
            const current = await this.getCurrentWeather(coords.lat, coords.lon);
            const forecast = await this.getForecast(coords.lat, coords.lon);
            
            return {
                city: coords.name,
                country: coords.country,
                current: current,
                forecast: forecast
            };
        } finally {
            this.showLoading(false);
        }
    }
}

const weatherAPI = new WeatherAPI();