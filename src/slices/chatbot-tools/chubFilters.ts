import { computed } from "vue";
import { type ChubCard } from "./chub";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";

function getChubFilterValues(card: ChubCard, tag: "NSFW" | "NSFL") {
  const author = computed(() => card.fullPath.replace(/[/][\s\S]+/, ""));

  const isExplicitFiltered = computed(() => card.topics.includes(tag));

  const isShadowFilteredQuery = useQuery(
    chubQueryOptions(
      "chubGetCardsByQuery",
      [
        {
          type: "search",
          params: {
            namespace: card.projectSpace,
            nsfw: tag !== "NSFW",
            nsfl: tag !== "NSFL",
            //topics: card.topics.join(","),
            include_forks: true,
            search: card.name.replace(/[!$^&*()+[\]'"+~/\\-]/g, " "),
            min_tokens: card.nTokens,
            max_tokens: card.nTokens,
            username:
              author.value.toLowerCase() !== "anonymous" ? author.value : "", // Ensure we only get cards by this author
          },
        },
      ],
      { enabled: computed(() => !isExplicitFiltered.value) },
    ),
  );

  const isShadowFiltered = computed(() => {
    if (isExplicitFiltered.value) return false;
    if (!isShadowFilteredQuery?.data?.value) return false;
    // If we have no results, it's definitely NSFW
    if (isShadowFilteredQuery.data.value.length === 0) return true;
    // If we have results, check if our card is among them
    return !isShadowFilteredQuery.data.value.some(
      (c) => c.fullPath === card.fullPath,
    );
  });

  const isFiltered = computed(
    () => isExplicitFiltered.value || isShadowFiltered.value,
  );

  return { isFiltered, isExplicitFiltered, isShadowFiltered };
}

export function getChubFilters(card: ChubCard) {
  const {
    isFiltered: isNsfw,
    isExplicitFiltered: isExplicitNsfw,
    isShadowFiltered: isShadowNsfw,
  } = getChubFilterValues(card, "NSFW");
  const {
    isFiltered: isNsfl,
    isExplicitFiltered: isExplicitNsfl,
    isShadowFiltered: isShadowNsfl,
  } = getChubFilterValues(card, "NSFL");
  return {
    isNsfw,
    isExplicitNsfw,
    isShadowNsfw,
    isNsfl,
    isExplicitNsfl,
    isShadowNsfl,
  };
}
