import type { ChubCard } from "./chub";
import { chubCardToTavernCard } from "./chubHelpers";
import { decode, encode } from "fast-png";

export async function chubCardToTavernCardFile(
  card: ChubCard<true>,
): Promise<File> {
  const tavernCard = chubCardToTavernCard(card);
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
