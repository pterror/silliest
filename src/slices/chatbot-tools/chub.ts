const API_URL = "https://gateway.chub.ai/api";

export type ChubCardId = number & {
  readonly __type: "ChubCardId";
};

export type ChubCardFullPath = string & {
  readonly __type: "ChubCardFullPath";
};

export interface ChubLabel {
  readonly title: string;
  readonly description: string;
}

export interface ChubCard {
  readonly id: ChubCardId;
  readonly name: string;
  readonly fullPath: ChubCardFullPath;
  readonly description: string;
  readonly starCount: number;
  readonly lastActivityAt: Date;
  readonly createdAt: Date;
  readonly labels: readonly ChubLabel[];
  readonly topics: readonly string[];
  readonly forksCount: number;
  readonly rating: number;
  readonly ratingCount: number;
  readonly projectSpace: "characters" | "lorebooks";
  /** -1 for anonymous */
  readonly creatorId: number;
  readonly nTokens: number;
  readonly tagline: string;
  readonly primaryFormat: "tavern";
  readonly related_characters: readonly number[];
  readonly related_lorebooks: readonly number[];
  readonly related_prompts: readonly number[];
  readonly related_extensions: readonly number[];
  readonly hasGallery: boolean;
  readonly nChats: number;
  readonly nMessages: number;
  readonly definition: null | string;
  readonly permissions: "read" | "write" | "admin";
  readonly is_public: boolean;
  readonly is_favorite: boolean;
  readonly nsfw_image: boolean;
  readonly n_public_chats: number;
  readonly n_favorites: number;
  readonly is_unlisted: boolean;
  readonly avatar_url: string;
  readonly max_res_url: string;
  readonly bound_preset: null | string;
  readonly project_uuid: null | string;
  readonly voice_id: null | string;
  readonly verified: boolean;
  readonly recommended: boolean;
  readonly ratings_disabled: boolean;
  readonly lang_id: number;
  readonly badges: readonly string[];
}

interface ChubCardRaw extends Omit<ChubCard, "lastActivityAt" | "createdAt"> {
  readonly lastActivityAt: string;
  readonly createdAt: string;
}

interface ChubGetSimilarProjectsResponse {
  readonly count: number;
  readonly nodes: ChubCardRaw[];
  readonly page: number;
  readonly previous: null;
  readonly cursor: null;
}

export function chubCardRawToChubCard(raw: ChubCardRaw): ChubCard {
  return {
    ...raw,
    lastActivityAt: new Date(raw.lastActivityAt),
    createdAt: new Date(raw.createdAt),
  };
}

export async function chubListSimilarCards(
  id: number
): Promise<readonly ChubCard[]> {
  const response = await fetch(`${API_URL}/projects/similar/${id}/true/true`);
  const data: ChubGetSimilarProjectsResponse = await response.json();
  return data.nodes.map(chubCardRawToChubCard);
}

interface ChubGetCardResponse {
  readonly errors: readonly unknown[] | null;
  readonly node: ChubCardRaw;
  readonly nodes: Record<`${bigint}`, ChubCardRaw>;
  readonly permissions: "read";
  readonly is_favorite: boolean;
}

export async function chubGetCardByFullPath(
  fullPath: ChubCardFullPath
): Promise<ChubCard> {
  const response = await fetch(`${API_URL}/characters/${fullPath}`);
  const data: ChubGetCardResponse = await response.json();
  return chubCardRawToChubCard(data.node);
}

export async function chubGetCardById(id: ChubCardId): Promise<ChubCard> {
  const response = await fetch(`${API_URL}/characters/${id}`);
  const data: ChubGetCardResponse = await response.json();
  return chubCardRawToChubCard(data.node);
}
