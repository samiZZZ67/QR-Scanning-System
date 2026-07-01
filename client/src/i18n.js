import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          // Nav / general
          menu: 'Menu',
          language: 'Language',
          cart: 'Cart',

          // Search
          searchDishes: 'Search food…',
          close: 'Close',

          // Categories
          all: 'All',

          // Menu page
          ourMenu: 'Our Menu',
          table: 'Table',
          noItemsFound: 'No items found',
          tryAdjusting: 'Try adjusting your search',

          // Dish card / modal
          addToCart: 'Add to Cart',
          reviews: 'reviews',
          add: '+ Add',
          added: '✓ Added',

          // Cart drawer
          yourCart: 'Your Cart',
          item: 'item',
          items: 'items',
          cartEmpty: 'Your cart is empty',
          browseMenuToAdd: 'Browse the menu to add items',
          clearAll: 'Clear all items',
          total: 'Total',
          placeOrder: 'Place Order',
          addNote: 'Add Note',
          done: 'Done',
          note: 'Note',

          // Order flow
          yourOrder: 'Your Order',
          orderPlaced: 'Order Placed!',
          browseMenuAgain: 'Browse Menu Again',

          // Service buttons
          callWaiter: 'Call Waiter',
          waiterNotified: 'Waiter Notified',
          requestBill: 'Request Bill',
          billRequested: 'Bill Requested',

          // Feedback
          howWasYourExperience: 'How was your experience?',
          submitFeedback: 'Submit Feedback',
          thankYou: 'Thank you!',

          // Staff dashboards
          orderTracking: 'Order Tracking',
          noOrders: 'No orders',
          kitchenDashboard: 'Kitchen Dashboard',
          waiterDashboard: 'Waiter Dashboard',

          // Notices
          couldntLoadMenu: "Couldn't load menu",
        },
      },
      am: {
        translation: {
          // Nav / general
          menu: 'ምናሌ',
          language: 'ቋንቋ',
          cart: 'ጋሪ',

          // Search
          searchDishes: 'ምግብ ፈልግ…',
          close: 'ዝጋ',

          // Categories
          all: 'ሁሉም',

          // Menu page
          ourMenu: 'ምናሌያችን',
          table: 'ጠረጴዛ',
          noItemsFound: 'ምንም ምርት አልተገኘም',
          tryAdjusting: 'ፍለጋዎን ያስተካክሉ',

          // Dish card / modal
          addToCart: 'ወደ ጋሪ ጨምር',
          reviews: 'ግምገማዎች',
          add: '+ ጨምር',
          added: '✓ ተጨምሯል',

          // Cart drawer
          yourCart: 'ጋሪዎ',
          item: 'ዓይነት',
          items: 'ዓይነቶች',
          cartEmpty: 'ጋሪዎ ባዶ ነው',
          browseMenuToAdd: 'ምርቶችን ለመጨመር ምናሌውን ይዞሩ',
          clearAll: 'ሁሉንም ምርቶች አጽዱ',
          total: 'ጠቅላላ',
          placeOrder: 'ትዕዛዝ ያቅርቡ',
          addNote: 'ማስታወሻ ጨምር',
          done: 'ተጠናቀቀ',
          note: 'ማስታወሻ',

          // Order flow
          yourOrder: 'ትዕዛዝዎ',
          orderPlaced: 'ትዕዛዝ ተቀበለ!',
          browseMenuAgain: 'ምናሌ እንደገና ይዞሩ',

          // Service buttons
          callWaiter: 'አስተናጋጅ ይጥሩ',
          waiterNotified: 'አስተናጋጅ ተጠርቷል',
          requestBill: 'ደረሰኝ ይጠይቁ',
          billRequested: 'ደረሰኝ ተጠይቋል',

          // Feedback
          howWasYourExperience: 'ልምድዎ እንዴት ነበር?',
          submitFeedback: 'አስተያየት ያስገቡ',
          thankYou: 'አመሰግናለሁ!',

          // Staff dashboards
          orderTracking: 'ትዕዛዝ ክትትል',
          noOrders: 'ምንም ትዕዛዝ የለም',
          kitchenDashboard: 'ምግብ ቤት ዳሽቦርድ',
          waiterDashboard: 'አስተናጋጅ ዳሽቦርድ',

          // Notices
          couldntLoadMenu: 'ምናሌ መጫን አልተቻለም',
        },
      },
      ar: {
        translation: {
          // Nav / general
          menu: 'القائمة',
          language: 'اللغة',
          cart: 'السلة',

          // Search
          searchDishes: 'ابحث عن طعام…',
          close: 'إغلاق',

          // Categories
          all: 'الكل',

          // Menu page
          ourMenu: 'قائمتنا',
          table: 'طاولة',
          noItemsFound: 'لم يتم العثور على أي عناصر',
          tryAdjusting: 'جرّب تعديل بحثك',

          // Dish card / modal
          addToCart: 'أضف إلى السلة',
          reviews: 'تقييمات',
          add: '+ إضافة',
          added: '✓ تمت الإضافة',

          // Cart drawer
          yourCart: 'سلتك',
          item: 'عنصر',
          items: 'عناصر',
          cartEmpty: 'سلتك فارغة',
          browseMenuToAdd: 'تصفح القائمة لإضافة عناصر',
          clearAll: 'مسح جميع العناصر',
          total: 'الإجمالي',
          placeOrder: 'تقديم الطلب',
          addNote: 'إضافة ملاحظة',
          done: 'تم',
          note: 'ملاحظة',

          // Order flow
          yourOrder: 'طلبك',
          orderPlaced: 'تم تقديم الطلب!',
          browseMenuAgain: 'تصفح القائمة مرة أخرى',

          // Service buttons
          callWaiter: 'استدعاء النادل',
          waiterNotified: 'تم إشعار النادل',
          requestBill: 'طلب الفاتورة',
          billRequested: 'تم طلب الفاتورة',

          // Feedback
          howWasYourExperience: 'كيف كانت تجربتك؟',
          submitFeedback: 'إرسال التقييم',
          thankYou: 'شكراً لك!',

          // Staff dashboards
          orderTracking: 'تتبع الطلب',
          noOrders: 'لا توجد طلبات',
          kitchenDashboard: 'لوحة تحكم المطبخ',
          waiterDashboard: 'لوحة تحكم النادل',

          // Notices
          couldntLoadMenu: 'تعذّر تحميل القائمة',
        },
      },
    },
  });

export default i18n;
