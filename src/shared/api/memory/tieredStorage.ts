import type {
  ChatSession,
  FlashcardContent as Flashcard,
  GeneratedLessonContent as GeneratedLesson,
  MemoryType,
  NoteContent as Note,
  StudyMaterialContent as StudyMaterial,
} from "../../types/ai-brain";
import { summarizeChat } from "./chatSummarizer";
import { getMemoryStore, TRUST_SCORES } from "./memoryStore";

// =============================================================================
// TYPES
// =============================================================================

// Types are imported from ai-brain.ts

// =============================================================================
// CHUNKING UTILITIES
// =============================================================================

interface ChunkOptions {
  maxLength?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
}

/**
 * Split text into chunks for embedding
 */
function chunkText(text: string, options?: ChunkOptions): string[] {
  const maxLength = options?.maxLength || 500;
  const overlap = options?.overlap || 50;
  const preserveParagraphs = options?.preserveParagraphs ?? true;

  // If text is short enough, return as single chunk
  if (text.length <= maxLength) {
    return [text.trim()];
  }

  const chunks: string[] = [];

  if (preserveParagraphs) {
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;

      if (currentChunk.length + trimmedPara.length + 2 <= maxLength) {
        currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // If paragraph itself is too long, split it
        if (trimmedPara.length > maxLength) {
          const subChunks = splitByLength(trimmedPara, maxLength, overlap);
          chunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1] || "";
        } else {
          currentChunk = trimmedPara;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }
  } else {
    // Simple length-based splitting
    chunks.push(...splitByLength(text, maxLength, overlap));
  }

  return chunks.filter((c) => c.trim().length > 0);
}

function splitByLength(
  text: string,
  maxLength: number,
  overlap: number,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;

    // Try to break at sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPeriod = slice.lastIndexOf(". ");
      const lastNewline = slice.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > maxLength * 0.5) {
        end = start + breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}

// =============================================================================
// TIERED STORAGE MANAGER
// =============================================================================

export class TieredStorageManager {
  private memoryStore = getMemoryStore();

  // =============================================================================
  // CORE OPERATIONS
  // =============================================================================

  /**
   * Embed study material (library)
   */
  async onStudyMaterialCreate(material: StudyMaterial): Promise<string[]> {
    console.log(
      `[TieredStorage] Embedding library material: ${material.title}`,
    );

    const chunks = chunkText(material.content, {
      maxLength: 4000,
      overlap: 400,
      preserveParagraphs: true,
    });

    const items = chunks.map((chunk) => ({
      text: chunk,
      metadata: {
        type: "library" as MemoryType,
        trustScore: TRUST_SCORES.library,
        sourceId: material.id,
        sourceType: material.type,
        subject: material.subject,
        topic: material.topic,
        validated: true,
      },
    }));

    return this.memoryStore.addBatch(items);
  }

  async onStudyMaterialDelete(materialId: string): Promise<number> {
    return this.memoryStore.deleteWhere({ sourceId: materialId });
  }

  /**
   * Embed note on save
   */
  async onNoteSave(note: Note): Promise<string> {
    console.log(`[TieredStorage] Embedding note: ${note.id}`);

    // Delete existing embedding for this note
    await this.memoryStore.deleteWhere({ sourceId: note.id });

    // Add new embedding
    return this.memoryStore.add(note.content, {
      type: "note",
      trustScore: TRUST_SCORES.note,
      sourceId: note.id,
      sourceType: "note",
      subject: note.subject,
      topic: note.topic,
      validated: true,
    });
  }

  async onNoteDelete(noteId: string): Promise<number> {
    return this.memoryStore.deleteWhere({ sourceId: noteId });
  }

  /**
   * Embed flashcard on creation
   */
  async onFlashcardCreate(flashcard: Flashcard): Promise<string> {
    const text = `Q: ${flashcard.front}\nA: ${flashcard.back}`;

    return this.memoryStore.add(text, {
      type: "flashcard",
      trustScore: TRUST_SCORES.flashcard,
      sourceId: flashcard.id,
      sourceType: "flashcard",
      subject: flashcard.subject,
      topic: flashcard.topic,
      validated: true,
    });
  }

  async onFlashcardBatchCreate(flashcards: Flashcard[]): Promise<string[]> {
    console.log(`[TieredStorage] Embedding ${flashcards.length} flashcards`);

    const items = flashcards.map((fc) => ({
      text: `Q: ${fc.front}\nA: ${fc.back}`,
      metadata: {
        type: "flashcard" as MemoryType,
        trustScore: TRUST_SCORES.flashcard,
        sourceId: fc.id,
        sourceType: "flashcard",
        subject: fc.subject,
        topic: fc.topic,
        validated: true,
      },
    }));

    return this.memoryStore.addBatch(items);
  }

  async onFlashcardDelete(flashcardId: string): Promise<number> {
    return this.memoryStore.deleteWhere({ sourceId: flashcardId });
  }

  /**
   * Embed new generated lesson
   */
  async onGeneratedLessonCreate(lesson: GeneratedLesson): Promise<string[]> {
    console.log(`[TieredStorage] Embedding new lesson: ${lesson.title}`);

    const chunks = chunkText(lesson.content, {
      maxLength: 500,
      overlap: 50,
    });

    const items = chunks.map((chunk) => ({
      text: chunk,
      metadata: {
        type: "lesson" as MemoryType,
        trustScore: TRUST_SCORES.lesson,
        sourceId: lesson.id,
        sourceType: "generated_lesson" as string,
        subject: lesson.subject,
        topic: lesson.topic,
        validated: false,
      },
    }));

    return this.memoryStore.addBatch(items);
  }

  async onLessonDelete(lessonId: string): Promise<number> {
    return this.memoryStore.deleteWhere({ sourceId: lessonId });
  }

  /**
   * Summarize and embed chat session
   */
  async onChatEnd(session: ChatSession): Promise<string | null> {
    if (session.messages.length < 4) return null;

    try {
      const summary = await summarizeChat(session);
      if (!summary || summary.trim().length < 20) return null;

      return this.memoryStore.add(summary, {
        type: "chat_summary",
        trustScore: TRUST_SCORES.chat_summary,
        sourceId: session.id,
        sourceType: "chat_session",
        subject: session.subject,
        topic: session.topic,
        validated: false,
      });
    } catch (error) {
      console.error("[TieredStorage] Failed to summarize chat:", error);
      return null;
    }
  }

  // =============================================================================
  // UTILITIES & ALIASES
  // =============================================================================

  async onLibraryUpload(material: StudyMaterial): Promise<string[]> {
    return this.onStudyMaterialCreate(material);
  }

  async onLibraryDelete(id: string): Promise<number> {
    return this.onStudyMaterialDelete(id);
  }

  async onLessonValidate(lesson: GeneratedLesson): Promise<string[]> {
    // For backward compatibility, re-embed with higher trust
    await this.onLessonDelete(lesson.id);
    const ids = await this.onGeneratedLessonCreate(lesson);
    // Then upgrade trust manually? Or just use this logic:
    for (const id of ids) {
      await this.markAsValidated(id);
    }
    return ids;
  }

  async markAsValidated(documentId: string): Promise<boolean> {
    return this.memoryStore.update(documentId, {
      metadata: {
        validated: true,
        validationDate: Date.now(),
        trustScore: 0.9,
      },
    });
  }

  async clearSubject(subject: string): Promise<number> {
    return this.memoryStore.deleteWhere({ subject });
  }

  async getStats() {
    return this.memoryStore.getStats();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let tieredStorageInstance: TieredStorageManager | null = null;

export function getTieredStorage(): TieredStorageManager {
  if (!tieredStorageInstance) {
    tieredStorageInstance = new TieredStorageManager();
  }
  return tieredStorageInstance;
}
