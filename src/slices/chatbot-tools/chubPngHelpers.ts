import type { ChubCard } from "./chub";
import { chubCardToTavernCard } from "./chubHelpers";
import { decode, encode } from "fast-png";
import type { TavernCardV2 } from "./types";

export async function chubCardToTavernCardFile(
  card: ChubCard<true>,
  tavernCard?: TavernCardV2,
): Promise<File> {
  tavernCard ??= chubCardToTavernCard(card);
  const imageResponse = await fetch(card.max_res_url);
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
