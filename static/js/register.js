document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const phoneInput = document.getElementById("phone");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  const errorText = document.getElementById("errorText");
  const successText = document.getElementById("successText");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Phone validation
    if (!/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    // Password validation
    if (password.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      alert("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      alert("Password must contain at least one symbol.");
      return;
    }

    // Confirm password check
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const formData = new FormData(registerForm);

    try {
      const response = await fetch("/register", {
        method: "POST",
        body: formData,
        redirect: "follow",
      });

      if (response.redirected) {
        alert("Registration successful!");
        window.location.href = response.url;
      } else if (response.ok) {
        alert("Registration successful!");
        successText.textContent = "Registration successful!";
        errorText.textContent = "";
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        const result = await response.json();
        alert(result.message || result.error || "Registration failed.");
        errorText.textContent = result.message || result.error || "Registration failed.";
        successText.textContent = "";
      }
    } catch (error) {
      alert("Error: " + (error?.message || JSON.stringify(error)));
      errorText.textContent = "Error: " + (error?.message || JSON.stringify(error));
      successText.textContent = "";
    }
  });
});

