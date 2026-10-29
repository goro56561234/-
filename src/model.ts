export type Motion =
  | "none"
  | "horizontal"
  | "vertical"
  | "rotate"
  | "scale"
  | "fade"
  | "sway"
  | "jump"
  | "swap";
export type Element = {
  id: string;
  kind: "image" | "text";
  src: string;
  alternate?: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  fontSize: number;
  font: string;
  motion: Motion;
  duration: number;
  distance: number;
  angle: number;
};
export type Page = {
  id: string;
  name: string;
  background: string;
  elements: Element[];
};
export type Book = {
  id: string;
  title: string;
  pages: Page[];
  updated: number;
};
export const uid = () => crypto.randomUUID();
export const motions: Record<Motion, string> = {
  none: "なし",
  horizontal: "左右に移動",
  vertical: "上下に移動",
  rotate: "くるっと回転",
  scale: "大きく・小さく",
  fade: "消える・現れる",
  sway: "ゆらゆら揺れる",
  jump: "ぴょんと跳ねる",
  swap: "画像を切り替え",
};
export function svg(content: string, w = 200, h = 200) {
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`,
    )
  );
}
export const art = {
  house: svg(
    '<path d="M30 95L100 28l70 67v90H30z" fill="#f3d9a9"/><path d="M15 100L100 15l85 85-15 9-70-69-70 69z" fill="#a76546"/><path d="M125 40V12h19v47" fill="#ad7353"/><rect x="48" y="111" width="29" height="32" rx="13" fill="#8ba99b"/><path d="M47 126h31M63 111v32" stroke="#fff4d7" stroke-width="3"/><rect x="91" y="112" width="43" height="73" rx="21" fill="#9a6948"/><circle cx="123" cy="153" r="3" fill="#efd99c"/>',
  ),
  door: svg(
    '<path d="M4 140V40a36 36 0 0172 0v100z" fill="#9b6848"/><path d="M12 140V42a28 28 0 0156 0v98" fill="none" stroke="#b68459" stroke-width="2"/><circle cx="62" cy="85" r="4" fill="#eac47c"/>',
    80,
    140,
  ),
  open: svg(
    '<path d="M4 140V40a36 36 0 0172 0v100z" fill="#483d35"/><path d="M4 140V40a36 36 0 0124-34v148z" fill="#ae7b50"/><circle cx="22" cy="86" r="3" fill="#f6d67c"/><path d="M37 121l14-36 15 36z" fill="#f5ce76"/>',
    80,
    140,
  ),
  flower: svg(
    '<path d="M100 181V91M100 145q-50-38-46-2 4 25 46 17M100 124q46-34 43-4-4 22-43 20" stroke="#6e9873" stroke-width="7" fill="#8eac77"/><g fill="#e9a298"><ellipse cx="100" cy="66" rx="22" ry="33"/><ellipse cx="100" cy="110" rx="22" ry="33"/><ellipse cx="78" cy="88" rx="33" ry="22"/><ellipse cx="122" cy="88" rx="33" ry="22"/></g><circle cx="100" cy="88" r="19" fill="#f6d475"/>',
  ),
  butterfly: svg(
    '<path d="M95 100Q2 0 25 99q-19 80 70 12M105 100Q198 0 175 99q19 80-70 12" fill="#dfaa65"/><path d="M90 92Q35 40 43 91M110 92q55-52 47-1" fill="none" stroke="#f7d59d" stroke-width="12"/><path d="M100 79v64m-1-63L85 58m15 22 15-22" stroke="#76634e" stroke-width="6" stroke-linecap="round"/>',
  ),
  star: svg(
    '<path d="M100 18l24 52 57 8-42 41 10 58-49-27-49 27 10-58-42-41 57-8z" fill="#efd078"/><path d="M87 101v5m26-5v5" stroke="#9d7c45" stroke-width="5" stroke-linecap="round"/><path d="M90 121q10 10 20 0" fill="none" stroke="#9d7c45" stroke-width="3"/>',
  ),
  rabbit: svg(
    '<ellipse cx="76" cy="48" rx="17" ry="44" fill="#f6eee0" transform="rotate(-12 76 48)"/><ellipse cx="122" cy="47" rx="17" ry="44" fill="#f6eee0" transform="rotate(12 122 47)"/><ellipse cx="99" cy="142" rx="47" ry="48" fill="#bec5a1"/><ellipse cx="99" cy="95" rx="46" ry="39" fill="#f6eee0"/><circle cx="83" cy="91" r="3" fill="#61554b"/><circle cx="115" cy="91" r="3" fill="#61554b"/><path d="M96 103l4 4 4-4" fill="#d39e91"/><ellipse cx="72" cy="107" rx="10" ry="5" fill="#edc5b5"/><ellipse cx="128" cy="107" rx="10" ry="5" fill="#edc5b5"/><ellipse cx="73" cy="181" rx="24" ry="10" fill="#f6eee0"/><ellipse cx="124" cy="181" rx="24" ry="10" fill="#f6eee0"/>',
  ),
  tree: svg(
    '<path d="M92 101h17v99H92z" fill="#a18a67"/><path d="M100 4L36 100h28l-42 55h156l-42-55h28z" fill="#7c9978"/><path d="M100 5v150H22l42-55H36z" fill="#8faa85"/>',
  ),
  mushroom: svg(
    '<path d="M81 91h38l9 87H72z" fill="#efe2bf"/><path d="M20 102a80 80 0 01160 0z" fill="#b97860"/><circle cx="70" cy="68" r="12" fill="#f6e6c8"/><circle cx="127" cy="79" r="14" fill="#f6e6c8"/>',
  ),
};
export function item(
  src: string,
  x = 40,
  y = 35,
  width = 20,
  height = 30,
): Element {
  return {
    id: uid(),
    kind: "image",
    src,
    text: "",
    x,
    y,
    width,
    height,
    rotation: 0,
    color: "#4d5947",
    fontSize: 26,
    font: "serif",
    motion: "none",
    duration: 900,
    distance: 70,
    angle: 180,
  };
}
export function newBook(): Book {
  return {
    id: uid(),
    title: "あたらしい物語",
    updated: Date.now(),
    pages: [{ id: uid(), name: "表紙", background: "#f4eedc", elements: [] }],
  };
}
export function sample(): Book {
  const captions = [
    "森のおくに、小さなおうちがありました。",
    "おはなに、そっとふれてみて。",
    "ちょうちょさん、どこへいくの？",
    "夜空に、きらり。星のおくりもの。",
    "またあしたも、いっしょにあそぼう。",
  ];
  const pages = captions.map((caption, i) => {
    const elements: Element[] = [];
    [0, 1, 2, 3, 4, 5].forEach((n) =>
      elements.push(item(art.tree, n * 18 - 5, 12 + (n % 2) * 6, 22, 64)),
    );
    elements.push(item(art.house, 36, 24, 30, 48));
    const actor = item(
      [art.door, art.flower, art.butterfly, art.star, art.rabbit][i],
      ...((i === 0 ? [49, 45, 8, 24] : [43, 42, 20, 32]) as [
        number,
        number,
        number,
        number,
      ]),
    );
    actor.motion = (["swap", "scale", "vertical", "scale", "jump"] as Motion[])[
      i
    ];
    actor.alternate = art.open;
    actor.distance = 130;
    elements.push(actor);
    const text = item("", 12, 82, 76, 10);
    text.kind = "text";
    text.text = caption;
    text.fontSize = 22;
    elements.push(text);
    return {
      id: uid(),
      name: i === 0 ? "表紙" : `ページ ${i + 1}`,
      background: i === 3 ? "#ccd6dc" : "#edf0df",
      elements,
    };
  });
  return {
    id: uid(),
    title: "ふしぎな森の小さなおうち",
    pages,
    updated: Date.now(),
  };
}
export function validateBook(value: unknown): value is Book {
  const b = value as Book;
  return (
    !!b &&
    typeof b.id === "string" &&
    typeof b.title === "string" &&
    Array.isArray(b.pages) &&
    b.pages.length > 0 &&
    b.pages.length <= 100 &&
    b.pages.every(
      (p) =>
        typeof p.id === "string" &&
        typeof p.background === "string" &&
        Array.isArray(p.elements) &&
        p.elements.length <= 500 &&
        p.elements.every(
          (e) =>
            typeof e.id === "string" &&
            ["text", "image"].includes(e.kind) &&
            typeof e.src === "string" &&
            (!e.src ||
              /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/.test(e.src)) &&
            (!e.alternate ||
              /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/.test(e.alternate)) &&
            typeof e.text === "string" &&
            [
              e.x,
              e.y,
              e.width,
              e.height,
              e.rotation,
              e.duration,
              e.distance,
              e.angle,
              e.fontSize,
            ].every(Number.isFinite) &&
            e.width > 0 &&
            e.height > 0 &&
            e.motion in motions,
        ),
    )
  );
}
