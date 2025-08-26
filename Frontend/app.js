(function () {
  const API = window.__API_BASE__ || "http://localhost:4000";

  function qs(sel) {
    return document.querySelector(sel);
  }
  const subscribeForm = qs("#subscribeForm");
  const subscribeEmail = qs("#subscribeEmail");
  const subscribeMessage = qs("#subscribeMessage");

  const unsubscribeForm = qs("#unsubscribeForm");
  const unsubscribeEmail = qs("#unsubscribeEmail");
  const unsubscribeMessage = qs("#unsubscribeMessage");

  const subscribeSection = qs("#subscribeSection");
  const confirmSection = qs("#confirmSection");

  function show(el, text, type = "") {
    el.textContent = text;
    el.className = "message" + (type ? " " + type : "");

    // Mensagem desaparece após 5s
    if (text) {
      setTimeout(() => {
        el.textContent = "";
        el.className = "message";
      }, 5000);
    }
  }

  // --- INSCRIÇÃO ---
  subscribeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = subscribeEmail.value.trim();
    if (!email) return;

    show(subscribeMessage, "Enviando...", "");

    try {
      const res = await fetch(`${API}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        // Novo cadastro ou reativação → confirmação
        subscribeSection.classList.add("hidden");
        confirmSection.classList.remove("hidden");
        subscribeForm.reset();
      } else if (res.status === 409) {
        // Já ativo → apenas mensagem de erro
        show(subscribeMessage, "Este email já está cadastrado.", "error");
      } else if (res.status === 400) {
        show(subscribeMessage, data.error || "Email inválido", "error");
      } else {
        show(
          subscribeMessage,
          data.error || "Ocorreu um erro. Tente novamente.",
          "error"
        );
      }
    } catch (err) {
      show(subscribeMessage, "Erro de conexão. Verifique o backend.", "error");
      console.error(err);
    }
  });

  // --- DESCADASTRAR ---
  if (unsubscribeForm) {
    unsubscribeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = unsubscribeEmail.value.trim();
      if (!email) return;

      show(unsubscribeMessage, "Processando...", "");

      try {
        const res = await fetch(`${API}/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (res.ok) {
          show(unsubscribeMessage, "Descadastrado com sucesso", "success");
          unsubscribeForm.reset();
        } else if (res.status === 404) {
          show(unsubscribeMessage, "Email não encontrado", "error");
        } else {
          show(
            unsubscribeMessage,
            data.error || "Erro ao descadastrar",
            "error"
          );
        }
      } catch (err) {
        show(
          unsubscribeMessage,
          "Erro de conexão. Verifique o backend.",
          "error"
        );
        console.error(err);
      }
    });
  }
})();
