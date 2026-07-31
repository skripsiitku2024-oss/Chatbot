import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const upload = multer();
const port = 3000;

const apiKey = process.env.GEMINI_API_KEY;
const model = 'gemini-3.5-flash-lite';
// console.log(apiKey);

const ai = new GoogleGenAI({
  apiKey,
});

app.use(cors());
app.use(express.json());

// Serve static frontend files from the client folder
app.use(express.static(path.join(__dirname, '../client')));


app.post('/api/chat', async (req, res) => {
  try {
    const { conversation } = req.body;

    if (!Array.isArray(conversation)) throw new Error('Massages must be an array!');

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0.9,
        systemInstruction: "Jawab hanya menggunakan bahasa Indonesia.",
      },
    });

    res.status(200).json({
      result: response.text
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    res.status(200).json({
      result: response.text,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

app.post('/generate-from-image', upload.single('file'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const base64Image = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model,
      contents:
        [{ text: prompt, type: 'text' },
        {
          inlineData: { data: base64Image, mimeType: req.file.mimetype },
        },
        ]
    });

    res.status(200).json({
      result: response.text,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

// Static serving is now defined above to target '../client'

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});