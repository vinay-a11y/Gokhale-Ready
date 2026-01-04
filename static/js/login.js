console.log("Login JS loaded");

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const successMessage = document.getElementById("successMessage");
  const successText = document.getElementById("successText");

  const forgotPasswordBtn = document.querySelector(".forgot-password");
  const sendOtpButton = document.getElementById("sendOtpButton");
  const signInBtn = document.getElementById("signInBtn");
  const passwordGroup = document.getElementById("passwordGroup");
  const formOptions = document.querySelector(".form-options");
  const otpInputGroup = document.getElementById("otpInputGroup");
  const mobileInput = document.getElementById("mobile_number");
  const otpValidation = document.getElementById("otpValidation");
  const h2 = document.getElementById("hh");
  const h3 = document.getElementById("h3");
  const rememberMe = document.getElementById("rememberMe");
  const resetPasswordGroup = document.getElementById("resetPasswordGroup");
  const resetBtn = document.getElementById("resetBtn");

  let isOtpSent = false;
  let isOtpVerified = false;

  // Login form handler
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    try {
      const response = await fetch("/login", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log(result);

      if (response.ok) {
        if (result.user && result.user.first_name) {
          localStorage.setItem("user", JSON.stringify(result.user));
          successText.textContent = result.message || "Login successful!";
          successMessage.style.display = "block";

          if (result.user.role === "admin") {
                 window.location.href = "http://139.59.2.94:3000";
          } else {
            window.location.href = "/";
          } 
          setTimeout(() => {
            successMessage.style.display = "none";
          }, 1000);
        } else {
          errorText.textContent = "Invalid user data received";
          errorMessage.style.display = "block";
        }
      } else {
        errorText.textContent = result.detail || "Invalid credentials";
        errorMessage.style.display = "block";
      }
    } catch (err) {
      errorText.textContent = "Something went wrong!";
      errorMessage.style.display = "block";
      console.error(err);
    }
  });

  // Forgot Password flow
  forgotPasswordBtn.addEventListener("click", () => {
    passwordGroup.style.display = "none";
    formOptions.style.display = "none";
    signInBtn.style.display = "none";
    if (rememberMe?.closest("label")) rememberMe.closest("label").style.display = "none";
    forgotPasswordBtn.style.display = "none";

    sendOtpButton.style.display = "block";
    h3.style.display = "block";
    h2.style.display = "none";

    otpInputGroup.style.display = "none";
    resetPasswordGroup.style.display = "none";
    resetBtn.style.display = "none";
  });

  // OTP Send + Verify
  sendOtpButton.addEventListener("click", async () => {
    const phone = mobileInput.value.trim();

    if (!/^\d{10}$/.test(phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    if (!isOtpSent) {
      // Send OTP
      try {
        const otpRes = await fetch("/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: `+91${phone}` }),
        });
        const otpResult = await otpRes.json();

        if (otpRes.ok && otpResult.status === "pending") {
          isOtpSent = true;
          otpInputGroup.style.display = "block";
          sendOtpButton.innerHTML = "<span>Submit OTP</span>";
          otpValidation.textContent = "";
        } else {
          alert(otpResult.detail || "Failed to send OTP.");
        }
      } catch (error) {
        alert("Error sending OTP: " + (error?.message || JSON.stringify(error)));
      }
    } else if (!isOtpVerified) {
      // Verify OTP
      const code = document.getElementById("otpInput").value.trim();
      if (!/^\d{6}$/.test(code)) {
        otpValidation.textContent = "Please enter a valid 6-digit OTP.";
        return;
      }

      try {
        const verifyRes = await fetch("/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: `+91${phone}`, code }),
        });
        const verifyResult = await verifyRes.json();

        if (verifyRes.ok && verifyResult.status === "verified") {
          isOtpVerified = true;
          alert("OTP Verified. Please reset your password below.");

          mobileInput.style.display = "none";
          otpInputGroup.style.display = "none";
          sendOtpButton.style.display = "none";
          resetPasswordGroup.style.display = "block";
          resetBtn.style.display = "block";

          const resetSection = document.getElementById("resetPasswordSection");
          if (resetSection) {
            resetSection.classList.remove("hidden");
            resetSection.scrollIntoView({ behavior: "smooth" });
          }
        } else {
          otpValidation.textContent = "Invalid OTP. Please try again.";
        }
      } catch (error) {
        otpValidation.textContent = "Error verifying OTP: " + (error?.message || JSON.stringify(error));
      }
    }
  });

  // Reset Password Handler
  resetBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmNewPassword").value.trim();
    const phone = mobileInput.value.trim();
    const resetValidation = document.getElementById("resetErrorText");

    resetValidation.textContent = "";

    if (!newPassword || !confirmPassword) {
      resetValidation.textContent = "Please fill out both password fields.";
      return;
    }

    if (newPassword !== confirmPassword) {
      resetValidation.textContent = "Passwords do not match.";
      return;
    }

    try {
      const resetRes = await fetch("/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `${phone}`, newPassword }),
      });

      const resetResult = await resetRes.json();

      if (resetRes.ok) {
        alert("Password reset successful. You can now log in.");
        window.location.reload();
      } else {
        resetValidation.textContent = resetResult.detail || "Failed to reset password.";
      }
    } catch (error) {
      resetValidation.textContent =
        "Error resetting password: " + (error?.message || JSON.stringify(error));
    }
  });
});

  function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }
