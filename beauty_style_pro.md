# BEAUTY STYLE PRO — SAFE EDIT MODE WITH LOVABLE SYNC

You are working on a real production repository connected to Lovable.

This repository is linked to Lovable preview environment.
Every change must remain compatible with Lovable UI preview and live app rendering.

## CRITICAL RULES

1. DO NOT break Lovable preview
2. DO NOT change project structure unless necessary
3. DO NOT rename root folders
4. DO NOT remove existing components
5. DO NOT change Vite / React / Supabase config unless required
6. All changes must be incremental
7. UI must still render in Lovable preview
8. App must still run in browser without build errors
9. All new features must be testable manually in preview
10. Keep compatibility with Capacitor Android build

## STACK (must stay the same)

- React 18
- TypeScript
- Vite
- Tailwind
- shadcn/ui
- Supabase
- Capacitor
- Service Worker
- GitHub Actions
- Lovable preview

## WORKFLOW RULES

### Before editing:
- read existing file
- keep imports
- keep props
- extend, do not rewrite

### After editing:
- ensure no TypeScript errors
- ensure no missing imports
- ensure component renders
- ensure preview works in Lovable

## LOVABLE COMPATIBILITY RULES

All UI changes must:

- be visible in preview
- not require server restart
- not break routing
- not break Tailwind
- not break shadcn
- not break Supabase client

Use existing patterns from project.

DO NOT introduce new frameworks.

### Allowed:
✔ new components  
✔ new hooks  
✔ new services  
✔ new Supabase tables  
✔ new API calls

### Not allowed without request:
❌ Next.js  
❌ React Native  
❌ Redux rewrite  
❌ folder restructure  
❌ removing old code

## PREVIEW TEST REQUIREMENT

Every feature must be testable manually in Lovable preview.

Provide after every change:

1. File path changed
2. Full updated file
3. How to test in preview
4. What button to click
5. What result should appear

## Example output format:

### FILES UPDATED
src/components/stella/StellaVoiceV2.tsx

### HOW TO TEST
Open preview
Go to Chat
Click microphone
Say "Stella"
Expect voice response

## ERROR SAFE MODE

If a change may break preview:
ask before editing.

## LOVABLE SYNC RULE

All changes must remain compatible with Lovable live UI builder.

Do not generate code that only works locally.

Manual preview must work.

## END RULES