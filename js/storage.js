class WeatherStorage {
    constructor() {
        this.STORAGE_KEYS = {
            FAVORITES: 'weather_favorites',
            THEME: 'weather_theme'
        };
    }

    getFavorites() {
        try {
            const favorites = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Ошибка чтения избранного:', error);
            return [];
        }
    }

    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения избранного:', error);
            return false;
        }
    }

    addFavorite(cityName, countryCode) {
        const favorites = this.getFavorites();
        const cityKey = `${cityName},${countryCode}`.toLowerCase();
        
        if (!favorites.some(fav => fav.key === cityKey)) {
            favorites.push({
                key: cityKey,
                name: cityName,
                country: countryCode,
                addedAt: new Date().toISOString()
            });
            this.saveFavorites(favorites);
            return true;
        }
        return false;
    }

    removeFavorite(cityName, countryCode) {
        const favorites = this.getFavorites();
        const cityKey = `${cityName},${countryCode}`.toLowerCase();
        const newFavorites = favorites.filter(fav => fav.key !== cityKey);
        
        if (newFavorites.length !== favorites.length) {
            this.saveFavorites(newFavorites);
            return true;
        }
        return false;
    }

    isFavorite(cityName, countryCode) {
        const favorites = this.getFavorites();
        const cityKey = `${cityName},${countryCode}`.toLowerCase();
        return favorites.some(fav => fav.key === cityKey);
    }

    clearFavorites() {
        this.saveFavorites([]);
    }

    getTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.THEME) || 'light';
        } catch (error) {
            return 'light';
        }
    }

    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Ошибка сохранения темы:', error);
            return false;
        }
    }
}

const weatherStorage = new WeatherStorage();