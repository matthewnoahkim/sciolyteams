import mammoth from 'mammoth';
import OpenAI from 'openai';
import { ImportedQuestion } from './import-types';
import { nanoid } from 'nanoid';

// System prompt to be provided by user
export const DOCX_IMPORT_SYSTEM_PROMPT = `
You are the parser for the Teamy test builder's "Import from .docx" feature. The backend extracts text from a .docx file and adds simple markers. Your job is to convert each chunk of this marked text into JSON that exactly matches the Teamy ImportedQuestion schema.

GENERAL RULES
- Output ONLY valid JSON. No explanations, no markdown, no comments.
- Be conservative: if something is unclear, use null, "" or [] rather than guessing.
- Preserve all instructor wording; do not rewrite text.
- Return: { "questions": [ ... ] } where each item is an ImportedQuestion.

IMPORTED QUESTION SCHEMA
Each question must match:

{
  "id": "string",                      // e.g. "1", "1a"
  "type": "free_response | multiple_choice | select_all",
  "prompt": "string",
  "context": "string or null",
  "choices": [                         // empty for free_response
    { "label": "A", "text": "string", "correct": true }
  ],
  "points": number | null,
  "frqParts": [                        // optional, for multi-part FRQs
    { "label": "a", "prompt": "string", "points": number | null }
  ]
}

MARKERS YOU MAY RECEIVE
[TITLE] text
[INSTR] text
[Q] 1. Question text
[SUBQ] 1a. Question text
[CONTEXT] text
[CHOICE] A) Option text
[CHOICE_CORRECT] A) Option text
[POINTS] (2 pts)
[ANSWER_KEY] 1. C          // Or multiple like "3. AC"
[TEXT] text                // Generic unclassified text

INTERPRETATION RULES

1. QUESTION DETECTION
- Each [Q] starts a new main question.
- Each [SUBQ] is a sub-part of the previous main question (e.g., 1a, 1b, 1c).
- Use the visible number ("1", "2") as the "id" field for main questions.

2. MULTI-PART FRQs
- If a question has [SUBQ] markers following it, this is a multi-part FRQ.
- Group all [SUBQ] items as "frqParts" in the main question.
- Each frqPart should have: { "label": "a", "prompt": "text", "points": number | null }
- Extract the letter (a, b, c) from the SUBQ numbering (1a → "a", 2b → "b").
- The main question's prompt should be the [Q] text, and points should be the sum of all parts.

3. QUESTION TYPE
- If a question has choices → "multiple_choice"
- If instructions or prompt contain phrases like "select all", "choose all that apply", etc. → "select_all"
- If no choices present AND no sub-parts → "free_response"
- If has sub-parts ([SUBQ]) → "free_response" with frqParts

4. CONTEXT
- Consecutive [CONTEXT] or [TEXT] lines before a question's prompt belong to that question's context.
- If none exist → context = null.

5. PROMPT
- For [Q]: the text on the line after its numbering is the main prompt.
- For [SUBQ]: the text on the line after its numbering is that part's prompt.

6. CHOICES
- All [CHOICE] and [CHOICE_CORRECT] lines until the next [Q]/[SUBQ] belong to the same question.
- Extract the label (A, B, C, etc.) and the text after the label.
- Default "correct": false unless explicitly known.

7. CORRECT ANSWERS
- Use [ANSWER_KEY] when available:
  - Example: "1. C" → choice C is correct.
  - "3. AC" → choices A and C are correct.
- If [CHOICE_CORRECT] lines appear, mark those choices as correct.
- If both answer key and CORRECT markers exist and conflict, prefer the answer key.
- If no correct answer info is provided, leave all choices as correct: false.

8. POINTS
- If a [POINTS] marker is present, extract its integer.
- For multi-part questions, assign points to individual parts if specified.
- If not present → points = null.

OUTPUT FORMAT
Return a single object:
{
  "questions": [
    ...all questions parsed from this chunk...
  ]
}

Do not add any additional fields. Output JSON ONLY.

`;

/**
 * Converts a docx file buffer to marked text with special markers
 * for questions, choices, correct answers, and points.
 */
export async function docxToMarkedText(buffer: Buffer): Promise<string> {
  // Extract plain text from docx using mammoth
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  // Split into lines for processing
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const markedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect sub-questions (e.g., "1a.", "2b)", "1a:", "(a)", "a.")
    if (/^(\d+[a-z][.):)]|[(\[]?[a-z][.)\]:)])/i.test(line) && !/^[(\[]?[A-Z][.)\]]/.test(line)) {
      markedLines.push(`[SUBQ] ${line}`);
      continue;
    }
    
    // Detect question numbers (e.g., "1.", "2)", "Q1.", "Question 1:")
    if (/^(\d+[.)]|Q\d+[.:]|Question\s+\d+[.:])/i.test(line)) {
      markedLines.push(`[Q] ${line}`);
      continue;
    }
    
    // Detect multiple choice options (e.g., "A)", "A.", "a)", "(A)", etc.) - must be uppercase
    if (/^[(\[]?[A-Z][.)\]]/i.test(line)) {
      markedLines.push(`[CHOICE] ${line}`);
      continue;
    }
    
    // Detect correct answer markers in answer keys (e.g., "1. C", "Answer: B")
    if (/^(\d+[.)]?\s*[A-Z]|Answer[:\s]*[A-Z])/i.test(line)) {
      markedLines.push(`[ANSWER_KEY] ${line}`);
      continue;
    }
    
    // Detect points (e.g., "(2 pts)", "[5 points]", "3 points")
    if (/\(?\d+\s*(pt|pts|point|points)\)?/i.test(line)) {
      markedLines.push(`[POINTS] ${line}`);
      continue;
    }
    
    // Default: keep line as-is (could be part of question context or prompt)
    markedLines.push(line);
  }
  
  return markedLines.join('\n');
}

/**
 * Splits marked text into chunks suitable for GPT processing.
 * Splits by question blocks to avoid cutting questions in half.
 */
export function splitIntoChunks(markedText: string, maxQuestionsPerChunk: number = 10): string[] {
  const lines = markedText.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let questionCount = 0;
  
  for (const line of lines) {
    if (line.startsWith('[Q]')) {
      if (questionCount >= maxQuestionsPerChunk && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
        questionCount = 0;
      }
      questionCount++;
    }
    currentChunk.push(line);
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }
  
  return chunks.length > 0 ? chunks : [markedText];
}

/**
 * Calls OpenAI GPT to parse marked text into structured questions.
 */
export async function callGptForImport(markedChunk: string): Promise<ImportedQuestion[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: DOCX_IMPORT_SYSTEM_PROMPT + '\n\nYou must respond with valid JSON format.',
        },
        {
          role: 'user',
          content: markedChunk,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });
    
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from GPT');
    }
    
    const parsed = JSON.parse(responseText);
    
    // Validate structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }
    
    // Add IDs to questions if they don't have them
    const questions: ImportedQuestion[] = parsed.questions.map((q: any) => ({
      id: q.id || nanoid(),
      type: q.type,
      prompt: q.prompt || '',
      context: q.context || null,
      choices: Array.isArray(q.choices) ? q.choices : [],
      points: q.points || null,
      frqParts: Array.isArray(q.frqParts) ? q.frqParts.map((part: any) => ({
        label: part.label || 'a',
        prompt: part.prompt || '',
        points: part.points || null,
      })) : undefined,
    }));
    
    return questions;
  } catch (error: any) {
    console.error('Error calling GPT for import:', error);
    throw new Error(`Failed to parse questions with GPT: ${error.message}`);
  }
}

/**
 * Main function to import questions from a docx buffer.
 */
export async function importQuestionsFromDocx(buffer: Buffer): Promise<ImportedQuestion[]> {
  // Convert docx to marked text
  const markedText = await docxToMarkedText(buffer);
  
  // Split into chunks
  const chunks = splitIntoChunks(markedText, 10);
  
  // Process each chunk with GPT
  const allQuestions: ImportedQuestion[] = [];
  
  for (const chunk of chunks) {
    const questions = await callGptForImport(chunk);
    allQuestions.push(...questions);
  }
  
  return allQuestions;
}

