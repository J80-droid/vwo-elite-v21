/* eslint-disable @typescript-eslint/no-explicit-any -- external library type definitions without official types */
import * as React from "react";

declare global {
  interface Window {
    $3Dmol?: any;
    $?: {
      ajax: (options: { url: string; success: (data: any) => void }) => void;
    };
  }

  /* eslint-disable @typescript-eslint/no-empty-object-type */
  /**
   * React 19 JSX Namespace Bridge
   * Resolves "Cannot find namespace 'JSX'" in node_modules that haven't updated to React 19's new JSX pattern.
   */
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface Element extends React.JSX.Element {}
    interface ElementClass extends React.JSX.ElementClass {}
    interface ElementAttributesProperty
      extends React.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute
      extends React.JSX.ElementChildrenAttribute {}
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<
      C,
      P
    >;
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>;
  }
  /* eslint-enable @typescript-eslint/no-empty-object-type */
}

// Required export to make this file a module
export {};
