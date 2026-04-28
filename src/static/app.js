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

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants:</strong></p>
            <ul class="participants-list">
              ${
                details.participants.length
                  ? details.participants.map((email) => `<li>${email} <button class="delete-btn" data-email="${email}" data-activity="${name}">❌</button></li>`).join("")
                  : `<li class="empty">No one has signed up yet.</li>`
              }
            </ul>
          </div>
        `;

        // Add event listeners to delete buttons
        activityCard.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const email = btn.dataset.email;
            const activity = btn.dataset.activity;
            unregister(email, activity);
          });
        });

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

  // Function to unregister a participant
  async function unregister(email, activity) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities to update the UI
        fetchActivities();
      } else {
        console.error("Error unregistering:", result.detail);
      }
    } catch (error) {
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(`/activities/${activity}/signup?email=${email}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");

        // Refresh activities to update the UI
        fetchActivities();

        // Optionally clear the form
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred.";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      messageDiv.textContent = "Network error. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
});
