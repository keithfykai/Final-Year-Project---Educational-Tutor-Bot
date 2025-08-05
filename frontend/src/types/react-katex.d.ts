declare module 'react-katex' {
  import * as React from 'react';

  export interface KatexProps {
    children: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    macros?: Record<string, string>;
    strict?: boolean | 'warn' | 'ignore';
    trust?: boolean | ((context: any) => boolean);
    leqno?: boolean;
    fleqn?: boolean;
    displayMode?: boolean;
    throwOnError?: boolean;
    output?: 'html' | 'mathml';
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}
