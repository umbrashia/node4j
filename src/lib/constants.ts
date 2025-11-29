/* ============================
   CONSTANTS (mirroring Python)
   ============================ */
export const JAVA_MAX_INT = 2147483647;
export const JAVA_MIN_INT = -2147483648;

export const JAVA_INFINITY = "Infinity";
export const JAVA_NEGATIVE_INFINITY = "-Infinity";
export const JAVA_NAN = "NaN";

export const ESCAPE_CHAR = "\\";

export const ENTRY_POINT_OBJECT_ID = "t";
export const CONNECTION_PROPERTY_OBJECT_ID = "c";
export const GATEWAY_SERVER_OBJECT_ID = "GATEWAY_SERVER";
export const STATIC_PREFIX = "z:";

export const DEFAULT_JVM_ID = "rj";
export const DEFAULT_JVM_NAME = "default";

/* Types */
export const BYTES_TYPE = "j";
export const INTEGER_TYPE = "i";
export const LONG_TYPE = "L";
export const BOOLEAN_TYPE = "b";
export const DOUBLE_TYPE = "d";
export const DECIMAL_TYPE = "D";
export const STRING_TYPE = "s";
export const REFERENCE_TYPE = "r";
export const ARRAY_TYPE = "t";
export const SET_TYPE = "h";
export const LIST_TYPE = "l";
export const MAP_TYPE = "a";
export const NULL_TYPE = "n";
export const PACKAGE_TYPE = "p";
export const CLASS_TYPE = "c";
export const METHOD_TYPE = "m";
export const NO_MEMBER = "o";
export const VOID_TYPE = "v";
export const ITERATOR_TYPE = "g";
export const PYTHON_PROXY_TYPE = "f";

/* Protocol */
export const END = "e";
export const ERROR = "x";
export const FATAL_ERROR = "z";
export const SUCCESS = "y";
export const RETURN_MESSAGE = "!";

/* Commands */
export const CALL_COMMAND_NAME = "c\n";
export const CONSTRUCTOR_COMMAND_NAME = "i\n";
export const REFLECTION_COMMAND_NAME = "r\n";
export const REFL_GET_UNKNOWN_SUB_COMMAND_NAME = "u";
export const REF_TYPE_COMMAND_NAME = "rj";
export const SUCCESS_PACKAGE_COMMAND = SUCCESS + PACKAGE_TYPE;
export const SUCCESS_CLASS_COMMAND = SUCCESS + CLASS_TYPE;
export const SUCCESS_METHOD_COMMAND = SUCCESS + METHOD_TYPE;
