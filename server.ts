import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Math solver endpoint
app.post('/api/solve', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/jpeg', gradeLevel = 'All JSS' } = req.body;

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either a math question text or an image.' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables in Secrets.',
      });
    }

    const systemInstruction = `You are an encouraging, expert secondary school mathematics tutor named Sheddy Math Solver. Your audience consists of Junior Secondary School (JSS 1, JSS 2, and JSS 3) students.
When provided with a text question OR an image of a math problem:
1. Transcribe/extract the exact math problem from the image or text.
2. Solve it accurately step-by-step.
3. Explain concepts in simple, beginner-friendly terms appropriate for JSS level.
4. Format mathematical expressions clearly using Markdown and bold text.
Return responses in strict JSON format containing:
- 'extractedQuestion': string (the transcribed question from text or image)
- 'finalAnswer': string (concise, clear final answer with units if applicable)
- 'gradeLevel': string (e.g. 'JSS 1', 'JSS 2', or 'JSS 3')
- 'topic': string (e.g. 'Prime Factorization', 'HCF & LCM', 'Binomial Expansion', 'Linear Equations', 'Basic Kinematics', etc.)
- 'steps': array of strings (detailed step-by-step breakdown explaining why and how each step works)
- 'keyTip': string (a helpful memory rule, formula tip, or mnemonic)
- 'similarQuestion': string (a follow-up practice question based on the same concept)`;

    const contents: any[] = [];

    if (imageBase64) {
      // Clean base64 header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    let textInstruction = '';
    if (prompt && prompt.trim()) {
      textInstruction += `Math Question: "${prompt.trim()}". `;
    } else {
      textInstruction += 'Please transcribe and solve the math problem shown in the image. ';
    }

    if (gradeLevel && gradeLevel !== 'All JSS') {
      textInstruction += `The student is in grade level ${gradeLevel}. Tailor the explanation strictly to this level.`;
    }

    contents.push({ text: textInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? contents[0] : { parts: contents },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedQuestion: {
              type: Type.STRING,
              description: 'The transcribed question from text or image',
            },
            finalAnswer: {
              type: Type.STRING,
              description: 'Clear, emphasized final answer',
            },
            gradeLevel: {
              type: Type.STRING,
              description: 'Appropriate grade level e.g. JSS 1, JSS 2, or JSS 3',
            },
            topic: {
              type: Type.STRING,
              description: 'Mathematics topic area',
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'Step-by-step pedagogical breakdown explaining how and why',
            },
            keyTip: {
              type: Type.STRING,
              description: 'A helpful mnemonic or key rule to remember',
            },
            similarQuestion: {
              type: Type.STRING,
              description: 'A follow-up practice question based on the same concept',
            },
          },
          required: [
            'extractedQuestion',
            'finalAnswer',
            'gradeLevel',
            'topic',
            'steps',
            'keyTip',
            'similarQuestion',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text received from Gemini');
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error solving math problem:', err);
    return res.status(500).json({
      error: err.message || 'Failed to solve math problem. Please check your question or image and try again.',
    });
  }
});

// Endpoint to generate similar problem or interactive quiz question
app.post('/api/practice-question', async (req, res) => {
  try {
    const { topic, gradeLevel = 'JSS 2', sourceQuestion } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured.' });
    }

    const systemInstruction = `You are Sheddy Math Solver's practice generator.
Generate a high-quality Junior Secondary School (JSS) mathematics multiple-choice question.
Topic: ${topic || 'General JSS Math'}.
Target Level: ${gradeLevel}.
${sourceQuestion ? `Create a problem testing the exact same mathematical skill as: "${sourceQuestion}".` : ''}

Return JSON with:
- 'question': string (The math problem statement)
- 'options': array of 4 string choices (e.g. ["A) ...", "B) ...", "C) ...", "D) ..."])
- 'correctOptionIndex': integer (0 to 3)
- 'finalAnswer': string (The exact correct answer)
- 'hint': string (A gentle hint without giving away the answer)
- 'explanation': string (Clear step-by-step explanation for why the option is correct)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate 1 multiple-choice practice question for ${gradeLevel} on ${topic || 'algebra'}.`,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctOptionIndex: { type: Type.INTEGER },
            finalAnswer: { type: Type.STRING },
            hint: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ['question', 'options', 'correctOptionIndex', 'finalAnswer', 'hint', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error generating practice question:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate practice question.' });
  }
});

// Endpoint for hints
app.post('/api/hint', async (req, res) => {
  try {
    const { question, userAttempt } = req.body;
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured.' });
    }

    const prompt = `Student question: "${question}".
${userAttempt ? `Student current attempt: "${userAttempt}".` : ''}
Provide a short, friendly, encouraging hint for a Junior Secondary School student.
Do not reveal the final answer. Guide them on the first or next step.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an encouraging math teacher giving a helpful hint to a JSS student.',
        temperature: 0.3,
      },
    });

    return res.json({ hint: response.text?.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get hint.' });
  }
});

// Serve frontend: Vite middlewares in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Sheddy Math Solver server running on http://localhost:${PORT}`);
  });
}

startServer();
