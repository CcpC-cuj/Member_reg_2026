// Admin panel frontend

// Production backend URL (Hugging Face Spaces)
const API_BASE_URL = "https://ccpccuj-mem-reg-2026.hf.space";

let adminToken = null;
let users = [];

const loginSection = document.getElementById("admin-login-section");
const mainSection = document.getElementById("admin-main-section");
const loginStatus = document.getElementById("admin-login-status");
const emailStatus = document.getElementById("admin-email-status");
const usersTableBody = document.querySelector("#users-table tbody");

document
  .getElementById("admin-login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const tokenInput = document.getElementById("admin-token-input");
    const token = tokenInput.value.trim();
    loginStatus.textContent = "";

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        adminToken = token;
        loginSection.classList.add("hidden");
        mainSection.classList.remove("hidden");
        await loadUsers();
      } else {
        loginStatus.textContent = data.message || "Invalid admin token";
      }
    } catch (err) {
      console.error(err);
      loginStatus.textContent = "Login failed.";
    }
  });

async function loadUsers() {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { "x-admin-token": adminToken },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      emailStatus.textContent = data.message || "Failed to load users.";
      return;
    }

    users = data.users || [];
    renderUsers();
  } catch (err) {
    console.error(err);
    emailStatus.textContent = "Failed to load users.";
  }
}

function renderUsers() {
  usersTableBody.innerHTML = "";
  users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="user-select" data-id="${user._id}" /></td>
      <td>${user.name || ""}</td>
      <td>${user.email || ""}</td>
      <td>${user.reg_no || ""}</td>
      <td>${user.Batch || ""}</td>
      <td>${user.PreferedLanguage || ""}</td>
    `;
    usersTableBody.appendChild(tr);
  });
}

document
  .getElementById("refresh-users-btn")
  .addEventListener("click", loadUsers);

document.getElementById("select-all-btn").addEventListener("click", () => {
  document
    .querySelectorAll(".user-select")
    .forEach((cb) => (cb.checked = true));
});

document.getElementById("clear-selection-btn").addEventListener("click", () => {
  document
    .querySelectorAll(".user-select")
    .forEach((cb) => (cb.checked = false));
});

function getSelectedUserIds() {
  return Array.from(document.querySelectorAll(".user-select"))
    .filter((cb) => cb.checked)
    .map((cb) => cb.getAttribute("data-id"));
}

async function sendEmailToSelected() {
  if (!adminToken) return;

  emailStatus.textContent = "";
  const subject = document.getElementById("email-subject").value.trim();
  const text = document.getElementById("email-text").value.trim();
  const selectedIds = getSelectedUserIds();

  if (!subject || !text) {
    emailStatus.textContent = "Please provide subject and message.";
    return;
  }

  if (selectedIds.length === 0) {
    emailStatus.textContent = "Please select at least one user.";
    return;
  }

  try {
    emailStatus.textContent = "Sending...";

    let res;
    if (selectedIds.length === 1) {
      res = await fetch(
        `${API_BASE_URL}/admin/email/user/${selectedIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken,
          },
          body: JSON.stringify({ subject, text }),
        }
      );
    } else {
      res = await fetch(`${API_BASE_URL}/admin/email/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ userIds: selectedIds, subject, text }),
      });
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      emailStatus.textContent = data.message || "Emails sent.";
    } else {
      emailStatus.textContent =
        data.message || "Failed to send emails to selected users.";
    }
  } catch (err) {
    console.error(err);
    emailStatus.textContent = "Failed to send emails.";
  }
}

async function sendEmailToAll() {
  if (!adminToken) return;

  emailStatus.textContent = "";
  const subject = document.getElementById("email-subject").value.trim();
  const text = document.getElementById("email-text").value.trim();

  if (!subject || !text) {
    emailStatus.textContent = "Please provide subject and message.";
    return;
  }

  try {
    emailStatus.textContent = "Sending to all...";
    const res = await fetch(`${API_BASE_URL}/admin/email/all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ subject, text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      emailStatus.textContent = data.message || "Emails sent to all users.";
    } else {
      emailStatus.textContent =
        data.message || "Failed to send emails to all users.";
    }
  } catch (err) {
    console.error(err);
    emailStatus.textContent = "Failed to send emails.";
  }
}

document
  .getElementById("send-selected-btn")
  .addEventListener("click", sendEmailToSelected);

document
  .getElementById("send-all-btn")
  .addEventListener("click", sendEmailToAll);


