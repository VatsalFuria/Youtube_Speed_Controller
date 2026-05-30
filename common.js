(function attachSpeedControllerConfig(globalScope) {
  const config = {
    absoluteMinSpeed: 0.5,
    absoluteMaxSpeed: 6.0,
    defaultSpeed: 1.0,
    sliderStep: 0.1,
    buttonStep: 0.5,
    shortcutStep: 0.5,
    defaultPresets: [1.0, 1.5, 2.5, 3.5],
  };

  function clampAbsolute(speed) {
    return Math.min(
      config.absoluteMaxSpeed,
      Math.max(config.absoluteMinSpeed, speed),
    );
  }

  function roundToTenth(speed) {
    return Math.round(speed * 10) / 10;
  }

  function normalizeAbsoluteSpeed(speed, fallback = config.defaultSpeed) {
    const numericSpeed = Number(speed);
    if (!Number.isFinite(numericSpeed)) {
      return roundToTenth(clampAbsolute(fallback));
    }

    return roundToTenth(clampAbsolute(numericSpeed));
  }

  function createDefaultSettings() {
    return {
      minSpeed: config.absoluteMinSpeed,
      maxSpeed: config.absoluteMaxSpeed,
      presets: [...config.defaultPresets],
    };
  }

  function sanitizeSettings(settings = {}) {
    const defaults = createDefaultSettings();
    const minSpeed = normalizeAbsoluteSpeed(settings.minSpeed, defaults.minSpeed);
    const maxSpeed = normalizeAbsoluteSpeed(settings.maxSpeed, defaults.maxSpeed);
    const normalizedMin = Math.min(minSpeed, maxSpeed);
    const normalizedMax = Math.max(minSpeed, maxSpeed);
    const safeMin =
      normalizedMin === normalizedMax
        ? Math.max(config.absoluteMinSpeed, normalizedMin - config.sliderStep)
        : normalizedMin;
    const safeMax =
      normalizedMin === normalizedMax
        ? Math.min(config.absoluteMaxSpeed, normalizedMax + config.sliderStep)
        : normalizedMax;

    return {
      minSpeed: safeMin,
      maxSpeed: safeMax,
      presets:
        Array.isArray(settings.presets) && settings.presets.length
          ? settings.presets.map((preset) => normalizeAbsoluteSpeed(preset))
          : defaults.presets,
    };
  }

  function clampToSettings(speed, settings = createDefaultSettings()) {
    const normalizedSpeed = normalizeAbsoluteSpeed(speed);
    return roundToTenth(
      Math.min(settings.maxSpeed, Math.max(settings.minSpeed, normalizedSpeed)),
    );
  }

  function formatSpeed(speed) {
    return `${speed.toFixed(1)}x`;
  }

  globalScope.SpeedControllerConfig = {
    ...config,
    clampAbsolute,
    roundToTenth,
    normalizeAbsoluteSpeed,
    createDefaultSettings,
    sanitizeSettings,
    clampToSettings,
    formatSpeed,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
