import * as chub from "./chub";
import type { MethodNamesOf } from "../../lib/object";
import { queryOptions, type QueryOptions } from "@tanstack/vue-query";
import { toValue } from "vue";
import type { MaybeRefs } from "../../lib/vue";

export function chubQueryOptions<
  EndpointName extends MethodNamesOf<
    typeof import("./chub"),
    never,
    Promise<any>
  >
>(
  endpointName: EndpointName,
  args: MaybeRefs<Parameters<(typeof chub)[EndpointName]>>,
  options: Partial<
    QueryOptions<Awaited<ReturnType<(typeof chub)[EndpointName]>>>
  > = {}
) {
  return queryOptions({
    queryKey: [endpointName, args],
    // @ts-expect-error TypeScript cannot infer as the type of `chub[endpointName]` is dynamic,
    // but it is correctly constrained by the type of `args`.
    queryFn: () => chub[endpointName](...args.map((arg) => toValue(arg))),
    ...options,
  });
}
