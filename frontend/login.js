// Toggle forms
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

loginTab.addEventListener("click", () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
});

registerTab.addEventListener("click", () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("http://localhost:7777/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("username", username);
    localStorage.setItem("role", data.user.role);
    window.location.href = "index.html";
  } else {
    document.getElementById("loginError").textContent = data.message;
  }
});

// Register
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const phoneNumber = document.getElementById("registerPhone").value;
  const password = document.getElementById("registerPassword").value;

  const res = await fetch("http://localhost:7777/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, phoneNumber, password })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Registration successful! Please log in.");
    registerForm.reset();
    loginTab.click(); // switch to login form
  } else {
    document.getElementById("registerError").textContent = data.error;
  }
});
