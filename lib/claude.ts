import { uriToBase64 } from './image-utils';

export interface Nutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  name: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  steps: string[];
  emoji: string;
  nutrition?: Nutrition;
}

export interface AnalysisResult {
  recipes: Recipe[];
  detectedIngredients: string[];
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  es: 'Spanish',
  tr: 'Turkish',
  ja: 'Japanese',
  ko: 'Korean',
  it: 'Italian',
  nl: 'Dutch',
};

function buildSystemPrompt(language: string): string {
  const langName = LANGUAGE_NAMES[language] ?? 'English';
  return `You are an experienced chef assistant. Analyze the ingredient photos and/or text descriptions provided by the user and suggest practical, delicious recipes.

Respond ONLY with valid JSON in this exact format (no other text):
{
  "detectedIngredients": ["ingredient1", "ingredient2"],
  "recipes": [
    {
      "name": "Recipe Name",
      "emoji": "🍳",
      "duration": "30 min",
      "difficulty": "Easy",
      "ingredients": ["500g tomatoes", "2 eggs"],
      "steps": ["Step 1 description", "Step 2 description"],
      "nutrition": { "calories": 350, "protein": "15g", "carbs": "45g", "fat": "8g" }
    }
  ]
}

Rules:
- difficulty must be exactly one of: "Easy", "Medium", or "Hard" (always in English, never translated)
- nutrition.calories is an estimated integer (kcal per serving); protein, carbs, fat are strings with "g" unit (e.g. "15g")
- Always include nutrition values; estimate based on typical ingredients and portion sizes
- Suggest at least 2 and at most 4 recipes
- Choose a meaningful emoji for each recipe
- Keep steps concise and clear
- Respond in ${langName} for all text fields (name, detectedIngredients, ingredients, steps, duration) except difficulty`;
}

type ContentBlock =
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
  | { type: 'text'; text: string };

export async function analyzeIngredients(
  imageUris: string[],
  textDescription?: string,
  onChunk?: (chunk: string) => void,
  language = 'en'
): Promise<AnalysisResult> {
  const content: ContentBlock[] = [];

  for (const uri of imageUris) {
    const base64 = await uriToBase64(uri);
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
    });
  }

  const textPart = textDescription?.trim()
    ? `Ingredients: ${textDescription}`
    : 'Analyze the ingredients in these photos and suggest recipes.';

  content.push({ type: 'text', text: textPart });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(language),
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const fullText: string = data.content?.[0]?.text ?? '';

  onChunk?.(fullText);

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid API response');
  }

  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}
