/**
 * app.js
 *
 * No Cap Fund — Easy Action Tool
 *
 * Handles:
 *   - Email template randomization (client-side, locked per session)
 *   - ZIP-to-rep lookup (stubbed — wire to Google Civic Information API)
 *   - Dynamic template rendering with rep/constituent name substitution
 *   - Personal note toggle and appending
 *   - Form validation
 *   - Form submission (stubbed — wire to Action Network API)
 *   - Success state + social sharing
 */

(function () {
  "use strict";

  /* ── Constants ──────────────────────────────────────────────────────────── */

  const SHARE_URL = "https://nocapfund.org/take-action"; // Update when live
  const SHARE_TEXT = "I just emailed my House rep to uncap Congress. Takes 60 seconds — join me:";

  /* ── DOM References ─────────────────────────────────────────────────────── */

  const form            = document.getElementById("action-form");
  const firstNameInput  = document.getElementById("first-name");
  const lastNameInput   = document.getElementById("last-name");
  const emailInput      = document.getElementById("email");
  const zipInput        = document.getElementById("zip");
  const repNameText     = document.getElementById("rep-name-text");
  const previewTo       = document.getElementById("preview-to");
  const emailBody       = document.getElementById("email-body");
  const toggleEditBtn   = document.getElementById("toggle-edit-btn");
  const personalNoteToggle = document.getElementById("personal-note-toggle");
  const personalNoteField  = document.getElementById("personal-note-field");
  const personalNoteInput  = document.getElementById("personal-note");
  const sendBtn         = document.getElementById("send-btn");
  const successState    = document.getElementById("success-state");
  const successRepName  = document.getElementById("success-rep-name");
  const shareTwitter    = document.getElementById("share-twitter");
  const shareFacebook   = document.getElementById("share-facebook");
  const shareCopy       = document.getElementById("share-copy");
  const sendAnotherBtn  = document.getElementById("send-another-btn");

  /* ── Session State ──────────────────────────────────────────────────────── */

  const state = {
    template:     null,   // The locked EMAIL_TEMPLATES entry for this session
    rep: {
      fullName:   null,   // e.g. "Rep. Jane Smith"
      lastName:   null,   // e.g. "Smith"
      office:     null,   // e.g. "OR-02"
      email:      null,   // Representative's contact email (from API)
      webFormUrl: null,   // Rep web form URL (fallback if no direct email)
    },
    submitted:    false,
  };

  /* ── Template Initialization ────────────────────────────────────────────── */

  function initTemplate() {
    const templates = window.EMAIL_TEMPLATES;
    const randomIndex = Math.floor(Math.random() * templates.length);
    state.template = templates[randomIndex];
    renderEmailBody();
  }

  /**
   * Renders the current template into the email body textarea,
   * substituting placeholders with current state values.
   */
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

    // Update the "To:" field in the preview header
    previewTo.textContent = state.rep.fullName || "Your representative";
  }

  function getConstituentName() {
    const first = firstNameInput.value.trim();
    const last  = lastNameInput.value.trim();
    return [first, last].filter(Boolean).join(" ");
  }

  /* ── Editable Toggle ────────────────────────────────────────────────────── */

  toggleEditBtn.addEventListener("click", function () {
    const isEditable = emailBody.readOnly;
    emailBody.readOnly = !isEditable;
    toggleEditBtn.textContent = isEditable ? "Lock" : "Editable";
    toggleEditBtn.setAttribute("aria-expanded", String(isEditable));

    if (isEditable) {
      emailBody.focus();
    }
  });

  /* ── Personal Note Toggle ───────────────────────────────────────────────── */

  personalNoteToggle.addEventListener("click", function () {
    const isHidden = personalNoteField.hidden;
    personalNoteField.hidden = !isHidden;
    personalNoteToggle.setAttribute("aria-expanded", String(isHidden));

    if (isHidden) {
      personalNoteInput.focus();
    }
  });

  /* ── Name Fields → Re-render Signature ─────────────────────────────────── */

  firstNameInput.addEventListener("input", onNameChange);
  lastNameInput.addEventListener("input",  onNameChange);

  function onNameChange() {
    // Only re-render if the template body isn't user-edited
    if (emailBody.readOnly) {
      renderEmailBody();
    }
  }

  /* ── ZIP Lookup ─────────────────────────────────────────────────────────── */

  zipInput.addEventListener("blur", onZipBlur);

  function onZipBlur() {
    const zip = zipInput.value.trim();
    if (!isValidZip(zip)) return;
    lookupRepByZip(zip);
  }

  function isValidZip(zip) {
    return /^\d{5}$/.test(zip);
  }

  /**
   * lookupRepByZip
   *
   * TODO: Replace the stub below with a real call to the Google Civic
   * Information API.
   *
   * Live endpoint (requires an API key passed as a query param):
   *   https://civicinfo.googleapis.com/civicinfo/v2/representatives
   *     ?address={ZIP}&levels=country&roles=legislatorLowerBody
   *     &key={GOOGLE_CIVIC_API_KEY}
   *
   * On success: parse officials[] and offices[] from the response,
   *   find the U.S. House member, then call setRep().
   *
   * On failure or no result: call setRepError().
   */
  function lookupRepByZip(zip) {
    setRepLoading();

    // ── STUB ──────────────────────────────────────────────────────────────
    // Simulates an async API response. Remove this block and implement the
    // real fetch() call to the Google Civic Information API.
    setTimeout(function () {
      // Example stubbed representative data structure — mirrors what the
      // Civic API returns after parsing.
      const stubbedRep = {
        fullName:   "Rep. Jane Smith",
        lastName:   "Smith",
        office:     "OR-02",
        email:      null,         // Most reps don't expose direct email
        webFormUrl: "https://www.house.gov/representatives/find-your-representative",
      };

      setRep(stubbedRep);
    }, 600);
    // ── END STUB ──────────────────────────────────────────────────────────
  }

  function setRepLoading() {
    repNameText.textContent = "Looking up your rep…";
    repNameText.className = "rep-name rep-loading";
  }

  function setRep(rep) {
    state.rep = rep;
    repNameText.textContent = rep.fullName + (rep.office ? " (" + rep.office + ")" : "");
    repNameText.className = "rep-name";
    clearFieldError("zip");
    renderEmailBody();
  }

  function setRepError(message) {
    repNameText.textContent = message || "Could not find rep — check ZIP or visit house.gov";
    repNameText.className = "rep-name rep-error";
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
    if (input)  input.classList.add("input-error");
    if (error)  error.textContent = message;
  }

  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + "-error");
    if (input)  input.classList.remove("input-error");
    if (error)  error.textContent = "";
  }

  /* ── Form Submission ────────────────────────────────────────────────────── */

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (state.submitted) return;
    if (!validateForm())  return;

    // Re-render to capture any name changes before submitting
    renderEmailBody();

    const payload = buildPayload();
    submitAction(payload);
  });

  function buildPayload() {
    const personalNote = personalNoteInput.value.trim();
    let finalEmailBody = emailBody.value.trim();

    if (personalNote) {
      finalEmailBody += "\n\n---\n" + personalNote;
    }

    return {
      firstName:       firstNameInput.value.trim(),
      lastName:        lastNameInput.value.trim(),
      email:           emailInput.value.trim(),
      zip:             zipInput.value.trim(),
      optIn:           document.getElementById("opt-in").checked,
      rep:             { ...state.rep },
      templateId:      state.template.id,
      emailSubject:    window.EMAIL_SUBJECT,
      emailBody:       finalEmailBody,
    };
  }

  /**
   * submitAction
   *
   * TODO: Replace the stub below with a real API call to Action Network
   * (or whichever delivery service is chosen).
   *
   * Action Network petition/action endpoint (example):
   *   POST https://actionnetwork.org/api/v2/petitions/{petition_id}/signatures
   *
   * Headers:
   *   OSDI-API-Token: {ACTION_NETWORK_API_KEY}
   *   Content-Type: application/json
   *
   * Body shape will depend on how the Action Network action is configured.
   * The emailBody and rep data will likely need to be mapped to custom fields.
   *
   * Also log each submission to your analytics/CRM as needed.
   */
  function submitAction(payload) {
    setSendingState(true);

    // ── STUB ──────────────────────────────────────────────────────────────
    console.log("[No Cap Fund] Submission payload (stub):", payload);

    // Simulates async API response. Replace with real fetch() call.
    setTimeout(function () {
      const success = true; // Simulate success

      if (success) {
        onSubmitSuccess(payload);
      } else {
        onSubmitError("Something went wrong. Please try again.");
      }
    }, 1000);
    // ── END STUB ──────────────────────────────────────────────────────────
  }

  function setSendingState(isSending) {
    sendBtn.disabled = isSending;
    sendBtn.classList.toggle("loading", isSending);
    sendBtn.textContent = isSending ? "Sending…" : "Send Email →";
  }

  function onSubmitSuccess(payload) {
    state.submitted = true;
    setSendingState(false);

    // Populate success state
    successRepName.textContent = payload.rep.fullName || "your representative";
    setShareLinks();

    // Swap form for success state
    form.hidden = true;
    successState.hidden = false;
    successState.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onSubmitError(message) {
    setSendingState(false);
    // Display a general error near the submit button
    const existingError = document.getElementById("submit-error");
    if (!existingError) {
      const errorEl = document.createElement("p");
      errorEl.id = "submit-error";
      errorEl.style.color = "#f87171";
      errorEl.style.fontSize = "0.85rem";
      errorEl.style.marginTop = "0.5rem";
      errorEl.textContent = message;
      sendBtn.parentElement.appendChild(errorEl);
    }
  }

  /* ── Social Sharing ─────────────────────────────────────────────────────── */

  function setShareLinks() {
    const encoded = encodeURIComponent(SHARE_URL);
    const text    = encodeURIComponent(SHARE_TEXT + " " + SHARE_URL);

    shareTwitter.href  = "https://twitter.com/intent/tweet?text=" + text;
    shareFacebook.href = "https://www.facebook.com/sharer/sharer.php?u=" + encoded;
  }

  shareCopy.addEventListener("click", function () {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SHARE_URL).then(function () {
        shareCopy.textContent = "Copied!";
        shareCopy.classList.add("copied");
        setTimeout(function () {
          shareCopy.textContent = "Copy link";
          shareCopy.classList.remove("copied");
        }, 2000);
      });
    } else {
      // Fallback for older browsers
      const temp = document.createElement("input");
      temp.value = SHARE_URL;
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
    state.rep = { fullName: null, lastName: null, office: null, email: null, webFormUrl: null };

    form.reset();
    repNameText.textContent = "Auto-detects your rep";
    repNameText.className   = "rep-name";
    previewTo.textContent   = "Your representative";
    emailBody.readOnly      = true;
    toggleEditBtn.textContent = "Editable";
    toggleEditBtn.setAttribute("aria-expanded", "false");
    personalNoteField.hidden = true;
    personalNoteToggle.setAttribute("aria-expanded", "false");

    // Pick a new random template for the next session
    initTemplate();

    successState.hidden = false;
    form.hidden         = false;
    successState.hidden = true;
    sendBtn.disabled    = false;
    sendBtn.textContent = "Send Email →";

    firstNameInput.focus();
  });

  /* ── Boot ───────────────────────────────────────────────────────────────── */

  initTemplate();

})();
