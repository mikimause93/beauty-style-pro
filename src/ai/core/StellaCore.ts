// src/ai/core/StellaCore.ts
import { askAI } from '@/lib/aiRouter';
import { runAction } from '../actions/StellaActions';
import { getMemory, recordInteraction } from './StellaMemory';
import { getContext, recordRecentAction } from './StellaContext';
import type {
  StellaChatResponse,
  StellaAction,
  StellaActionName,
  StellaParsedCommand,
} from '../types/stella.types';

// Tag format embedded in AI responses: [STELLA_ACTION:functionName|{...json...}]
// Use a robust extractor to handle nested braces in JSON args.
const ACTION_TAG_START_RE = /\[STELLA_ACTION:(\w+)\|/g;

function extractActionTags(text: string): Array<{ name: string; argsJson: string; fullMatch: string }> {
  const results: Array<{ name: string; argsJson: string; fullMatch: string }> = [];
  const re = new RegExp(ACTION_TAG_START_RE.source, 'g');
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    const afterPipe = m.index + m[0].length;
    // Walk forward to find the matching closing brace, counting nesting
    let depth = 0;
    let i = afterPipe;
    let started = false;
    for (; i < text.length; i++) {
      if (text[i] === '{') { depth++; started = true; }
      else if (text[i] === '}') {
        depth--;
        if (started && depth === 0) {
          // i is the position of the final '}'
          const argsJson = text.slice(afterPipe, i + 1);
          const closingBracket = text[i + 1] === ']' ? i + 1 : -1;
          if (closingBracket !== -1) {
            results.push({
              name,
              argsJson,
              fullMatch: text.slice(m.index, closingBracket + 1),
            });
          }
          break;
        }
      }
    }
  }
  return results;
}

function buildSystemPrompt(contextStr: string, memoryStr: string): string {
  return `Sei Stella AI V3, l'assistente intelligente di Beauty Style Pro.

SEI IL CERVELLO DELL'APP. Puoi controllare TUTTO.

CONTESTO ATTUALE:
${contextStr}

MEMORIA UTENTE:
${memoryStr}

CAPACITÀ:
- Aprire qualsiasi schermata dell'app
- Creare prenotazioni
- Gestire shop e ordini
- Rispondere ai clienti
- Mostrare statistiche
- Controllare l'agenda
- Trovare professionisti
- Automatizzare operazioni

FUNZIONI DISPONIBILI (usa la sintassi esatta per eseguire azioni):
Per eseguire un'azione inserisci nel testo: [STELLA_ACTION:nomeFunzione|{"chiave":"valore"}]

- open_calendar: Apre agenda  →  [STELLA_ACTION:open_calendar|{}]
- create_booking: Crea prenotazione  →  [STELLA_ACTION:create_booking|{"professionalId":"id","serviceId":"id","date":"YYYY-MM-DD","time":"HH:mm"}]
- open_shop: Apre shop  →  [STELLA_ACTION:open_shop|{}]
- show_stats: Statistiche  →  [STELLA_ACTION:show_stats|{"period":"today"}]  (period: today|week|month)
- find_professionals: Cerca professionisti  →  [STELLA_ACTION:find_professionals|{"category":"parrucchiere","city":"Roma"}]
- add_to_cart: Aggiungi al carrello  →  [STELLA_ACTION:add_to_cart|{"productId":"id","quantity":1}]
- get_revenue: Incassi  →  [STELLA_ACTION:get_revenue|{"period":"week"}]
- get_bookings: Prenotazioni  →  [STELLA_ACTION:get_bookings|{"status":"confirmed"}]
- send_message: Invia messaggio  →  [STELLA_ACTION:send_message|{"clientId":"id","message":"testo"}]
- navigate_to: Naviga  →  [STELLA_ACTION:navigate_to|{"path":"/shop"}]
- search: Cerca  →  [STELLA_ACTION:search|{"query":"termine"}]
- activate_work_mode: Modalità lavoro  →  [STELLA_ACTION:activate_work_mode|{}]

STILE:
- Concisa, diretta, professionale
- Azioni immediate, poche parole
- Emoji solo se pertinenti
- Sempre proattiva
- Rispondi in italiano`;
}

function parseActions(text: string): { cleanText: string; commands: StellaParsedCommand[] } {
  const commands: StellaParsedCommand[] = [];
  const tags = extractActionTags(text);
  let cleanText = text;

  // Process in reverse order to preserve string indices
  for (let i = tags.length - 1; i >= 0; i--) {
    const tag = tags[i];
    try {
      const args = JSON.parse(tag.argsJson) as Record<string, unknown>;
      commands.unshift({ functionName: tag.name as StellaActionName, args });
    } catch {
      // ignore malformed JSON
    }
    cleanText = cleanText.replace(tag.fullMatch, '');
  }

  return { cleanText: cleanText.trim(), commands };
}

export async function stellaChat(
  message: string,
  userId: string,
  navigate: (path: string) => void,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<StellaChatResponse> {
  const context = getContext({ userId });
  const memory = getMemory(userId);

  const systemPrompt = buildSystemPrompt(
    JSON.stringify(context),
    JSON.stringify({
      frequentServices: memory.frequentServices,
      preferredTimes: memory.preferredTimes,
      preferences: memory.preferences,
      recentInteractions: memory.lastInteractions.slice(0, 3),
    })
  );

  // Build the full prompt: inject system context before history
  const fullMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ];

  // Use existing AI router (Supabase edge function)
  const rawResponse = await askAI({
    role: 'auto',
    messages: fullMessages,
    userId,
    context: { currentPage: context.currentPage },
  });

  // Parse action tags from response
  const { cleanText, commands } = parseActions(rawResponse);

  // Execute discovered actions
  const executedActions: StellaAction[] = [];
  for (const cmd of commands) {
    recordRecentAction(cmd.functionName);
    const result = await runAction(cmd.functionName, cmd.args, userId, navigate);
    executedActions.push({ name: cmd.functionName, result });
  }

  // Record this interaction in memory
  recordInteraction(userId, message.slice(0, 80));

  return {
    response: cleanText || rawResponse,
    actions: executedActions.length > 0 ? executedActions : undefined,
  };
}
