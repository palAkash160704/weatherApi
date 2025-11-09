// State
let currentUnit = 'C';
let currentData = null;
let currentCity = '';
let comparedCities = [];
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

// Weather code mapping
const weatherCodes = {
  0: { icon: '☀', desc: 'Clear sky' },
  1: { icon: '🌤', desc: 'Mainly clear' },
  2: { icon: '⛅', desc: 'Partly cloudy' },
  3: { icon: '☁', desc: 'Overcast' },
  45: { icon: '🌫', desc: 'Foggy' },
  48: { icon: '🌫', desc: 'Depositing rime fog' },
  51: { icon: '🌦', desc: 'Light drizzle' },
  53: { icon: '🌦', desc: 'Moderate drizzle' },
  55: { icon: '🌧', desc: 'Dense drizzle' },
  61: { icon: '🌧', desc: 'Slight rain' },
  63: { icon: '🌧', desc: 'Moderate rain' },
  65: { icon: '⛈', desc: 'Heavy rain' },
  71: { icon: '🌨', desc: 'Slight snow' },
  73: { icon: '🌨', desc: 'Moderate snow' },
  75: { icon: '❄', desc: 'Heavy snow' },
  77: { icon: '🌨', desc: 'Snow grains' },
  80: { icon: '🌦', desc: 'Slight rain showers' },
  81: { icon: '🌧', desc: 'Moderate rain showers' },
  82: { icon: '⛈', desc: 'Violent rain showers' },
  85: { icon: '🌨', desc: 'Slight snow showers' },
  86: { icon: '❄', desc: 'Heavy snow showers' },
  95: { icon: '⛈', desc: 'Thunderstorm' },
  96: { icon: '⛈', desc: 'Thunderstorm with hail' },
  99: { icon: '⛈', desc: 'Severe thunderstorm' }
};

// Particle animation
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
for (let i = 0; i < 50; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5
  });
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    
    p.x += p.speedX;
    p.y += p.speedY;
    
    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
  });
  
  requestAnimationFrame(animateParticles);
}
animateParticles();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// API Functions
async function getOpenMeteo(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: true,
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,apparent_temperature',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Weather fetch failed');
  return r.json();
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Geocoding failed");
  const j = await r.json();
  if (!j.results || !j.results.length) throw new Error("City not found");
  const res = j.results[0];
  return {
    name: `${res.name}, ${res.country}`,
    lat: res.latitude,
    lon: res.longitude
  };
}

// Temperature conversion
function convertTemp(celsius) {
  return currentUnit === 'F' ? (celsius * 9/5) + 32 : celsius;
}

function formatTemp(celsius) {
  const temp = convertTemp(celsius);
  return `${Math.round(temp)}°${currentUnit}`;
}

// Render functions
function renderWeather(city, data) {
  currentData = data;
  currentCity = city;

  const cur = data.current_weather;
  const weather = weatherCodes[cur.weathercode] || { icon: '🌤', desc: 'Unknown' };

  document.getElementById('weatherIcon').textContent = weather.icon;
  document.getElementById('temp').textContent = formatTemp(cur.temperature);
  document.getElementById('location').textContent = city;
  document.getElementById('description').textContent = weather.desc;

  // find index for current time in hourly arrays
  const curIndex = data.hourly.time.indexOf(cur.time);
  const idx = curIndex >= 0 ? curIndex : 0;

  document.getElementById('humidity').textContent = `${data.hourly.relative_humidity_2m[idx]}%`;
  document.getElementById('windSpeed').textContent = `${Math.round(cur.windspeed)} km/h`;
  document.getElementById('precipitation').textContent = `${data.hourly.precipitation_probability[idx]}%`;
  document.getElementById('feelsLike').textContent = formatTemp(data.hourly.apparent_temperature[idx]);

  renderForecast(data, 'hourly');
  renderInsights(data);

  document.getElementById('weatherContent').classList.remove('hidden');
}

function renderForecast(data, type) {
  const container = document.getElementById('forecast');
  container.innerHTML = '';

  if (type === 'hourly') {
    const hours = data.hourly.time.slice(0, 24);
    hours.forEach((t, i) => {
      const card = document.createElement('div');
      card.className = 'forecast-card';
      const time = new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      card.innerHTML = `
        <div class="forecast-time">${time}</div>
        <div class="forecast-icon">🌤</div>
        <div class="forecast-temp">${formatTemp(data.hourly.temperature_2m[i])}</div>
        <div class="forecast-detail">💧 ${data.hourly.relative_humidity_2m[i]}%</div>
        <div class="forecast-detail">🌬 ${Math.round(data.hourly.wind_speed_10m[i])} km/h</div>
      `;
      container.appendChild(card);
    });
  } else {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    data.daily.time.forEach((date, i) => {
      const card = document.createElement('div');
      card.className = 'forecast-card';
      const d = new Date(date);
      
      card.innerHTML = `
        <div class="forecast-time">${days[d.getDay()]}</div>
        <div class="forecast-icon">🌤</div>
        <div class="forecast-temp">${formatTemp(data.daily.temperature_2m_max[i])}</div>
        <div class="forecast-detail">${formatTemp(data.daily.temperature_2m_min[i])}</div>
        <div class="forecast-detail">☔ ${Math.round(data.daily.precipitation_sum[i])}mm</div>
      `;
      container.appendChild(card);
    });
  }
}

function renderInsights(data) {
  const container = document.getElementById('insights');
  container.innerHTML = '';
  const insights = generateInsights(data);
  
  insights.forEach(insight => {
    const card = document.createElement('div');
    card.className = 'insight-card';
    card.innerHTML = `
      <div class="insight-title">${insight.icon} ${insight.title}</div>
      <div class="insight-text">${insight.text}</div>
    `;
    container.appendChild(card);
  });
}

function generateInsights(data) {
  const insights = [];
  const cur = data.current_weather;
  const curIndex = data.hourly.time.indexOf(cur.time);
  const idx = curIndex >= 0 ? curIndex : 0;

  // Temperature insight
  const maxTemp = Math.max(...data.daily.temperature_2m_max);
  const minTemp = Math.min(...data.daily.temperature_2m_min);
  insights.push({
    icon: '🌡',
    title: 'Temperature Trend',
    text: `Today's temperature ranges from ${formatTemp(minTemp)} to ${formatTemp(maxTemp)}. ${cur.temperature > 25 ? "It's quite warm!" : (cur.temperature < 10 ? "Bundle up, it's cold!" : "Pleasant temperatures expected.")}`
  });

  // Wind insight
  if (cur.windspeed > 30) {
    insights.push({
      icon: '💨',
      title: 'Windy Conditions',
      text: `Strong winds at ${Math.round(cur.windspeed)} km/h. Secure loose objects and be cautious outdoors.`
    });
  }

  // Precipitation insight
  const todayPrecip = data.daily.precipitation_sum[0];
  if (todayPrecip > 5) {
    insights.push({
      icon: '☔',
      title: 'Rain Expected',
      text: `${Math.round(todayPrecip)}mm of precipitation expected today. Don't forget your umbrella!`
    });
  }

  // Activity recommendation
  if (cur.temperature >= 20 && cur.temperature <= 28 && cur.windspeed < 20 && data.hourly.precipitation_probability[idx] < 30) {
    insights.push({
      icon: '🎯',
      title: 'Perfect Outdoor Weather',
      text: 'Great conditions for outdoor activities! Temperature, wind, and precipitation are all ideal.'
    });
  }

  return insights;
}

async function addComparison(city) {
  try {
    const g = await geocodeCity(city);
    const data = await getOpenMeteo(g.lat, g.lon);
    
    comparedCities.push({ name: g.name, data });
    renderComparison();
  } catch (err) {
    alert(err.message);
  }
}

function renderComparison() {
  const container = document.getElementById('comparison');
  container.innerHTML = '';

  if (currentData) {
    const mainCard = document.createElement('div');
    mainCard.className = 'compare-card';
    mainCard.innerHTML = `
      <div class="compare-city">${currentCity}</div>
      <div class="forecast-icon">🌤</div>
      <div class="forecast-temp">${formatTemp(currentData.current_weather.temperature)}</div>
      <div class="forecast-detail">💧 ${currentData.hourly.relative_humidity_2m[0]}%</div>
      <div class="forecast-detail">🌬 ${Math.round(currentData.current_weather.windspeed)} km/h</div>
    `;
    container.appendChild(mainCard);
  }

  comparedCities.forEach(c => {
    const card = document.createElement('div');
    card.className = 'compare-card';
    const cur = c.data.current_weather;
    card.innerHTML = `
      <div class="compare-city">${c.name}</div>
      <div class="forecast-icon">🌤</div>
      <div class="forecast-temp">${formatTemp(cur.temperature)}</div>
      <div class="forecast-detail">💧 ${c.data.hourly.relative_humidity_2m[0]}%</div>
      <div class="forecast-detail">🌬 ${Math.round(cur.windspeed)} km/h</div>
    `;
    container.appendChild(card);
  });
}

// Event Listeners
document.getElementById('go').addEventListener('click', async () => {
  const city = document.getElementById('city').value.trim();
  if (!city) return alert('Please enter a city name.');
  await fetchWeather(city);
});

document.getElementById('geo').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      await fetchWeatherByCoords(latitude, longitude);
    }, () => alert('Unable to access location.'));
  } else {
    alert('Geolocation not supported.');
  }
});

document.querySelectorAll('.quick-city').forEach(el => {
  el.addEventListener('click', async () => {
    const city = el.dataset.city;
    await fetchWeather(city);
  });
});

document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentUnit = e.target.dataset.unit;
    if (currentData) renderWeather(currentCity, currentData);
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', e => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    const type = e.target.dataset.tab;
    if (currentData) renderForecast(currentData, type);
  });
});

document.getElementById('addCompare').addEventListener('click', async () => {
  const city = document.getElementById('compareCity').value.trim();
  if (!city) return alert('Enter a city to compare.');
  await addComparison(city);
  document.getElementById('compareCity').value = '';
});

// Saved locations feature
function renderSavedLocations() {
  const container = document.getElementById('savedLocations');
  container.innerHTML = '';
  savedLocations.forEach(city => {
    const div = document.createElement('div');
    div.className = 'saved-location';
    div.innerHTML = `
      <span>${city}</span>
      <div class="remove-btn">✕</div>
    `;
    div.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      savedLocations = savedLocations.filter(c => c !== city);
      localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
      renderSavedLocations();
    });
    div.addEventListener('click', () => fetchWeather(city));
    container.appendChild(div);
  });
}

renderSavedLocations();

async function fetchWeather(city) {
  try {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('weatherContent').classList.add('hidden');
    const geo = await geocodeCity(city);
    const data = await getOpenMeteo(geo.lat, geo.lon);
    renderWeather(geo.name, data);
    document.getElementById('loading').classList.add('hidden');

    if (!savedLocations.includes(geo.name)) {
      savedLocations.push(geo.name);
      localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
      renderSavedLocations();
    }
  } catch (err) {
    alert(err.message);
    document.getElementById('loading').classList.add('hidden');
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('weatherContent').classList.add('hidden');
    const data = await getOpenMeteo(lat, lon);
    renderWeather('My Location', data);
    document.getElementById('loading').classList.add('hidden');
  } catch (err) {
    alert(err.message);
    document.getElementById('loading').classList.add('hidden');
  }
}
