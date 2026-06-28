import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal inline resources so the app works even without a running server.
// When the server delivers /locales/{{lng}}/{{ns}}.json, those translations
// will take precedence.
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          menu: 'Menu',
          cart: 'Cart',
          yourOrder: 'Your Order',
          placeOrder: 'Place Order',
          addToCart: 'Add to Cart',
          searchDishes: 'Search dishes…',
          orderTracking: 'Order Tracking',
          callWaiter: 'Call Waiter',
          requestBill: 'Request Bill',
          howWasYourExperience: 'How was your experience?',
          submitFeedback: 'Submit Feedback',
          thankYou: 'Thank you!',
          noOrders: 'No orders',
          kitchenDashboard: 'Kitchen Dashboard',
          waiterDashboard: 'Waiter Dashboard',
        },
      },
      am: {
        translation: {
          menu: 'ምናሌ',
          cart: 'ጋሪ',
          yourOrder: 'ትዕዛዝዎ',
          placeOrder: 'ትዕዛዝ ያቅርቡ',
          addToCart: 'ወደ ጋሪ ጨምር',
          searchDishes: 'ምግቦችን ፈልግ…',
          orderTracking: 'ትዕዛዝ ክትትል',
          callWaiter: 'አስተናጋጅ ይጥሩ',
          requestBill: 'ደረሰኝ ይጠይቁ',
          howWasYourExperience: 'ልምድዎ እንዴት ነበር?',
          submitFeedback: 'አስተያየት ያስገቡ',
          thankYou: 'አመሰግናለሁ!',
          noOrders: 'ምንም ትዕዛዝ የለም',
          kitchenDashboard: 'ምግብ ቤት ዳሽቦርድ',
          waiterDashboard: 'አስተናጋጅ ዳሽቦርድ',
        },
      },
    },
  });

export default i18n;
