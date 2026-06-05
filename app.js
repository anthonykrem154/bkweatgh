const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York";

const weatherCodes = {
  0: ["☀️", "Clear Sky"],
  1: ["🌤️", "Mainly Clear"],
  2: ["⛅", "Partly Cloudy"],
  3: ["☁️", "Cloudy"],
  45: ["🌫️", "Foggy"],
  48: ["🌫️", "Foggy"],
  51: ["🌦️", "Light Drizzle"],
  53: ["🌦️", "Drizzle"],
  55: ["🌧️", "Heavy Drizzle"],
  61: ["🌧️", "Light Rain"],
  63: ["🌧️", "Rain"],
  65: ["🌧️", "Heavy Rain"],
  71: ["🌨️", "Light Snow"],
  73: ["🌨️", "Snow"],
  75: ["❄️", "Heavy Snow"],
  80: ["🌦️", "Rain Showers"],
  81: ["🌧️", "Rain Showers"],
  82: ["⛈️", "Heavy Showers"],
  95: ["⛈️", "Thunderstorm"],
  96: ["⛈️", "Thunderstorm"],
  99: ["⛈️", "Severe Thunderstorm"]
};

function getWeatherIcon(code){
  return weatherCodes[code] || ["🌤️", "Weather Update"];
}

function getDayName(dateString){
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function getFullDate(dateString){
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function setText(id, value){
  const element = document.getElementById(id);
  if(element){
    element.textContent = value;
  }
}

async function getWeather(){
  const status = document.getElementById("status");
  const alertBox = document.getElementById("alertBox");

  try{
    if(status) status.textContent = "Updating weather...";
    if(alertBox) alertBox.textContent = "Checking Brooklyn conditions...";

    const response = await fetch(API_URL);

    if(!response.ok){
      throw new Error("Weather API failed");
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    if(!current || !daily || !daily.time){
      throw new Error("Missing weather data");
    }

    const currentWeather = getWeatherIcon(current.weather_code);

    setText("temp", `${Math.round(current.temperature_2m)}°F`);
    setText("condition", `${currentWeather[0]} ${currentWeather[1]}`);
    setText("humidity", `${current.relative_humidity_2m}%`);
    setText("wind", `${Math.round(current.wind_speed_10m)} MPH`);
    setText("rain", `${current.precipitation} in`);
    setText("feels", `${Math.round(current.apparent_temperature)}°F`);

    setText("updated", "Updated: " + new Date(current.time).toLocaleString("en-US", {
      month:"short",
      day:"numeric",
      hour:"numeric",
      minute:"2-digit"
    }));

    if(status) status.textContent = "Live Brooklyn weather loaded successfully.";

    const forecastGrid = document.getElementById("forecastGrid");
    if(forecastGrid){
      forecastGrid.innerHTML = "";

      for(let i = 0; i < 5; i++){
        const weather = getWeatherIcon(daily.weather_code[i]);
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const rain = daily.precipitation_sum[i];

        const card = document.createElement("article");
        card.className = "day";

        card.innerHTML = `
          <h3>${getDayName(daily.time[i])}</h3>
          <p>${getFullDate(daily.time[i])}</p>
          <div class="icon" aria-hidden="true">${weather[0]}</div>
          <div class="day-temp">${max}° / ${min}°</div>
          <div class="day-desc">${weather[1]}</div>
          <div class="day-desc">Rain: ${rain} in</div>
        `;

        forecastGrid.appendChild(card);
      }
    }

    const rainToday = daily.precipitation_sum[0];
    const windNow = current.wind_speed_10m;
    const codeNow = current.weather_code;

    if(alertBox){
      if(codeNow >= 95){
        alertBox.textContent = "⛈️ Thunderstorm conditions are possible in Brooklyn. Stay safe and check local alerts.";
      } else if(rainToday > 0.1){
        alertBox.textContent = "🌧️ Rain is possible today in Brooklyn. Bring an umbrella.";
      } else if(windNow > 20){
        alertBox.textContent = "💨 It is windy in Brooklyn today. Be careful outside.";
      } else {
        alertBox.textContent = "✅ No major weather alert right now for Brooklyn.";
      }
    }

  } catch(error){
    console.error(error);

    if(status){
      status.textContent = "Could not load live weather. Check your internet or try again.";
    }

    if(alertBox){
      alertBox.textContent = "Weather data is not loading right now.";
    }

    setText("condition", "Weather unavailable");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshBtn");
  if(refreshBtn){
    refreshBtn.addEventListener("click", getWeather);
  }

  getWeather();
});
