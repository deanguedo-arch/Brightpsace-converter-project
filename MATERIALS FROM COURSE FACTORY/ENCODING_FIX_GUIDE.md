# Encoding Fix Guide & Prevention Recommendations

## Immediate Manual Fixes Required

Due to encoding corruption, please manually fix these lines in `src/App.jsx`:

### 1. Read Button Duplicates (Lines 6101, 7272, 8081)
**Find:**
```javascript
buttonsHTML += `<button ...>Read</button>`;ðŸ"– Read</button>`;
```
**Replace with:**
```javascript
buttonsHTML += `<button ...>Read</button>`;
```

### 2. Assessment Type Icons (Lines 6356, 7453)
**Find:**
```javascript
const typeIcon = assess.type === 'quiz' ? 'ðŸ"' : assess.type === 'longanswer' ? 'âœ"ï¸' : assess.type === 'print' ? 'ðŸ–¨ï¸' : 'ðŸ"‹';
```
**Replace with:**
```javascript
const typeIcon = assess.type === 'quiz' ? 'Q' : assess.type === 'longanswer' ? 'A' : assess.type === 'print' ? 'P' : 'M';
```

### 3. File Icons in Phase 4 (Lines 8840, 8843, 8847, 8854, 8857)
**Find and replace:**
- `ðŸ"„` → `&#128194;`
- `ðŸ"‹` → `&#128196;`
- `ðŸ"` → `&#128193;`

### 4. Migrate Button (Line ~2959)
**Find:**
```javascript
ðŸ"„ Migrate
```
**Replace with:**
```javascript
Migrate
```

---

## Prevention Recommendations

### 1. **Use HTML Entities Instead of Emojis**
Instead of direct emoji characters, use HTML entities or Unicode escapes:
- ✅ `&#128194;` (folder icon)
- ✅ `&#128196;` (document icon)
- ✅ `&#128193;` (file icon)
- ❌ Direct emoji characters (can corrupt)

### 2. **Use SVG Icons for UI Elements**
For icons that need to be reliable:
```javascript
// ✅ Good - SVG icon
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
</svg>

// ❌ Bad - Emoji
☰
```

### 3. **Use Text Labels Instead of Emoji Icons**
For assessment types and similar:
```javascript
// ✅ Good - Text labels
const typeIcon = assess.type === 'quiz' ? 'Q' : assess.type === 'longanswer' ? 'A' : 'P';

// ❌ Bad - Emoji
const typeIcon = assess.type === 'quiz' ? '📝' : ...
```

### 4. **File Encoding Standards**
- Always save files as **UTF-8 with BOM** or **UTF-8 without BOM**
- Configure your editor to use UTF-8 encoding
- Add to `.editorconfig`:
  ```
  [*.{js,jsx,ts,tsx}]
  charset = utf-8
  ```

### 5. **Use Icon Libraries**
Consider using icon libraries instead of emojis:
- **Lucide React** (already in your project)
- **Heroicons**
- **Font Awesome**

Example:
```javascript
import { Book, FileText, Video, Presentation } from 'lucide-react';

const materialIcon = material.type === 'book' ? <Book /> : 
                     material.type === 'pdf' ? <FileText /> : 
                     material.type === 'video' ? <Video /> : 
                     <Presentation />;
```

### 6. **Create Icon Constants**
Create a constants file for icons:
```javascript
// icons.js
export const ICONS = {
  FOLDER: '&#128194;',
  DOCUMENT: '&#128196;',
  FILE: '&#128193;',
  QUIZ: 'Q',
  LONG_ANSWER: 'A',
  PRINT: 'P',
  MIXED: 'M'
};
```

### 7. **Add ESLint Rule**
Add to `eslint.config.js`:
```javascript
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'Literal[value=/[\u{1F300}-\u{1F9FF}]/u]',
      message: 'Avoid using emoji characters directly. Use HTML entities or icon components instead.'
    }
  ]
}
```

### 8. **Pre-commit Hook**
Add a pre-commit hook to check for emoji characters:
```javascript
// .husky/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx)$' | xargs grep -P '[\x{1F300}-\x{1F9FF}]'; then
  echo "❌ Error: Emoji characters detected. Use HTML entities or icon components instead."
  exit 1
fi
```

---

## Best Practices Summary

1. ✅ **Never use direct emoji characters in code**
2. ✅ **Use HTML entities for simple icons** (`&#128194;`)
3. ✅ **Use SVG icons for complex UI elements**
4. ✅ **Use icon libraries (Lucide, Heroicons) for React components**
5. ✅ **Use text labels for simple indicators** (Q, A, P, M)
6. ✅ **Ensure UTF-8 encoding in all files**
7. ✅ **Add linting rules to catch emoji usage**
8. ✅ **Use pre-commit hooks to prevent emoji commits**

---

## Material Type Icon System (Future Enhancement)

Instead of emojis, create a selectable icon system:

```javascript
const MATERIAL_ICONS = {
  book: { svg: '<svg>...</svg>', label: 'Book' },
  pdf: { svg: '<svg>...</svg>', label: 'PDF' },
  video: { svg: '<svg>...</svg>', label: 'Video' },
  slideshow: { svg: '<svg>...</svg>', label: 'Slideshow' }
};
```

This allows users to select icon types in the UI without encoding issues.
