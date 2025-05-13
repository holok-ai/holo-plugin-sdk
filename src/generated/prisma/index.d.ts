
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model llm_request_audit
 * 
 */
export type llm_request_audit = $Result.DefaultSelection<Prisma.$llm_request_auditPayload>
/**
 * Model llm_response_audit
 * 
 */
export type llm_response_audit = $Result.DefaultSelection<Prisma.$llm_response_auditPayload>
/**
 * Model models
 * 
 */
export type models = $Result.DefaultSelection<Prisma.$modelsPayload>
/**
 * Model Prompt
 * 
 */
export type Prompt = $Result.DefaultSelection<Prisma.$PromptPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Llm_request_audits
 * const llm_request_audits = await prisma.llm_request_audit.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Llm_request_audits
   * const llm_request_audits = await prisma.llm_request_audit.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.llm_request_audit`: Exposes CRUD operations for the **llm_request_audit** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Llm_request_audits
    * const llm_request_audits = await prisma.llm_request_audit.findMany()
    * ```
    */
  get llm_request_audit(): Prisma.llm_request_auditDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.llm_response_audit`: Exposes CRUD operations for the **llm_response_audit** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Llm_response_audits
    * const llm_response_audits = await prisma.llm_response_audit.findMany()
    * ```
    */
  get llm_response_audit(): Prisma.llm_response_auditDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.models`: Exposes CRUD operations for the **models** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Models
    * const models = await prisma.models.findMany()
    * ```
    */
  get models(): Prisma.modelsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.prompt`: Exposes CRUD operations for the **Prompt** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Prompts
    * const prompts = await prisma.prompt.findMany()
    * ```
    */
  get prompt(): Prisma.PromptDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    llm_request_audit: 'llm_request_audit',
    llm_response_audit: 'llm_response_audit',
    models: 'models',
    Prompt: 'Prompt'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "llm_request_audit" | "llm_response_audit" | "models" | "prompt"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      llm_request_audit: {
        payload: Prisma.$llm_request_auditPayload<ExtArgs>
        fields: Prisma.llm_request_auditFieldRefs
        operations: {
          findUnique: {
            args: Prisma.llm_request_auditFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.llm_request_auditFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>
          }
          findFirst: {
            args: Prisma.llm_request_auditFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.llm_request_auditFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>
          }
          findMany: {
            args: Prisma.llm_request_auditFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>[]
          }
          create: {
            args: Prisma.llm_request_auditCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>
          }
          createMany: {
            args: Prisma.llm_request_auditCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.llm_request_auditCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>[]
          }
          delete: {
            args: Prisma.llm_request_auditDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>
          }
          update: {
            args: Prisma.llm_request_auditUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>
          }
          deleteMany: {
            args: Prisma.llm_request_auditDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.llm_request_auditUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.llm_request_auditUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>[]
          }
          upsert: {
            args: Prisma.llm_request_auditUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_request_auditPayload>
          }
          aggregate: {
            args: Prisma.Llm_request_auditAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLlm_request_audit>
          }
          groupBy: {
            args: Prisma.llm_request_auditGroupByArgs<ExtArgs>
            result: $Utils.Optional<Llm_request_auditGroupByOutputType>[]
          }
          count: {
            args: Prisma.llm_request_auditCountArgs<ExtArgs>
            result: $Utils.Optional<Llm_request_auditCountAggregateOutputType> | number
          }
        }
      }
      llm_response_audit: {
        payload: Prisma.$llm_response_auditPayload<ExtArgs>
        fields: Prisma.llm_response_auditFieldRefs
        operations: {
          findUnique: {
            args: Prisma.llm_response_auditFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.llm_response_auditFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>
          }
          findFirst: {
            args: Prisma.llm_response_auditFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.llm_response_auditFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>
          }
          findMany: {
            args: Prisma.llm_response_auditFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>[]
          }
          create: {
            args: Prisma.llm_response_auditCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>
          }
          createMany: {
            args: Prisma.llm_response_auditCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.llm_response_auditCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>[]
          }
          delete: {
            args: Prisma.llm_response_auditDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>
          }
          update: {
            args: Prisma.llm_response_auditUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>
          }
          deleteMany: {
            args: Prisma.llm_response_auditDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.llm_response_auditUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.llm_response_auditUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>[]
          }
          upsert: {
            args: Prisma.llm_response_auditUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$llm_response_auditPayload>
          }
          aggregate: {
            args: Prisma.Llm_response_auditAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLlm_response_audit>
          }
          groupBy: {
            args: Prisma.llm_response_auditGroupByArgs<ExtArgs>
            result: $Utils.Optional<Llm_response_auditGroupByOutputType>[]
          }
          count: {
            args: Prisma.llm_response_auditCountArgs<ExtArgs>
            result: $Utils.Optional<Llm_response_auditCountAggregateOutputType> | number
          }
        }
      }
      models: {
        payload: Prisma.$modelsPayload<ExtArgs>
        fields: Prisma.modelsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.modelsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.modelsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>
          }
          findFirst: {
            args: Prisma.modelsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.modelsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>
          }
          findMany: {
            args: Prisma.modelsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>[]
          }
          create: {
            args: Prisma.modelsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>
          }
          createMany: {
            args: Prisma.modelsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.modelsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>[]
          }
          delete: {
            args: Prisma.modelsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>
          }
          update: {
            args: Prisma.modelsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>
          }
          deleteMany: {
            args: Prisma.modelsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.modelsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.modelsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>[]
          }
          upsert: {
            args: Prisma.modelsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$modelsPayload>
          }
          aggregate: {
            args: Prisma.ModelsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModels>
          }
          groupBy: {
            args: Prisma.modelsGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelsGroupByOutputType>[]
          }
          count: {
            args: Prisma.modelsCountArgs<ExtArgs>
            result: $Utils.Optional<ModelsCountAggregateOutputType> | number
          }
        }
      }
      Prompt: {
        payload: Prisma.$PromptPayload<ExtArgs>
        fields: Prisma.PromptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PromptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PromptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>
          }
          findFirst: {
            args: Prisma.PromptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PromptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>
          }
          findMany: {
            args: Prisma.PromptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>[]
          }
          create: {
            args: Prisma.PromptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>
          }
          createMany: {
            args: Prisma.PromptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PromptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>[]
          }
          delete: {
            args: Prisma.PromptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>
          }
          update: {
            args: Prisma.PromptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>
          }
          deleteMany: {
            args: Prisma.PromptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PromptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PromptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>[]
          }
          upsert: {
            args: Prisma.PromptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromptPayload>
          }
          aggregate: {
            args: Prisma.PromptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePrompt>
          }
          groupBy: {
            args: Prisma.PromptGroupByArgs<ExtArgs>
            result: $Utils.Optional<PromptGroupByOutputType>[]
          }
          count: {
            args: Prisma.PromptCountArgs<ExtArgs>
            result: $Utils.Optional<PromptCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    llm_request_audit?: llm_request_auditOmit
    llm_response_audit?: llm_response_auditOmit
    models?: modelsOmit
    prompt?: PromptOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model llm_request_audit
   */

  export type AggregateLlm_request_audit = {
    _count: Llm_request_auditCountAggregateOutputType | null
    _avg: Llm_request_auditAvgAggregateOutputType | null
    _sum: Llm_request_auditSumAggregateOutputType | null
    _min: Llm_request_auditMinAggregateOutputType | null
    _max: Llm_request_auditMaxAggregateOutputType | null
  }

  export type Llm_request_auditAvgAggregateOutputType = {
    id: number | null
  }

  export type Llm_request_auditSumAggregateOutputType = {
    id: number | null
  }

  export type Llm_request_auditMinAggregateOutputType = {
    id: number | null
    request_id: string | null
    request_type: string | null
    model: string | null
    prompt: string | null
    source_id: string | null
    user_id: string | null
    timestamp: Date | null
  }

  export type Llm_request_auditMaxAggregateOutputType = {
    id: number | null
    request_id: string | null
    request_type: string | null
    model: string | null
    prompt: string | null
    source_id: string | null
    user_id: string | null
    timestamp: Date | null
  }

  export type Llm_request_auditCountAggregateOutputType = {
    id: number
    request_id: number
    request_type: number
    model: number
    prompt: number
    options: number
    source_id: number
    user_id: number
    timestamp: number
    metadata: number
    _all: number
  }


  export type Llm_request_auditAvgAggregateInputType = {
    id?: true
  }

  export type Llm_request_auditSumAggregateInputType = {
    id?: true
  }

  export type Llm_request_auditMinAggregateInputType = {
    id?: true
    request_id?: true
    request_type?: true
    model?: true
    prompt?: true
    source_id?: true
    user_id?: true
    timestamp?: true
  }

  export type Llm_request_auditMaxAggregateInputType = {
    id?: true
    request_id?: true
    request_type?: true
    model?: true
    prompt?: true
    source_id?: true
    user_id?: true
    timestamp?: true
  }

  export type Llm_request_auditCountAggregateInputType = {
    id?: true
    request_id?: true
    request_type?: true
    model?: true
    prompt?: true
    options?: true
    source_id?: true
    user_id?: true
    timestamp?: true
    metadata?: true
    _all?: true
  }

  export type Llm_request_auditAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which llm_request_audit to aggregate.
     */
    where?: llm_request_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_request_audits to fetch.
     */
    orderBy?: llm_request_auditOrderByWithRelationInput | llm_request_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: llm_request_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_request_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_request_audits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned llm_request_audits
    **/
    _count?: true | Llm_request_auditCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Llm_request_auditAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Llm_request_auditSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Llm_request_auditMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Llm_request_auditMaxAggregateInputType
  }

  export type GetLlm_request_auditAggregateType<T extends Llm_request_auditAggregateArgs> = {
        [P in keyof T & keyof AggregateLlm_request_audit]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLlm_request_audit[P]>
      : GetScalarType<T[P], AggregateLlm_request_audit[P]>
  }




  export type llm_request_auditGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: llm_request_auditWhereInput
    orderBy?: llm_request_auditOrderByWithAggregationInput | llm_request_auditOrderByWithAggregationInput[]
    by: Llm_request_auditScalarFieldEnum[] | Llm_request_auditScalarFieldEnum
    having?: llm_request_auditScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Llm_request_auditCountAggregateInputType | true
    _avg?: Llm_request_auditAvgAggregateInputType
    _sum?: Llm_request_auditSumAggregateInputType
    _min?: Llm_request_auditMinAggregateInputType
    _max?: Llm_request_auditMaxAggregateInputType
  }

  export type Llm_request_auditGroupByOutputType = {
    id: number
    request_id: string
    request_type: string
    model: string
    prompt: string | null
    options: JsonValue | null
    source_id: string | null
    user_id: string | null
    timestamp: Date
    metadata: JsonValue | null
    _count: Llm_request_auditCountAggregateOutputType | null
    _avg: Llm_request_auditAvgAggregateOutputType | null
    _sum: Llm_request_auditSumAggregateOutputType | null
    _min: Llm_request_auditMinAggregateOutputType | null
    _max: Llm_request_auditMaxAggregateOutputType | null
  }

  type GetLlm_request_auditGroupByPayload<T extends llm_request_auditGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Llm_request_auditGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Llm_request_auditGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Llm_request_auditGroupByOutputType[P]>
            : GetScalarType<T[P], Llm_request_auditGroupByOutputType[P]>
        }
      >
    >


  export type llm_request_auditSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    request_id?: boolean
    request_type?: boolean
    model?: boolean
    prompt?: boolean
    options?: boolean
    source_id?: boolean
    user_id?: boolean
    timestamp?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["llm_request_audit"]>

  export type llm_request_auditSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    request_id?: boolean
    request_type?: boolean
    model?: boolean
    prompt?: boolean
    options?: boolean
    source_id?: boolean
    user_id?: boolean
    timestamp?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["llm_request_audit"]>

  export type llm_request_auditSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    request_id?: boolean
    request_type?: boolean
    model?: boolean
    prompt?: boolean
    options?: boolean
    source_id?: boolean
    user_id?: boolean
    timestamp?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["llm_request_audit"]>

  export type llm_request_auditSelectScalar = {
    id?: boolean
    request_id?: boolean
    request_type?: boolean
    model?: boolean
    prompt?: boolean
    options?: boolean
    source_id?: boolean
    user_id?: boolean
    timestamp?: boolean
    metadata?: boolean
  }

  export type llm_request_auditOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "request_id" | "request_type" | "model" | "prompt" | "options" | "source_id" | "user_id" | "timestamp" | "metadata", ExtArgs["result"]["llm_request_audit"]>

  export type $llm_request_auditPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "llm_request_audit"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      request_id: string
      request_type: string
      model: string
      prompt: string | null
      options: Prisma.JsonValue | null
      source_id: string | null
      user_id: string | null
      timestamp: Date
      metadata: Prisma.JsonValue | null
    }, ExtArgs["result"]["llm_request_audit"]>
    composites: {}
  }

  type llm_request_auditGetPayload<S extends boolean | null | undefined | llm_request_auditDefaultArgs> = $Result.GetResult<Prisma.$llm_request_auditPayload, S>

  type llm_request_auditCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<llm_request_auditFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Llm_request_auditCountAggregateInputType | true
    }

  export interface llm_request_auditDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['llm_request_audit'], meta: { name: 'llm_request_audit' } }
    /**
     * Find zero or one Llm_request_audit that matches the filter.
     * @param {llm_request_auditFindUniqueArgs} args - Arguments to find a Llm_request_audit
     * @example
     * // Get one Llm_request_audit
     * const llm_request_audit = await prisma.llm_request_audit.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends llm_request_auditFindUniqueArgs>(args: SelectSubset<T, llm_request_auditFindUniqueArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Llm_request_audit that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {llm_request_auditFindUniqueOrThrowArgs} args - Arguments to find a Llm_request_audit
     * @example
     * // Get one Llm_request_audit
     * const llm_request_audit = await prisma.llm_request_audit.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends llm_request_auditFindUniqueOrThrowArgs>(args: SelectSubset<T, llm_request_auditFindUniqueOrThrowArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Llm_request_audit that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_request_auditFindFirstArgs} args - Arguments to find a Llm_request_audit
     * @example
     * // Get one Llm_request_audit
     * const llm_request_audit = await prisma.llm_request_audit.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends llm_request_auditFindFirstArgs>(args?: SelectSubset<T, llm_request_auditFindFirstArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Llm_request_audit that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_request_auditFindFirstOrThrowArgs} args - Arguments to find a Llm_request_audit
     * @example
     * // Get one Llm_request_audit
     * const llm_request_audit = await prisma.llm_request_audit.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends llm_request_auditFindFirstOrThrowArgs>(args?: SelectSubset<T, llm_request_auditFindFirstOrThrowArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Llm_request_audits that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_request_auditFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Llm_request_audits
     * const llm_request_audits = await prisma.llm_request_audit.findMany()
     * 
     * // Get first 10 Llm_request_audits
     * const llm_request_audits = await prisma.llm_request_audit.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const llm_request_auditWithIdOnly = await prisma.llm_request_audit.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends llm_request_auditFindManyArgs>(args?: SelectSubset<T, llm_request_auditFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Llm_request_audit.
     * @param {llm_request_auditCreateArgs} args - Arguments to create a Llm_request_audit.
     * @example
     * // Create one Llm_request_audit
     * const Llm_request_audit = await prisma.llm_request_audit.create({
     *   data: {
     *     // ... data to create a Llm_request_audit
     *   }
     * })
     * 
     */
    create<T extends llm_request_auditCreateArgs>(args: SelectSubset<T, llm_request_auditCreateArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Llm_request_audits.
     * @param {llm_request_auditCreateManyArgs} args - Arguments to create many Llm_request_audits.
     * @example
     * // Create many Llm_request_audits
     * const llm_request_audit = await prisma.llm_request_audit.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends llm_request_auditCreateManyArgs>(args?: SelectSubset<T, llm_request_auditCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Llm_request_audits and returns the data saved in the database.
     * @param {llm_request_auditCreateManyAndReturnArgs} args - Arguments to create many Llm_request_audits.
     * @example
     * // Create many Llm_request_audits
     * const llm_request_audit = await prisma.llm_request_audit.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Llm_request_audits and only return the `id`
     * const llm_request_auditWithIdOnly = await prisma.llm_request_audit.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends llm_request_auditCreateManyAndReturnArgs>(args?: SelectSubset<T, llm_request_auditCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Llm_request_audit.
     * @param {llm_request_auditDeleteArgs} args - Arguments to delete one Llm_request_audit.
     * @example
     * // Delete one Llm_request_audit
     * const Llm_request_audit = await prisma.llm_request_audit.delete({
     *   where: {
     *     // ... filter to delete one Llm_request_audit
     *   }
     * })
     * 
     */
    delete<T extends llm_request_auditDeleteArgs>(args: SelectSubset<T, llm_request_auditDeleteArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Llm_request_audit.
     * @param {llm_request_auditUpdateArgs} args - Arguments to update one Llm_request_audit.
     * @example
     * // Update one Llm_request_audit
     * const llm_request_audit = await prisma.llm_request_audit.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends llm_request_auditUpdateArgs>(args: SelectSubset<T, llm_request_auditUpdateArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Llm_request_audits.
     * @param {llm_request_auditDeleteManyArgs} args - Arguments to filter Llm_request_audits to delete.
     * @example
     * // Delete a few Llm_request_audits
     * const { count } = await prisma.llm_request_audit.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends llm_request_auditDeleteManyArgs>(args?: SelectSubset<T, llm_request_auditDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Llm_request_audits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_request_auditUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Llm_request_audits
     * const llm_request_audit = await prisma.llm_request_audit.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends llm_request_auditUpdateManyArgs>(args: SelectSubset<T, llm_request_auditUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Llm_request_audits and returns the data updated in the database.
     * @param {llm_request_auditUpdateManyAndReturnArgs} args - Arguments to update many Llm_request_audits.
     * @example
     * // Update many Llm_request_audits
     * const llm_request_audit = await prisma.llm_request_audit.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Llm_request_audits and only return the `id`
     * const llm_request_auditWithIdOnly = await prisma.llm_request_audit.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends llm_request_auditUpdateManyAndReturnArgs>(args: SelectSubset<T, llm_request_auditUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Llm_request_audit.
     * @param {llm_request_auditUpsertArgs} args - Arguments to update or create a Llm_request_audit.
     * @example
     * // Update or create a Llm_request_audit
     * const llm_request_audit = await prisma.llm_request_audit.upsert({
     *   create: {
     *     // ... data to create a Llm_request_audit
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Llm_request_audit we want to update
     *   }
     * })
     */
    upsert<T extends llm_request_auditUpsertArgs>(args: SelectSubset<T, llm_request_auditUpsertArgs<ExtArgs>>): Prisma__llm_request_auditClient<$Result.GetResult<Prisma.$llm_request_auditPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Llm_request_audits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_request_auditCountArgs} args - Arguments to filter Llm_request_audits to count.
     * @example
     * // Count the number of Llm_request_audits
     * const count = await prisma.llm_request_audit.count({
     *   where: {
     *     // ... the filter for the Llm_request_audits we want to count
     *   }
     * })
    **/
    count<T extends llm_request_auditCountArgs>(
      args?: Subset<T, llm_request_auditCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Llm_request_auditCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Llm_request_audit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Llm_request_auditAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Llm_request_auditAggregateArgs>(args: Subset<T, Llm_request_auditAggregateArgs>): Prisma.PrismaPromise<GetLlm_request_auditAggregateType<T>>

    /**
     * Group by Llm_request_audit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_request_auditGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends llm_request_auditGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: llm_request_auditGroupByArgs['orderBy'] }
        : { orderBy?: llm_request_auditGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, llm_request_auditGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLlm_request_auditGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the llm_request_audit model
   */
  readonly fields: llm_request_auditFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for llm_request_audit.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__llm_request_auditClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the llm_request_audit model
   */
  interface llm_request_auditFieldRefs {
    readonly id: FieldRef<"llm_request_audit", 'Int'>
    readonly request_id: FieldRef<"llm_request_audit", 'String'>
    readonly request_type: FieldRef<"llm_request_audit", 'String'>
    readonly model: FieldRef<"llm_request_audit", 'String'>
    readonly prompt: FieldRef<"llm_request_audit", 'String'>
    readonly options: FieldRef<"llm_request_audit", 'Json'>
    readonly source_id: FieldRef<"llm_request_audit", 'String'>
    readonly user_id: FieldRef<"llm_request_audit", 'String'>
    readonly timestamp: FieldRef<"llm_request_audit", 'DateTime'>
    readonly metadata: FieldRef<"llm_request_audit", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * llm_request_audit findUnique
   */
  export type llm_request_auditFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_request_audit to fetch.
     */
    where: llm_request_auditWhereUniqueInput
  }

  /**
   * llm_request_audit findUniqueOrThrow
   */
  export type llm_request_auditFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_request_audit to fetch.
     */
    where: llm_request_auditWhereUniqueInput
  }

  /**
   * llm_request_audit findFirst
   */
  export type llm_request_auditFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_request_audit to fetch.
     */
    where?: llm_request_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_request_audits to fetch.
     */
    orderBy?: llm_request_auditOrderByWithRelationInput | llm_request_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for llm_request_audits.
     */
    cursor?: llm_request_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_request_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_request_audits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of llm_request_audits.
     */
    distinct?: Llm_request_auditScalarFieldEnum | Llm_request_auditScalarFieldEnum[]
  }

  /**
   * llm_request_audit findFirstOrThrow
   */
  export type llm_request_auditFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_request_audit to fetch.
     */
    where?: llm_request_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_request_audits to fetch.
     */
    orderBy?: llm_request_auditOrderByWithRelationInput | llm_request_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for llm_request_audits.
     */
    cursor?: llm_request_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_request_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_request_audits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of llm_request_audits.
     */
    distinct?: Llm_request_auditScalarFieldEnum | Llm_request_auditScalarFieldEnum[]
  }

  /**
   * llm_request_audit findMany
   */
  export type llm_request_auditFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_request_audits to fetch.
     */
    where?: llm_request_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_request_audits to fetch.
     */
    orderBy?: llm_request_auditOrderByWithRelationInput | llm_request_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing llm_request_audits.
     */
    cursor?: llm_request_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_request_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_request_audits.
     */
    skip?: number
    distinct?: Llm_request_auditScalarFieldEnum | Llm_request_auditScalarFieldEnum[]
  }

  /**
   * llm_request_audit create
   */
  export type llm_request_auditCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * The data needed to create a llm_request_audit.
     */
    data: XOR<llm_request_auditCreateInput, llm_request_auditUncheckedCreateInput>
  }

  /**
   * llm_request_audit createMany
   */
  export type llm_request_auditCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many llm_request_audits.
     */
    data: llm_request_auditCreateManyInput | llm_request_auditCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * llm_request_audit createManyAndReturn
   */
  export type llm_request_auditCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * The data used to create many llm_request_audits.
     */
    data: llm_request_auditCreateManyInput | llm_request_auditCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * llm_request_audit update
   */
  export type llm_request_auditUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * The data needed to update a llm_request_audit.
     */
    data: XOR<llm_request_auditUpdateInput, llm_request_auditUncheckedUpdateInput>
    /**
     * Choose, which llm_request_audit to update.
     */
    where: llm_request_auditWhereUniqueInput
  }

  /**
   * llm_request_audit updateMany
   */
  export type llm_request_auditUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update llm_request_audits.
     */
    data: XOR<llm_request_auditUpdateManyMutationInput, llm_request_auditUncheckedUpdateManyInput>
    /**
     * Filter which llm_request_audits to update
     */
    where?: llm_request_auditWhereInput
    /**
     * Limit how many llm_request_audits to update.
     */
    limit?: number
  }

  /**
   * llm_request_audit updateManyAndReturn
   */
  export type llm_request_auditUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * The data used to update llm_request_audits.
     */
    data: XOR<llm_request_auditUpdateManyMutationInput, llm_request_auditUncheckedUpdateManyInput>
    /**
     * Filter which llm_request_audits to update
     */
    where?: llm_request_auditWhereInput
    /**
     * Limit how many llm_request_audits to update.
     */
    limit?: number
  }

  /**
   * llm_request_audit upsert
   */
  export type llm_request_auditUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * The filter to search for the llm_request_audit to update in case it exists.
     */
    where: llm_request_auditWhereUniqueInput
    /**
     * In case the llm_request_audit found by the `where` argument doesn't exist, create a new llm_request_audit with this data.
     */
    create: XOR<llm_request_auditCreateInput, llm_request_auditUncheckedCreateInput>
    /**
     * In case the llm_request_audit was found with the provided `where` argument, update it with this data.
     */
    update: XOR<llm_request_auditUpdateInput, llm_request_auditUncheckedUpdateInput>
  }

  /**
   * llm_request_audit delete
   */
  export type llm_request_auditDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
    /**
     * Filter which llm_request_audit to delete.
     */
    where: llm_request_auditWhereUniqueInput
  }

  /**
   * llm_request_audit deleteMany
   */
  export type llm_request_auditDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which llm_request_audits to delete
     */
    where?: llm_request_auditWhereInput
    /**
     * Limit how many llm_request_audits to delete.
     */
    limit?: number
  }

  /**
   * llm_request_audit without action
   */
  export type llm_request_auditDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_request_audit
     */
    select?: llm_request_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_request_audit
     */
    omit?: llm_request_auditOmit<ExtArgs> | null
  }


  /**
   * Model llm_response_audit
   */

  export type AggregateLlm_response_audit = {
    _count: Llm_response_auditCountAggregateOutputType | null
    _avg: Llm_response_auditAvgAggregateOutputType | null
    _sum: Llm_response_auditSumAggregateOutputType | null
    _min: Llm_response_auditMinAggregateOutputType | null
    _max: Llm_response_auditMaxAggregateOutputType | null
  }

  export type Llm_response_auditAvgAggregateOutputType = {
    id: number | null
    total_tokens: number | null
    processing_time: number | null
    tokens_per_second: number | null
  }

  export type Llm_response_auditSumAggregateOutputType = {
    id: number | null
    total_tokens: number | null
    processing_time: number | null
    tokens_per_second: number | null
  }

  export type Llm_response_auditMinAggregateOutputType = {
    id: number | null
    request_id: string | null
    response_type: string | null
    token: string | null
    model: string | null
    worker_id: string | null
    timestamp: Date | null
    is_final: boolean | null
    total_tokens: number | null
    processing_time: number | null
    tokens_per_second: number | null
  }

  export type Llm_response_auditMaxAggregateOutputType = {
    id: number | null
    request_id: string | null
    response_type: string | null
    token: string | null
    model: string | null
    worker_id: string | null
    timestamp: Date | null
    is_final: boolean | null
    total_tokens: number | null
    processing_time: number | null
    tokens_per_second: number | null
  }

  export type Llm_response_auditCountAggregateOutputType = {
    id: number
    request_id: number
    response_type: number
    token: number
    model: number
    worker_id: number
    timestamp: number
    is_final: number
    total_tokens: number
    processing_time: number
    tokens_per_second: number
    metadata: number
    _all: number
  }


  export type Llm_response_auditAvgAggregateInputType = {
    id?: true
    total_tokens?: true
    processing_time?: true
    tokens_per_second?: true
  }

  export type Llm_response_auditSumAggregateInputType = {
    id?: true
    total_tokens?: true
    processing_time?: true
    tokens_per_second?: true
  }

  export type Llm_response_auditMinAggregateInputType = {
    id?: true
    request_id?: true
    response_type?: true
    token?: true
    model?: true
    worker_id?: true
    timestamp?: true
    is_final?: true
    total_tokens?: true
    processing_time?: true
    tokens_per_second?: true
  }

  export type Llm_response_auditMaxAggregateInputType = {
    id?: true
    request_id?: true
    response_type?: true
    token?: true
    model?: true
    worker_id?: true
    timestamp?: true
    is_final?: true
    total_tokens?: true
    processing_time?: true
    tokens_per_second?: true
  }

  export type Llm_response_auditCountAggregateInputType = {
    id?: true
    request_id?: true
    response_type?: true
    token?: true
    model?: true
    worker_id?: true
    timestamp?: true
    is_final?: true
    total_tokens?: true
    processing_time?: true
    tokens_per_second?: true
    metadata?: true
    _all?: true
  }

  export type Llm_response_auditAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which llm_response_audit to aggregate.
     */
    where?: llm_response_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_response_audits to fetch.
     */
    orderBy?: llm_response_auditOrderByWithRelationInput | llm_response_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: llm_response_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_response_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_response_audits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned llm_response_audits
    **/
    _count?: true | Llm_response_auditCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Llm_response_auditAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Llm_response_auditSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Llm_response_auditMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Llm_response_auditMaxAggregateInputType
  }

  export type GetLlm_response_auditAggregateType<T extends Llm_response_auditAggregateArgs> = {
        [P in keyof T & keyof AggregateLlm_response_audit]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLlm_response_audit[P]>
      : GetScalarType<T[P], AggregateLlm_response_audit[P]>
  }




  export type llm_response_auditGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: llm_response_auditWhereInput
    orderBy?: llm_response_auditOrderByWithAggregationInput | llm_response_auditOrderByWithAggregationInput[]
    by: Llm_response_auditScalarFieldEnum[] | Llm_response_auditScalarFieldEnum
    having?: llm_response_auditScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Llm_response_auditCountAggregateInputType | true
    _avg?: Llm_response_auditAvgAggregateInputType
    _sum?: Llm_response_auditSumAggregateInputType
    _min?: Llm_response_auditMinAggregateInputType
    _max?: Llm_response_auditMaxAggregateInputType
  }

  export type Llm_response_auditGroupByOutputType = {
    id: number
    request_id: string
    response_type: string
    token: string | null
    model: string | null
    worker_id: string | null
    timestamp: Date
    is_final: boolean | null
    total_tokens: number | null
    processing_time: number | null
    tokens_per_second: number | null
    metadata: JsonValue | null
    _count: Llm_response_auditCountAggregateOutputType | null
    _avg: Llm_response_auditAvgAggregateOutputType | null
    _sum: Llm_response_auditSumAggregateOutputType | null
    _min: Llm_response_auditMinAggregateOutputType | null
    _max: Llm_response_auditMaxAggregateOutputType | null
  }

  type GetLlm_response_auditGroupByPayload<T extends llm_response_auditGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Llm_response_auditGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Llm_response_auditGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Llm_response_auditGroupByOutputType[P]>
            : GetScalarType<T[P], Llm_response_auditGroupByOutputType[P]>
        }
      >
    >


  export type llm_response_auditSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    request_id?: boolean
    response_type?: boolean
    token?: boolean
    model?: boolean
    worker_id?: boolean
    timestamp?: boolean
    is_final?: boolean
    total_tokens?: boolean
    processing_time?: boolean
    tokens_per_second?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["llm_response_audit"]>

  export type llm_response_auditSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    request_id?: boolean
    response_type?: boolean
    token?: boolean
    model?: boolean
    worker_id?: boolean
    timestamp?: boolean
    is_final?: boolean
    total_tokens?: boolean
    processing_time?: boolean
    tokens_per_second?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["llm_response_audit"]>

  export type llm_response_auditSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    request_id?: boolean
    response_type?: boolean
    token?: boolean
    model?: boolean
    worker_id?: boolean
    timestamp?: boolean
    is_final?: boolean
    total_tokens?: boolean
    processing_time?: boolean
    tokens_per_second?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["llm_response_audit"]>

  export type llm_response_auditSelectScalar = {
    id?: boolean
    request_id?: boolean
    response_type?: boolean
    token?: boolean
    model?: boolean
    worker_id?: boolean
    timestamp?: boolean
    is_final?: boolean
    total_tokens?: boolean
    processing_time?: boolean
    tokens_per_second?: boolean
    metadata?: boolean
  }

  export type llm_response_auditOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "request_id" | "response_type" | "token" | "model" | "worker_id" | "timestamp" | "is_final" | "total_tokens" | "processing_time" | "tokens_per_second" | "metadata", ExtArgs["result"]["llm_response_audit"]>

  export type $llm_response_auditPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "llm_response_audit"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      request_id: string
      response_type: string
      token: string | null
      model: string | null
      worker_id: string | null
      timestamp: Date
      is_final: boolean | null
      total_tokens: number | null
      processing_time: number | null
      tokens_per_second: number | null
      metadata: Prisma.JsonValue | null
    }, ExtArgs["result"]["llm_response_audit"]>
    composites: {}
  }

  type llm_response_auditGetPayload<S extends boolean | null | undefined | llm_response_auditDefaultArgs> = $Result.GetResult<Prisma.$llm_response_auditPayload, S>

  type llm_response_auditCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<llm_response_auditFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Llm_response_auditCountAggregateInputType | true
    }

  export interface llm_response_auditDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['llm_response_audit'], meta: { name: 'llm_response_audit' } }
    /**
     * Find zero or one Llm_response_audit that matches the filter.
     * @param {llm_response_auditFindUniqueArgs} args - Arguments to find a Llm_response_audit
     * @example
     * // Get one Llm_response_audit
     * const llm_response_audit = await prisma.llm_response_audit.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends llm_response_auditFindUniqueArgs>(args: SelectSubset<T, llm_response_auditFindUniqueArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Llm_response_audit that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {llm_response_auditFindUniqueOrThrowArgs} args - Arguments to find a Llm_response_audit
     * @example
     * // Get one Llm_response_audit
     * const llm_response_audit = await prisma.llm_response_audit.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends llm_response_auditFindUniqueOrThrowArgs>(args: SelectSubset<T, llm_response_auditFindUniqueOrThrowArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Llm_response_audit that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_response_auditFindFirstArgs} args - Arguments to find a Llm_response_audit
     * @example
     * // Get one Llm_response_audit
     * const llm_response_audit = await prisma.llm_response_audit.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends llm_response_auditFindFirstArgs>(args?: SelectSubset<T, llm_response_auditFindFirstArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Llm_response_audit that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_response_auditFindFirstOrThrowArgs} args - Arguments to find a Llm_response_audit
     * @example
     * // Get one Llm_response_audit
     * const llm_response_audit = await prisma.llm_response_audit.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends llm_response_auditFindFirstOrThrowArgs>(args?: SelectSubset<T, llm_response_auditFindFirstOrThrowArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Llm_response_audits that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_response_auditFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Llm_response_audits
     * const llm_response_audits = await prisma.llm_response_audit.findMany()
     * 
     * // Get first 10 Llm_response_audits
     * const llm_response_audits = await prisma.llm_response_audit.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const llm_response_auditWithIdOnly = await prisma.llm_response_audit.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends llm_response_auditFindManyArgs>(args?: SelectSubset<T, llm_response_auditFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Llm_response_audit.
     * @param {llm_response_auditCreateArgs} args - Arguments to create a Llm_response_audit.
     * @example
     * // Create one Llm_response_audit
     * const Llm_response_audit = await prisma.llm_response_audit.create({
     *   data: {
     *     // ... data to create a Llm_response_audit
     *   }
     * })
     * 
     */
    create<T extends llm_response_auditCreateArgs>(args: SelectSubset<T, llm_response_auditCreateArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Llm_response_audits.
     * @param {llm_response_auditCreateManyArgs} args - Arguments to create many Llm_response_audits.
     * @example
     * // Create many Llm_response_audits
     * const llm_response_audit = await prisma.llm_response_audit.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends llm_response_auditCreateManyArgs>(args?: SelectSubset<T, llm_response_auditCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Llm_response_audits and returns the data saved in the database.
     * @param {llm_response_auditCreateManyAndReturnArgs} args - Arguments to create many Llm_response_audits.
     * @example
     * // Create many Llm_response_audits
     * const llm_response_audit = await prisma.llm_response_audit.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Llm_response_audits and only return the `id`
     * const llm_response_auditWithIdOnly = await prisma.llm_response_audit.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends llm_response_auditCreateManyAndReturnArgs>(args?: SelectSubset<T, llm_response_auditCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Llm_response_audit.
     * @param {llm_response_auditDeleteArgs} args - Arguments to delete one Llm_response_audit.
     * @example
     * // Delete one Llm_response_audit
     * const Llm_response_audit = await prisma.llm_response_audit.delete({
     *   where: {
     *     // ... filter to delete one Llm_response_audit
     *   }
     * })
     * 
     */
    delete<T extends llm_response_auditDeleteArgs>(args: SelectSubset<T, llm_response_auditDeleteArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Llm_response_audit.
     * @param {llm_response_auditUpdateArgs} args - Arguments to update one Llm_response_audit.
     * @example
     * // Update one Llm_response_audit
     * const llm_response_audit = await prisma.llm_response_audit.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends llm_response_auditUpdateArgs>(args: SelectSubset<T, llm_response_auditUpdateArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Llm_response_audits.
     * @param {llm_response_auditDeleteManyArgs} args - Arguments to filter Llm_response_audits to delete.
     * @example
     * // Delete a few Llm_response_audits
     * const { count } = await prisma.llm_response_audit.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends llm_response_auditDeleteManyArgs>(args?: SelectSubset<T, llm_response_auditDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Llm_response_audits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_response_auditUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Llm_response_audits
     * const llm_response_audit = await prisma.llm_response_audit.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends llm_response_auditUpdateManyArgs>(args: SelectSubset<T, llm_response_auditUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Llm_response_audits and returns the data updated in the database.
     * @param {llm_response_auditUpdateManyAndReturnArgs} args - Arguments to update many Llm_response_audits.
     * @example
     * // Update many Llm_response_audits
     * const llm_response_audit = await prisma.llm_response_audit.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Llm_response_audits and only return the `id`
     * const llm_response_auditWithIdOnly = await prisma.llm_response_audit.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends llm_response_auditUpdateManyAndReturnArgs>(args: SelectSubset<T, llm_response_auditUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Llm_response_audit.
     * @param {llm_response_auditUpsertArgs} args - Arguments to update or create a Llm_response_audit.
     * @example
     * // Update or create a Llm_response_audit
     * const llm_response_audit = await prisma.llm_response_audit.upsert({
     *   create: {
     *     // ... data to create a Llm_response_audit
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Llm_response_audit we want to update
     *   }
     * })
     */
    upsert<T extends llm_response_auditUpsertArgs>(args: SelectSubset<T, llm_response_auditUpsertArgs<ExtArgs>>): Prisma__llm_response_auditClient<$Result.GetResult<Prisma.$llm_response_auditPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Llm_response_audits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_response_auditCountArgs} args - Arguments to filter Llm_response_audits to count.
     * @example
     * // Count the number of Llm_response_audits
     * const count = await prisma.llm_response_audit.count({
     *   where: {
     *     // ... the filter for the Llm_response_audits we want to count
     *   }
     * })
    **/
    count<T extends llm_response_auditCountArgs>(
      args?: Subset<T, llm_response_auditCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Llm_response_auditCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Llm_response_audit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Llm_response_auditAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Llm_response_auditAggregateArgs>(args: Subset<T, Llm_response_auditAggregateArgs>): Prisma.PrismaPromise<GetLlm_response_auditAggregateType<T>>

    /**
     * Group by Llm_response_audit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {llm_response_auditGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends llm_response_auditGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: llm_response_auditGroupByArgs['orderBy'] }
        : { orderBy?: llm_response_auditGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, llm_response_auditGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLlm_response_auditGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the llm_response_audit model
   */
  readonly fields: llm_response_auditFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for llm_response_audit.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__llm_response_auditClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the llm_response_audit model
   */
  interface llm_response_auditFieldRefs {
    readonly id: FieldRef<"llm_response_audit", 'Int'>
    readonly request_id: FieldRef<"llm_response_audit", 'String'>
    readonly response_type: FieldRef<"llm_response_audit", 'String'>
    readonly token: FieldRef<"llm_response_audit", 'String'>
    readonly model: FieldRef<"llm_response_audit", 'String'>
    readonly worker_id: FieldRef<"llm_response_audit", 'String'>
    readonly timestamp: FieldRef<"llm_response_audit", 'DateTime'>
    readonly is_final: FieldRef<"llm_response_audit", 'Boolean'>
    readonly total_tokens: FieldRef<"llm_response_audit", 'Int'>
    readonly processing_time: FieldRef<"llm_response_audit", 'Int'>
    readonly tokens_per_second: FieldRef<"llm_response_audit", 'Float'>
    readonly metadata: FieldRef<"llm_response_audit", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * llm_response_audit findUnique
   */
  export type llm_response_auditFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_response_audit to fetch.
     */
    where: llm_response_auditWhereUniqueInput
  }

  /**
   * llm_response_audit findUniqueOrThrow
   */
  export type llm_response_auditFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_response_audit to fetch.
     */
    where: llm_response_auditWhereUniqueInput
  }

  /**
   * llm_response_audit findFirst
   */
  export type llm_response_auditFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_response_audit to fetch.
     */
    where?: llm_response_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_response_audits to fetch.
     */
    orderBy?: llm_response_auditOrderByWithRelationInput | llm_response_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for llm_response_audits.
     */
    cursor?: llm_response_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_response_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_response_audits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of llm_response_audits.
     */
    distinct?: Llm_response_auditScalarFieldEnum | Llm_response_auditScalarFieldEnum[]
  }

  /**
   * llm_response_audit findFirstOrThrow
   */
  export type llm_response_auditFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_response_audit to fetch.
     */
    where?: llm_response_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_response_audits to fetch.
     */
    orderBy?: llm_response_auditOrderByWithRelationInput | llm_response_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for llm_response_audits.
     */
    cursor?: llm_response_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_response_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_response_audits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of llm_response_audits.
     */
    distinct?: Llm_response_auditScalarFieldEnum | Llm_response_auditScalarFieldEnum[]
  }

  /**
   * llm_response_audit findMany
   */
  export type llm_response_auditFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * Filter, which llm_response_audits to fetch.
     */
    where?: llm_response_auditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of llm_response_audits to fetch.
     */
    orderBy?: llm_response_auditOrderByWithRelationInput | llm_response_auditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing llm_response_audits.
     */
    cursor?: llm_response_auditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` llm_response_audits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` llm_response_audits.
     */
    skip?: number
    distinct?: Llm_response_auditScalarFieldEnum | Llm_response_auditScalarFieldEnum[]
  }

  /**
   * llm_response_audit create
   */
  export type llm_response_auditCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * The data needed to create a llm_response_audit.
     */
    data: XOR<llm_response_auditCreateInput, llm_response_auditUncheckedCreateInput>
  }

  /**
   * llm_response_audit createMany
   */
  export type llm_response_auditCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many llm_response_audits.
     */
    data: llm_response_auditCreateManyInput | llm_response_auditCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * llm_response_audit createManyAndReturn
   */
  export type llm_response_auditCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * The data used to create many llm_response_audits.
     */
    data: llm_response_auditCreateManyInput | llm_response_auditCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * llm_response_audit update
   */
  export type llm_response_auditUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * The data needed to update a llm_response_audit.
     */
    data: XOR<llm_response_auditUpdateInput, llm_response_auditUncheckedUpdateInput>
    /**
     * Choose, which llm_response_audit to update.
     */
    where: llm_response_auditWhereUniqueInput
  }

  /**
   * llm_response_audit updateMany
   */
  export type llm_response_auditUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update llm_response_audits.
     */
    data: XOR<llm_response_auditUpdateManyMutationInput, llm_response_auditUncheckedUpdateManyInput>
    /**
     * Filter which llm_response_audits to update
     */
    where?: llm_response_auditWhereInput
    /**
     * Limit how many llm_response_audits to update.
     */
    limit?: number
  }

  /**
   * llm_response_audit updateManyAndReturn
   */
  export type llm_response_auditUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * The data used to update llm_response_audits.
     */
    data: XOR<llm_response_auditUpdateManyMutationInput, llm_response_auditUncheckedUpdateManyInput>
    /**
     * Filter which llm_response_audits to update
     */
    where?: llm_response_auditWhereInput
    /**
     * Limit how many llm_response_audits to update.
     */
    limit?: number
  }

  /**
   * llm_response_audit upsert
   */
  export type llm_response_auditUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * The filter to search for the llm_response_audit to update in case it exists.
     */
    where: llm_response_auditWhereUniqueInput
    /**
     * In case the llm_response_audit found by the `where` argument doesn't exist, create a new llm_response_audit with this data.
     */
    create: XOR<llm_response_auditCreateInput, llm_response_auditUncheckedCreateInput>
    /**
     * In case the llm_response_audit was found with the provided `where` argument, update it with this data.
     */
    update: XOR<llm_response_auditUpdateInput, llm_response_auditUncheckedUpdateInput>
  }

  /**
   * llm_response_audit delete
   */
  export type llm_response_auditDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
    /**
     * Filter which llm_response_audit to delete.
     */
    where: llm_response_auditWhereUniqueInput
  }

  /**
   * llm_response_audit deleteMany
   */
  export type llm_response_auditDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which llm_response_audits to delete
     */
    where?: llm_response_auditWhereInput
    /**
     * Limit how many llm_response_audits to delete.
     */
    limit?: number
  }

  /**
   * llm_response_audit without action
   */
  export type llm_response_auditDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the llm_response_audit
     */
    select?: llm_response_auditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the llm_response_audit
     */
    omit?: llm_response_auditOmit<ExtArgs> | null
  }


  /**
   * Model models
   */

  export type AggregateModels = {
    _count: ModelsCountAggregateOutputType | null
    _min: ModelsMinAggregateOutputType | null
    _max: ModelsMaxAggregateOutputType | null
  }

  export type ModelsMinAggregateOutputType = {
    id: string | null
    provider: string | null
    name: string | null
    description: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ModelsMaxAggregateOutputType = {
    id: string | null
    provider: string | null
    name: string | null
    description: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type ModelsCountAggregateOutputType = {
    id: number
    provider: number
    name: number
    description: number
    capabilities: number
    parameters: number
    metadata: number
    status: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type ModelsMinAggregateInputType = {
    id?: true
    provider?: true
    name?: true
    description?: true
    created_at?: true
    updated_at?: true
  }

  export type ModelsMaxAggregateInputType = {
    id?: true
    provider?: true
    name?: true
    description?: true
    created_at?: true
    updated_at?: true
  }

  export type ModelsCountAggregateInputType = {
    id?: true
    provider?: true
    name?: true
    description?: true
    capabilities?: true
    parameters?: true
    metadata?: true
    status?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type ModelsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which models to aggregate.
     */
    where?: modelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of models to fetch.
     */
    orderBy?: modelsOrderByWithRelationInput | modelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: modelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned models
    **/
    _count?: true | ModelsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelsMaxAggregateInputType
  }

  export type GetModelsAggregateType<T extends ModelsAggregateArgs> = {
        [P in keyof T & keyof AggregateModels]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModels[P]>
      : GetScalarType<T[P], AggregateModels[P]>
  }




  export type modelsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: modelsWhereInput
    orderBy?: modelsOrderByWithAggregationInput | modelsOrderByWithAggregationInput[]
    by: ModelsScalarFieldEnum[] | ModelsScalarFieldEnum
    having?: modelsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelsCountAggregateInputType | true
    _min?: ModelsMinAggregateInputType
    _max?: ModelsMaxAggregateInputType
  }

  export type ModelsGroupByOutputType = {
    id: string
    provider: string
    name: string
    description: string | null
    capabilities: JsonValue
    parameters: JsonValue
    metadata: JsonValue
    status: JsonValue
    created_at: Date
    updated_at: Date
    _count: ModelsCountAggregateOutputType | null
    _min: ModelsMinAggregateOutputType | null
    _max: ModelsMaxAggregateOutputType | null
  }

  type GetModelsGroupByPayload<T extends modelsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelsGroupByOutputType[P]>
            : GetScalarType<T[P], ModelsGroupByOutputType[P]>
        }
      >
    >


  export type modelsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    name?: boolean
    description?: boolean
    capabilities?: boolean
    parameters?: boolean
    metadata?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["models"]>

  export type modelsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    name?: boolean
    description?: boolean
    capabilities?: boolean
    parameters?: boolean
    metadata?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["models"]>

  export type modelsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    name?: boolean
    description?: boolean
    capabilities?: boolean
    parameters?: boolean
    metadata?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["models"]>

  export type modelsSelectScalar = {
    id?: boolean
    provider?: boolean
    name?: boolean
    description?: boolean
    capabilities?: boolean
    parameters?: boolean
    metadata?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type modelsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "provider" | "name" | "description" | "capabilities" | "parameters" | "metadata" | "status" | "created_at" | "updated_at", ExtArgs["result"]["models"]>

  export type $modelsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "models"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      provider: string
      name: string
      description: string | null
      capabilities: Prisma.JsonValue
      parameters: Prisma.JsonValue
      metadata: Prisma.JsonValue
      status: Prisma.JsonValue
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["models"]>
    composites: {}
  }

  type modelsGetPayload<S extends boolean | null | undefined | modelsDefaultArgs> = $Result.GetResult<Prisma.$modelsPayload, S>

  type modelsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<modelsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelsCountAggregateInputType | true
    }

  export interface modelsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['models'], meta: { name: 'models' } }
    /**
     * Find zero or one Models that matches the filter.
     * @param {modelsFindUniqueArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends modelsFindUniqueArgs>(args: SelectSubset<T, modelsFindUniqueArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Models that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {modelsFindUniqueOrThrowArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends modelsFindUniqueOrThrowArgs>(args: SelectSubset<T, modelsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Models that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {modelsFindFirstArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends modelsFindFirstArgs>(args?: SelectSubset<T, modelsFindFirstArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Models that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {modelsFindFirstOrThrowArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends modelsFindFirstOrThrowArgs>(args?: SelectSubset<T, modelsFindFirstOrThrowArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Models that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {modelsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Models
     * const models = await prisma.models.findMany()
     * 
     * // Get first 10 Models
     * const models = await prisma.models.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelsWithIdOnly = await prisma.models.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends modelsFindManyArgs>(args?: SelectSubset<T, modelsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Models.
     * @param {modelsCreateArgs} args - Arguments to create a Models.
     * @example
     * // Create one Models
     * const Models = await prisma.models.create({
     *   data: {
     *     // ... data to create a Models
     *   }
     * })
     * 
     */
    create<T extends modelsCreateArgs>(args: SelectSubset<T, modelsCreateArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Models.
     * @param {modelsCreateManyArgs} args - Arguments to create many Models.
     * @example
     * // Create many Models
     * const models = await prisma.models.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends modelsCreateManyArgs>(args?: SelectSubset<T, modelsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Models and returns the data saved in the database.
     * @param {modelsCreateManyAndReturnArgs} args - Arguments to create many Models.
     * @example
     * // Create many Models
     * const models = await prisma.models.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Models and only return the `id`
     * const modelsWithIdOnly = await prisma.models.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends modelsCreateManyAndReturnArgs>(args?: SelectSubset<T, modelsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Models.
     * @param {modelsDeleteArgs} args - Arguments to delete one Models.
     * @example
     * // Delete one Models
     * const Models = await prisma.models.delete({
     *   where: {
     *     // ... filter to delete one Models
     *   }
     * })
     * 
     */
    delete<T extends modelsDeleteArgs>(args: SelectSubset<T, modelsDeleteArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Models.
     * @param {modelsUpdateArgs} args - Arguments to update one Models.
     * @example
     * // Update one Models
     * const models = await prisma.models.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends modelsUpdateArgs>(args: SelectSubset<T, modelsUpdateArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Models.
     * @param {modelsDeleteManyArgs} args - Arguments to filter Models to delete.
     * @example
     * // Delete a few Models
     * const { count } = await prisma.models.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends modelsDeleteManyArgs>(args?: SelectSubset<T, modelsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {modelsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Models
     * const models = await prisma.models.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends modelsUpdateManyArgs>(args: SelectSubset<T, modelsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Models and returns the data updated in the database.
     * @param {modelsUpdateManyAndReturnArgs} args - Arguments to update many Models.
     * @example
     * // Update many Models
     * const models = await prisma.models.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Models and only return the `id`
     * const modelsWithIdOnly = await prisma.models.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends modelsUpdateManyAndReturnArgs>(args: SelectSubset<T, modelsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Models.
     * @param {modelsUpsertArgs} args - Arguments to update or create a Models.
     * @example
     * // Update or create a Models
     * const models = await prisma.models.upsert({
     *   create: {
     *     // ... data to create a Models
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Models we want to update
     *   }
     * })
     */
    upsert<T extends modelsUpsertArgs>(args: SelectSubset<T, modelsUpsertArgs<ExtArgs>>): Prisma__modelsClient<$Result.GetResult<Prisma.$modelsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {modelsCountArgs} args - Arguments to filter Models to count.
     * @example
     * // Count the number of Models
     * const count = await prisma.models.count({
     *   where: {
     *     // ... the filter for the Models we want to count
     *   }
     * })
    **/
    count<T extends modelsCountArgs>(
      args?: Subset<T, modelsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelsAggregateArgs>(args: Subset<T, ModelsAggregateArgs>): Prisma.PrismaPromise<GetModelsAggregateType<T>>

    /**
     * Group by Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {modelsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends modelsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: modelsGroupByArgs['orderBy'] }
        : { orderBy?: modelsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, modelsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the models model
   */
  readonly fields: modelsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for models.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__modelsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the models model
   */
  interface modelsFieldRefs {
    readonly id: FieldRef<"models", 'String'>
    readonly provider: FieldRef<"models", 'String'>
    readonly name: FieldRef<"models", 'String'>
    readonly description: FieldRef<"models", 'String'>
    readonly capabilities: FieldRef<"models", 'Json'>
    readonly parameters: FieldRef<"models", 'Json'>
    readonly metadata: FieldRef<"models", 'Json'>
    readonly status: FieldRef<"models", 'Json'>
    readonly created_at: FieldRef<"models", 'DateTime'>
    readonly updated_at: FieldRef<"models", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * models findUnique
   */
  export type modelsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * Filter, which models to fetch.
     */
    where: modelsWhereUniqueInput
  }

  /**
   * models findUniqueOrThrow
   */
  export type modelsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * Filter, which models to fetch.
     */
    where: modelsWhereUniqueInput
  }

  /**
   * models findFirst
   */
  export type modelsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * Filter, which models to fetch.
     */
    where?: modelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of models to fetch.
     */
    orderBy?: modelsOrderByWithRelationInput | modelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for models.
     */
    cursor?: modelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of models.
     */
    distinct?: ModelsScalarFieldEnum | ModelsScalarFieldEnum[]
  }

  /**
   * models findFirstOrThrow
   */
  export type modelsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * Filter, which models to fetch.
     */
    where?: modelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of models to fetch.
     */
    orderBy?: modelsOrderByWithRelationInput | modelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for models.
     */
    cursor?: modelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of models.
     */
    distinct?: ModelsScalarFieldEnum | ModelsScalarFieldEnum[]
  }

  /**
   * models findMany
   */
  export type modelsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * Filter, which models to fetch.
     */
    where?: modelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of models to fetch.
     */
    orderBy?: modelsOrderByWithRelationInput | modelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing models.
     */
    cursor?: modelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` models.
     */
    skip?: number
    distinct?: ModelsScalarFieldEnum | ModelsScalarFieldEnum[]
  }

  /**
   * models create
   */
  export type modelsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * The data needed to create a models.
     */
    data: XOR<modelsCreateInput, modelsUncheckedCreateInput>
  }

  /**
   * models createMany
   */
  export type modelsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many models.
     */
    data: modelsCreateManyInput | modelsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * models createManyAndReturn
   */
  export type modelsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * The data used to create many models.
     */
    data: modelsCreateManyInput | modelsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * models update
   */
  export type modelsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * The data needed to update a models.
     */
    data: XOR<modelsUpdateInput, modelsUncheckedUpdateInput>
    /**
     * Choose, which models to update.
     */
    where: modelsWhereUniqueInput
  }

  /**
   * models updateMany
   */
  export type modelsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update models.
     */
    data: XOR<modelsUpdateManyMutationInput, modelsUncheckedUpdateManyInput>
    /**
     * Filter which models to update
     */
    where?: modelsWhereInput
    /**
     * Limit how many models to update.
     */
    limit?: number
  }

  /**
   * models updateManyAndReturn
   */
  export type modelsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * The data used to update models.
     */
    data: XOR<modelsUpdateManyMutationInput, modelsUncheckedUpdateManyInput>
    /**
     * Filter which models to update
     */
    where?: modelsWhereInput
    /**
     * Limit how many models to update.
     */
    limit?: number
  }

  /**
   * models upsert
   */
  export type modelsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * The filter to search for the models to update in case it exists.
     */
    where: modelsWhereUniqueInput
    /**
     * In case the models found by the `where` argument doesn't exist, create a new models with this data.
     */
    create: XOR<modelsCreateInput, modelsUncheckedCreateInput>
    /**
     * In case the models was found with the provided `where` argument, update it with this data.
     */
    update: XOR<modelsUpdateInput, modelsUncheckedUpdateInput>
  }

  /**
   * models delete
   */
  export type modelsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
    /**
     * Filter which models to delete.
     */
    where: modelsWhereUniqueInput
  }

  /**
   * models deleteMany
   */
  export type modelsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which models to delete
     */
    where?: modelsWhereInput
    /**
     * Limit how many models to delete.
     */
    limit?: number
  }

  /**
   * models without action
   */
  export type modelsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the models
     */
    select?: modelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the models
     */
    omit?: modelsOmit<ExtArgs> | null
  }


  /**
   * Model Prompt
   */

  export type AggregatePrompt = {
    _count: PromptCountAggregateOutputType | null
    _avg: PromptAvgAggregateOutputType | null
    _sum: PromptSumAggregateOutputType | null
    _min: PromptMinAggregateOutputType | null
    _max: PromptMaxAggregateOutputType | null
  }

  export type PromptAvgAggregateOutputType = {
    temperature: number | null
    topP: number | null
    topK: number | null
    maxTokens: number | null
    presencePenalty: number | null
    frequencyPenalty: number | null
  }

  export type PromptSumAggregateOutputType = {
    temperature: number | null
    topP: number | null
    topK: number | null
    maxTokens: number | null
    presencePenalty: number | null
    frequencyPenalty: number | null
  }

  export type PromptMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    provider: string | null
    promptType: string | null
    systemPrompt: string | null
    userPrompt: string | null
    temperature: number | null
    topP: number | null
    topK: number | null
    maxTokens: number | null
    presencePenalty: number | null
    frequencyPenalty: number | null
    model: string | null
    anthropicVersion: string | null
    version: string | null
    isActive: boolean | null
    createdBy: string | null
    updatedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PromptMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    provider: string | null
    promptType: string | null
    systemPrompt: string | null
    userPrompt: string | null
    temperature: number | null
    topP: number | null
    topK: number | null
    maxTokens: number | null
    presencePenalty: number | null
    frequencyPenalty: number | null
    model: string | null
    anthropicVersion: string | null
    version: string | null
    isActive: boolean | null
    createdBy: string | null
    updatedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PromptCountAggregateOutputType = {
    id: number
    name: number
    description: number
    provider: number
    promptType: number
    systemPrompt: number
    userPrompt: number
    parameters: number
    temperature: number
    topP: number
    topK: number
    maxTokens: number
    presencePenalty: number
    frequencyPenalty: number
    stopSequences: number
    model: number
    anthropicVersion: number
    safetySettings: number
    grokSettings: number
    tags: number
    version: number
    isActive: number
    createdBy: number
    updatedBy: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PromptAvgAggregateInputType = {
    temperature?: true
    topP?: true
    topK?: true
    maxTokens?: true
    presencePenalty?: true
    frequencyPenalty?: true
  }

  export type PromptSumAggregateInputType = {
    temperature?: true
    topP?: true
    topK?: true
    maxTokens?: true
    presencePenalty?: true
    frequencyPenalty?: true
  }

  export type PromptMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    provider?: true
    promptType?: true
    systemPrompt?: true
    userPrompt?: true
    temperature?: true
    topP?: true
    topK?: true
    maxTokens?: true
    presencePenalty?: true
    frequencyPenalty?: true
    model?: true
    anthropicVersion?: true
    version?: true
    isActive?: true
    createdBy?: true
    updatedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PromptMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    provider?: true
    promptType?: true
    systemPrompt?: true
    userPrompt?: true
    temperature?: true
    topP?: true
    topK?: true
    maxTokens?: true
    presencePenalty?: true
    frequencyPenalty?: true
    model?: true
    anthropicVersion?: true
    version?: true
    isActive?: true
    createdBy?: true
    updatedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PromptCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    provider?: true
    promptType?: true
    systemPrompt?: true
    userPrompt?: true
    parameters?: true
    temperature?: true
    topP?: true
    topK?: true
    maxTokens?: true
    presencePenalty?: true
    frequencyPenalty?: true
    stopSequences?: true
    model?: true
    anthropicVersion?: true
    safetySettings?: true
    grokSettings?: true
    tags?: true
    version?: true
    isActive?: true
    createdBy?: true
    updatedBy?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PromptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Prompt to aggregate.
     */
    where?: PromptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Prompts to fetch.
     */
    orderBy?: PromptOrderByWithRelationInput | PromptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PromptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Prompts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Prompts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Prompts
    **/
    _count?: true | PromptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PromptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PromptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PromptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PromptMaxAggregateInputType
  }

  export type GetPromptAggregateType<T extends PromptAggregateArgs> = {
        [P in keyof T & keyof AggregatePrompt]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePrompt[P]>
      : GetScalarType<T[P], AggregatePrompt[P]>
  }




  export type PromptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PromptWhereInput
    orderBy?: PromptOrderByWithAggregationInput | PromptOrderByWithAggregationInput[]
    by: PromptScalarFieldEnum[] | PromptScalarFieldEnum
    having?: PromptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PromptCountAggregateInputType | true
    _avg?: PromptAvgAggregateInputType
    _sum?: PromptSumAggregateInputType
    _min?: PromptMinAggregateInputType
    _max?: PromptMaxAggregateInputType
  }

  export type PromptGroupByOutputType = {
    id: string
    name: string
    description: string | null
    provider: string
    promptType: string
    systemPrompt: string | null
    userPrompt: string
    parameters: JsonValue
    temperature: number | null
    topP: number | null
    topK: number | null
    maxTokens: number | null
    presencePenalty: number | null
    frequencyPenalty: number | null
    stopSequences: string[]
    model: string | null
    anthropicVersion: string | null
    safetySettings: JsonValue | null
    grokSettings: JsonValue | null
    tags: string[]
    version: string
    isActive: boolean
    createdBy: string | null
    updatedBy: string | null
    createdAt: Date
    updatedAt: Date
    _count: PromptCountAggregateOutputType | null
    _avg: PromptAvgAggregateOutputType | null
    _sum: PromptSumAggregateOutputType | null
    _min: PromptMinAggregateOutputType | null
    _max: PromptMaxAggregateOutputType | null
  }

  type GetPromptGroupByPayload<T extends PromptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PromptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PromptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PromptGroupByOutputType[P]>
            : GetScalarType<T[P], PromptGroupByOutputType[P]>
        }
      >
    >


  export type PromptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    provider?: boolean
    promptType?: boolean
    systemPrompt?: boolean
    userPrompt?: boolean
    parameters?: boolean
    temperature?: boolean
    topP?: boolean
    topK?: boolean
    maxTokens?: boolean
    presencePenalty?: boolean
    frequencyPenalty?: boolean
    stopSequences?: boolean
    model?: boolean
    anthropicVersion?: boolean
    safetySettings?: boolean
    grokSettings?: boolean
    tags?: boolean
    version?: boolean
    isActive?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["prompt"]>

  export type PromptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    provider?: boolean
    promptType?: boolean
    systemPrompt?: boolean
    userPrompt?: boolean
    parameters?: boolean
    temperature?: boolean
    topP?: boolean
    topK?: boolean
    maxTokens?: boolean
    presencePenalty?: boolean
    frequencyPenalty?: boolean
    stopSequences?: boolean
    model?: boolean
    anthropicVersion?: boolean
    safetySettings?: boolean
    grokSettings?: boolean
    tags?: boolean
    version?: boolean
    isActive?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["prompt"]>

  export type PromptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    provider?: boolean
    promptType?: boolean
    systemPrompt?: boolean
    userPrompt?: boolean
    parameters?: boolean
    temperature?: boolean
    topP?: boolean
    topK?: boolean
    maxTokens?: boolean
    presencePenalty?: boolean
    frequencyPenalty?: boolean
    stopSequences?: boolean
    model?: boolean
    anthropicVersion?: boolean
    safetySettings?: boolean
    grokSettings?: boolean
    tags?: boolean
    version?: boolean
    isActive?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["prompt"]>

  export type PromptSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    provider?: boolean
    promptType?: boolean
    systemPrompt?: boolean
    userPrompt?: boolean
    parameters?: boolean
    temperature?: boolean
    topP?: boolean
    topK?: boolean
    maxTokens?: boolean
    presencePenalty?: boolean
    frequencyPenalty?: boolean
    stopSequences?: boolean
    model?: boolean
    anthropicVersion?: boolean
    safetySettings?: boolean
    grokSettings?: boolean
    tags?: boolean
    version?: boolean
    isActive?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PromptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "provider" | "promptType" | "systemPrompt" | "userPrompt" | "parameters" | "temperature" | "topP" | "topK" | "maxTokens" | "presencePenalty" | "frequencyPenalty" | "stopSequences" | "model" | "anthropicVersion" | "safetySettings" | "grokSettings" | "tags" | "version" | "isActive" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt", ExtArgs["result"]["prompt"]>

  export type $PromptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Prompt"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      provider: string
      promptType: string
      systemPrompt: string | null
      userPrompt: string
      parameters: Prisma.JsonValue
      temperature: number | null
      topP: number | null
      topK: number | null
      maxTokens: number | null
      presencePenalty: number | null
      frequencyPenalty: number | null
      stopSequences: string[]
      model: string | null
      anthropicVersion: string | null
      safetySettings: Prisma.JsonValue | null
      grokSettings: Prisma.JsonValue | null
      tags: string[]
      version: string
      isActive: boolean
      createdBy: string | null
      updatedBy: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["prompt"]>
    composites: {}
  }

  type PromptGetPayload<S extends boolean | null | undefined | PromptDefaultArgs> = $Result.GetResult<Prisma.$PromptPayload, S>

  type PromptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PromptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PromptCountAggregateInputType | true
    }

  export interface PromptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Prompt'], meta: { name: 'Prompt' } }
    /**
     * Find zero or one Prompt that matches the filter.
     * @param {PromptFindUniqueArgs} args - Arguments to find a Prompt
     * @example
     * // Get one Prompt
     * const prompt = await prisma.prompt.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PromptFindUniqueArgs>(args: SelectSubset<T, PromptFindUniqueArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Prompt that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PromptFindUniqueOrThrowArgs} args - Arguments to find a Prompt
     * @example
     * // Get one Prompt
     * const prompt = await prisma.prompt.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PromptFindUniqueOrThrowArgs>(args: SelectSubset<T, PromptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Prompt that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptFindFirstArgs} args - Arguments to find a Prompt
     * @example
     * // Get one Prompt
     * const prompt = await prisma.prompt.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PromptFindFirstArgs>(args?: SelectSubset<T, PromptFindFirstArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Prompt that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptFindFirstOrThrowArgs} args - Arguments to find a Prompt
     * @example
     * // Get one Prompt
     * const prompt = await prisma.prompt.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PromptFindFirstOrThrowArgs>(args?: SelectSubset<T, PromptFindFirstOrThrowArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Prompts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Prompts
     * const prompts = await prisma.prompt.findMany()
     * 
     * // Get first 10 Prompts
     * const prompts = await prisma.prompt.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const promptWithIdOnly = await prisma.prompt.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PromptFindManyArgs>(args?: SelectSubset<T, PromptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Prompt.
     * @param {PromptCreateArgs} args - Arguments to create a Prompt.
     * @example
     * // Create one Prompt
     * const Prompt = await prisma.prompt.create({
     *   data: {
     *     // ... data to create a Prompt
     *   }
     * })
     * 
     */
    create<T extends PromptCreateArgs>(args: SelectSubset<T, PromptCreateArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Prompts.
     * @param {PromptCreateManyArgs} args - Arguments to create many Prompts.
     * @example
     * // Create many Prompts
     * const prompt = await prisma.prompt.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PromptCreateManyArgs>(args?: SelectSubset<T, PromptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Prompts and returns the data saved in the database.
     * @param {PromptCreateManyAndReturnArgs} args - Arguments to create many Prompts.
     * @example
     * // Create many Prompts
     * const prompt = await prisma.prompt.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Prompts and only return the `id`
     * const promptWithIdOnly = await prisma.prompt.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PromptCreateManyAndReturnArgs>(args?: SelectSubset<T, PromptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Prompt.
     * @param {PromptDeleteArgs} args - Arguments to delete one Prompt.
     * @example
     * // Delete one Prompt
     * const Prompt = await prisma.prompt.delete({
     *   where: {
     *     // ... filter to delete one Prompt
     *   }
     * })
     * 
     */
    delete<T extends PromptDeleteArgs>(args: SelectSubset<T, PromptDeleteArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Prompt.
     * @param {PromptUpdateArgs} args - Arguments to update one Prompt.
     * @example
     * // Update one Prompt
     * const prompt = await prisma.prompt.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PromptUpdateArgs>(args: SelectSubset<T, PromptUpdateArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Prompts.
     * @param {PromptDeleteManyArgs} args - Arguments to filter Prompts to delete.
     * @example
     * // Delete a few Prompts
     * const { count } = await prisma.prompt.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PromptDeleteManyArgs>(args?: SelectSubset<T, PromptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Prompts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Prompts
     * const prompt = await prisma.prompt.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PromptUpdateManyArgs>(args: SelectSubset<T, PromptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Prompts and returns the data updated in the database.
     * @param {PromptUpdateManyAndReturnArgs} args - Arguments to update many Prompts.
     * @example
     * // Update many Prompts
     * const prompt = await prisma.prompt.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Prompts and only return the `id`
     * const promptWithIdOnly = await prisma.prompt.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PromptUpdateManyAndReturnArgs>(args: SelectSubset<T, PromptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Prompt.
     * @param {PromptUpsertArgs} args - Arguments to update or create a Prompt.
     * @example
     * // Update or create a Prompt
     * const prompt = await prisma.prompt.upsert({
     *   create: {
     *     // ... data to create a Prompt
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Prompt we want to update
     *   }
     * })
     */
    upsert<T extends PromptUpsertArgs>(args: SelectSubset<T, PromptUpsertArgs<ExtArgs>>): Prisma__PromptClient<$Result.GetResult<Prisma.$PromptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Prompts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptCountArgs} args - Arguments to filter Prompts to count.
     * @example
     * // Count the number of Prompts
     * const count = await prisma.prompt.count({
     *   where: {
     *     // ... the filter for the Prompts we want to count
     *   }
     * })
    **/
    count<T extends PromptCountArgs>(
      args?: Subset<T, PromptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PromptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Prompt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PromptAggregateArgs>(args: Subset<T, PromptAggregateArgs>): Prisma.PrismaPromise<GetPromptAggregateType<T>>

    /**
     * Group by Prompt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PromptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PromptGroupByArgs['orderBy'] }
        : { orderBy?: PromptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PromptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPromptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Prompt model
   */
  readonly fields: PromptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Prompt.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PromptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Prompt model
   */
  interface PromptFieldRefs {
    readonly id: FieldRef<"Prompt", 'String'>
    readonly name: FieldRef<"Prompt", 'String'>
    readonly description: FieldRef<"Prompt", 'String'>
    readonly provider: FieldRef<"Prompt", 'String'>
    readonly promptType: FieldRef<"Prompt", 'String'>
    readonly systemPrompt: FieldRef<"Prompt", 'String'>
    readonly userPrompt: FieldRef<"Prompt", 'String'>
    readonly parameters: FieldRef<"Prompt", 'Json'>
    readonly temperature: FieldRef<"Prompt", 'Float'>
    readonly topP: FieldRef<"Prompt", 'Float'>
    readonly topK: FieldRef<"Prompt", 'Int'>
    readonly maxTokens: FieldRef<"Prompt", 'Int'>
    readonly presencePenalty: FieldRef<"Prompt", 'Float'>
    readonly frequencyPenalty: FieldRef<"Prompt", 'Float'>
    readonly stopSequences: FieldRef<"Prompt", 'String[]'>
    readonly model: FieldRef<"Prompt", 'String'>
    readonly anthropicVersion: FieldRef<"Prompt", 'String'>
    readonly safetySettings: FieldRef<"Prompt", 'Json'>
    readonly grokSettings: FieldRef<"Prompt", 'Json'>
    readonly tags: FieldRef<"Prompt", 'String[]'>
    readonly version: FieldRef<"Prompt", 'String'>
    readonly isActive: FieldRef<"Prompt", 'Boolean'>
    readonly createdBy: FieldRef<"Prompt", 'String'>
    readonly updatedBy: FieldRef<"Prompt", 'String'>
    readonly createdAt: FieldRef<"Prompt", 'DateTime'>
    readonly updatedAt: FieldRef<"Prompt", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Prompt findUnique
   */
  export type PromptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * Filter, which Prompt to fetch.
     */
    where: PromptWhereUniqueInput
  }

  /**
   * Prompt findUniqueOrThrow
   */
  export type PromptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * Filter, which Prompt to fetch.
     */
    where: PromptWhereUniqueInput
  }

  /**
   * Prompt findFirst
   */
  export type PromptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * Filter, which Prompt to fetch.
     */
    where?: PromptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Prompts to fetch.
     */
    orderBy?: PromptOrderByWithRelationInput | PromptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Prompts.
     */
    cursor?: PromptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Prompts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Prompts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Prompts.
     */
    distinct?: PromptScalarFieldEnum | PromptScalarFieldEnum[]
  }

  /**
   * Prompt findFirstOrThrow
   */
  export type PromptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * Filter, which Prompt to fetch.
     */
    where?: PromptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Prompts to fetch.
     */
    orderBy?: PromptOrderByWithRelationInput | PromptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Prompts.
     */
    cursor?: PromptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Prompts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Prompts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Prompts.
     */
    distinct?: PromptScalarFieldEnum | PromptScalarFieldEnum[]
  }

  /**
   * Prompt findMany
   */
  export type PromptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * Filter, which Prompts to fetch.
     */
    where?: PromptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Prompts to fetch.
     */
    orderBy?: PromptOrderByWithRelationInput | PromptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Prompts.
     */
    cursor?: PromptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Prompts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Prompts.
     */
    skip?: number
    distinct?: PromptScalarFieldEnum | PromptScalarFieldEnum[]
  }

  /**
   * Prompt create
   */
  export type PromptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * The data needed to create a Prompt.
     */
    data: XOR<PromptCreateInput, PromptUncheckedCreateInput>
  }

  /**
   * Prompt createMany
   */
  export type PromptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Prompts.
     */
    data: PromptCreateManyInput | PromptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Prompt createManyAndReturn
   */
  export type PromptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * The data used to create many Prompts.
     */
    data: PromptCreateManyInput | PromptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Prompt update
   */
  export type PromptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * The data needed to update a Prompt.
     */
    data: XOR<PromptUpdateInput, PromptUncheckedUpdateInput>
    /**
     * Choose, which Prompt to update.
     */
    where: PromptWhereUniqueInput
  }

  /**
   * Prompt updateMany
   */
  export type PromptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Prompts.
     */
    data: XOR<PromptUpdateManyMutationInput, PromptUncheckedUpdateManyInput>
    /**
     * Filter which Prompts to update
     */
    where?: PromptWhereInput
    /**
     * Limit how many Prompts to update.
     */
    limit?: number
  }

  /**
   * Prompt updateManyAndReturn
   */
  export type PromptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * The data used to update Prompts.
     */
    data: XOR<PromptUpdateManyMutationInput, PromptUncheckedUpdateManyInput>
    /**
     * Filter which Prompts to update
     */
    where?: PromptWhereInput
    /**
     * Limit how many Prompts to update.
     */
    limit?: number
  }

  /**
   * Prompt upsert
   */
  export type PromptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * The filter to search for the Prompt to update in case it exists.
     */
    where: PromptWhereUniqueInput
    /**
     * In case the Prompt found by the `where` argument doesn't exist, create a new Prompt with this data.
     */
    create: XOR<PromptCreateInput, PromptUncheckedCreateInput>
    /**
     * In case the Prompt was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PromptUpdateInput, PromptUncheckedUpdateInput>
  }

  /**
   * Prompt delete
   */
  export type PromptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
    /**
     * Filter which Prompt to delete.
     */
    where: PromptWhereUniqueInput
  }

  /**
   * Prompt deleteMany
   */
  export type PromptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Prompts to delete
     */
    where?: PromptWhereInput
    /**
     * Limit how many Prompts to delete.
     */
    limit?: number
  }

  /**
   * Prompt without action
   */
  export type PromptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Prompt
     */
    select?: PromptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Prompt
     */
    omit?: PromptOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const Llm_request_auditScalarFieldEnum: {
    id: 'id',
    request_id: 'request_id',
    request_type: 'request_type',
    model: 'model',
    prompt: 'prompt',
    options: 'options',
    source_id: 'source_id',
    user_id: 'user_id',
    timestamp: 'timestamp',
    metadata: 'metadata'
  };

  export type Llm_request_auditScalarFieldEnum = (typeof Llm_request_auditScalarFieldEnum)[keyof typeof Llm_request_auditScalarFieldEnum]


  export const Llm_response_auditScalarFieldEnum: {
    id: 'id',
    request_id: 'request_id',
    response_type: 'response_type',
    token: 'token',
    model: 'model',
    worker_id: 'worker_id',
    timestamp: 'timestamp',
    is_final: 'is_final',
    total_tokens: 'total_tokens',
    processing_time: 'processing_time',
    tokens_per_second: 'tokens_per_second',
    metadata: 'metadata'
  };

  export type Llm_response_auditScalarFieldEnum = (typeof Llm_response_auditScalarFieldEnum)[keyof typeof Llm_response_auditScalarFieldEnum]


  export const ModelsScalarFieldEnum: {
    id: 'id',
    provider: 'provider',
    name: 'name',
    description: 'description',
    capabilities: 'capabilities',
    parameters: 'parameters',
    metadata: 'metadata',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type ModelsScalarFieldEnum = (typeof ModelsScalarFieldEnum)[keyof typeof ModelsScalarFieldEnum]


  export const PromptScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    provider: 'provider',
    promptType: 'promptType',
    systemPrompt: 'systemPrompt',
    userPrompt: 'userPrompt',
    parameters: 'parameters',
    temperature: 'temperature',
    topP: 'topP',
    topK: 'topK',
    maxTokens: 'maxTokens',
    presencePenalty: 'presencePenalty',
    frequencyPenalty: 'frequencyPenalty',
    stopSequences: 'stopSequences',
    model: 'model',
    anthropicVersion: 'anthropicVersion',
    safetySettings: 'safetySettings',
    grokSettings: 'grokSettings',
    tags: 'tags',
    version: 'version',
    isActive: 'isActive',
    createdBy: 'createdBy',
    updatedBy: 'updatedBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PromptScalarFieldEnum = (typeof PromptScalarFieldEnum)[keyof typeof PromptScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type llm_request_auditWhereInput = {
    AND?: llm_request_auditWhereInput | llm_request_auditWhereInput[]
    OR?: llm_request_auditWhereInput[]
    NOT?: llm_request_auditWhereInput | llm_request_auditWhereInput[]
    id?: IntFilter<"llm_request_audit"> | number
    request_id?: StringFilter<"llm_request_audit"> | string
    request_type?: StringFilter<"llm_request_audit"> | string
    model?: StringFilter<"llm_request_audit"> | string
    prompt?: StringNullableFilter<"llm_request_audit"> | string | null
    options?: JsonNullableFilter<"llm_request_audit">
    source_id?: StringNullableFilter<"llm_request_audit"> | string | null
    user_id?: StringNullableFilter<"llm_request_audit"> | string | null
    timestamp?: DateTimeFilter<"llm_request_audit"> | Date | string
    metadata?: JsonNullableFilter<"llm_request_audit">
  }

  export type llm_request_auditOrderByWithRelationInput = {
    id?: SortOrder
    request_id?: SortOrder
    request_type?: SortOrder
    model?: SortOrder
    prompt?: SortOrderInput | SortOrder
    options?: SortOrderInput | SortOrder
    source_id?: SortOrderInput | SortOrder
    user_id?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    metadata?: SortOrderInput | SortOrder
  }

  export type llm_request_auditWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: llm_request_auditWhereInput | llm_request_auditWhereInput[]
    OR?: llm_request_auditWhereInput[]
    NOT?: llm_request_auditWhereInput | llm_request_auditWhereInput[]
    request_id?: StringFilter<"llm_request_audit"> | string
    request_type?: StringFilter<"llm_request_audit"> | string
    model?: StringFilter<"llm_request_audit"> | string
    prompt?: StringNullableFilter<"llm_request_audit"> | string | null
    options?: JsonNullableFilter<"llm_request_audit">
    source_id?: StringNullableFilter<"llm_request_audit"> | string | null
    user_id?: StringNullableFilter<"llm_request_audit"> | string | null
    timestamp?: DateTimeFilter<"llm_request_audit"> | Date | string
    metadata?: JsonNullableFilter<"llm_request_audit">
  }, "id">

  export type llm_request_auditOrderByWithAggregationInput = {
    id?: SortOrder
    request_id?: SortOrder
    request_type?: SortOrder
    model?: SortOrder
    prompt?: SortOrderInput | SortOrder
    options?: SortOrderInput | SortOrder
    source_id?: SortOrderInput | SortOrder
    user_id?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    metadata?: SortOrderInput | SortOrder
    _count?: llm_request_auditCountOrderByAggregateInput
    _avg?: llm_request_auditAvgOrderByAggregateInput
    _max?: llm_request_auditMaxOrderByAggregateInput
    _min?: llm_request_auditMinOrderByAggregateInput
    _sum?: llm_request_auditSumOrderByAggregateInput
  }

  export type llm_request_auditScalarWhereWithAggregatesInput = {
    AND?: llm_request_auditScalarWhereWithAggregatesInput | llm_request_auditScalarWhereWithAggregatesInput[]
    OR?: llm_request_auditScalarWhereWithAggregatesInput[]
    NOT?: llm_request_auditScalarWhereWithAggregatesInput | llm_request_auditScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"llm_request_audit"> | number
    request_id?: StringWithAggregatesFilter<"llm_request_audit"> | string
    request_type?: StringWithAggregatesFilter<"llm_request_audit"> | string
    model?: StringWithAggregatesFilter<"llm_request_audit"> | string
    prompt?: StringNullableWithAggregatesFilter<"llm_request_audit"> | string | null
    options?: JsonNullableWithAggregatesFilter<"llm_request_audit">
    source_id?: StringNullableWithAggregatesFilter<"llm_request_audit"> | string | null
    user_id?: StringNullableWithAggregatesFilter<"llm_request_audit"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"llm_request_audit"> | Date | string
    metadata?: JsonNullableWithAggregatesFilter<"llm_request_audit">
  }

  export type llm_response_auditWhereInput = {
    AND?: llm_response_auditWhereInput | llm_response_auditWhereInput[]
    OR?: llm_response_auditWhereInput[]
    NOT?: llm_response_auditWhereInput | llm_response_auditWhereInput[]
    id?: IntFilter<"llm_response_audit"> | number
    request_id?: StringFilter<"llm_response_audit"> | string
    response_type?: StringFilter<"llm_response_audit"> | string
    token?: StringNullableFilter<"llm_response_audit"> | string | null
    model?: StringNullableFilter<"llm_response_audit"> | string | null
    worker_id?: StringNullableFilter<"llm_response_audit"> | string | null
    timestamp?: DateTimeFilter<"llm_response_audit"> | Date | string
    is_final?: BoolNullableFilter<"llm_response_audit"> | boolean | null
    total_tokens?: IntNullableFilter<"llm_response_audit"> | number | null
    processing_time?: IntNullableFilter<"llm_response_audit"> | number | null
    tokens_per_second?: FloatNullableFilter<"llm_response_audit"> | number | null
    metadata?: JsonNullableFilter<"llm_response_audit">
  }

  export type llm_response_auditOrderByWithRelationInput = {
    id?: SortOrder
    request_id?: SortOrder
    response_type?: SortOrder
    token?: SortOrderInput | SortOrder
    model?: SortOrderInput | SortOrder
    worker_id?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    is_final?: SortOrderInput | SortOrder
    total_tokens?: SortOrderInput | SortOrder
    processing_time?: SortOrderInput | SortOrder
    tokens_per_second?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
  }

  export type llm_response_auditWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: llm_response_auditWhereInput | llm_response_auditWhereInput[]
    OR?: llm_response_auditWhereInput[]
    NOT?: llm_response_auditWhereInput | llm_response_auditWhereInput[]
    request_id?: StringFilter<"llm_response_audit"> | string
    response_type?: StringFilter<"llm_response_audit"> | string
    token?: StringNullableFilter<"llm_response_audit"> | string | null
    model?: StringNullableFilter<"llm_response_audit"> | string | null
    worker_id?: StringNullableFilter<"llm_response_audit"> | string | null
    timestamp?: DateTimeFilter<"llm_response_audit"> | Date | string
    is_final?: BoolNullableFilter<"llm_response_audit"> | boolean | null
    total_tokens?: IntNullableFilter<"llm_response_audit"> | number | null
    processing_time?: IntNullableFilter<"llm_response_audit"> | number | null
    tokens_per_second?: FloatNullableFilter<"llm_response_audit"> | number | null
    metadata?: JsonNullableFilter<"llm_response_audit">
  }, "id">

  export type llm_response_auditOrderByWithAggregationInput = {
    id?: SortOrder
    request_id?: SortOrder
    response_type?: SortOrder
    token?: SortOrderInput | SortOrder
    model?: SortOrderInput | SortOrder
    worker_id?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    is_final?: SortOrderInput | SortOrder
    total_tokens?: SortOrderInput | SortOrder
    processing_time?: SortOrderInput | SortOrder
    tokens_per_second?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    _count?: llm_response_auditCountOrderByAggregateInput
    _avg?: llm_response_auditAvgOrderByAggregateInput
    _max?: llm_response_auditMaxOrderByAggregateInput
    _min?: llm_response_auditMinOrderByAggregateInput
    _sum?: llm_response_auditSumOrderByAggregateInput
  }

  export type llm_response_auditScalarWhereWithAggregatesInput = {
    AND?: llm_response_auditScalarWhereWithAggregatesInput | llm_response_auditScalarWhereWithAggregatesInput[]
    OR?: llm_response_auditScalarWhereWithAggregatesInput[]
    NOT?: llm_response_auditScalarWhereWithAggregatesInput | llm_response_auditScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"llm_response_audit"> | number
    request_id?: StringWithAggregatesFilter<"llm_response_audit"> | string
    response_type?: StringWithAggregatesFilter<"llm_response_audit"> | string
    token?: StringNullableWithAggregatesFilter<"llm_response_audit"> | string | null
    model?: StringNullableWithAggregatesFilter<"llm_response_audit"> | string | null
    worker_id?: StringNullableWithAggregatesFilter<"llm_response_audit"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"llm_response_audit"> | Date | string
    is_final?: BoolNullableWithAggregatesFilter<"llm_response_audit"> | boolean | null
    total_tokens?: IntNullableWithAggregatesFilter<"llm_response_audit"> | number | null
    processing_time?: IntNullableWithAggregatesFilter<"llm_response_audit"> | number | null
    tokens_per_second?: FloatNullableWithAggregatesFilter<"llm_response_audit"> | number | null
    metadata?: JsonNullableWithAggregatesFilter<"llm_response_audit">
  }

  export type modelsWhereInput = {
    AND?: modelsWhereInput | modelsWhereInput[]
    OR?: modelsWhereInput[]
    NOT?: modelsWhereInput | modelsWhereInput[]
    id?: StringFilter<"models"> | string
    provider?: StringFilter<"models"> | string
    name?: StringFilter<"models"> | string
    description?: StringNullableFilter<"models"> | string | null
    capabilities?: JsonFilter<"models">
    parameters?: JsonFilter<"models">
    metadata?: JsonFilter<"models">
    status?: JsonFilter<"models">
    created_at?: DateTimeFilter<"models"> | Date | string
    updated_at?: DateTimeFilter<"models"> | Date | string
  }

  export type modelsOrderByWithRelationInput = {
    id?: SortOrder
    provider?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    capabilities?: SortOrder
    parameters?: SortOrder
    metadata?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type modelsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: modelsWhereInput | modelsWhereInput[]
    OR?: modelsWhereInput[]
    NOT?: modelsWhereInput | modelsWhereInput[]
    provider?: StringFilter<"models"> | string
    name?: StringFilter<"models"> | string
    description?: StringNullableFilter<"models"> | string | null
    capabilities?: JsonFilter<"models">
    parameters?: JsonFilter<"models">
    metadata?: JsonFilter<"models">
    status?: JsonFilter<"models">
    created_at?: DateTimeFilter<"models"> | Date | string
    updated_at?: DateTimeFilter<"models"> | Date | string
  }, "id">

  export type modelsOrderByWithAggregationInput = {
    id?: SortOrder
    provider?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    capabilities?: SortOrder
    parameters?: SortOrder
    metadata?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: modelsCountOrderByAggregateInput
    _max?: modelsMaxOrderByAggregateInput
    _min?: modelsMinOrderByAggregateInput
  }

  export type modelsScalarWhereWithAggregatesInput = {
    AND?: modelsScalarWhereWithAggregatesInput | modelsScalarWhereWithAggregatesInput[]
    OR?: modelsScalarWhereWithAggregatesInput[]
    NOT?: modelsScalarWhereWithAggregatesInput | modelsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"models"> | string
    provider?: StringWithAggregatesFilter<"models"> | string
    name?: StringWithAggregatesFilter<"models"> | string
    description?: StringNullableWithAggregatesFilter<"models"> | string | null
    capabilities?: JsonWithAggregatesFilter<"models">
    parameters?: JsonWithAggregatesFilter<"models">
    metadata?: JsonWithAggregatesFilter<"models">
    status?: JsonWithAggregatesFilter<"models">
    created_at?: DateTimeWithAggregatesFilter<"models"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"models"> | Date | string
  }

  export type PromptWhereInput = {
    AND?: PromptWhereInput | PromptWhereInput[]
    OR?: PromptWhereInput[]
    NOT?: PromptWhereInput | PromptWhereInput[]
    id?: StringFilter<"Prompt"> | string
    name?: StringFilter<"Prompt"> | string
    description?: StringNullableFilter<"Prompt"> | string | null
    provider?: StringFilter<"Prompt"> | string
    promptType?: StringFilter<"Prompt"> | string
    systemPrompt?: StringNullableFilter<"Prompt"> | string | null
    userPrompt?: StringFilter<"Prompt"> | string
    parameters?: JsonFilter<"Prompt">
    temperature?: FloatNullableFilter<"Prompt"> | number | null
    topP?: FloatNullableFilter<"Prompt"> | number | null
    topK?: IntNullableFilter<"Prompt"> | number | null
    maxTokens?: IntNullableFilter<"Prompt"> | number | null
    presencePenalty?: FloatNullableFilter<"Prompt"> | number | null
    frequencyPenalty?: FloatNullableFilter<"Prompt"> | number | null
    stopSequences?: StringNullableListFilter<"Prompt">
    model?: StringNullableFilter<"Prompt"> | string | null
    anthropicVersion?: StringNullableFilter<"Prompt"> | string | null
    safetySettings?: JsonNullableFilter<"Prompt">
    grokSettings?: JsonNullableFilter<"Prompt">
    tags?: StringNullableListFilter<"Prompt">
    version?: StringFilter<"Prompt"> | string
    isActive?: BoolFilter<"Prompt"> | boolean
    createdBy?: StringNullableFilter<"Prompt"> | string | null
    updatedBy?: StringNullableFilter<"Prompt"> | string | null
    createdAt?: DateTimeFilter<"Prompt"> | Date | string
    updatedAt?: DateTimeFilter<"Prompt"> | Date | string
  }

  export type PromptOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    provider?: SortOrder
    promptType?: SortOrder
    systemPrompt?: SortOrderInput | SortOrder
    userPrompt?: SortOrder
    parameters?: SortOrder
    temperature?: SortOrderInput | SortOrder
    topP?: SortOrderInput | SortOrder
    topK?: SortOrderInput | SortOrder
    maxTokens?: SortOrderInput | SortOrder
    presencePenalty?: SortOrderInput | SortOrder
    frequencyPenalty?: SortOrderInput | SortOrder
    stopSequences?: SortOrder
    model?: SortOrderInput | SortOrder
    anthropicVersion?: SortOrderInput | SortOrder
    safetySettings?: SortOrderInput | SortOrder
    grokSettings?: SortOrderInput | SortOrder
    tags?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PromptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PromptWhereInput | PromptWhereInput[]
    OR?: PromptWhereInput[]
    NOT?: PromptWhereInput | PromptWhereInput[]
    name?: StringFilter<"Prompt"> | string
    description?: StringNullableFilter<"Prompt"> | string | null
    provider?: StringFilter<"Prompt"> | string
    promptType?: StringFilter<"Prompt"> | string
    systemPrompt?: StringNullableFilter<"Prompt"> | string | null
    userPrompt?: StringFilter<"Prompt"> | string
    parameters?: JsonFilter<"Prompt">
    temperature?: FloatNullableFilter<"Prompt"> | number | null
    topP?: FloatNullableFilter<"Prompt"> | number | null
    topK?: IntNullableFilter<"Prompt"> | number | null
    maxTokens?: IntNullableFilter<"Prompt"> | number | null
    presencePenalty?: FloatNullableFilter<"Prompt"> | number | null
    frequencyPenalty?: FloatNullableFilter<"Prompt"> | number | null
    stopSequences?: StringNullableListFilter<"Prompt">
    model?: StringNullableFilter<"Prompt"> | string | null
    anthropicVersion?: StringNullableFilter<"Prompt"> | string | null
    safetySettings?: JsonNullableFilter<"Prompt">
    grokSettings?: JsonNullableFilter<"Prompt">
    tags?: StringNullableListFilter<"Prompt">
    version?: StringFilter<"Prompt"> | string
    isActive?: BoolFilter<"Prompt"> | boolean
    createdBy?: StringNullableFilter<"Prompt"> | string | null
    updatedBy?: StringNullableFilter<"Prompt"> | string | null
    createdAt?: DateTimeFilter<"Prompt"> | Date | string
    updatedAt?: DateTimeFilter<"Prompt"> | Date | string
  }, "id">

  export type PromptOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    provider?: SortOrder
    promptType?: SortOrder
    systemPrompt?: SortOrderInput | SortOrder
    userPrompt?: SortOrder
    parameters?: SortOrder
    temperature?: SortOrderInput | SortOrder
    topP?: SortOrderInput | SortOrder
    topK?: SortOrderInput | SortOrder
    maxTokens?: SortOrderInput | SortOrder
    presencePenalty?: SortOrderInput | SortOrder
    frequencyPenalty?: SortOrderInput | SortOrder
    stopSequences?: SortOrder
    model?: SortOrderInput | SortOrder
    anthropicVersion?: SortOrderInput | SortOrder
    safetySettings?: SortOrderInput | SortOrder
    grokSettings?: SortOrderInput | SortOrder
    tags?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PromptCountOrderByAggregateInput
    _avg?: PromptAvgOrderByAggregateInput
    _max?: PromptMaxOrderByAggregateInput
    _min?: PromptMinOrderByAggregateInput
    _sum?: PromptSumOrderByAggregateInput
  }

  export type PromptScalarWhereWithAggregatesInput = {
    AND?: PromptScalarWhereWithAggregatesInput | PromptScalarWhereWithAggregatesInput[]
    OR?: PromptScalarWhereWithAggregatesInput[]
    NOT?: PromptScalarWhereWithAggregatesInput | PromptScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Prompt"> | string
    name?: StringWithAggregatesFilter<"Prompt"> | string
    description?: StringNullableWithAggregatesFilter<"Prompt"> | string | null
    provider?: StringWithAggregatesFilter<"Prompt"> | string
    promptType?: StringWithAggregatesFilter<"Prompt"> | string
    systemPrompt?: StringNullableWithAggregatesFilter<"Prompt"> | string | null
    userPrompt?: StringWithAggregatesFilter<"Prompt"> | string
    parameters?: JsonWithAggregatesFilter<"Prompt">
    temperature?: FloatNullableWithAggregatesFilter<"Prompt"> | number | null
    topP?: FloatNullableWithAggregatesFilter<"Prompt"> | number | null
    topK?: IntNullableWithAggregatesFilter<"Prompt"> | number | null
    maxTokens?: IntNullableWithAggregatesFilter<"Prompt"> | number | null
    presencePenalty?: FloatNullableWithAggregatesFilter<"Prompt"> | number | null
    frequencyPenalty?: FloatNullableWithAggregatesFilter<"Prompt"> | number | null
    stopSequences?: StringNullableListFilter<"Prompt">
    model?: StringNullableWithAggregatesFilter<"Prompt"> | string | null
    anthropicVersion?: StringNullableWithAggregatesFilter<"Prompt"> | string | null
    safetySettings?: JsonNullableWithAggregatesFilter<"Prompt">
    grokSettings?: JsonNullableWithAggregatesFilter<"Prompt">
    tags?: StringNullableListFilter<"Prompt">
    version?: StringWithAggregatesFilter<"Prompt"> | string
    isActive?: BoolWithAggregatesFilter<"Prompt"> | boolean
    createdBy?: StringNullableWithAggregatesFilter<"Prompt"> | string | null
    updatedBy?: StringNullableWithAggregatesFilter<"Prompt"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Prompt"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Prompt"> | Date | string
  }

  export type llm_request_auditCreateInput = {
    request_id: string
    request_type: string
    model: string
    prompt?: string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: string | null
    user_id?: string | null
    timestamp?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_request_auditUncheckedCreateInput = {
    id?: number
    request_id: string
    request_type: string
    model: string
    prompt?: string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: string | null
    user_id?: string | null
    timestamp?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_request_auditUpdateInput = {
    request_id?: StringFieldUpdateOperationsInput | string
    request_type?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    prompt?: NullableStringFieldUpdateOperationsInput | string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_request_auditUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    request_id?: StringFieldUpdateOperationsInput | string
    request_type?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    prompt?: NullableStringFieldUpdateOperationsInput | string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_request_auditCreateManyInput = {
    id?: number
    request_id: string
    request_type: string
    model: string
    prompt?: string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: string | null
    user_id?: string | null
    timestamp?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_request_auditUpdateManyMutationInput = {
    request_id?: StringFieldUpdateOperationsInput | string
    request_type?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    prompt?: NullableStringFieldUpdateOperationsInput | string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_request_auditUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    request_id?: StringFieldUpdateOperationsInput | string
    request_type?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    prompt?: NullableStringFieldUpdateOperationsInput | string | null
    options?: NullableJsonNullValueInput | InputJsonValue
    source_id?: NullableStringFieldUpdateOperationsInput | string | null
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditCreateInput = {
    request_id: string
    response_type: string
    token?: string | null
    model?: string | null
    worker_id?: string | null
    timestamp?: Date | string
    is_final?: boolean | null
    total_tokens?: number | null
    processing_time?: number | null
    tokens_per_second?: number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditUncheckedCreateInput = {
    id?: number
    request_id: string
    response_type: string
    token?: string | null
    model?: string | null
    worker_id?: string | null
    timestamp?: Date | string
    is_final?: boolean | null
    total_tokens?: number | null
    processing_time?: number | null
    tokens_per_second?: number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditUpdateInput = {
    request_id?: StringFieldUpdateOperationsInput | string
    response_type?: StringFieldUpdateOperationsInput | string
    token?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    worker_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    is_final?: NullableBoolFieldUpdateOperationsInput | boolean | null
    total_tokens?: NullableIntFieldUpdateOperationsInput | number | null
    processing_time?: NullableIntFieldUpdateOperationsInput | number | null
    tokens_per_second?: NullableFloatFieldUpdateOperationsInput | number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    request_id?: StringFieldUpdateOperationsInput | string
    response_type?: StringFieldUpdateOperationsInput | string
    token?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    worker_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    is_final?: NullableBoolFieldUpdateOperationsInput | boolean | null
    total_tokens?: NullableIntFieldUpdateOperationsInput | number | null
    processing_time?: NullableIntFieldUpdateOperationsInput | number | null
    tokens_per_second?: NullableFloatFieldUpdateOperationsInput | number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditCreateManyInput = {
    id?: number
    request_id: string
    response_type: string
    token?: string | null
    model?: string | null
    worker_id?: string | null
    timestamp?: Date | string
    is_final?: boolean | null
    total_tokens?: number | null
    processing_time?: number | null
    tokens_per_second?: number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditUpdateManyMutationInput = {
    request_id?: StringFieldUpdateOperationsInput | string
    response_type?: StringFieldUpdateOperationsInput | string
    token?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    worker_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    is_final?: NullableBoolFieldUpdateOperationsInput | boolean | null
    total_tokens?: NullableIntFieldUpdateOperationsInput | number | null
    processing_time?: NullableIntFieldUpdateOperationsInput | number | null
    tokens_per_second?: NullableFloatFieldUpdateOperationsInput | number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type llm_response_auditUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    request_id?: StringFieldUpdateOperationsInput | string
    response_type?: StringFieldUpdateOperationsInput | string
    token?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    worker_id?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    is_final?: NullableBoolFieldUpdateOperationsInput | boolean | null
    total_tokens?: NullableIntFieldUpdateOperationsInput | number | null
    processing_time?: NullableIntFieldUpdateOperationsInput | number | null
    tokens_per_second?: NullableFloatFieldUpdateOperationsInput | number | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type modelsCreateInput = {
    id: string
    provider: string
    name: string
    description?: string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type modelsUncheckedCreateInput = {
    id: string
    provider: string
    name: string
    description?: string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type modelsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type modelsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type modelsCreateManyInput = {
    id: string
    provider: string
    name: string
    description?: string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type modelsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type modelsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    capabilities?: JsonNullValueInput | InputJsonValue
    parameters?: JsonNullValueInput | InputJsonValue
    metadata?: JsonNullValueInput | InputJsonValue
    status?: JsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptCreateInput = {
    id?: string
    name: string
    description?: string | null
    provider: string
    promptType: string
    systemPrompt?: string | null
    userPrompt: string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: number | null
    topP?: number | null
    topK?: number | null
    maxTokens?: number | null
    presencePenalty?: number | null
    frequencyPenalty?: number | null
    stopSequences?: PromptCreatestopSequencesInput | string[]
    model?: string | null
    anthropicVersion?: string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptCreatetagsInput | string[]
    version?: string
    isActive?: boolean
    createdBy?: string | null
    updatedBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PromptUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    provider: string
    promptType: string
    systemPrompt?: string | null
    userPrompt: string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: number | null
    topP?: number | null
    topK?: number | null
    maxTokens?: number | null
    presencePenalty?: number | null
    frequencyPenalty?: number | null
    stopSequences?: PromptCreatestopSequencesInput | string[]
    model?: string | null
    anthropicVersion?: string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptCreatetagsInput | string[]
    version?: string
    isActive?: boolean
    createdBy?: string | null
    updatedBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PromptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    promptType?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    userPrompt?: StringFieldUpdateOperationsInput | string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: NullableFloatFieldUpdateOperationsInput | number | null
    topP?: NullableFloatFieldUpdateOperationsInput | number | null
    topK?: NullableIntFieldUpdateOperationsInput | number | null
    maxTokens?: NullableIntFieldUpdateOperationsInput | number | null
    presencePenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    frequencyPenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    stopSequences?: PromptUpdatestopSequencesInput | string[]
    model?: NullableStringFieldUpdateOperationsInput | string | null
    anthropicVersion?: NullableStringFieldUpdateOperationsInput | string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptUpdatetagsInput | string[]
    version?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    promptType?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    userPrompt?: StringFieldUpdateOperationsInput | string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: NullableFloatFieldUpdateOperationsInput | number | null
    topP?: NullableFloatFieldUpdateOperationsInput | number | null
    topK?: NullableIntFieldUpdateOperationsInput | number | null
    maxTokens?: NullableIntFieldUpdateOperationsInput | number | null
    presencePenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    frequencyPenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    stopSequences?: PromptUpdatestopSequencesInput | string[]
    model?: NullableStringFieldUpdateOperationsInput | string | null
    anthropicVersion?: NullableStringFieldUpdateOperationsInput | string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptUpdatetagsInput | string[]
    version?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    provider: string
    promptType: string
    systemPrompt?: string | null
    userPrompt: string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: number | null
    topP?: number | null
    topK?: number | null
    maxTokens?: number | null
    presencePenalty?: number | null
    frequencyPenalty?: number | null
    stopSequences?: PromptCreatestopSequencesInput | string[]
    model?: string | null
    anthropicVersion?: string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptCreatetagsInput | string[]
    version?: string
    isActive?: boolean
    createdBy?: string | null
    updatedBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PromptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    promptType?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    userPrompt?: StringFieldUpdateOperationsInput | string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: NullableFloatFieldUpdateOperationsInput | number | null
    topP?: NullableFloatFieldUpdateOperationsInput | number | null
    topK?: NullableIntFieldUpdateOperationsInput | number | null
    maxTokens?: NullableIntFieldUpdateOperationsInput | number | null
    presencePenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    frequencyPenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    stopSequences?: PromptUpdatestopSequencesInput | string[]
    model?: NullableStringFieldUpdateOperationsInput | string | null
    anthropicVersion?: NullableStringFieldUpdateOperationsInput | string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptUpdatetagsInput | string[]
    version?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    promptType?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    userPrompt?: StringFieldUpdateOperationsInput | string
    parameters?: JsonNullValueInput | InputJsonValue
    temperature?: NullableFloatFieldUpdateOperationsInput | number | null
    topP?: NullableFloatFieldUpdateOperationsInput | number | null
    topK?: NullableIntFieldUpdateOperationsInput | number | null
    maxTokens?: NullableIntFieldUpdateOperationsInput | number | null
    presencePenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    frequencyPenalty?: NullableFloatFieldUpdateOperationsInput | number | null
    stopSequences?: PromptUpdatestopSequencesInput | string[]
    model?: NullableStringFieldUpdateOperationsInput | string | null
    anthropicVersion?: NullableStringFieldUpdateOperationsInput | string | null
    safetySettings?: NullableJsonNullValueInput | InputJsonValue
    grokSettings?: NullableJsonNullValueInput | InputJsonValue
    tags?: PromptUpdatetagsInput | string[]
    version?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type llm_request_auditCountOrderByAggregateInput = {
    id?: SortOrder
    request_id?: SortOrder
    request_type?: SortOrder
    model?: SortOrder
    prompt?: SortOrder
    options?: SortOrder
    source_id?: SortOrder
    user_id?: SortOrder
    timestamp?: SortOrder
    metadata?: SortOrder
  }

  export type llm_request_auditAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type llm_request_auditMaxOrderByAggregateInput = {
    id?: SortOrder
    request_id?: SortOrder
    request_type?: SortOrder
    model?: SortOrder
    prompt?: SortOrder
    source_id?: SortOrder
    user_id?: SortOrder
    timestamp?: SortOrder
  }

  export type llm_request_auditMinOrderByAggregateInput = {
    id?: SortOrder
    request_id?: SortOrder
    request_type?: SortOrder
    model?: SortOrder
    prompt?: SortOrder
    source_id?: SortOrder
    user_id?: SortOrder
    timestamp?: SortOrder
  }

  export type llm_request_auditSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type llm_response_auditCountOrderByAggregateInput = {
    id?: SortOrder
    request_id?: SortOrder
    response_type?: SortOrder
    token?: SortOrder
    model?: SortOrder
    worker_id?: SortOrder
    timestamp?: SortOrder
    is_final?: SortOrder
    total_tokens?: SortOrder
    processing_time?: SortOrder
    tokens_per_second?: SortOrder
    metadata?: SortOrder
  }

  export type llm_response_auditAvgOrderByAggregateInput = {
    id?: SortOrder
    total_tokens?: SortOrder
    processing_time?: SortOrder
    tokens_per_second?: SortOrder
  }

  export type llm_response_auditMaxOrderByAggregateInput = {
    id?: SortOrder
    request_id?: SortOrder
    response_type?: SortOrder
    token?: SortOrder
    model?: SortOrder
    worker_id?: SortOrder
    timestamp?: SortOrder
    is_final?: SortOrder
    total_tokens?: SortOrder
    processing_time?: SortOrder
    tokens_per_second?: SortOrder
  }

  export type llm_response_auditMinOrderByAggregateInput = {
    id?: SortOrder
    request_id?: SortOrder
    response_type?: SortOrder
    token?: SortOrder
    model?: SortOrder
    worker_id?: SortOrder
    timestamp?: SortOrder
    is_final?: SortOrder
    total_tokens?: SortOrder
    processing_time?: SortOrder
    tokens_per_second?: SortOrder
  }

  export type llm_response_auditSumOrderByAggregateInput = {
    id?: SortOrder
    total_tokens?: SortOrder
    processing_time?: SortOrder
    tokens_per_second?: SortOrder
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type modelsCountOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    name?: SortOrder
    description?: SortOrder
    capabilities?: SortOrder
    parameters?: SortOrder
    metadata?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type modelsMaxOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    name?: SortOrder
    description?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type modelsMinOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    name?: SortOrder
    description?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type PromptCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    provider?: SortOrder
    promptType?: SortOrder
    systemPrompt?: SortOrder
    userPrompt?: SortOrder
    parameters?: SortOrder
    temperature?: SortOrder
    topP?: SortOrder
    topK?: SortOrder
    maxTokens?: SortOrder
    presencePenalty?: SortOrder
    frequencyPenalty?: SortOrder
    stopSequences?: SortOrder
    model?: SortOrder
    anthropicVersion?: SortOrder
    safetySettings?: SortOrder
    grokSettings?: SortOrder
    tags?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PromptAvgOrderByAggregateInput = {
    temperature?: SortOrder
    topP?: SortOrder
    topK?: SortOrder
    maxTokens?: SortOrder
    presencePenalty?: SortOrder
    frequencyPenalty?: SortOrder
  }

  export type PromptMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    provider?: SortOrder
    promptType?: SortOrder
    systemPrompt?: SortOrder
    userPrompt?: SortOrder
    temperature?: SortOrder
    topP?: SortOrder
    topK?: SortOrder
    maxTokens?: SortOrder
    presencePenalty?: SortOrder
    frequencyPenalty?: SortOrder
    model?: SortOrder
    anthropicVersion?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PromptMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    provider?: SortOrder
    promptType?: SortOrder
    systemPrompt?: SortOrder
    userPrompt?: SortOrder
    temperature?: SortOrder
    topP?: SortOrder
    topK?: SortOrder
    maxTokens?: SortOrder
    presencePenalty?: SortOrder
    frequencyPenalty?: SortOrder
    model?: SortOrder
    anthropicVersion?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PromptSumOrderByAggregateInput = {
    temperature?: SortOrder
    topP?: SortOrder
    topK?: SortOrder
    maxTokens?: SortOrder
    presencePenalty?: SortOrder
    frequencyPenalty?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PromptCreatestopSequencesInput = {
    set: string[]
  }

  export type PromptCreatetagsInput = {
    set: string[]
  }

  export type PromptUpdatestopSequencesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type PromptUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}