const api = typeof browser !== "undefined" ? browser : chrome;
const {
  defaultSpeed: DEFAULT_SPEED,
  shortcutStep: SHORTCUT_STEP,
  normalizeAbsoluteSpeed,
  sanitizeSettings,
  clampToSettings,
} = SpeedControllerConfig;

let currentVideo = null;
let lastUrl = location.href;

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

function applySpeedToVideo(video, speed) {
  if (!video) {
    return;
  }

  const normalizedSpeed = normalizeAbsoluteSpeed(speed);

  if (video.playbackRate !== normalizedSpeed) {
    video.playbackRate = normalizedSpeed;
  }
}

async function applySavedSpeedToVideo(video = currentVideo) {
  if (!video) {
    return;
  }

  const data = await storageGet(["playbackSpeed", "settings"]);
  const settings = sanitizeSettings(data.settings);
  const speed = clampToSettings(data.playbackSpeed ?? DEFAULT_SPEED, settings);

  if (data.playbackSpeed !== speed || JSON.stringify(data.settings) !== JSON.stringify(settings)) {
    await storageSet({ playbackSpeed: speed, settings });
  }

  applySpeedToVideo(video, speed);
}

function handleVideoStateChange(event) {
  void applySavedSpeedToVideo(event.currentTarget);
}

function attachToVideo(video) {
  if (!video || video === currentVideo) {
    return;
  }

  if (currentVideo) {
    currentVideo.removeEventListener("loadeddata", handleVideoStateChange);
    currentVideo.removeEventListener("playing", handleVideoStateChange);
  }

  currentVideo = video;
  currentVideo.addEventListener("loadeddata", handleVideoStateChange);
  currentVideo.addEventListener("playing", handleVideoStateChange);
  void applySavedSpeedToVideo(currentVideo);
}

function hookCurrentVideo() {
  attachToVideo(document.querySelector("video"));
}

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
  }

  hookCurrentVideo();
});

observer.observe(document.documentElement, { childList: true, subtree: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hookCurrentVideo, {
    once: true,
  });
} else {
  hookCurrentVideo();
}

window.addEventListener("load", hookCurrentVideo, { once: true });

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [contenteditable=''], [contenteditable]"),
  );
}

async function updateSpeedFromShortcut(direction) {
  const data = await storageGet(["playbackSpeed", "settings"]);
  const settings = sanitizeSettings(data.settings);
  const currentSpeed = clampToSettings(data.playbackSpeed ?? DEFAULT_SPEED, settings);
  const nextSpeed = clampToSettings(currentSpeed + direction * SHORTCUT_STEP, settings);

  await storageSet({
    playbackSpeed: nextSpeed,
    settings,
  });
  applySpeedToVideo(document.querySelector("video"), nextSpeed);
}

document.addEventListener(
  "keydown",
  (event) => {
    if (!event.shiftKey || isEditableTarget(event.target)) {
      return;
    }

    const isIncrease = event.key === ">" || (event.code === "Period" && event.shiftKey);
    const isDecrease = event.key === "<" || (event.code === "Comma" && event.shiftKey);

    if (!isIncrease && !isDecrease) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    void updateSpeedFromShortcut(isIncrease ? 1 : -1);
  },
  true,
);

api.runtime.onMessage.addListener((request) => {
  if (request.action === "setSpeed") {
    applySpeedToVideo(document.querySelector("video"), request.speed);
  }
});
