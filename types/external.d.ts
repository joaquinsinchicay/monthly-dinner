declare module "tailwindcss" {
  export interface Config {
    content?: string[];
    theme?: Record<string, unknown>;
    plugins?: unknown[];
  }
  const config: Config;
  export default config;
}

declare module "@playwright/test" {
  export const test: ((name: string, fn: (args: { page: { goto(url: string): Promise<void> } }) => Promise<void>) => void) & {
    describe?: unknown;
  };
  export const expect: (value: unknown) => { toHaveURL(pattern: RegExp): Promise<void> };
  export function defineConfig(config: Record<string, unknown>): Record<string, unknown>;
}

declare module "jest" {
  export interface Config {
    preset?: string;
    testEnvironment?: string;
    setupFilesAfterEnv?: string[];
    moduleNameMapper?: Record<string, string>;
  }
}

declare module "@testing-library/jest-dom";

declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect<T>(value: T): { toBe(expected: unknown): void };
}

export {};
