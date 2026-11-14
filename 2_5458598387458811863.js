const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/booking", async (req, res) => {
  const { name, phone, service, car, preferredDate, preferredTime, comment } = req.body || {};

  if (!name || !phone || !service) {
    return res.status(400).json({ ok: false, message: "Заполните имя, телефон и услугу." });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(503).json({
      ok: false,
      message: "Запись пока не подключена к Telegram. Администратору нужно добавить настройки бота."
    });
  }

  const safe = (value) => String(value || "—").replace(/[<>&]/g, (ch) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;"
  }[ch]));

  const message = [
    "🚘 <b>Новая заявка — AUTOHUB</b>",
    "",
    `👤 Имя: ${safe(name)}`,
    `📞 Телефон: ${safe(phone)}`,
    `🛠 Услуга: ${safe(service)}`,
    `🚗 Автомобиль: ${safe(car)}`,
    `📅 Дата: ${safe(preferredDate)}`,
    `🕒 Время: ${safe(preferredTime)}`,
    `💬 Комментарий: ${safe(comment)}`
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return res.status(502).json({
        ok: false,
        message: "Не удалось отправить заявку в Telegram. Попробуйте позвонить нам."
      });
    }

    res.json({ ok: true, message: "Заявка отправлена! Мы свяжемся с вами для подтверждения времени." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Ошибка отправки. Позвоните нам, пожалуйста." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`AUTOHUB site is running on port ${PORT}`));
