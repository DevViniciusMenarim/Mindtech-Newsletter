document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.__API_BASE__ || "http://localhost:4000";

  const ui = {
    subscribe: document.querySelector("#subscribeSection"),
    confirmSubscribe: document.querySelector("#confirmSubscribeSection"),
    confirmUnsubscribe: document.querySelector("#confirmUnsubscribeSection"),

    subscribeForm: document.querySelector("#subscribeForm"),
    subscribeEmail: document.querySelector("#subscribeEmail"),
    subscribeMessage: document.querySelector("#subscribeMessage"),

    unsubscribeForm: document.querySelector("#unsubscribeForm"),
    unsubscribeEmail: document.querySelector("#unsubscribeEmail"),
    unsubscribeMessage: document.querySelector("#unsubscribeMessage"),
  };

  const renderState = (state) => {
    Object.values(ui).forEach((element) => {
      if (element && element.classList.contains("content-section")) {
        element.classList.add("hidden");
      }
    });
    if (ui[state]) {
      ui[state].classList.remove("hidden");
    }
  };

  const normalizeEmail = (email) => (email || "").toLowerCase().trim();

  let messageTimer = null;
  const showMessage = (element, text, type = "") => {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;

    clearTimeout(messageTimer);
    if (text) {
      messageTimer = setTimeout(() => {
        element.textContent = "";
        element.className = "message";
      }, 5000);
    }
  };

  const postJSON = async (endpoint, payload) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      console.error("API call failed:", error);
      return {
        ok: false,
        status: 503,
        data: { error: "Erro de conexão. Verifique o backend." },
      };
    }
  };

  ui.subscribeForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = normalizeEmail(ui.subscribeEmail.value);
    if (!email) return;

    showMessage(ui.subscribeMessage, "Enviando...");

    const { ok, data } = await postJSON("/subscribe", { email });

    if (ok) {
      renderState("confirmSubscribe");
      ui.subscribeForm.reset();
    } else {
      showMessage(
        ui.subscribeMessage,
        data.error || "Ocorreu um erro.",
        "error"
      );
    }
  });

  ui.unsubscribeForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = normalizeEmail(ui.unsubscribeEmail.value);
    if (!email) return;

    showMessage(ui.unsubscribeMessage, "Processando...");

    const { ok, data } = await postJSON("/unsubscribe", { email });

    if (ok) {
      renderState("confirmUnsubscribe");
      ui.unsubscribeForm.reset();
    } else {
      showMessage(
        ui.unsubscribeMessage,
        data.error || "Erro ao descadastrar.",
        "error"
      );
    }
  });

  renderState("subscribe");
});

