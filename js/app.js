/**
 * app.js
 *
 * No Cap Fund — Easy Action Tool
 *
 * Handles:
 *   - Email template randomization (client-side, locked per session)
 *   - ZIP-to-rep lookup via Google Civic Information API (two-pass with
 *     split-ZIP fallback: if a ZIP maps to multiple districts, a district
 *     picker UI is shown so the user can select their rep)
 *   - Dynamic template rendering with rep/constituent name substitution
 *   - Personal note toggle and appending
 *   - Form validation
 *   - Form submission via Action Network API
 *   - Success state + social sharing
 *
 * ── CONFIGURATION ────────────────────────────────────────────────────────────
 * Before going live, set the three values in the CONFIG block below.
 * Keep API keys out of client-side JS in production — route through a
 * serverless function (Vercel / Netlify Functions / Cloudflare Workers).
 *
 * ── TEST HARNESS ─────────────────────────────────────────────────────────────
 * Set TEST_MODE = true to run without hitting live APIs.
 * Special ZIPs in test mode:
 *   00000 → simulates API error / no rep found
 *   11111 → simulates a split ZIP (two reps returned, picker shown)
 *   any other valid 5-digit ZIP → returns a stubbed single rep
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  "use strict";

  /* ── Configuration ──────────────────────────────────────────────────────── */

  const CONFIG = {
    GOOGLE_CIVIC_API_KEY:       "YOUR_GOOGLE_CIVIC_API_KEY",   // Replace before launch
    ACTION_NETWORK_API_KEY:     "YOUR_ACTION_NETWORK_API_KEY", // Replace before launch
    ACTION_NETWORK_ENDPOINT:    "YOUR_ACTION_NETWORK_ENDPOINT_URL", // Replace before launch
    SHARE_URL:  "https://nocapfund.org/take-action",
    SHARE_TEXT: "I just emailed my House rep to uncap Congress. Takes 60 seconds — join me:",
  };

  // ── Set to true to run against stubs instead of live APIs ──────────────────
  const TEST_MODE = false;

  /* ── DOM References ─────────────────────────────────────────────────────── */

  const form               = document.getElementById("action-form");
  const firstNameInput     = document.getElementById("first-name");
  const lastNameInput      = document.getElementById("last-name");
  const emailInput         = document.getElementById("email");
  const zipInput           = document.getElementById("zip");
  const repNameText        = document.getElementById("rep-name-text");
  const previewTo          = document.getElementById("preview-to");
  const emailBody          = document.getElementById("email-body");
  const toggleEditBtn      = document.getElementById("toggle-edit-btn");
  const personalNoteToggle = document.getElementById("personal-note-toggle");
  const personalNoteField  = document.getElementById("personal-note-field");
  const personalNoteInput  = document.getElementById("personal-note");
  const sendBtn            = document.getElementById("send-btn");
  const successState       = document.getElementById("success-state");
  const successRepName     = document.getElementById("success-rep-name");
  const shareTwitter       = document.getElementById("share-twitter");
  const shareFacebook      = document.getElementById("share-facebook");
  const shareCopy          = document.getElementById("share-copy");
  const sendAnotherBtn     = document.getElementById("send-another-btn");

  /* ── Session State ──────────────────────────────────────────────────────── */

  const state = {
    template: null,   // Locked EMAIL_TEMPLATES entry for this session
    rep: {
      fullName:   null,
      lastName:   null,
      office:     null,
      email:      null,
      webFormUrl: null,
    },
    submitted: false,
  };

  /* ── Template Initialization ────────────────────────────────────────────── */

  function initTemplate() {
    const templates  = window.EMAIL_TEMPLATES;
    const randomIndex = Math.floor(Math.random() * templates.length);
    state.template   = templates[randomIndex];
    renderEmailBody();
  }

  function renderEmailBody() {
    if (!state.template) return;

    const constituentName = getConstituentName();
    const repLastName     = state.rep.lastName || "Representative";
    const repFullName     = state.rep.fullName || "your Representative";

    let body = state.template.body
      .replace(/\{\{REP_LAST_NAME\}\}/g,    repLastName)
      .replace(/\{\{REP_FULL_NAME\}\}/g,    repFullName)
      .replace(/\{\{CONSTITUENT_NAME\}\}/g, constituentName || "[Your Name]");

    emailBody.value = body;
    previewTo.textContent = state.rep.fullName || "Your representative";
  }

  function getConstituentName() {
    const first = firstNameInput.value.trim();
    const last  = lastNameInput.value.trim();
    return [first, last].filter(Boolean).join(" ");
  }

  /* ── Editable Toggle ────────────────────────────────────────────────────── */

  toggleEditBtn.addEventListener("click", function () {
    const isEditable      = emailBody.readOnly;
    emailBody.readOnly    = !isEditable;
    toggleEditBtn.textContent = isEditable ? "Lock" : "Editable";
    toggleEditBtn.setAttribute("aria-expanded", String(isEditable));
    if (isEditable) emailBody.focus();
  });

  /* ── Personal Note Toggle ───────────────────────────────────────────────── */

  personalNoteToggle.addEventListener("click", function () {
    const isHidden            = personalNoteField.hidden;
    personalNoteField.hidden  = !isHidden;
    personalNoteToggle.setAttribute("aria-expanded", String(isHidden));
    if (isHidden) personalNoteInput.focus();
  });

  /* ── Name Fields → Re-render Signature ─────────────────────────────────── */

  firstNameInput.addEventListener("input", onNameChange);
  lastNameInput.addEventListener("input",  onNameChange);

  function onNameChange() {
    if (emailBody.readOnly) renderEmailBody();
  }

  /* ── ZIP Lookup ─────────────────────────────────────────────────────────── */

  zipInput.addEventListener("blur", onZipBlur);

  function onZipBlur() {
    const zip = zipInput.value.trim();
    if (!isValidZip(zip)) return;
    removeSplitZipPicker(); // Clear any previous picker
    lookupRepByZip(zip);
  }

  function isValidZip(zip) {
    return /^\d{5}$/.test(zip);
  }

  /**
   * lookupRepByZip
   *
   * Two-pass strategy:
   *   Pass 1 — query Civic API with just the ZIP.
   *   Pass 2 — if multiple House members come back (split ZIP), show a
   *             district picker so the user can select their rep.
   *
   * In TEST_MODE, no live API calls are made. Special ZIPs:
   *   00000 → error state
   *   11111 → split-ZIP picker (two stubbed reps)
   *   other → single stubbed rep
   */
  async function lookupRepByZip(zip) {
    setRepLoading();

    if (TEST_MODE) {
      await simulateLookup(zip);
      return;
    }

    try {
      const url =
        "https://civicinfo.googleapis.com/civicinfo/v2/representatives" +
        "?key="     + encodeURIComponent(CONFIG.GOOGLE_CIVIC_API_KEY) +
        "&address=" + encodeURIComponent(zip) +
        "&levels=country&roles=legislatorLowerBody";

      const res  = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.officials || data.officials.length === 0) {
        setRepError("Couldn't find a rep for this ZIP — check it or visit house.gov");
        return;
      }

      // Collect all House members returned (split ZIPs can return more than one)
      const houseMembers = extractHouseMembers(data);

      if (houseMembers.length === 0) {
        setRepError("Couldn't find a House rep for this ZIP — try house.gov");
      } else if (houseMembers.length === 1) {
        setRep(houseMembers[0]);
      } else {
        // Split ZIP — show picker
        showSplitZipPicker(houseMembers);
      }

    } catch (err) {
      console.error("[NoCap] Civic API error:", err);
      setRepError("Lookup unavailable — please edit the salutation manually");
    }
  }

  /**
   * extractHouseMembers
   *
   * Parses the raw Civic API response and returns an array of rep objects,
   * one per House member found (usually 1, occasionally 2 for split ZIPs).
   */
  function extractHouseMembers(data) {
    const offices  = data.offices  || [];
    const officials = data.officials || [];
    const members  = [];

    for (const office of offices) {
      const isHouse =
        office.levels && office.levels.includes("country") &&
        office.roles  && office.roles.includes("legislatorLowerBody");

      if (!isHouse) continue;

      for (const idx of (office.officialIndices || [])) {
        const official = officials[idx];
        if (!official) continue;

        const nameParts = official.name.trim().split(/\s+/);
        const lastName  = nameParts[nameParts.length - 1];

        // Extract district label from office name, e.g. "Oregon's 2nd Congressional District"
        const districtMatch = office.name.match(/(\d+(?:st|nd|rd|th)?)\s+congressional/i);
        const districtLabel = districtMatch ? districtMatch[0] : office.name;

        members.push({
          fullName:   official.name,
          lastName:   lastName,
          office:     office.name,
          district:   districtLabel,
          email:      (official.emails && official.emails[0]) || null,
          webFormUrl: (official.urls   && official.urls[0])   || "https://www.house.gov/representatives/find-your-representative",
        });
      }
    }

    return members;
  }

  /* ── Split ZIP Picker ───────────────────────────────────────────────────── */

  /**
   * showSplitZipPicker
   *
   * Renders a small inline UI below the ZIP field listing all reps found.
   * User selects one and the tool proceeds normally.
   */
  function showSplitZipPicker(members) {
    removeSplitZipPicker();

    repNameText.textContent = "Your ZIP spans multiple districts — select yours:";
    repNameText.className   = "rep-name";

    const picker = document.createElement("div");
    picker.id    = "split-zip-picker";
    picker.style.cssText = [
      "margin-top: 0.6rem",
      "display: flex",
      "flex-direction: column",
      "gap: 0.4rem",
    ].join(";");

    members.forEach(function (member) {
      const btn = document.createElement("button");
      btn.type  = "button";
      btn.textContent = member.fullName + " — " + member.office;
      btn.style.cssText = [
        "background: rgba(255,255,255,0.08)",
        "border: 1px solid rgba(255,255,255,0.2)",
        "border-radius: 6px",
        "color: #f0f4ff",
        "cursor: pointer",
        "font-size: 0.88rem",
        "padding: 0.5rem 0.75rem",
        "text-align: left",
        "transition: background 0.15s",
      ].join(";");

      btn.addEventListener("mouseenter", function () {
        btn.style.background = "rgba(255,255,255,0.14)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.background = "rgba(255,255,255,0.08)";
      });

      btn.addEventListener("click", function () {
        setRep(member);
        removeSplitZipPicker();
      });

      picker.appendChild(btn);
    });

    // Insert picker after the zip-row
    const zipRow = zipInput.closest(".zip-row") || zipInput.parentElement;
    zipRow.parentElement.insertBefore(picker, zipRow.nextSibling);
  }

  function removeSplitZipPicker() {
    const existing = document.getElementById("split-zip-picker");
    if (existing) existing.remove();
  }

  /* ── Rep State Helpers ──────────────────────────────────────────────────── */

  function setRepLoading() {
    repNameText.textContent = "Looking up your rep…";
    repNameText.className   = "rep-name rep-loading";
  }

  function setRep(rep) {
    state.rep = rep;
    repNameText.textContent = rep.fullName + (rep.office ? " (" + rep.office + ")" : "");
    repNameText.className   = "rep-name";
    clearFieldError("zip");
    renderEmailBody();
  }

  function setRepError(message) {
    repNameText.textContent = message || "Could not find rep — check ZIP or visit house.gov";
    repNameText.className   = "rep-name rep-error";
  }

  /* ── Test Mode Simulator ────────────────────────────────────────────────── */

  async function simulateLookup(zip) {
    await delay(600);

    if (zip === "00000") {
      setRepError("TEST: No rep found for this ZIP (simulated error)");
      return;
    }

    if (zip === "11111") {
      // Simulate a split ZIP with two reps
      showSplitZipPicker([
        {
          fullName:   "Rep. Alex Johnson",
          lastName:   "Johnson",
          office:     "TX-07",
          district:   "7th Congressional District",
          email:      null,
          webFormUrl: "https://www.house.gov/representatives/find-your-representative",
        },
        {
          fullName:   "Rep. Maria Chen",
          lastName:   "Chen",
          office:     "TX-08",
          district:   "8th Congressional District",
          email:      null,
          webFormUrl: "https://www.house.gov/representatives/find-your-representative",
        },
      ]);
      return;
    }

    // Default: single stubbed rep for any other valid ZIP
    setRep({
      fullName:   "Rep. Jane Smith",
      lastName:   "Smith",
      office:     "OR-02",
      district:   "2nd Congressional District",
      email:      null,
      webFormUrl: "https://www.house.gov/representatives/find-your-representative",
    });
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* ── Form Validation ────────────────────────────────────────────────────── */

  function validateForm() {
    let valid = true;

    if (!firstNameInput.value.trim()) {
      setFieldError("first-name", "First name is required.");
      valid = false;
    } else {
      clearFieldError("first-name");
    }

    if (!lastNameInput.value.trim()) {
      setFieldError("last-name", "Last name is required.");
      valid = false;
    } else {
      clearFieldError("last-name");
    }

    if (!isValidEmail(emailInput.value.trim())) {
      setFieldError("email", "Please enter a valid email address.");
      valid = false;
    } else {
      clearFieldError("email");
    }

    if (!isValidZip(zipInput.value.trim())) {
      setFieldError("zip", "Please enter a valid 5-digit ZIP code.");
      valid = false;
    } else {
      clearFieldError("zip");
    }

    if (!state.rep.lastName) {
      setFieldError("zip", "We couldn't find your representative. Try re-entering your ZIP.");
      valid = false;
    }

    return valid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + "-error");
    if (input) input.classList.add("input-error");
    if (error) error.textContent = message;
  }

  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + "-error");
    if (input) input.classList.remove("input-error");
    if (error) error.textContent = "";
  }

  /* ── Form Submission ────────────────────────────────────────────────────── */

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.submitted)  return;
    if (!validateForm())  return;
    renderEmailBody(); // Capture any last-second name changes
    submitAction(buildPayload());
  });

  function buildPayload() {
    const personalNote = personalNoteInput ? personalNoteInput.value.trim() : "";
    let finalEmailBody = emailBody.value.trim();

    if (personalNote) {
      finalEmailBody += "\n\n---\n" + personalNote;
    }

    return {
      firstName:    firstNameInput.value.trim(),
      lastName:     lastNameInput.value.trim(),
      email:        emailInput.value.trim(),
      zip:          zipInput.value.trim(),
      optIn:        document.getElementById("opt-in").checked,
      rep:          Object.assign({}, state.rep),
      templateId:   state.template.id,
      emailSubject: window.EMAIL_SUBJECT,
      emailBody:    finalEmailBody,
    };
  }

  /**
   * submitAction
   *
   * Posts the submission payload to Action Network's Email Targets endpoint.
   * In TEST_MODE, logs the payload and simulates success without a real POST.
   *
   * Action Network endpoint (configure in CONFIG above):
   *   POST https://actionnetwork.org/api/v2/petitions/{petition_id}/signatures
   *
   * Headers:
   *   OSDI-API-Token: {ACTION_NETWORK_API_KEY}
   *   Content-Type: application/json
   */
  async function submitAction(payload) {
    setSendingState(true);

    if (TEST_MODE) {
      console.log("[NoCap TEST] Submission payload:", payload);
      await delay(1000);
      onSubmitSuccess(payload);
      return;
    }

    try {
      const body = {
        person: {
          given_name:      payload.firstName,
          family_name:     payload.lastName,
          email_addresses: [{
            address: payload.email,
            status:  payload.optIn ? "subscribed" : "unsubscribed",
          }],
          postal_addresses: [{ postal_code: payload.zip }],
        },
        action_fields: {
          message:       payload.emailBody,
          subject:       payload.emailSubject,
          target:        payload.rep.fullName  || "My Representative",
          target_office: payload.rep.office    || "U.S. House of Representatives",
        },
      };

      const res = await fetch(CONFIG.ACTION_NETWORK_ENDPOINT, {
        method:  "POST",
        headers: {
          "Content-Type":   "application/json",
          "OSDI-API-Token": CONFIG.ACTION_NETWORK_API_KEY,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Action Network returned " + res.status);
      }

      onSubmitSuccess(payload);

    } catch (err) {
      console.error("[NoCap] Submission error:", err);
      onSubmitError("Something went wrong — please try again or email us at hello@nocapfund.org");
    }
  }

  function setSendingState(isSending) {
    sendBtn.disabled     = isSending;
    sendBtn.classList.toggle("loading", isSending);
    sendBtn.textContent  = isSending ? "Sending…" : "Send Email →";
  }

  function onSubmitSuccess(payload) {
    state.submitted = true;
    setSendingState(false);
    successRepName.textContent = payload.rep.fullName || "your representative";
    setShareLinks();
    form.hidden         = true;
    successState.hidden = false;
    successState.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onSubmitError(message) {
    setSendingState(false);
    let errorEl = document.getElementById("submit-error");
    if (!errorEl) {
      errorEl          = document.createElement("p");
      errorEl.id       = "submit-error";
      errorEl.style.cssText = "color:#f87171;font-size:0.85rem;margin-top:0.5rem";
      sendBtn.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  /* ── Social Sharing ─────────────────────────────────────────────────────── */

  function setShareLinks() {
    const encoded = encodeURIComponent(CONFIG.SHARE_URL);
    const text    = encodeURIComponent(CONFIG.SHARE_TEXT + " " + CONFIG.SHARE_URL);
    shareTwitter.href  = "https://twitter.com/intent/tweet?text=" + text;
    shareFacebook.href = "https://www.facebook.com/sharer/sharer.php?u=" + encoded;
  }

  shareCopy.addEventListener("click", function () {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(CONFIG.SHARE_URL).then(function () {
        shareCopy.textContent = "Copied!";
        shareCopy.classList.add("copied");
        setTimeout(function () {
          shareCopy.textContent = "Copy link";
          shareCopy.classList.remove("copied");
        }, 2000);
      });
    } else {
      const temp = document.createElement("input");
      temp.value = CONFIG.SHARE_URL;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      shareCopy.textContent = "Copied!";
      setTimeout(function () { shareCopy.textContent = "Copy link"; }, 2000);
    }
  });

  /* ── "Send Another" ─────────────────────────────────────────────────────── */

  sendAnotherBtn.addEventListener("click", function () {
    state.submitted = false;
    state.rep       = { fullName: null, lastName: null, office: null, email: null, webFormUrl: null };

    form.reset();
    removeSplitZipPicker();
    repNameText.textContent   = "Auto-detects your rep";
    repNameText.className     = "rep-name";
    previewTo.textContent     = "Your representative";
    emailBody.readOnly        = true;
    toggleEditBtn.textContent = "Editable";
    toggleEditBtn.setAttribute("aria-expanded", "false");
    personalNoteField.hidden  = true;
    personalNoteToggle.setAttribute("aria-expanded", "false");

    initTemplate(); // Pick a fresh random template

    successState.hidden = true;
    form.hidden         = false;
    sendBtn.disabled    = false;
    sendBtn.textContent = "Send Email →";

    firstNameInput.focus();
  });

  /* ── Boot ───────────────────────────────────────────────────────────────── */

  initTemplate();

})();
