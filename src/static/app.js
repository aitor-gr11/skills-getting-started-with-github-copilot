document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml =
          details.participants && details.participants.length
            ? `<ul class="participants-list">${details.participants
                .map(
                  (p) =>
                    `<li title="${escapeHtml(p)}"><span class="participant-email">${escapeHtml(p)}</span><button class="remove-participant" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" aria-label="Remove ${escapeHtml(p)}">✖</button></li>`
                )
                .join("")}</ul>`
            : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <div class="activity-header">
            <h4>${escapeHtml(name)}</h4>
            <span class="spots-badge">${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left</span>
          </div>
          <p class="muted"><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p>${escapeHtml(details.description)}</p>
          <div class="participants">
            <p class="participants-title"><strong>Participants (${details.participants.length}):</strong></p>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Simple helper to avoid injecting raw HTML from data
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears without a full page reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Delegate removal clicks for participants (event delegation)
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".remove-participant");
    if (!btn) return;

    const activityName = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!activityName || !email) return;

    const confirmed = confirm(`Remove ${email} from ${activityName}?`);
    if (!confirmed) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await resp.json();

      if (resp.ok) {
        // Optimistically remove the participant from the DOM
        const li = btn.closest("li");
        if (li) li.remove();
        // Refresh the activities list to keep counts and badges in sync
        fetchActivities();
      } else {
        alert(result.detail || result.message || "Failed to remove participant");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Network error while removing participant");
    }
  });
});
