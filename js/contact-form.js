const form = document.querySelector("#contact-form");

if (form) {
  const status = document.querySelector("#contact-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const accessKeyInput = form.querySelector('input[name="access_key"]');
  const defaultButtonText = submitButton ? submitButton.textContent : "";

  const setStatus = (message, state = "") => {
    if (!status) {
      return;
    }

    status.textContent = message;

    if (state) {
      status.dataset.state = state;
      return;
    }

    delete status.dataset.state;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!accessKeyInput || !accessKeyInput.value || accessKeyInput.value === "YOUR_WEB3FORMS_ACCESS_KEY") {
      setStatus("Falta configurar la access key de Web3Forms.", "error");
      return;
    }

    if (!form.reportValidity()) {
      setStatus("Revisa los campos obligatorios antes de enviar.", "error");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    setStatus("Transmitiendo mensaje...");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo enviar el formulario.");
      }

      form.reset();
      setStatus("Mensaje enviado. Si procede, habrá respuesta por correo.", "success");
    } catch (error) {
      setStatus(error.message || "Se produjo un error al enviar el mensaje.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
      }
    }
  });
}
