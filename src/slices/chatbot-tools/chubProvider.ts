import type { InjectionKey, Ref } from "vue";

export const chubProviderKey = Symbol("chub provider") as InjectionKey<{
  username: Ref<string>;
  avatarUrl: Ref<string>;
  blurNsfw: Ref<boolean>;
  showCustomCss: Ref<boolean>;
}>;
