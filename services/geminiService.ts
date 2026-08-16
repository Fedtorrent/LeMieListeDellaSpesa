import { ProductMetadata, Category } from "../types";

export const KEYWORD_MAP: Record<string, { category: string, emoji: string }> = {
  // ORTOFRUTTA
  'mela': { category: Category.ORTOFRUTTA, emoji: '🍎' },
  'aneto': { category: Category.ORTOFRUTTA, emoji: '🌿' },
  'banana': { category: Category.ORTOFRUTTA, emoji: '🍌' },
  'insalata': { category: Category.ORTOFRUTTA, emoji: '🥗' },
  'pomodoro': { category: Category.ORTOFRUTTA, emoji: '🍅' },
  'carote': { category: Category.ORTOFRUTTA, emoji: '🥕' },
  'patate': { category: Category.ORTOFRUTTA, emoji: '🥔' },
  'limone': { category: Category.ORTOFRUTTA, emoji: '🍋' },
  'cipolla': { category: Category.ORTOFRUTTA, emoji: '🧅' },
  'aglio': { category: Category.ORTOFRUTTA, emoji: '🧄' },
  'zucchine': { category: Category.ORTOFRUTTA, emoji: '🥒' },
  'piselli': { category: Category.ORTOFRUTTA, emoji: '🟢' },
  'peperoni': { category: Category.ORTOFRUTTA, emoji: '🫑' },
  'fragole': { category: Category.ORTOFRUTTA, emoji: '🍓' },
  'arance': { category: Category.ORTOFRUTTA, emoji: '🍊' },
  'uva': { category: Category.ORTOFRUTTA, emoji: '🍇' },
  'asparagi': { category: Category.ORTOFRUTTA, emoji: '🥒' },
  
  // MACELLERIA
  'pollo': { category: Category.MACELLERIA, emoji: '🍗' },
  'manzo': { category: Category.MACELLERIA, emoji: '🥩' },
  'hamburger': { category: Category.MACELLERIA, emoji: '🍔' },
  'prosciutto': { category: Category.MACELLERIA, emoji: '🥓' },
  'salame': { category: Category.MACELLERIA, emoji: '🌭' },

  // PESCHERIA
  'pesce': { category: Category.PESCHERIA, emoji: '🐟' },
  'tonno': { category: Category.PESCHERIA, emoji: '🐟' },
  'salmone': { category: Category.PESCHERIA, emoji: '🐟' },
  'orata': { category: Category.PESCHERIA, emoji: '🐟' },
  'branzino': { category: Category.PESCHERIA, emoji: '🐟' },

  // LATTICINI
  'latte': { category: Category.LATTICINI, emoji: '🥛' },
  'uova': { category: Category.LATTICINI, emoji: '🥚' },
  'burro': { category: Category.LATTICINI, emoji: '🧈' },
  'formaggio': { category: Category.LATTICINI, emoji: '🧀' },
  'parmigiano': { category: Category.LATTICINI, emoji: '🧀' },
  'yogurt': { category: Category.LATTICINI, emoji: '🥛' },
  'mozzarella': { category: Category.LATTICINI, emoji: '🧀' },
  
  // DISPENSA
  'pane': { category: Category.DISPENSA, emoji: '🍞' },
  'pasta': { category: Category.DISPENSA, emoji: '🍝' },
  'riso': { category: Category.DISPENSA, emoji: '🍚' },
  'biscotti': { category: Category.DISPENSA, emoji: '🍪' },
  'caffè': { category: Category.DISPENSA, emoji: '☕' },
  'olio': { category: Category.DISPENSA, emoji: '🫒' },
  'zucchero': { category: Category.DISPENSA, emoji: '🧂' },
  'sale': { category: Category.DISPENSA, emoji: '🧂' },
  'farina': { category: Category.DISPENSA, emoji: '🌾' },
  'passata': { category: Category.DISPENSA, emoji: '🥫' },
  
  // SURGELATI
  'gelato surg.': { category: Category.SURGELATI, emoji: '❄️' },
  'pizza surg.': { category: Category.SURGELATI, emoji: '❄️' },
  'piselli surg.': { category: Category.SURGELATI, emoji: '❄️' },
  'asparagi surg.': { category: Category.SURGELATI, emoji: '❄️' },
  
  // BEVANDE
  'acqua': { category: Category.BEVANDE, emoji: '💧' },
  'vino': { category: Category.BEVANDE, emoji: '🍷' },
  'birra': { category: Category.BEVANDE, emoji: '🍺' },
  'succo': { category: Category.BEVANDE, emoji: '🧃' },
  'coca': { category: Category.BEVANDE, emoji: '🥤' },
  
  // CASA
  'detersivo': { category: Category.CASA, emoji: '🧼' },
  'sapone': { category: Category.CASA, emoji: '🧼' },
  'carta casa': { category: Category.CASA, emoji: '🧻' },
  'dentifricio': { category: Category.CASA, emoji: '🦷' },
  'shampoo': { category: Category.CASA, emoji: '🧴' },
  'carta igienica': { category: Category.CASA, emoji: '🧻' },
};

export const classifyProduct = async (rawName: string): Promise<ProductMetadata> => {
  const lowerName = rawName.toLowerCase();
  
  for (const [key, value] of Object.entries(KEYWORD_MAP)) {
    if (lowerName.includes(key)) {
      return {
        normalizedName: rawName.charAt(0).toUpperCase() + rawName.slice(1),
        category: value.category,
        emoji: value.emoji
      };
    }
  }

  return {
    normalizedName: rawName,
    category: Category.VARIE,
    emoji: "🛒"
  };
};