import type { Template } from './types';

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean lines, neutral colors, uncluttered spaces',
    prompt: 'Transform this space into a modern minimalist design with clean lines, neutral color palette (whites, grays, beiges), uncluttered surfaces, and functional furniture. Focus on simplicity, natural light, and a sense of calm.',
    isCustom: false,
  },
  {
    id: 'scandinavian-warmth',
    name: 'Scandinavian Warmth',
    description: 'Cozy textures, light woods, hygge atmosphere',
    prompt: 'Redesign this space in a Scandinavian style with light wood furniture, cozy textiles (wool, linen), warm lighting, soft neutral colors with subtle pastels, and hygge-inspired elements like candles and plants.',
    isCustom: false,
  },
  {
    id: 'industrial-loft',
    name: 'Industrial Loft',
    description: 'Exposed materials, metal accents, urban edge',
    prompt: 'Transform this space into an industrial loft style with exposed brick or concrete walls, metal furniture and fixtures, Edison bulb lighting, raw materials (steel, wood, leather), and an urban, edgy aesthetic.',
    isCustom: false,
  },
  {
    id: 'bohemian-eclectic',
    name: 'Bohemian Eclectic',
    description: 'Vibrant colors, patterns, layered textures',
    prompt: 'Redesign this space in a bohemian eclectic style with vibrant colors, mixed patterns (kilim rugs, tapestries), layered textures, plants, vintage furniture, and an artistic, free-spirited atmosphere.',
    isCustom: false,
  },
  {
    id: 'mid-century-modern',
    name: 'Mid-Century Modern',
    description: 'Retro furniture, geometric patterns, warm woods',
    prompt: 'Transform this space into a mid-century modern design with retro furniture (Eames-style chairs, teak wood), geometric patterns, warm wood tones, bold accent colors, and clean, functional aesthetics from the 1950s-60s.',
    isCustom: false,
  },
  {
    id: 'coastal-relaxed',
    name: 'Coastal Relaxed',
    description: 'Light blues, whites, natural materials, beach vibes',
    prompt: 'Redesign this space in a coastal relaxed style with light blue and white color palette, natural materials (rattan, jute, driftwood), nautical accents, airy curtains, and a fresh, beach-inspired atmosphere.',
    isCustom: false,
  },
  {
    id: 'japanese-zen',
    name: 'Japanese Zen',
    description: 'Minimalist, natural materials, peaceful ambiance',
    prompt: 'Transform this space into a Japanese zen design with minimalist furniture, natural materials (bamboo, rice paper, tatami), neutral earth tones, indoor plants, low seating, and a peaceful, meditative atmosphere.',
    isCustom: false,
  },
  {
    id: 'art-deco-glam',
    name: 'Art Deco Glam',
    description: 'Bold geometry, luxurious materials, 1920s elegance',
    prompt: 'Redesign this space in an Art Deco glam style with bold geometric patterns, luxurious materials (velvet, brass, marble), rich jewel tones, mirrored surfaces, elegant lighting, and 1920s sophistication.',
    isCustom: false,
  },
];

const CUSTOM_TEMPLATES_KEY = 'decor-assistant-custom-templates';

export function getCustomTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: Template): void {
  if (typeof window === 'undefined') return;
  const custom = getCustomTemplates();
  const index = custom.findIndex(t => t.id === template.id);
  if (index >= 0) {
    custom[index] = template;
  } else {
    custom.push(template);
  }
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(custom));
}

export function deleteCustomTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  const custom = getCustomTemplates().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(custom));
}

export function getAllTemplates(): Template[] {
  return [...BUILT_IN_TEMPLATES, ...getCustomTemplates()];
}

export function getTemplateById(id: string): Template | undefined {
  return getAllTemplates().find(t => t.id === id);
}

