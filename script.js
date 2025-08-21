
async function getOpenMeteo(lat, lon) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `current_weather=true`,
    `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability`,
    `timezone=auto`
  ].join('&');

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Open-Meteo fetch failed');
  return r.json();
}


async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`; 
  const r = await fetch(url);
  if (!r.ok) throw new Error("Geocoding failed");
  const j = await r.json();
  if (!j.results || !j.results.length) throw new Error("City not found");
  return { name: `${j.results[0].name}, ${j.results[0].country}`, lat: j.results[0].latitude, lon: j.results[0].longitude };
}

function renderWeather(city, data) {
  const cur = data.current_weather;
  document.getElementById('temp').textContent = `${Math.round(cur.temperature)}°C`;
  document.getElementById('summary').textContent = `${cur.weathercode ? "Weather code " + cur.weathercode : ""} • ${city}`;

  const f = document.getElementById('forecast');
  f.innerHTML = '';
  const hours = data.hourly.time.slice(0,12); 
  hours.forEach((t, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'hour';
    wrap.innerHTML = `
      <div>${new Date(t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      <div><strong>${Math.round(data.hourly.temperature_2m[i])}°C</strong></div>
      <div class="muted">💧 ${data.hourly.relative_humidity_2m[i]}%</div>
      <div class="muted">🌬️ ${Math.round(data.hourly.wind_speed_10m[i])} km/h</div>
      <div class="muted">☔ ${data.hourly.precipitation_probability[i]}%</div>
    `;
    f.appendChild(wrap);
  });
}

async function loadCity(city) {
  try {
    const g = await geocodeCity(city);
    const data = await getOpenMeteo(g.lat, g.lon);
    renderWeather(g.name, data);
  } catch(err) {
    document.getElementById('summary').textContent = '⚠️ ' + err.message;
  }
}

async function loadCoords(lat, lon) {
  try {
    const data = await getOpenMeteo(lat, lon);
    renderWeather(`${lat.toFixed(2)},${lon.toFixed(2)}`, data);
  } catch(err) {
    document.getElementById('summary').textContent = '⚠️ ' + err.message;
  }
}

// Events
document.getElementById('go').addEventListener('click', () => {
  const c = document.getElementById('city').value.trim();
  if (c) loadCity(c);
});

document.getElementById('geo').addEventListener('click', () => {
  if (!('geolocation' in navigator)) { alert('Not supported'); return; }
  navigator.geolocation.getCurrentPosition(p => {
    loadCoords(p.coords.latitude, p.coords.longitude);
  }, err => alert(err.message));
});

async function getOpenMeteo(lat, lon) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `current_weather=true`,
    `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability`,
    `timezone=auto`
  ].join('&');

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Open-Meteo fetch failed');
  return r.json();
}


async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`; 
  const r = await fetch(url);
  if (!r.ok) throw new Error("Geocoding failed");
  const j = await r.json();
  if (!j.results || !j.results.length) throw new Error("City not found");
  return { name: `${j.results[0].name}, ${j.results[0].country}`, lat: j.results[0].latitude, lon: j.results[0].longitude };
}

function renderWeather(city, data) {
  const cur = data.current_weather;
  document.getElementById('temp').textContent = `${Math.round(cur.temperature)}°C`;
  document.getElementById('summary').textContent = `${cur.weathercode ? "Weather code " + cur.weathercode : ""} • ${city}`;

  const f = document.getElementById('forecast');
  f.innerHTML = '';
  const hours = data.hourly.time.slice(0,12);
  hours.forEach((t, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'hour';
    wrap.innerHTML = `
      <div>${new Date(t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      <div><strong>${Math.round(data.hourly.temperature_2m[i])}°C</strong></div>
      <div class="muted">💧 ${data.hourly.relative_humidity_2m[i]}%</div>
      <div class="muted">🌬️ ${Math.round(data.hourly.wind_speed_10m[i])} km/h</div>
      <div class="muted">☔ ${data.hourly.precipitation_probability[i]}%</div>
    `;
    f.appendChild(wrap);
  });
}

async function loadCity(city) {
  try {
    const g = await geocodeCity(city);
    const data = await getOpenMeteo(g.lat, g.lon);
    renderWeather(g.name, data);
  } catch(err) {
    document.getElementById('summary').textContent = '⚠️ ' + err.message;
  }
}

async function loadCoords(lat, lon) {
  try {
    const data = await getOpenMeteo(lat, lon);
    renderWeather(`${lat.toFixed(2)},${lon.toFixed(2)}`, data);
  } catch(err) {
    document.getElementById('summary').textContent = '⚠️ ' + err.message;
  }
}

// Events
document.getElementById('go').addEventListener('click', () => {
  const c = document.getElementById('city').value.trim();
  if (c) loadCity(c);
});

document.getElementById('geo').addEventListener('click', () => {
  if (!('geolocation' in navigator)) { alert('Not supported'); return; }
  navigator.geolocation.getCurrentPosition(p => {
    loadCoords(p.coords.latitude, p.coords.longitude);
  }, err => alert(err.message));
});
