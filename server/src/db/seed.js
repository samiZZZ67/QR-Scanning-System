export const defaultAssets = [
  {
    key: 'landingHero',
    label: 'Landing hero',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=75'
  },
  {
    key: 'menuBanner',
    label: 'Menu banner',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=75'
  }
];

export const defaultMenuImages = [
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80'
];

export function fallbackMenuImage(row) {
  const id = Number(row.id || 1);
  const categoryId = Number(row.category_id || row.categoryId || 1);
  return defaultMenuImages[(id + categoryId) % defaultMenuImages.length];
}

export function seedTables() {
  const tables = [];
  for (let floor = 1; floor <= 3; floor += 1) {
    for (let table = 1; table <= 6; table += 1) {
      tables.push({
        number: floor * 100 + table,
        floor,
        seats: table % 3 === 0 ? 6 : 4
      });
    }
  }
  return tables;
}

export function seedFloors() {
  return [
    { number: 1, name: 'Floor 1', description: 'Main dining floor' },
    { number: 2, name: 'Floor 2', description: 'Upper dining floor' },
    { number: 3, name: 'Floor 3', description: 'Guest rooms and private dining' }
  ];
}

export function seedStaffMembers() {
  return [
    { name: 'Waiter A', role: 'Waiter', assignedFloor: 1, online: false },
    { name: 'Waiter B', role: 'Waiter', assignedFloor: 1, online: false },
    { name: 'Waiter C', role: 'Waiter', assignedFloor: 2, online: false },
    { name: 'Chef A', role: 'Kitchen', assignedFloor: null, online: false },
    { name: 'Chef B', role: 'Kitchen', assignedFloor: null, online: false }
  ];
}

export const seedCategories = [
  { id: 1, name: { en: 'Starters', am: 'መክሰስ', ar: 'مقبلات' }, icon: 'Leaf', sortOrder: 1 },
  { id: 2, name: { en: 'Main Course', am: 'ዋና ምግብ', ar: 'أطباق رئيسية' }, icon: 'Utensils', sortOrder: 2 },
  { id: 3, name: { en: 'Grills', am: 'ጥብስ', ar: 'مشويات' }, icon: 'Flame', sortOrder: 3 },
  { id: 4, name: { en: 'Pasta & Pizza', am: 'ፓስታ እና ፒዛ', ar: 'باستا وبيتزا' }, icon: 'Pizza', sortOrder: 4 },
  { id: 5, name: { en: 'Desserts', am: 'ጣፋጮች', ar: 'حلويات' }, icon: 'CakeSlice', sortOrder: 5 },
  { id: 6, name: { en: 'Hot Drinks', am: 'ትኩስ መጠጦች', ar: 'مشروبات ساخنة' }, icon: 'Coffee', sortOrder: 6 },
  { id: 7, name: { en: 'Cold Drinks', am: 'ቀዝቃዛ መጠጦች', ar: 'مشروبات باردة' }, icon: 'CupSoda', sortOrder: 7 },
  { id: 8, name: { en: 'Fresh Juices', am: 'ትኩስ ጭማቂዎች', ar: 'عصائر طازجة' }, icon: 'GlassWater', sortOrder: 8 }
];

export const seedMenuItems = [
  {
    categoryId: 1,
    name: { en: 'Tomato Soup', am: 'ቲማቲም ሾርባ', ar: 'شوربة طماطم' },
    description: { en: 'Creamy tomato soup with fresh basil and toasted bread.', am: 'በባዚል እና በተጠበሰ ዳቦ የሚቀርብ የቲማቲም ሾርባ።', ar: 'شوربة طماطم كريمية مع ريحان طازج وخبز محمص.' },
    price: 120,
    prepMinutes: 10,
    popular: true
  },
  {
    categoryId: 1,
    name: { en: 'Garden Salad', am: 'የአትክልት ሰላጣ', ar: 'سلطة خضراء' },
    description: { en: 'Crisp greens, tomato, cucumber, and lemon vinaigrette.', am: 'ትኩስ አትክልት፣ ቲማቲም፣ ኪያር እና የሎሚ ሶስ።', ar: 'خضار طازجة مع طماطم وخيار وصلصة ليمون خفيفة.' },
    price: 150,
    prepMinutes: 5,
    chefPick: true
  },
  {
    categoryId: 1,
    name: { en: 'Shiro with Injera', am: 'ሽሮ ከእንጀራ ጋር', ar: 'شيرو مع إنجيرا' },
    description: { en: 'Slow-simmered chickpea stew with berbere and fresh injera.', am: 'በበርበሬ የተዘጋጀ የሽምብራ ወጥ ከእንጀራ ጋር።', ar: 'يخنة حمص إثيوبية مع بربري وإنجيرا طازجة.' },
    price: 130,
    prepMinutes: 15,
    popular: true
  },
  {
    categoryId: 2,
    name: { en: 'Doro Wot', am: 'ዶሮ ወጥ', ar: 'دورو وات' },
    description: { en: 'Classic spicy chicken stew with egg, served with injera.', am: 'በቅመም የተዘጋጀ የዶሮ ወጥ ከእንቁላል እና እንጀራ ጋር።', ar: 'يخنة دجاج إثيوبية حارة مع بيض وإنجيرا.' },
    price: 280,
    prepMinutes: 25,
    popular: true,
    chefPick: true
  },
  {
    categoryId: 2,
    name: { en: 'Kitfo', am: 'ክትፎ', ar: 'كتفو' },
    description: { en: 'Seasoned minced beef served classic or lightly cooked.', am: 'በቅመም የተቀመመ የበሬ ስጋ፣ ጥሬ ወይም በትንሹ ተበስሎ።', ar: 'لحم بقري مفروم ومتبل يقدم كلاسيكيا أو مطهوا قليلا.' },
    price: 350,
    prepMinutes: 15,
    popular: true,
    chefPick: true
  },
  {
    categoryId: 2,
    name: { en: 'Beef Tibs', am: 'የበሬ ጥብስ', ar: 'تبس لحم بقري' },
    description: { en: 'Sauteed beef with onion, pepper, rosemary, and house spice.', am: 'ከሽንኩርት፣ ቃሪያ እና ቅመም ጋር የተጠበሰ የበሬ ስጋ።', ar: 'لحم بقري مقلي مع بصل وفلفل وتوابل المطعم.' },
    price: 320,
    prepMinutes: 20,
    popular: true
  },
  {
    categoryId: 3,
    name: { en: 'Grilled Chicken', am: 'የተጠበሰ ዶሮ', ar: 'دجاج مشوي' },
    description: { en: 'Half chicken marinated with herbs and lemon butter.', am: 'በቅመም እና በሎሚ ቅቤ የተቀመመ ግማሽ ዶሮ።', ar: 'نصف دجاجة متبلة بالأعشاب وزبدة الليمون.' },
    price: 380,
    prepMinutes: 30,
    popular: true
  },
  {
    categoryId: 3,
    name: { en: 'Mixed Grill', am: 'የተለያዩ ጥብሶች', ar: 'مشاوي مشكلة' },
    description: { en: 'Assorted grilled meats served with rice and seasonal salad.', am: 'ከሩዝ እና ሰላጣ ጋር የሚቀርቡ የተለያዩ ጥብሶች።', ar: 'تشكيلة لحوم مشوية تقدم مع الأرز وسلطة موسمية.' },
    price: 550,
    prepMinutes: 35,
    chefPick: true
  },
  {
    categoryId: 3,
    name: { en: 'Grilled Fish', am: 'የተጠበሰ ዓሣ', ar: 'سمك مشوي' },
    description: { en: 'Fresh fish with lemon butter, herbs, and roasted vegetables.', am: 'በሎሚ ቅቤ እና በአትክልት የሚቀርብ ትኩስ ዓሣ።', ar: 'سمك طازج مع زبدة الليمون وأعشاب وخضار مشوية.' },
    price: 420,
    prepMinutes: 25
  },
  {
    categoryId: 4,
    name: { en: 'Spaghetti Bolognese', am: 'ስፓጌቲ ቦሎኔዝ', ar: 'سباغيتي بولونيز' },
    description: { en: 'Classic spaghetti with rich beef tomato sauce.', am: 'በበሬ ስጋ እና ቲማቲም ሶስ የተዘጋጀ ስፓጌቲ።', ar: 'سباغيتي كلاسيكية مع صلصة طماطم ولحم غنية.' },
    price: 220,
    prepMinutes: 20,
    popular: true
  },
  {
    categoryId: 4,
    name: { en: 'Margherita Pizza', am: 'ማርጋሪታ ፒዛ', ar: 'بيتزا مارغريتا' },
    description: { en: 'Tomato, mozzarella, basil, and olive oil.', am: 'ቲማቲም፣ ሞዛሬላ፣ ባዚል እና የወይራ ዘይት።', ar: 'طماطم وموزاريلا وريحان وزيت زيتون.' },
    price: 280,
    prepMinutes: 25,
    popular: true
  },
  {
    categoryId: 4,
    name: { en: 'Chicken Alfredo', am: 'የዶሮ አልፍሬዶ', ar: 'دجاج ألفريدو' },
    description: { en: 'Creamy pasta with grilled chicken and parmesan.', am: 'ከተጠበሰ ዶሮ እና ፓርሜዛን ጋር የሚቀርብ ክሬም ፓስታ።', ar: 'باستا كريمية مع دجاج مشوي وبارميزان.' },
    price: 260,
    prepMinutes: 18
  },
  {
    categoryId: 5,
    name: { en: 'Tiramisu', am: 'ቲራሚሱ', ar: 'تيراميسو' },
    description: { en: 'Coffee-soaked Italian dessert with mascarpone cream.', am: 'በቡና ጣዕም የተዘጋጀ የጣሊያን ጣፋጭ።', ar: 'حلوى إيطالية بنكهة القهوة وكريمة الماسكاربوني.' },
    price: 180,
    prepMinutes: 5,
    popular: true,
    chefPick: true
  },
  {
    categoryId: 5,
    name: { en: 'Chocolate Cake', am: 'ቸኮሌት ኬክ', ar: 'كيك شوكولاتة' },
    description: { en: 'Dark chocolate cake with ganache and berries.', am: 'በጋናሽ እና በቤሪ የሚቀርብ ጥቁር ቸኮሌት ኬክ።', ar: 'كيك شوكولاتة داكنة مع غاناش وتوت.' },
    price: 160,
    prepMinutes: 5
  },
  {
    categoryId: 5,
    name: { en: 'Ice Cream Trio', am: 'ሶስት ዓይነት አይስክሬም', ar: 'ثلاث كرات آيس كريم' },
    description: { en: 'Vanilla, chocolate, and strawberry scoops.', am: 'ቫኒላ፣ ቸኮሌት እና እንጆሪ አይስክሬም።', ar: 'فانيليا وشوكولاتة وفراولة.' },
    price: 120,
    prepMinutes: 2,
    popular: true
  },
  {
    categoryId: 6,
    name: { en: 'Ethiopian Coffee', am: 'የኢትዮጵያ ቡና', ar: 'قهوة إثيوبية' },
    description: { en: 'Freshly brewed coffee inspired by the traditional ceremony.', am: 'በባህላዊ የቡና ስነስርዓት የተነሳሳ ትኩስ ቡና።', ar: 'قهوة طازجة مستوحاة من الطقس الإثيوبي التقليدي.' },
    price: 80,
    prepMinutes: 10,
    popular: true,
    chefPick: true
  },
  {
    categoryId: 6,
    name: { en: 'Tea', am: 'ሻይ', ar: 'شاي' },
    description: { en: 'Hot tea with milk, sugar, or lemon on request.', am: 'ከወተት፣ ስኳር ወይም ሎሚ ጋር የሚቀርብ ትኩስ ሻይ።', ar: 'شاي ساخن مع حليب أو سكر أو ليمون حسب الطلب.' },
    price: 60,
    prepMinutes: 5
  },
  {
    categoryId: 6,
    name: { en: 'Macchiato', am: 'ማኪያቶ', ar: 'ماكياتو' },
    description: { en: 'Espresso with steamed milk and soft foam.', am: 'ኤስፕሬሶ ከወተት አረፋ ጋር።', ar: 'إسبريسو مع حليب مبخر ورغوة ناعمة.' },
    price: 90,
    prepMinutes: 5,
    popular: true
  },
  {
    categoryId: 7,
    name: { en: 'Cola', am: 'ኮላ', ar: 'كولا' },
    description: { en: 'Chilled cola drink.', am: 'ቀዝቃዛ ኮላ።', ar: 'مشروب كولا بارد.' },
    price: 50,
    prepMinutes: 1
  },
  {
    categoryId: 7,
    name: { en: 'Mineral Water', am: 'ማዕድን ውሃ', ar: 'مياه معدنية' },
    description: { en: 'Still bottled mineral water.', am: 'በጠርሙስ የታሸገ ማዕድን ውሃ።', ar: 'مياه معدنية معبأة.' },
    price: 40,
    prepMinutes: 1
  },
  {
    categoryId: 7,
    name: { en: 'Mint Lemonade', am: 'የናና ሎሚ ጭማቂ', ar: 'ليموناضة بالنعناع' },
    description: { en: 'Fresh lemonade shaken with mint and ice.', am: 'ከናና እና በረዶ ጋር የተዘጋጀ ትኩስ ሎሚ።', ar: 'ليموناضة طازجة مع نعناع وثلج.' },
    price: 70,
    prepMinutes: 3,
    popular: true
  },
  {
    categoryId: 8,
    name: { en: 'Orange Juice', am: 'ብርቱካን ጭማቂ', ar: 'عصير برتقال' },
    description: { en: 'Freshly squeezed orange juice.', am: 'አዲስ የተጨመቀ ብርቱካን ጭማቂ።', ar: 'عصير برتقال طازج.' },
    price: 90,
    prepMinutes: 3,
    popular: true
  },
  {
    categoryId: 8,
    name: { en: 'Mango Juice', am: 'ማንጎ ጭማቂ', ar: 'عصير مانجو' },
    description: { en: 'Fresh mango smoothie with a silky finish.', am: 'ለስላሳ የማንጎ ጭማቂ።', ar: 'سموذي مانجو طازج بقوام ناعم.' },
    price: 100,
    prepMinutes: 3,
    chefPick: true
  },
  {
    categoryId: 8,
    name: { en: 'Avocado Juice', am: 'አቮካዶ ጭማቂ', ar: 'عصير أفوكادو' },
    description: { en: 'Creamy avocado blended with milk and honey.', am: 'ከወተት እና ማር ጋር የተዘጋጀ አቮካዶ።', ar: 'أفوكادو كريمي مع حليب وعسل.' },
    price: 110,
    prepMinutes: 5,
    popular: true
  }
];

