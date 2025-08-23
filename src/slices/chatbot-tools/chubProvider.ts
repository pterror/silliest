import type { InjectionKey, Ref } from "vue";

export const chubProviderKey = Symbol("chub provider") as InjectionKey<{
  blurNsfw: Ref<boolean>;
  showCustomCss: Ref<boolean>;
}>;
