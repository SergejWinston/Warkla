const token = localStorage.getItem("warkla_token");
if (token) {
  window.location.href = "/";
}

const form = document.getElementById("authForm");
const msg = document.getElementById("authMsg");
const t = window.I18N ? window.I18N.t : (key) => key;

async function submitAuth(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `${t("request_failed")}: ${response.status}`);
  }

  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  msg.textContent = "";

  const mode = form.dataset.mode;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const payload = { email, password };
  let path = "/api/auth/login";

  if (mode === "register") {
    payload.username = document.getElementById("username").value.trim();
    path = "/api/auth/register";
  }

  try {
    const data = await submitAuth(path, payload);
    localStorage.setItem("warkla_token", data.access_token);
    window.location.href = "/";
  } catch (error) {
    msg.textContent = error.message;
  }
});

