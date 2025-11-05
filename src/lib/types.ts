/**
 * If the parameter is a Java reference from prior responses we expect it to
 * carry either:
 * - a `. _get_object_id()` function (rare in JS), or
 * - a `__py4jRef` string property (this module uses that representation)
 *
 * For python-proxy we need a pool to assign ids (optional).
 */
export type NodeJsProxyPool = {
  put: (obj: any) => string; // returns proxy id like "p0"
};

/**
 * General convenience: if want to encode based on a 'type' param
 */
export type EncodeCommandInput =
  | { cmd: "constructor"; fullPath: string; args?: any[] }
  | {
      cmd: "call";
      targetRefId: string;
      methodName: string;
      args?: any[];
      NodeJsProxyPool?: NodeJsProxyPool;
    }
  | { cmd: "reflection"; fullPath: string };

export type JavaProxy = {
  // It's callable, for `...method()`
  (...args: any[]): any;
  // It has properties, for `...method.property...`
  [key: string]: JavaProxy;
};

export type ProxyCommandType = {
  javaBridge: any | null;
  fullPath: string;
  args: any[];
};
