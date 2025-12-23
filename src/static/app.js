document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: turn "john.doe@example.com" -> "John Doe"
  function formatNameFromEmail(email) {
    const namePart = (email || "").split("@")[0];
    return namePart
      .replace(/[._\-+]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Helper: get initials from name or email
  function getInitials(email) {
    const name = formatNameFromEmail(email);
    const parts = name.split(" ").filter(Boolean);
    const initials =
      parts.length === 0
        ? "?"
        : parts.length === 1
        ? parts[0][0]
        : parts[0][0] + parts[1][0];
    return initials.toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear select dropdown to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants && details.participants.length > 0
            ? `<ul class="participants-list">
                ${details.participants
                  .map(
                    (p) => `<li><span class="avatar">${getInitials(p)}</span><span class="participant-name">${formatNameFromEmail(
                      p
                    )}</span></li>`
                  )
                  .join("")}
              </ul>`
            : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft > 0 ? spotsLeft + ' spots left' : '<span class="full">Full</span>'}</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHTML}
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
});
