import type { ChubCard } from "./chub";
import { chubCardToTavernCard } from "./chubHelpers";
import { decode, encode } from "fast-png";
import type { TavernCardV2 } from "./types";

export async function chubCardToTavernCardFile(
  card: ChubCard<true>,
  tavernCard?: TavernCardV2,
): Promise<File> {
  tavernCard ??= chubCardToTavernCard(card);
  const url = `https://avatars.charhub.io/avatars/${card.fullPath}/chara_card_v2.png`;
  const imageResponse = await fetch(url);
  const image = await imageResponse.arrayBuffer();
  const data = decode(image);
  data.text.chara = btoa(
    String.fromCharCode(
      ...new TextEncoder().encode(JSON.stringify(tavernCard)),
    ),
  );
  const pngData = encode(data) as Uint8Array<ArrayBuffer>;
  return new File(
    [pngData],
    `main_${card.fullPath.replace(/.+[/]/, "")}_spec_v2.png`,
    { type: "image/png" },
  );
}
