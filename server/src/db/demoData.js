const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days, hour, minute = 0) {
  const date = new Date(Date.now() - days * DAY_MS);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function buildDemoOrders(menuItems = []) {
  const ids = menuItems.map((item) => item.id);
  const item = (index) => ids[index % ids.length];

  return [
    {
      key: 'demo-order-active-101',
      tableNumber: 101,
      status: 'received',
      notes: 'Guest asked for low spice.',
      createdAt: isoDaysAgo(0, 12, 5),
      items: [{ menuItemId: item(3), quantity: 1 }, { menuItemId: item(20), quantity: 2 }]
    },
    {
      key: 'demo-order-active-204',
      tableNumber: 204,
      status: 'preparing',
      notes: 'Serve drinks first.',
      createdAt: isoDaysAgo(0, 12, 18),
      items: [{ menuItemId: item(7), quantity: 1 }, { menuItemId: item(22), quantity: 1 }]
    },
    {
      key: 'demo-order-ready-302',
      tableNumber: 302,
      status: 'ready',
      notes: '',
      createdAt: isoDaysAgo(0, 12, 34),
      items: [{ menuItemId: item(10), quantity: 2 }, { menuItemId: item(18), quantity: 2 }]
    },
    {
      key: 'demo-order-delivered-today',
      tableNumber: 103,
      status: 'delivered',
      notes: 'Birthday dessert plate.',
      createdAt: isoDaysAgo(0, 10, 42),
      items: [{ menuItemId: item(4), quantity: 2 }, { menuItemId: item(12), quantity: 1 }],
      feedback: { rating: 5, name: 'Maya', comment: 'Fast service and the Doro Wot was excellent.' }
    },
    {
      key: 'demo-order-yesterday-lunch',
      tableNumber: 205,
      status: 'delivered',
      notes: '',
      createdAt: isoDaysAgo(1, 13, 15),
      items: [{ menuItemId: item(5), quantity: 1 }, { menuItemId: item(21), quantity: 2 }],
      feedback: { rating: 4, name: 'Daniel', comment: 'Great flavors and helpful staff.' }
    },
    {
      key: 'demo-order-yesterday-dinner',
      tableNumber: 306,
      status: 'delivered',
      notes: 'No onions on salad.',
      createdAt: isoDaysAgo(1, 19, 40),
      items: [{ menuItemId: item(8), quantity: 1 }, { menuItemId: item(13), quantity: 2 }],
      feedback: { rating: 5, name: 'Hana', comment: 'Loved the grilled fish and dessert.' }
    },
    {
      key: 'demo-order-2-days',
      tableNumber: 102,
      status: 'delivered',
      notes: '',
      createdAt: isoDaysAgo(2, 18, 10),
      items: [{ menuItemId: item(9), quantity: 1 }, { menuItemId: item(16), quantity: 2 }],
      feedback: { rating: 4, name: 'Samir', comment: 'Comfortable QR ordering experience.' }
    },
    {
      key: 'demo-order-3-days',
      tableNumber: 201,
      status: 'delivered',
      notes: 'Extra lemon.',
      createdAt: isoDaysAgo(3, 11, 55),
      items: [{ menuItemId: item(6), quantity: 2 }, { menuItemId: item(23), quantity: 2 }],
      feedback: { rating: 5, name: 'Sara', comment: 'Smooth service from scan to delivery.' }
    },
    {
      key: 'demo-order-4-days',
      tableNumber: 301,
      status: 'delivered',
      notes: '',
      createdAt: isoDaysAgo(4, 20, 20),
      items: [{ menuItemId: item(11), quantity: 2 }, { menuItemId: item(14), quantity: 1 }],
      feedback: { rating: 3, name: 'Jon', comment: 'Food was good; drinks took a little longer.' }
    },
    {
      key: 'demo-order-6-days',
      tableNumber: 104,
      status: 'delivered',
      notes: 'Guest requested quiet corner.',
      createdAt: isoDaysAgo(6, 14, 30),
      items: [{ menuItemId: item(2), quantity: 1 }, { menuItemId: item(19), quantity: 3 }],
      feedback: { rating: 5, name: 'Amina', comment: 'The staff was attentive and kind.' }
    }
  ].filter(() => ids.length > 0);
}

export function buildDemoNotifications() {
  return [
    { type: 'call-waiter', tableNumber: 101, floor: 1, status: 'open', createdAt: isoDaysAgo(0, 12, 40) },
    { type: 'request-bill', tableNumber: 302, floor: 3, status: 'open', createdAt: isoDaysAgo(0, 12, 48) },
    { type: 'call-waiter', tableNumber: 205, floor: 2, status: 'resolved', createdAt: isoDaysAgo(0, 10, 20), resolvedAt: isoDaysAgo(0, 10, 26) }
  ];
}

