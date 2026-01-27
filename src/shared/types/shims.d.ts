/* eslint-disable @typescript-eslint/no-explicit-any */
// Global declaration file for missing library types

declare module "signals" {
  export class Signal<_T = any> {
    add(
      listener: (...args: any[]) => void,
      context?: any,
      priority?: number,
    ): any;
    addOnce(
      listener: (...args: any[]) => void,
      context?: any,
      priority?: number,
    ): any;
    remove(listener: (...args: any[]) => void, context?: any): any;
    removeAll(): void;
    halt(): void;
    dispatch(...args: any[]): void;
    active: boolean;
    memorize: boolean;
  }
}

declare module "monaco-editor" {
  export namespace editor {
    export type IStandaloneCodeEditor = any;
    export type IStandaloneDiffEditor = any;
    export type IDiffEditorConstructionOptions = any;
    export type IStandaloneEditorConstructionOptions = any;
    export type IEditorOverrideServices = any;
    export type IModelContentChangedEvent = any;
    export type IMarker = any;
  }
}

declare module "monaco-editor/esm/vs/editor/editor.api" {
  export * from "monaco-editor";
}

declare module "chroma-js" {
  const chroma: any;
  export default chroma;
  export type Scale<_T = any> = any;
}

// Global missing types
declare type BodyProps = any;
declare type BodyShapeType = any;
declare type N8AOPostPass = any;
declare type ImageDataArray = any;
declare type Signal<_T = any> = any;
declare type NodeType = any;
declare type NodeObject = any;
declare type Renderer = any;
