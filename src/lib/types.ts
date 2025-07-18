import * as t from "@sinclair/typebox";
import * as Value from "@sinclair/typebox/value";
import * as Errors from "@sinclair/typebox/errors";
export { Object, Array, Record, Optional, Literal } from "@sinclair/typebox";

export type Static<T extends t.TSchema> = t.Static<T>;

export const validate = Value.Check;
export const validationErrors = Errors.Errors;

export const unknown = t.Unknown();
export const any = t.Any();
export const string = t.String();
export const number = t.Number();
export const bigint = t.BigInt();
export const boolean = t.Boolean();
export const symbol = t.Symbol();

export const null_ = t.Null();
export const undefined_ = t.Undefined();

export const AnyOf = <Ts extends t.TSchema[]>(...ts: Ts) => t.Union<Ts>(ts);
export const AllOf = <Ts extends t.TSchema[]>(...ts: Ts) => t.Intersect<Ts>(ts);
