// Recruitment form frontend

// Replace this with your final deployed backend URL, e.g.:
// const API_BASE_URL = "https://<hf-username>-<space-name>.hf.space";
const API_BASE_URL = "http://localhost:3000";

document
  .getElementById("recruitment-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("mobile_number").value.trim();
    const PreferedLanguage = document.getElementById("language").value;
    const Skills = document.getElementById("skills").value.trim();
    const reg_no = document.getElementById("reg").value.trim();
    const Batch = document.getElementById("Batch").value;
    const statusEl = document.getElementById("recruitment-status");

    statusEl.textContent = "";

    if (!email || !email.includes("@")) {
      statusEl.textContent = "Please enter a valid email.";
      return;
    }

    if (
      !name ||
      !password ||
      !phone ||
      !Skills ||
      !reg_no ||
      Batch === "" ||
      PreferedLanguage === "select"
    ) {
      statusEl.textContent = "Please fill out all fields.";
      return;
    }

    try {
      statusEl.textContent = "Submitting...";

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          PreferedLanguage,
          Skills,
          reg_no,
          Batch,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        statusEl.textContent = data.message || "Submitted successfully.";
        (event.target).reset();
        return;
      }

      const message =
        data.message || data.error || "Something went wrong. Try again!";
      statusEl.textContent = message;
    } catch (error) {
      console.error("Error:", error);
      statusEl.textContent = "Something went wrong. Try again!";
    }
  });


