(function () {
  "use strict";

  const mediaInput = document.querySelector("#media-file");
  const uploadArea = document.querySelector("#upload-area");
  const uploadPrompt = document.querySelector("#upload-prompt");
  const imagePreview = document.querySelector("#image-preview");
  const videoPreview = document.querySelector("#video-preview");
  const removeMedia = document.querySelector("#remove-media");
  const momentInput = document.querySelector("#moment-input");
  const characterCount = document.querySelector("#character-count");
  const vibeOptions = document.querySelector("#vibe-options");
  const status = document.querySelector("#vibe-status");
  let selectedVibe = window.STUDIO_VIBES[0];
  let mediaUrl = "";

  function setStatus(message) {
    status.textContent = message;
  }

  function renderVibes() {
    window.STUDIO_VIBES.forEach((vibe) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vibe-option";
      button.textContent = vibe.label;
      button.setAttribute("aria-pressed", String(vibe.id === selectedVibe.id));
      button.addEventListener("click", () => {
        selectedVibe = vibe;
        vibeOptions.querySelectorAll(".vibe-option").forEach((option) => {
          option.setAttribute("aria-pressed", String(option.textContent === vibe.label));
        });
      });
      vibeOptions.append(button);
    });
  }

  function clearMedia() {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    mediaUrl = "";
    imagePreview.removeAttribute("src");
    videoPreview.pause();
    videoPreview.removeAttribute("src");
    videoPreview.load();
    imagePreview.hidden = true;
    videoPreview.hidden = true;
    uploadPrompt.hidden = false;
    removeMedia.hidden = true;
    mediaInput.value = "";
  }

  function loadMedia(file) {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Choose an image or video file.");
      mediaInput.value = "";
      return;
    }
    clearMedia();
    mediaUrl = URL.createObjectURL(file);
    uploadPrompt.hidden = true;
    removeMedia.hidden = false;
    if (file.type.startsWith("image/")) {
      imagePreview.src = mediaUrl;
      imagePreview.hidden = false;
    } else {
      videoPreview.src = mediaUrl;
      videoPreview.hidden = false;
    }
    setStatus(`${file.type.startsWith("video/") ? "Video" : "Photo"} preview ready: ${file.name}`);
  }

  function generateCopy() {
    const moment = momentInput.value.trim();
    if (!moment) {
      momentInput.focus();
      setStatus("Add a few words about the moment first.");
      return;
    }
    const caption = `${selectedVibe.caption} ${moment}`;
    const description = `A ${selectedVibe.words} moment: ${moment} ${selectedVibe.detail}`;
    document.querySelector("#caption-output").value = caption;
    document.querySelector("#description-output").value = description;
    setStatus(`Caption and description created with your ${selectedVibe.label.toLowerCase()} vibe. Your words are ready to edit.`);
  }

  mediaInput.addEventListener("change", () => loadMedia(mediaInput.files[0]));
  momentInput.addEventListener("input", () => {
    characterCount.textContent = `${momentInput.value.length} / 240`;
  });
  removeMedia.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearMedia();
    setStatus("Media removed.");
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadArea.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadArea.classList.remove("is-dragging");
    });
  });
  uploadArea.addEventListener("drop", (event) => loadMedia(event.dataTransfer.files[0]));
  document.querySelector("#generate-button").addEventListener("click", generateCopy);
  document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = document.querySelector(`#${button.dataset.copy}`).value.trim();
      if (!text) {
        setStatus("Create some writing before copying it.");
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Copied to clipboard.");
      } catch (error) {
        console.error("Could not copy generated writing.", error);
        setStatus("Clipboard access was blocked by the browser. Select the text and copy it manually.");
      }
    });
  });
  window.addEventListener("pagehide", () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  });

  renderVibes();
})();
