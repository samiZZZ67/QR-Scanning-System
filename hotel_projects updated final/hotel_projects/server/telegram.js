export async function notifyManager(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { skipped: true };
  }

  const lines = [
    `New order #${order.id}`,
    `Table ${order.tableNumber} - Floor ${order.floor}`,
    `Total: ${order.total} ETB`,
    "",
    ...order.items.map((item) => `${item.quantity}x ${item.name.en || "Item"} - ${item.lineTotal} ETB`),
    order.notes ? `\nNotes: ${order.notes}` : ""
  ].filter(Boolean);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n")
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram notification failed with ${response.status}`);
  }

  return { sent: true };
}
