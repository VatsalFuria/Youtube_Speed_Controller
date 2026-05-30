const api = typeof browser !== "undefined" ? browser : chrome;
const {
  absoluteMinSpeed: ABSOLUTE_MIN_SPEED,
  absoluteMaxSpeed: ABSOLUTE_MAX_SPEED,
  defaultSpeed: DEFAULT_SPEED,
  sliderStep: SLIDER_STEP,
  buttonStep: BUTTON_STEP,
  createDefaultSettings,
  roundToTenth,
  sanitizeSettings,
  clampToSettings,
  formatSpeed,
} = SpeedControllerConfig;

const slider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const increaseButton = document.getElementById("plus0.5-btn");
const decreaseButton = document.getElementById("minus0.5-btn");
const sliderRange = document.querySelector(".slider-range");
const scaleLabels = document.querySelectorAll(".scale span");
const presetGrid = document.getElementById("preset-grid");
const minSpeedInput = document.getElementById("min-speed-input");
const maxSpeedInput = document.getElementById("max-speed-input");
const settingsHint = document.getElementById("settings-hint");

let currentSettings = createDefaultSettings();
let currentSpeed = DEFAULT_SPEED;

function storageGet(key) {
  return new Promise((resolve) => {
    if (api.storage?.local?.get.length <= 1) {
      Promise.resolve(api.storage.local.get(key))
        .then(resolve)
        .catch(() => resolve({}));
      return;
    }

    api.storage.local.get(key, (data) => {
      resolve(data || {});
    });
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    if (api.storage?.local?.set.length <= 1) {
      Promise.resolve(api.storage.local.set(values))
        .then(resolve)
        .catch(resolve);
      return;
    }

    api.storage.local.set(values, resolve);
  });
}

function queryActiveTab() {
  return new Promise((resolve) => {
    if (api.tabs?.query.length <= 1) {
      Promise.resolve(api.tabs.query({ active: true, currentWindow: true }))
        .then((tabs) => resolve(tabs || []))
        .catch(() => resolve([]));
      return;
    }

    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs || []);
    });
  });
}

function sendMessage(tabId, message) {
  return new Promise((resolve) => {
    if (!tabId) {
      resolve();
      return;
    }

    if (api.tabs?.sendMessage.length <= 2) {
      Promise.resolve(api.tabs.sendMessage(tabId, message))
        .then(resolve)
        .catch(() => resolve());
      return;
    }

    api.tabs.sendMessage(tabId, message, () => {
      void api.runtime?.lastError;
      resolve();
    });
  });
}

function renderPresets(speed, settings = currentSettings) {
  presetGrid.innerHTML = "";

  settings.presets.forEach((preset) => {
    const presetButton = document.createElement("button");
    presetButton.type = "button";
    presetButton.className = "preset-button";
    presetButton.textContent = formatSpeed(preset);

    if (Math.abs(speed - preset) < 0.05) {
      presetButton.classList.add("is-active");
    }

    const inRange = preset >= settings.minSpeed && preset <= settings.maxSpeed;
    presetButton.disabled = !inRange;
    presetButton.title = inRange
      ? `Set speed to ${formatSpeed(preset)}`
      : `Preset is outside the active range`;

    presetButton.addEventListener("click", () => {
      if (inRange) {
        void setSpeed(preset);
      }
    });

    presetGrid.appendChild(presetButton);
  });
}

function updateRangeUI(settings) {
  slider.min = String(settings.minSpeed);
  slider.max = String(settings.maxSpeed);
  slider.step = String(SLIDER_STEP);
  minSpeedInput.min = String(ABSOLUTE_MIN_SPEED);
  minSpeedInput.max = String(ABSOLUTE_MAX_SPEED);
  minSpeedInput.step = String(SLIDER_STEP);
  maxSpeedInput.min = String(ABSOLUTE_MIN_SPEED);
  maxSpeedInput.max = String(ABSOLUTE_MAX_SPEED);
  maxSpeedInput.step = String(SLIDER_STEP);
  sliderRange.textContent = `${formatSpeed(settings.minSpeed)} to ${formatSpeed(settings.maxSpeed)}`;
  minSpeedInput.value = settings.minSpeed.toFixed(1);
  maxSpeedInput.value = settings.maxSpeed.toFixed(1);
  settingsHint.textContent = `Allowed range is ${formatSpeed(settings.minSpeed)} to ${formatSpeed(settings.maxSpeed)}.`;
  scaleLabels[0].textContent = formatSpeed(settings.minSpeed);
  scaleLabels[1].textContent = formatSpeed(
    roundToTenth(
      settings.minSpeed + (settings.maxSpeed - settings.minSpeed) / 3,
    ),
  );
  scaleLabels[2].textContent = formatSpeed(
    roundToTenth(
      settings.minSpeed + ((settings.maxSpeed - settings.minSpeed) * 2) / 3,
    ),
  );
  scaleLabels[3].textContent = formatSpeed(settings.maxSpeed);
}

function updateUI(speed, settings = currentSettings) {
  slider.value = speed.toFixed(1);
  speedValue.textContent = formatSpeed(speed);
  const span = settings.maxSpeed - settings.minSpeed || SLIDER_STEP;
  const fillPercentage = ((speed - settings.minSpeed) / span) * 100;
  slider.style.setProperty("--slider-fill", `${fillPercentage}%`);
  updateRangeUI(settings);
  renderPresets(speed, settings);
}

async function persistAndBroadcast(speed) {
  await storageSet({ playbackSpeed: speed });
  const tabs = await queryActiveTab();

  if (tabs[0]?.id) {
    await sendMessage(tabs[0].id, { action: "setSpeed", speed });
  }
}

async function persistSettings(settings) {
  await storageSet({ settings });
}

async function setSpeed(speed) {
  const normalizedSpeed = clampToSettings(speed, currentSettings);
  currentSpeed = normalizedSpeed;
  updateUI(normalizedSpeed);
  await persistAndBroadcast(normalizedSpeed);
}

async function applySettings(nextSettings) {
  currentSettings = sanitizeSettings(nextSettings);
  currentSpeed = clampToSettings(currentSpeed, currentSettings);
  updateUI(currentSpeed, currentSettings);
  await persistSettings(currentSettings);
  await persistAndBroadcast(currentSpeed);
}

function setFieldValidity(input, isValid) {
  input.classList.toggle("is-invalid", !isValid);
}

function parseSettingsInput(value) {
  if (value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? roundToTenth(numericValue) : null;
}

async function handleLimitChange() {
  const minValue = parseSettingsInput(minSpeedInput.value);
  const maxValue = parseSettingsInput(maxSpeedInput.value);
  const hasValidValues = minValue !== null && maxValue !== null;
  const withinBounds =
    hasValidValues &&
    minValue >= ABSOLUTE_MIN_SPEED &&
    maxValue <= ABSOLUTE_MAX_SPEED &&
    minValue < maxValue;

  setFieldValidity(minSpeedInput, withinBounds);
  setFieldValidity(maxSpeedInput, withinBounds);

  if (!withinBounds) {
    settingsHint.textContent =
      "Enter valid values between 0.5x and 6.0x, with min lower than max.";
    return;
  }

  await applySettings({
    ...currentSettings,
    minSpeed: minValue,
    maxSpeed: maxValue,
  });
}

slider.addEventListener("input", (event) => {
  void setSpeed(event.target.value);
});

increaseButton.addEventListener("click", async () => {
  void setSpeed(currentSpeed + BUTTON_STEP);
});

decreaseButton.addEventListener("click", async () => {
  void setSpeed(currentSpeed - BUTTON_STEP);
});

minSpeedInput.addEventListener("change", () => {
  void handleLimitChange();
});

maxSpeedInput.addEventListener("change", () => {
  void handleLimitChange();
});

minSpeedInput.addEventListener("blur", () => {
  void handleLimitChange();
});

maxSpeedInput.addEventListener("blur", () => {
  void handleLimitChange();
});

async function initialize() {
  const data = await storageGet(["playbackSpeed", "settings"]);
  const storedSettings = sanitizeSettings(data.settings);
  const storedSpeed = clampToSettings(
    data.playbackSpeed ?? DEFAULT_SPEED,
    storedSettings,
  );
  const needsSettingsWrite =
    JSON.stringify(data.settings) !== JSON.stringify(storedSettings);
  const needsSpeedWrite = data.playbackSpeed !== storedSpeed;

  currentSettings = storedSettings;
  currentSpeed = storedSpeed;
  updateUI(currentSpeed, currentSettings);

  if (needsSettingsWrite) {
    await persistSettings(currentSettings);
  }

  if (needsSpeedWrite) {
    await storageSet({ playbackSpeed: currentSpeed });
  }
}

void initialize();
