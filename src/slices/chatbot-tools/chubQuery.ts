import * as chub from "./chub";
import type { MethodNamesOf } from "../../lib/object";
import { queryOptions, type QueryOptions } from "@tanstack/vue-query";
import { toValue, type Ref } from "vue";

export function chubQueryOptions<
  EndpointName extends MethodNamesOf<
    typeof import("./chub"),
    never,
    Promise<any>
  >
>(
  endpointName: EndpointName,
  args:
    | Parameters<(typeof chub)[EndpointName]>
    | Ref<Parameters<(typeof chub)[EndpointName]>>,
  options: Partial<
    QueryOptions<Awaited<ReturnType<(typeof chub)[EndpointName]>>>
  > = {}
) {
  return queryOptions({
    queryKey: [endpointName, args],
    // @ts-expect-error TypeScript cannot infer as the type of `chub[endpointName]` is dynamic,
    // but it is correctly constrained by the type of `args`.
    queryFn: () => chub[endpointName](...toValue(args)),
    ...options,
  });
}
