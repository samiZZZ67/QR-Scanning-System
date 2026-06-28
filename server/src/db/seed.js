// ─── Default app assets ───────────────────────────────────────────────────────

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

// ─── Default menu images (fallback when no image is set on an item) ───────────

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

/**
 * Returns a deterministic fallback image for a menu item row.
 * @param {{ id?: number, category_id?: number, categoryId?: number }} row
 */
export function fallbackMenuImage(row) {
  const id = Number(row.id || 1);
  const categoryId = Number(row.category_id || row.categoryId || 1);
  return defaultMenuImages[(id + categoryId) % defaultMenuImages.length];
}

// ─── Seed tables ──────────────────────────────────────────────────────────────

/**
 * Generates the initial table records for the hotel.
 * Floors 1-3, tables 1-5 per floor → numbers 101-105, 201-205, 301-305.
 */
export function seedTables() {
  const tables = [];
  for (let floor = 1; floor <= 3; floor += 1) {
    for (let table = 1; table <= 5; table += 1) {
      tables.push({ number: floor * 100 + table, floor, seats: 4 });
    }
  }
  return tables;
}

// ─── Seed categories ──────────────────────────────────────────────────────────

export const seedCategories = [
  { id: 1, name: { en: 'Starters',     am: 'መክሰስ',           ar: 'مقبلات'           }, icon: 'Leaf',       sortOrder: 1 },
  { id: 2, name: { en: 'Main Course',  am: 'ዋና ምግብ',         ar: 'طبق رئيسي'       }, icon: 'Utensils',   sortOrder: 2 },
  { id: 3, name: { en: 'Grills',       am: 'ጥብስ',            ar: 'مشويات'          }, icon: 'Flame',      sortOrder: 3 },
  { id: 4, name: { en: 'Pasta & Pizza',am: 'ፓስታ እና ፒዛ',     ar: 'باستا وبيتزا'    }, icon: 'Pizza',      sortOrder: 4 },
  { id: 5, name: { en: 'Desserts',     am: 'ጣፋጭ ምግቦች',      ar: 'حلويات'          }, icon: 'CakeSlice',  sortOrder: 5 },
  { id: 6, name: { en: 'Hot Drinks',   am: 'ትኩስ መጠጦች',      ar: 'مشروبات ساخنة'   }, icon: 'Coffee',     sortOrder: 6 },
  { id: 7, name: { en: 'Cold Drinks',  am: 'ቀዝቃዛ መጠጦች',    ar: 'مشروبات باردة'   }, icon: 'CupSoda',    sortOrder: 7 },
  { id: 8, name: { en: 'Fresh Juices', am: 'ትኩስ ጭማቂዎች',    ar: 'عصائر طازجة'     }, icon: 'GlassWater', sortOrder: 8 }
];

// ─── Seed menu items ──────────────────────────────────────────────────────────

export const seedMenuItems = [
  // ── Starters (category 1) ──────────────────────────────────────────────────
  {
    categoryId: 1,
    name:        { en: 'Tomato Soup',   am: 'ቲማቲም ሾርባ',      ar: 'شوربة طماطم'     },
    description: { en: 'Creamy tomato soup with fresh herbs.',
                   am: 'በትኩስ ቅመሞች የተዘጋጀ ቲማቲም ሾርባ።',
                   ar: 'شوربة طماطم كريمية مع أعشاب طازجة.'     },
    price: 120, prepMinutes: 10, popular: true
  },
  {
    categoryId: 1,
    name:        { en: 'Garden Salad',  am: 'የአትክልት ሰላጣ',    ar: 'سلطة خضراء'      },
    description: { en: 'Mixed greens with light vinaigrette.',
                   am: 'በቀላል ሶስ የተዘጋጀ ትኩስ አትክልት።',
                   ar: 'خضار طازجة مع صلصة خفيفة.'              },
    price: 150, prepMinutes: 5, chefPick: true
  },
  {
    categoryId: 1,
    name:        { en: 'Shiro',         am: 'ሽሮ',              ar: 'شيرو'            },
    description: { en: 'Traditional Ethiopian chickpea stew with injera.',
                   am: 'ከእንጀራ ጋር የሚቀርብ ባህላዊ ሽሮ።',
                   ar: 'يخنة حمص إثيوبية تقليدية مع إنجيرا.'    },
    price: 100, prepMinutes: 15, popular: true
  },

  // ── Main Course (category 2) ───────────────────────────────────────────────
  {
    categoryId: 2,
    name:        { en: 'Doro Wot',      am: 'ዶሮ ወጥ',           ar: 'دورو وات'        },
    description: { en: 'Spicy Ethiopian chicken stew with egg.',
                   am: 'በቅመም የተዘጋጀ ዶሮ ወጥ ከእንቁላል ጋር።',
                   ar: 'يخنة دجاج إثيوبية حارة مع بيض.'         },
    price: 280, prepMinutes: 25, popular: true, chefPick: true
  },
  {
    categoryId: 2,
    name:        { en: 'Kitfo',         am: 'ክትፎ',              ar: 'كتفو'            },
    description: { en: 'Seasoned minced beef served classic or lightly cooked.',
                   am: 'በቅመም የተቀመመ የበሬ ስጋ።',
                   ar: 'لحم بقري مفروم ومتبل يقدم كلاسيكيا أو مطهوا قليلا.' },
    price: 350, prepMinutes: 15, popular: true, chefPick: true
  },
  {
    categoryId: 2,
    name:        { en: 'Tibs',          am: 'ጥብስ',              ar: 'تبس'             },
    description: { en: 'Sauteed beef with onion, pepper, and house spice.',
                   am: 'ከሽንኩርት እና ቃሪያ ጋር የተጠበሰ ስጋ።',
                   ar: 'لحم بقري مقلي مع بصل وفلفل وتوابل المطعم.' },
    price: 320, prepMinutes: 20, popular: true
  },

  // ── Grills (category 3) ────────────────────────────────────────────────────
  {
    categoryId: 3,
    name:        { en: 'Grilled Chicken', am: 'የተጠበሰ ዶሮ',      ar: 'دجاج مشوي'       },
    description: { en: 'Half chicken marinated in herbs.',
                   am: 'በቅመም የተቀመመ ግማሽ ዶሮ።',
                   ar: 'نصف دجاجة متبلة بالأعشاب.'              },
    price: 380, prepMinutes: 30, popular: true
  },
  {
    categoryId: 3,
    name:        { en: 'Mixed Grill',   am: 'የተለያዩ ጥብሶች',    ar: 'مشويات مشكلة'    },
    description: { en: 'Assorted grilled meats served with rice.',
                   am: 'ከሩዝ ጋር የሚቀርብ የተለያዩ ጥብሶች።',
                   ar: 'تشكيلة لحوم مشوية تقدم مع أرز.'        },
    price: 550, prepMinutes: 35, chefPick: true
  },
  {
    categoryId: 3,
    name:        { en: 'Grilled Fish',  am: 'የተጠበሰ ዓሣ',       ar: 'سمك مشوي'        },
    description: { en: 'Fresh fish with lemon butter.',
                   am: 'በሎሚ ቅቤ የተዘጋጀ ትኩስ ዓሣ።',
                   ar: 'سمك طازج مع زبدة الليمون.'              },
    price: 420, prepMinutes: 25
  },

  // ── Pasta & Pizza (category 4) ─────────────────────────────────────────────
  {
    categoryId: 4,
    name:        { en: 'Spaghetti Bolognese', am: 'ስፓጌቲ ቦሎኔዝ', ar: 'سباغيتي بولونيز' },
    description: { en: 'Classic spaghetti with rich meat sauce.',
                   am: 'ከስጋ ሶስ ጋር የተዘጋጀ ስፓጌቲ።',
                   ar: 'سباغيتي كلاسيكية مع صلصة لحم غنية.'    },
    price: 220, prepMinutes: 20, popular: true
  },
  {
    categoryId: 4,
    name:        { en: 'Margherita Pizza', am: 'ማርጋሪታ ፒዛ',    ar: 'بيتزا مارغريتا'  },
    description: { en: 'Tomato, mozzarella, and basil.',
                   am: 'ቲማቲም፣ ሞዛሬላ እና ባዚል።',
                   ar: 'طماطم وموزاريلا وريحان.'                },
    price: 280, prepMinutes: 25, popular: true
  },
  {
    categoryId: 4,
    name:        { en: 'Alfredo Pasta', am: 'አልፍሬዶ ፓስታ',      ar: 'باستا ألفريدو'   },
    description: { en: 'Creamy pasta with parmesan.',
                   am: 'በክሬም እና ፓርሜዛን የተዘጋጀ ፓስታ።',
                   ar: 'باستا كريمية مع بارميزان.'              },
    price: 240, prepMinutes: 18
  },

  // ── Desserts (category 5) ──────────────────────────────────────────────────
  {
    categoryId: 5,
    name:        { en: 'Tiramisu',      am: 'ቲራሚሱ',            ar: 'تيراميسو'        },
    description: { en: 'Italian coffee dessert.',
                   am: 'የቡና ጣዕም ያለው ጣሊያናዊ ጣፋጭ።',
                   ar: 'حلوى إيطالية بنكهة القهوة.'             },
    price: 180, prepMinutes: 5, popular: true, chefPick: true
  },
  {
    categoryId: 5,
    name:        { en: 'Chocolate Cake', am: 'ቸኮሌት ኬክ',        ar: 'كيك شوكولاتة'    },
    description: { en: 'Dark chocolate cake with ganache.',
                   am: 'በጋናሽ የተሸፈነ ቸኮሌት ኬክ።',
                   ar: 'كيك شوكولاتة داكنة مع غاناش.'          },
    price: 160, prepMinutes: 5
  },
  {
    categoryId: 5,
    name:        { en: 'Ice Cream',     am: 'አይስ ክሬም',         ar: 'آيس كريم'        },
    description: { en: 'Three scoops: vanilla, chocolate, strawberry.',
                   am: 'ሶስት ኳሶች፡ ቫኒላ፣ ቸኮሌት፣ እንጆሪ።',
                   ar: 'ثلاث كرات: فانيليا، شوكولاتة، فراولة.' },
    price: 120, prepMinutes: 2, popular: true
  },

  // ── Hot Drinks (category 6) ────────────────────────────────────────────────
  {
    categoryId: 6,
    name:        { en: 'Ethiopian Coffee', am: 'የኢትዮጵያ ቡና',   ar: 'قهوة إثيوبية'    },
    description: { en: 'Traditional coffee ceremony style.',
                   am: 'በባህላዊ የቡና ስነስርዓት የተዘጋጀ።',
                   ar: 'قهوة على طريقة الطقس الإثيوبي التقليدي.' },
    price: 80, prepMinutes: 10, popular: true, chefPick: true
  },
  {
    categoryId: 6,
    name:        { en: 'Tea',           am: 'ሻይ',               ar: 'شاي'             },
    description: { en: 'Hot tea with milk and sugar.',
                   am: 'ትኩስ ሻይ ከወተት እና ስኳር ጋር።',
                   ar: 'شاي ساخن مع حليب وسكر.'                },
    price: 60, prepMinutes: 5
  },
  {
    categoryId: 6,
    name:        { en: 'Macchiato',     am: 'ማኪያቶ',             ar: 'ماكياتو'         },
    description: { en: 'Espresso with foamed milk.',
                   am: 'ኤስፕሬሶ ከወተት አረፋ ጋር።',
                   ar: 'إسبريسو مع رغوة الحليب.'               },
    price: 90, prepMinutes: 5, popular: true
  },

  // ── Cold Drinks (category 7) ───────────────────────────────────────────────
  {
    categoryId: 7,
    name:        { en: 'Cola',          am: 'ኮላ',               ar: 'كولا'            },
    description: { en: 'Chilled cola drink.',
                   am: 'ቀዝቃዛ ኮላ።',
                   ar: 'مشروب كولا بارد.'                      },
    price: 50, prepMinutes: 1
  },
  {
    categoryId: 7,
    name:        { en: 'Mineral Water', am: 'ማዕድን ውሃ',         ar: 'مياه معدنية'     },
    description: { en: 'Bottled mineral water.',
                   am: 'በጠርሙስ የታሸገ ውሃ።',
                   ar: 'مياه معدنية معبأة.'                    },
    price: 40, prepMinutes: 1
  },
  {
    categoryId: 7,
    name:        { en: 'Lemonade',      am: 'ሎሚ ጭማቂ',          ar: 'ليمونادة'        },
    description: { en: 'Fresh lemonade with mint.',
                   am: 'ከናና ጋር የተዘጋጀ ትኩስ ሎሚ ጭማቂ።',
                   ar: 'ليمونادة طازجة مع نعناع.'              },
    price: 70, prepMinutes: 3, popular: true
  },

  // ── Fresh Juices (category 8) ──────────────────────────────────────────────
  {
    categoryId: 8,
    name:        { en: 'Orange Juice',  am: 'ብርቱካን ጭማቂ',      ar: 'عصير برتقال'     },
    description: { en: 'Freshly squeezed orange juice.',
                   am: 'አዲስ የተጨመቀ ብርቱካን ጭማቂ።',
                   ar: 'عصير برتقال طازج.'                     },
    price: 90, prepMinutes: 3, popular: true
  },
  {
    categoryId: 8,
    name:        { en: 'Mango Juice',   am: 'ማንጎ ጭማቂ',         ar: 'عصير مانجو'      },
    description: { en: 'Fresh mango smoothie.',
                   am: 'ትኩስ ማንጎ ስሙዚ።',
                   ar: 'سموذي مانجو طازج.'                     },
    price: 100, prepMinutes: 3, chefPick: true
  },
  {
    categoryId: 8,
    name:        { en: 'Avocado Juice', am: 'አቮካዶ ጭማቂ',        ar: 'عصير أفوكادو'    },
    description: { en: 'Creamy avocado with milk and honey.',
                   am: 'ከወተት እና ማር ጋር የተዘጋጀ አቮካዶ።',
                   ar: 'أفوكادو كريمي مع حليب وعسل.'           },
    price: 110, prepMinutes: 5, popular: true
  }
];
