class WeatherApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        const searchForm = document.getElementById('searchForm');
        const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
        const themeToggle = document.getElementById('themeToggle');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }
        
        if (clearFavoritesBtn) {
            clearFavoritesBtn.addEventListener('click', () => this.clearAllFavorites());
        }
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        const cityInput = document.getElementById('cityInput');
        if (cityInput) {
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch(e);
                }
            });
        }
    }

    async loadInitialData() {
        this.renderFavorites();
        
        this.loadTheme();
        
        const favorites = weatherStorage.getFavorites();
        if (favorites.length > 0) {
            const lastCity = favorites[favorites.length - 1];
            document.getElementById('cityInput').value = lastCity.name;
            await this.loadWeatherForCity(lastCity.name);
        } else {
            document.getElementById('cityInput').value = 'Moscow';
            await this.loadWeatherForCity('Moscow');
        }
    }

    async handleSearch(event) {
        event.preventDefault();
        
        const cityInput = document.getElementById('cityInput');
        const cityName = cityInput.value.trim();
        
        if (!cityName) {
            this.showError('Введите название города');
            return;
        }
        
        await this.loadWeatherForCity(cityName);
    }

    async loadWeatherForCity(cityName) {
        this.clearError();
        
        try {
            const weatherData = await weatherAPI.getFullWeatherByCity(cityName);
            
            if (weatherData) {
                this.renderCurrentWeather(weatherData);
                this.renderForecast(weatherData.forecast);
                this.renderFavorites();
            } else {
                this.showError('Не удалось получить данные о погоде');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError(error.message || 'Ошибка при получении данных');
        }
    }

    renderCurrentWeather(data) {
        const container = document.getElementById('currentWeather');
        if (!container) return;
        
        const currentDate = new Date().toLocaleString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const isFavorite = weatherStorage.isFavorite(data.city, data.country);
        const weatherIcon = this.getWeatherIcon(data.current.icon);
        
        const html = `
            <div class="weather-main">
                <div class="weather-info">
                    <div class="city-name">
                        ${data.city}
                        <span class="country-badge">${data.country}</span>
                    </div>
                    <div class="weather-date">${currentDate}</div>
                    <div class="temperature">
                        ${data.current.temp}°
                        <span class="temp-unit">C</span>
                    </div>
                    <div class="weather-desc">${data.current.description}</div>
                    <div class="weather-details">
                        <div class="detail-item">
                            <div class="detail-icon">🌡️</div>
                            <div class="detail-info">
                                <span class="detail-label">Ощущается</span>
                                <span class="detail-value">${data.current.feelsLike}°C</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon">💧</div>
                            <div class="detail-info">
                                <span class="detail-label">Влажность</span>
                                <span class="detail-value">${data.current.humidity}%</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon">🌬️</div>
                            <div class="detail-info">
                                <span class="detail-label">Ветер</span>
                                <span class="detail-value">${data.current.windSpeed} м/с</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon">📊</div>
                            <div class="detail-info">
                                <span class="detail-label">Давление</span>
                                <span class="detail-value">${data.current.pressure} гПа</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="weather-icon">
                    <div style="font-size: 100px;">${weatherIcon}</div>
                    <button class="fav-btn ${isFavorite ? 'active' : ''}" data-city="${data.city}" data-country="${data.country}">
                        ${isFavorite ? '★ В избранном' : '☆ Добавить в избранное'}
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        const favBtn = container.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                const city = favBtn.dataset.city;
                const country = favBtn.dataset.country;
                if (favBtn.classList.contains('active')) {
                    weatherStorage.removeFavorite(city, country);
                    favBtn.classList.remove('active');
                    favBtn.innerHTML = '☆ Добавить в избранное';
                } else {
                    weatherStorage.addFavorite(city, country);
                    favBtn.classList.add('active');
                    favBtn.innerHTML = '★ В избранном';
                }
                this.renderFavorites();
            });
        }
    }

    renderForecast(forecast) {
        const container = document.getElementById('forecast');
        if (!container) return;
        
        if (!forecast || forecast.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Нет данных о прогнозе</p>';
            return;
        }
        
        const html = forecast.map(day => {
            const date = new Date(day.date).toLocaleDateString('ru-RU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            const weatherIcon = this.getWeatherIcon(day.icon);
            
            return `
                <div class="forecast-card">
                    <div class="forecast-date">${date}</div>
                    <div class="forecast-icon">${weatherIcon}</div>
                    <div class="forecast-temp">${day.temp}°C</div>
                    <div class="forecast-desc">${day.description}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    renderFavorites() {
        const container = document.getElementById('favoritesList');
        if (!container) return;
        
        const favorites = weatherStorage.getFavorites();
        
        if (favorites.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">Нет избранных городов</p>';
            return;
        }
        
        const html = favorites.map(fav => `
            <div class="favorite-chip" data-city="${fav.name}" data-country="${fav.country}">
                <span>${fav.name}, ${fav.country}</span>
                <button class="remove-fav" data-key="${fav.key}">✕</button>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
        document.querySelectorAll('.favorite-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-fav')) {
                    e.stopPropagation();
                    const key = e.target.dataset.key;
                    const fav = favorites.find(f => f.key === key);
                    if (fav) {
                        weatherStorage.removeFavorite(fav.name, fav.country);
                        this.renderFavorites();
                        // Обновляем кнопку избранного
                        const currentCity = document.querySelector('.city-name')?.innerText?.split(' ')[0];
                        if (currentCity === fav.name) {
                            const favBtn = document.querySelector('.fav-btn');
                            if (favBtn) {
                                favBtn.classList.remove('active');
                                favBtn.innerHTML = '☆ Добавить в избранное';
                            }
                        }
                    }
                } else {
                    const city = chip.dataset.city;
                    if (city) {
                        document.getElementById('cityInput').value = city;
                        this.loadWeatherForCity(city);
                    }
                }
            });
        });
    }

    clearAllFavorites() {
        if (confirm('Удалить все города из избранного?')) {
            weatherStorage.clearFavorites();
            this.renderFavorites();
            const favBtn = document.querySelector('.fav-btn');
            if (favBtn) {
                favBtn.classList.remove('active');
                favBtn.innerHTML = '☆ Добавить в избранное';
            }
            this.showError('Избранное очищено');
            setTimeout(() => this.clearError(), 2000);
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.contains('dark-theme');
        if (isDark) {
            document.body.classList.remove('dark-theme');
            weatherStorage.saveTheme('light');
        } else {
            document.body.classList.add('dark-theme');
            weatherStorage.saveTheme('dark');
        }
    }

    loadTheme() {
        const theme = weatherStorage.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };
        return iconMap[iconCode] || '🌡️';
    }

    showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.add('show');
            setTimeout(() => {
                errorMsg.classList.remove('show');
            }, 5000);
        }
    }

    clearError() {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.classList.remove('show');
            errorMsg.textContent = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});