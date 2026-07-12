/**
 * Type declarations for shiki subpath modules and @shikijs/langs language modules.
 * These packages ship runtime ESM but their type declaration files are missing from the install.
 * We re-declare them here so TypeScript can resolve the imports.
 */

// ---------------------------------------------------------------------------
// shiki subpath imports → delegate to the @shikijs/* packages that have types
// ---------------------------------------------------------------------------

declare module 'shiki/core' {
  export {
    createBundledHighlighter,
    createSingletonShorthands,
  } from '@shikijs/core';
  export * from '@shikijs/types';
}

declare module 'shiki/engine/javascript' {
  export { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
}

declare module 'shiki/types' {
  export * from '@shikijs/types';
}

// ---------------------------------------------------------------------------
// @shikijs/langs/* – each language module exports a LanguageRegistration array
// ---------------------------------------------------------------------------

declare module '@shikijs/langs/typescript' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/javascript' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/jsx' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/tsx' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/html' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/css' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/json' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/jsonc' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/json5' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}

declare module '@shikijs/langs/markdown' {
  import type { LanguageRegistration } from '@shikijs/types';
  const langs: LanguageRegistration[];
  export default langs;
}
