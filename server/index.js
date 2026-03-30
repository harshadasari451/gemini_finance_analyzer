import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');

app.use(express.json({ limit: '10mb' }));

if (frontendOrigin) {
  app.use(
    cors({
      origin: frontendOrigin.split(',').map((origin) => origin.trim()),
    })
  );
}

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Missing GEMINI_API_KEY in environment. Set it in server/.env.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const stripCodeFences = (text) =>
  String(text)
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .trim();

const extractJson = (text) => {
  const trimmed = stripCodeFences(text);
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1) {
      try {
        return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
      } catch {
        return null;
      }
    }

    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd !== -1) {
      try {
        return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
};

const normalizeIssues = (rawIssues, fallbackText) => {
  const issues = Array.isArray(rawIssues)
    ? rawIssues.map((issue) => String(issue).trim()).filter(Boolean)
    : [];

  if (issues.length >= 2) return issues.slice(0, 5);

  const fallback = String(fallbackText)
    .split('\n')
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean);

  return fallback.slice(0, 5);
};

const parseDataUrl = (dataUrl) => {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
};

const generateText = async ({ prompt, imageData }) => {
  const model = genAI.getGenerativeModel({ model: modelName });
  const parts = [{ text: prompt }];

  if (imageData) {
    parts.push({ inlineData: { data: imageData.data, mimeType: imageData.mimeType } });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  });

  return result.response.text();
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/analyze', async (req, res) => {
  try {
    const { text, imageBase64 } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Complaint text is required.' });
    }

    const imageData = parseDataUrl(imageBase64);

    const issuesPrompt = `Extract 2-5 key issues from the following financial complaint. Be specific and concise.
Return ONLY a JSON array of strings.

Complaint: ${text.trim()}`;

    const issuesRaw = await generateText({ prompt: issuesPrompt, imageData });
    const parsedIssues = extractJson(issuesRaw);
    const keyIssues = normalizeIssues(parsedIssues, issuesRaw);

    const categories = [
      'Fraud',
      'Billing Issue',
      'Loan Issue',
      'Customer Service',
      'Account Issue',
      'Other',
    ];

    const categoryPrompt = `Given the following key issues, classify the complaint into ONE category from this list:
- Fraud
- Billing Issue
- Loan Issue
- Customer Service
- Account Issue
- Other
Return ONLY a JSON string with the category.

Key Issues: ${keyIssues.join('; ')}`;

    const categoryRaw = await generateText({ prompt: categoryPrompt });
    const parsedCategory = extractJson(categoryRaw);
    const rawCategoryText = stripCodeFences(categoryRaw);
    const categoryFromObject =
      parsedCategory && typeof parsedCategory === 'object' && 'category' in parsedCategory
        ? String(parsedCategory.category).trim()
        : null;
    const categoryFromString =
      typeof parsedCategory === 'string' && parsedCategory.trim()
        ? parsedCategory.trim()
        : null;
    const matchedCategory = categories.find((candidate) =>
      rawCategoryText.toLowerCase().includes(candidate.toLowerCase())
    );
    const category =
      categoryFromObject ||
      categoryFromString ||
      matchedCategory ||
      rawCategoryText.replace(/[^A-Za-z\s]/g, '').trim() ||
      'Other';

    const summaryPrompt = `Generate a concise 2-3 line summary of the complaint based on the complaint and key issues.
Return ONLY a JSON string.

Complaint: ${text.trim()}
Key Issues: ${keyIssues.join('; ')}`;

    const summaryRaw = await generateText({ prompt: summaryPrompt, imageData });
    const parsedSummary = extractJson(summaryRaw);
    const summaryFromObject =
      parsedSummary && typeof parsedSummary === 'object' && 'summary' in parsedSummary
        ? String(parsedSummary.summary).trim()
        : null;
    const summaryFromString =
      typeof parsedSummary === 'string' && parsedSummary.trim()
        ? parsedSummary.trim()
        : null;
    const summary = summaryFromObject || summaryFromString || stripCodeFences(summaryRaw);

    return res.json({ category, keyIssues, summary });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze complaint.' });
  }
});

app.listen(port, () => {
  console.log(`Gemini analyzer API listening on http://localhost:${port}`);
});

if (fs.existsSync(clientDistPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
