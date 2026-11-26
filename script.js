(function () {
  "use strict";

  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery__item"));
  var lightbox = document.getElementById("lightbox");

  if (items.length && lightbox) {
    var image = document.getElementById("lightboxImg");
    var caption = document.getElementById("lightboxCaption");
    var closeBtn = lightbox.querySelector(".lightbox__close");
    var current = 0;
    var lastFocused = null;

    function render(index) {
      current = (index + items.length) % items.length;
      var source = items[current].querySelector("img");
      image.src = source.src;
      image.alt = source.alt;
      caption.textContent = items[current].getAttribute("data-caption") || "";
    }

    function open(index) {
      lastFocused = document.activeElement;
      render(index);
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    items.forEach(function (item, index) {
      item.addEventListener("click", function () { open(index); });
    });

    closeBtn.addEventListener("click", close);
    lightbox.querySelector(".lightbox__prev").addEventListener("click", function () { render(current - 1); });
    lightbox.querySelector(".lightbox__next").addEventListener("click", function () { render(current + 1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") render(current - 1);
      if (event.key === "ArrowRight") render(current + 1);
    });
  }

  var timerValue = document.querySelector("#promoTimer [data-timer]");
  if (timerValue) {
    var now = new Date();
    var end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    var intervalId = null;

    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }

    function updateTimer() {
      var left = end - new Date();
      if (left <= 0) {
        timerValue.textContent = "акция завершена";
        if (intervalId) clearInterval(intervalId);
        return;
      }
      var days = Math.floor(left / 86400000);
      var hours = Math.floor(left / 3600000) % 24;
      var minutes = Math.floor(left / 60000) % 60;
      var seconds = Math.floor(left / 1000) % 60;
      timerValue.textContent = days + " дн. " + pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    }

    updateTimer();
    intervalId = setInterval(updateTimer, 1000);
  }
})();

(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll(".book-card"));
  var cartCount = document.querySelector(".cart-btn__count");
  var panelTotal = document.getElementById("cartPanelTotal");
  var summaryTotal = document.getElementById("orderSummaryTotal");
  var form = document.getElementById("orderForm");
  var status = document.getElementById("orderStatus");
  var MAX_QTY = 10;

  if (!cards.length) return;

  document.body.classList.add("js-cart");

  function cardNumber(card) {
    var match = card.className.match(/book-card--(\d+)/);
    return match ? match[1] : "";
  }

  function qtyOf(card) {
    return parseInt(card.getAttribute("data-qty"), 10) || 1;
  }

  function setQty(card, qty) {
    card.setAttribute("data-qty", String(qty));
    var value = card.querySelector(".book-card__qty-value");
    if (value) value.textContent = qty;
  }

  function priceOf(card) {
    var el = card.querySelector(".book-card__price");
    return el ? parseInt(el.textContent.replace(/[^\d]/g, ""), 10) || 0 : 0;
  }

  function titleOf(card) {
    var el = card.querySelector(".book-card__title");
    return el ? el.textContent.trim() : "Книга";
  }

  function formatMoney(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  }

  function update() {
    var totalItems = 0;
    var totalPrice = 0;
    var lines = [];

    cards.forEach(function (card) {
      var n = cardNumber(card);
      var box = card.querySelector(".cart-book");
      var checked = box && box.checked;
      var qty = qtyOf(card);
      var itemCount = document.querySelector(".cart-item--" + n + " .cart-item__count");
      var sumCount = document.querySelector(".order-summary__item--" + n + " .order-summary__count");

      if (!checked) {
        if (itemCount) itemCount.textContent = "";
        if (sumCount) sumCount.textContent = "";
        if (qty !== 1) setQty(card, 1);
        return;
      }

      var sum = priceOf(card) * qty;
      totalItems += qty;
      totalPrice += sum;
      lines.push(titleOf(card) + " — " + qty + " шт. — " + formatMoney(sum));

      if (itemCount) itemCount.textContent = "× " + qty;
      if (sumCount) sumCount.textContent = "× " + qty;
    });

    if (cartCount) cartCount.textContent = totalItems ? String(totalItems) : "";

    var totalText = "Всего книг: " + totalItems + " · " + formatMoney(totalPrice);
    if (panelTotal) {
      panelTotal.innerHTML = "<span>Всего книг: " + totalItems + "</span><span>" + formatMoney(totalPrice) + "</span>";
    }
    if (summaryTotal) summaryTotal.textContent = totalText;

    return { items: totalItems, price: totalPrice, lines: lines };
  }

  cards.forEach(function (card) {
    setQty(card, 1);
    var box = card.querySelector(".cart-book");
    if (box) box.addEventListener("change", update);
  });

  document.addEventListener("click", function (event) {
    var btn = event.target.closest ? event.target.closest(".book-card__qty-btn") : null;
    if (!btn) return;
    var card = btn.closest(".book-card");
    if (!card) return;
    var box = card.querySelector(".cart-book");
    var qty = qtyOf(card) + Number(btn.getAttribute("data-qty"));

    if (qty < 1) {
      if (box) box.checked = false;
      setQty(card, 1);
    } else {
      setQty(card, Math.min(MAX_QTY, qty));
    }
    update();
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var state = update();
      if (!state.items) {
        var errorToggle = document.getElementById("order-error-open");
        if (errorToggle) errorToggle.checked = true;
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var name = document.getElementById("name").value.trim();
      var phone = document.getElementById("phone").value.trim();
      var email = document.getElementById("email").value.trim();
      var comment = document.getElementById("comment").value.trim();

      var lines = [
        "Здравствуйте! Хочу оформить заказ в магазине «Инь-Янь».",
        "",
        "Имя: " + name,
        "Телефон: " + phone,
        "Email: " + email,
        ""
      ];

      state.lines.forEach(function (line) { lines.push(line); });
      lines.push("");
      lines.push("Всего книг: " + state.items);
      lines.push("Сумма: " + formatMoney(state.price));
      if (comment) {
        lines.push("");
        lines.push("Комментарий: " + comment);
      }
      lines.push("");
      lines.push("Заявка отправлена с сайта.");

      var address = (form.getAttribute("action") || "").replace(/^mailto:/, "");
      var href = "mailto:" + address +
        "?subject=" + encodeURIComponent("Заказ книг — " + name) +
        "&body=" + encodeURIComponent(lines.join("\n"));

      window.location.href = href;

      if (status) {
        status.hidden = false;
        status.textContent = "Открываем почтовое приложение. Если окно не появилось, напишите на " + address + ".";
      }
    });
  }

  update();
})();
