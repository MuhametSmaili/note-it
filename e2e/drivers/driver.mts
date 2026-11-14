/** Browser transport for shared extension scenarios. Evaluations return JSON values and expose native APIs as `extension`. */
export interface ExtensionDriver {
  origin: string;
  downloads: string;
  failures: Error[];
  page(url: string): Promise<string>;
  navigate(context: string, url: string): Promise<void>;
  evaluate(context: string, body: string): Promise<unknown>;
  activate(context: string): Promise<void>;
  closePage(context: string): Promise<void>;
  frame(context: string): Promise<string>;
  interceptLanguage(bytes: Buffer): Promise<void>;
  close(): Promise<void>;
}
