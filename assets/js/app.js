(function () {
  "use strict";

  const topics = window.SPEAKING_TOPICS;
  const elements = {
    categories: document.querySelector("#category-filters"),
    topicList: document.querySelector("#topic-list"),
    topicCount: document.querySelector("#topic-count"),
    search: document.querySelector("#topic-search"),
    completedCount: document.querySelector("#completed-count"),
    readerCategory: document.querySelector("#reader-category"),
    readerLevel: document.querySelector("#reader-level"),
    readerDuration: document.querySelector("#reader-duration"),
    readerTitle: document.querySelector("#reader-title"),
    readerNumber: document.querySelector("#reader-number"),
    readingWindow: document.querySelector("#reading-window"),
    readingCopy: document.querySelector("#reading-copy"),
    endOfReading: document.querySelector("#end-of-reading"),
    progressValue: document.querySelector("#progress-value"),
    progressTrack: document.querySelector(".progress-track"),
    progressFill: document.querySelector("#progress-fill"),
    paceSlider: document.querySelector("#pace-slider"),
    paceLabel: document.querySelector("#pace-label"),
    playButton: document.querySelector("#play-button"),
    playLabel: document.querySelector("#play-label"),
    playIcon: document.querySelector("#play-icon"),
    restartButton: document.querySelector("#restart-button"),
    nextButton: document.querySelector("#next-button"),
    textSizeButton: document.querySelector("#text-size-button"),
    status: document.querySelector("#app-status")
  };

  const storage = {
    read(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (error) {
        console.warn("Could not read saved practice data.", error);
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn("Could not save practice data.", error);
      }
    }
  };

  const completedTopics = new Set(storage.read("say-slowly-completed", []));
  let selectedCategory = "All topics";
  let selectedTopic = topics.find((topic) => topic.id === storage.read("say-slowly-last-topic", "")) || topics[0];
  let isPlaying = false;
  let lastFrame = 0;
  let animationFrame = 0;
  let fontSize = 19;

  function announce(message) {
    elements.status.textContent = message;
  }

  function renderCategories() {
    const categories = ["All topics", ...new Set(topics.map((topic) => topic.category))];
    elements.categories.replaceChildren();

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.className = "filter-chip";
      button.type = "button";
      button.textContent = category;
      button.setAttribute("aria-pressed", String(category === selectedCategory));
      button.addEventListener("click", () => {
        selectedCategory = category;
        renderCategories();
        renderTopicList();
      });
      elements.categories.append(button);
    });
  }

  function renderTopicList() {
    const query = elements.search.value.trim().toLowerCase();
    const visibleTopics = topics.filter((topic) => {
      const matchesCategory = selectedCategory === "All topics" || topic.category === selectedCategory;
      const matchesSearch = `${topic.title} ${topic.description} ${topic.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    elements.topicCount.textContent = String(visibleTopics.length).padStart(2, "0");
    elements.topicList.replaceChildren();

    if (visibleTopics.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No topics found. Try another search.";
      elements.topicList.append(empty);
      return;
    }

    visibleTopics.forEach((topic, index) => {
      const button = document.createElement("button");
      button.className = `topic-item${topic.id === selectedTopic.id ? " is-selected" : ""}`;
      button.type = "button";
      button.setAttribute("aria-pressed", String(topic.id === selectedTopic.id));
      button.setAttribute("aria-label", `${topic.title}, ${topic.level}, ${topic.minutes} minutes${completedTopics.has(topic.id) ? ", completed" : ""}`);

      const number = document.createElement("span");
      number.className = "topic-index";
      number.textContent = String(topics.indexOf(topic) + 1).padStart(2, "0");

      const details = document.createElement("span");
      details.className = "topic-details";
      const title = document.createElement("span");
      title.className = "topic-title";
      title.textContent = topic.title;
      const meta = document.createElement("span");
      meta.className = "topic-subtitle";
      meta.textContent = `${topic.level} · ${topic.minutes} min`;
      details.append(title, meta);

      const marker = document.createElement("span");
      marker.className = completedTopics.has(topic.id) ? "topic-marker is-done" : "topic-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = completedTopics.has(topic.id) ? "✓" : "↗";
      button.append(number, details, marker);
      button.addEventListener("click", () => selectTopic(topic));
      elements.topicList.append(button);
    });
  }

  function selectTopic(topic) {
    stopScrolling();
    selectedTopic = topic;
    storage.write("say-slowly-last-topic", topic.id);
    renderTopicList();
    renderReader();
    announce(`Selected topic: ${topic.title}`);
  }

  function renderReader() {
    const topicIndex = topics.indexOf(selectedTopic) + 1;
    elements.readerCategory.textContent = selectedTopic.category.toUpperCase();
    elements.readerLevel.textContent = selectedTopic.level;
    elements.readerDuration.textContent = `${selectedTopic.minutes} min`;
    elements.readerTitle.textContent = selectedTopic.title;
    elements.readerNumber.textContent = String(topicIndex).padStart(2, "0");
    elements.readingCopy.replaceChildren();
    selectedTopic.paragraphs.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      elements.readingCopy.append(paragraph);
    });
    elements.endOfReading.hidden = true;
    elements.readingWindow.scrollTop = 0;
    setProgress(0);
    setPlayState(false);
  }

  function setProgress(value) {
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    elements.progressValue.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(percent));
  }

  function setPlayState(playing) {
    isPlaying = playing;
    elements.playButton.classList.toggle("is-playing", playing);
    elements.playButton.setAttribute("aria-label", playing ? "Pause speaking practice" : "Start or resume speaking practice");
    elements.playIcon.textContent = playing ? "Ⅱ" : "▶";
    elements.playLabel.textContent = playing ? "Pause" : "Start speaking";
    elements.paceSlider.disabled = playing;
  }

  function stopScrolling() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    lastFrame = 0;
    setPlayState(false);
  }

  function markCompleted() {
    if (!completedTopics.has(selectedTopic.id)) {
      completedTopics.add(selectedTopic.id);
      storage.write("say-slowly-completed", [...completedTopics]);
      elements.completedCount.textContent = String(completedTopics.size);
      renderTopicList();
    }
    elements.endOfReading.hidden = false;
    announce(`Passage complete. ${selectedTopic.title} added to your completed topics.`);
  }

  function scrollPassage(timestamp) {
    if (!isPlaying) return;
    if (lastFrame === 0) lastFrame = timestamp;
    const elapsed = Math.min((timestamp - lastFrame) / 1000, 0.1);
    lastFrame = timestamp;
    const maxScroll = elements.readingWindow.scrollHeight - elements.readingWindow.clientHeight;

    if (maxScroll <= 0 || elements.readingWindow.scrollTop >= maxScroll - 1) {
      elements.readingWindow.scrollTop = Math.max(0, maxScroll);
      setProgress(100);
      stopScrolling();
      markCompleted();
      return;
    }

    elements.readingWindow.scrollTop += Number(elements.paceSlider.value) * elapsed;
    setProgress((elements.readingWindow.scrollTop / maxScroll) * 100);
    animationFrame = requestAnimationFrame(scrollPassage);
  }

  function togglePlayback() {
    if (isPlaying) {
      stopScrolling();
      announce("Practice paused.");
      return;
    }
    if (elements.readingWindow.scrollTop >= elements.readingWindow.scrollHeight - elements.readingWindow.clientHeight - 1) {
      elements.readingWindow.scrollTop = 0;
      elements.endOfReading.hidden = true;
      setProgress(0);
    }
    setPlayState(true);
    announce("Practice started. Read the passage out loud at your own pace.");
    animationFrame = requestAnimationFrame(scrollPassage);
  }

  function restartPassage() {
    stopScrolling();
    elements.readingWindow.scrollTop = 0;
    elements.endOfReading.hidden = true;
    setProgress(0);
    announce("Passage restarted.");
  }

  function selectNextTopic() {
    const currentIndex = topics.indexOf(selectedTopic);
    selectTopic(topics[(currentIndex + 1) % topics.length]);
  }

  function updatePaceLabel() {
    const pace = Number(elements.paceSlider.value);
    elements.paceLabel.textContent = pace < 20 ? "Slow" : pace < 36 ? "Steady" : "Brisk";
  }

  elements.search.addEventListener("input", renderTopicList);
  elements.playButton.addEventListener("click", togglePlayback);
  elements.restartButton.addEventListener("click", restartPassage);
  elements.nextButton.addEventListener("click", selectNextTopic);
  elements.paceSlider.addEventListener("input", updatePaceLabel);
  elements.textSizeButton.addEventListener("click", () => {
    fontSize = fontSize >= 23 ? 17 : fontSize + 2;
    elements.readingCopy.style.fontSize = `${fontSize}px`;
    elements.textSizeButton.setAttribute("aria-label", `Reading text size ${fontSize} pixels. Increase text size`);
  });
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat || event.target.matches("input, textarea, button, a, [contenteditable='true']")) return;
    event.preventDefault();
    togglePlayback();
  });

  elements.completedCount.textContent = String(completedTopics.size);
  renderCategories();
  renderTopicList();
  renderReader();
  updatePaceLabel();
})();
