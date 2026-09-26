(function () {
  "use strict";

  const storageKey = "my-studio-credit";
  const dialog = document.querySelector("#credit-dialog");
  const form = document.querySelector("#credit-form");
  const input = document.querySelector("#credit-input");

  function readCredit() {
    try {
      return localStorage.getItem(storageKey) ?? "@sumxn-official";
    } catch (error) {
      console.warn("Could not read saved studio credit.", error);
      return "@sumxn-official";
    }
  }

  function saveCredit(value) {
    try {
      localStorage.setItem(storageKey, value);
      return true;
    } catch (error) {
      console.error("Could not save studio credit.", error);
      return false;
    }
  }

  document.querySelector("#credit-settings-button").addEventListener("click", () => {
    input.value = readCredit();
    dialog.showModal();
    input.focus();
  });
  document.querySelector("#credit-cancel").addEventListener("click", () => dialog.close());
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rawValue = input.value.trim();
    const handle = rawValue && !rawValue.startsWith("@") ? `@${rawValue}` : rawValue;
    if (!saveCredit(handle)) {
      window.alert("Your browser could not save this handle. Check your storage settings and try again.");
      return;
    }
    dialog.close();
    document.querySelector("#credit-settings-button").textContent = handle || "Set your @credit";
  });

  const currentCredit = readCredit();
  document.querySelector("#credit-settings-button").textContent = currentCredit || "Set your @credit";
})();
