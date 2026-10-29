import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Undo2,
  Redo2,
  Upload,
  Download,
  Copy,
  Trash2,
  Layers,
  Type,
  ImagePlus,
  Sparkles,
  Check,
  ArrowUp,
  ArrowDown,
  Maximize,
  X,
  LayoutGrid,
  MousePointer2,
  Flower2,
  Settings2,
} from "lucide-react";
import {
  art,
  item,
  motions,
  newBook,
  sample,
  uid,
  validateBook,
  type Book,
  type Element,
  type Motion,
} from "./model";
import { allBooks, persist, removeBook } from "./storage";
import "./style.css";
function App() {
  const [book, setBook] = useState<Book | null>(null),
    [books, setBooks] = useState<Book[]>([]),
    [pageIndex, setPageIndex] = useState(0),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("pages"),
    [preview, setPreview] = useState(false),
    [library, setLibrary] = useState(false),
    [saved, setSaved] = useState("読み込み中"),
    [error, setError] = useState(""),
    [history, setHistory] = useState<Book[]>([]),
    [future, setFuture] = useState<Book[]>([]),
    [active, setActive] = useState<Record<string, boolean>>({});
  const canvas = useRef<HTMLDivElement>(null),
    upload = useRef<HTMLInputElement>(null),
    importFile = useRef<HTMLInputElement>(null),
    alternate = useRef<HTMLInputElement>(null),
    ready = useRef(false),
    drag = useRef<{
      id: string;
      x: number;
      y: number;
      bx: number;
      by: number;
      book: Book;
    } | null>(null);
  useEffect(() => {
    allBooks()
      .then(async (data) => {
        if (!data.length) {
          const b = sample();
          await persist(b);
          data = [b];
        }
        setBooks(data);
        setBook(data.sort((a, b) => b.updated - a.updated)[0]);
        ready.current = true;
      })
      .catch(() =>
        setError(
          "保存領域を開けません。ブラウザのストレージ設定をご確認ください。",
        ),
      );
  }, []);
  useEffect(() => {
    if (!book || !ready.current) return;
    setSaved("保存中…");
    const timer = setTimeout(() => {
      persist(book)
        .then(() => {
          setSaved("保存しました");
          setBooks((bs) => [book, ...bs.filter((b) => b.id !== book.id)]);
        })
        .catch(() => {
          setSaved("保存できません");
          setError(
            "保存容量が不足している可能性があります。JSONを書き出して作品を保管してください。",
          );
        });
    }, 450);
    return () => clearTimeout(timer);
  }, [book]);
  const page = book?.pages[pageIndex],
    element = page?.elements.find((e) => e.id === selected);
  const edit = (fn: (b: Book) => void) => {
    if (!book) return;
    const b = structuredClone(book);
    fn(b);
    b.updated = Date.now();
    setHistory((h) => [...h.slice(-39), book]);
    setFuture([]);
    setBook(b);
  };
  const update = (patch: Partial<Element>) =>
    edit((b) => {
      const e = b.pages[pageIndex].elements.find((e) => e.id === selected);
      if (e) Object.assign(e, patch);
    });
  const undo = () => {
    if (!history.length || !book) return;
    setFuture((f) => [book, ...f]);
    setBook(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setSelected("");
  };
  const redo = () => {
    if (!future.length || !book) return;
    setHistory((h) => [...h, book]);
    setBook(future[0]);
    setFuture(future.slice(1));
    setSelected("");
  };
  const go = (index: number) => {
    setPageIndex(index);
    setSelected("");
    setActive({});
  };
  const add = (e: Element) => {
    edit((b) => b.pages[pageIndex].elements.push(e));
    setSelected(e.id);
  };
  const chooseBook = async (b: Book) => {
    if (book)
      try {
        await persist(book);
      } catch {
        setError(
          "現在の作品を保存できませんでした。書き出してから切り替えてください。",
        );
        return;
      }
    setBook(b);
    go(0);
    setHistory([]);
    setFuture([]);
    setLibrary(false);
  };
  async function readImage(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("PNG・JPEG・WebPを選択してください。");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("画像は8MB以下にしてください。");
      return;
    }
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      r.readAsDataURL(file);
    });
  }
  const loadImage = async (file?: File, alt = false) => {
    try {
      const src = await readImage(file);
      if (src) {
        if (alt) update({ alternate: src });
        else add(item(src));
      }
    } catch (e) {
      setError(String(e));
    }
  };
  const exportBook = () => {
    if (!book) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(book, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = book.title + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importBook = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 60 * 1024 * 1024)
        throw Error("ファイルが大きすぎます（上限60MB）");
      const b: unknown = JSON.parse(await file.text());
      if (!validateBook(b)) throw Error("作品ファイルの形式が正しくありません");
      b.id = uid();
      b.updated = Date.now();
      await persist(b);
      await chooseBook(b);
      setBooks((bs) => [b, ...bs]);
    } catch (e) {
      setError(String(e));
    }
  };
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (e.key === "Escape") setPreview(false);
      if (preview && book) {
        if (e.key === "ArrowRight")
          go(Math.min(book.pages.length - 1, pageIndex + 1));
        if (e.key === "ArrowLeft") go(Math.max(0, pageIndex - 1));
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  function trigger(e: Element, node: HTMLElement) {
    setActive((a) => ({ ...a, [e.id]: !a[e.id] }));
    const d = e.distance,
      ang = e.angle;
    const frames: Record<string, Keyframe[]> = {
      horizontal: [
        { transform: "translateX(0)" },
        { transform: `translateX(${d}px)` },
        { transform: "translateX(0)" },
      ],
      vertical: [
        { transform: "translateY(0)" },
        { transform: `translateY(${-d}px)` },
        { transform: "translateY(0)" },
      ],
      rotate: [{ transform: "rotate(0)" }, { transform: `rotate(${ang}deg)` }],
      scale: [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.3)", filter: "brightness(1.2)" },
        { transform: "scale(1)" },
      ],
      sway: [
        { transform: "rotate(0)" },
        { transform: "rotate(-12deg)" },
        { transform: "rotate(12deg)" },
        { transform: "rotate(0)" },
      ],
      jump: [
        { transform: "translateY(0)" },
        { transform: `translateY(${-d}px)` },
        { transform: "translateY(0)" },
      ],
    };
    if (frames[e.motion])
      node.animate(frames[e.motion], {
        duration: e.duration,
        easing: "ease-in-out",
      });
  }
  const renderElement = (e: Element, small = false) => {
    const clicked = active[e.id];
    return (
      <div
        key={e.id}
        className={`element ${selected === e.id && !preview && !small ? "selected" : ""} ${preview && e.motion !== "none" ? "interactive" : ""}`}
        style={{
          left: e.x + "%",
          top: e.y + "%",
          width: e.width + "%",
          height: e.height + "%",
          transform: `rotate(${e.rotation}deg)`,
          zIndex: page?.elements.indexOf(e),
        }}
        onPointerDown={(ev) => {
          if (preview || small) return;
          ev.stopPropagation();
          setSelected(e.id);
          if (book) {
            ev.currentTarget.setPointerCapture(ev.pointerId);
            drag.current = {
              id: e.id,
              x: ev.clientX,
              y: ev.clientY,
              bx: e.x,
              by: e.y,
              book,
            };
          }
        }}
        onPointerMove={(ev) => {
          const d = drag.current;
          if (!d || d.id !== e.id || !canvas.current) return;
          const rect = canvas.current.getBoundingClientRect();
          setBook((b) => {
            if (!b) return b;
            const clone = structuredClone(b);
            const obj = clone.pages[pageIndex].elements.find(
              (el) => el.id === e.id,
            )!;
            obj.x = Math.max(
              -e.width + 3,
              Math.min(97, d.bx + ((ev.clientX - d.x) / rect.width) * 100),
            );
            obj.y = Math.max(
              -e.height + 3,
              Math.min(97, d.by + ((ev.clientY - d.y) / rect.height) * 100),
            );
            clone.updated = Date.now();
            return clone;
          });
        }}
        onPointerUp={() => {
          if (drag.current) {
            const before = drag.current.book;
            setHistory((h) => [...h.slice(-39), before]);
            setFuture([]);
            drag.current = null;
          }
        }}
        onClick={(ev) => {
          if (preview)
            trigger(e, ev.currentTarget.firstElementChild as HTMLElement);
        }}
      >
        <div
          className="element-inner"
          style={{
            opacity: preview && e.motion === "fade" && clicked ? 0.08 : 1,
            transition: `opacity ${e.duration}ms`,
          }}
        >
          {e.kind === "image" ? (
            <img
              draggable={false}
              src={
                preview && e.motion === "swap" && clicked && e.alternate
                  ? e.alternate
                  : e.src
              }
              alt="絵本のイラスト"
            />
          ) : (
            <div
              className="book-text"
              style={{
                color: e.color,
                fontSize: `${e.fontSize / 8.4}cqw`,
                fontFamily: e.font,
              }}
            >
              {e.text}
            </div>
          )}
        </div>
        {!preview && !small && selected === e.id && (
          <>
            <i className="handle tl" />
            <i className="handle tr" />
            <i className="handle bl" />
            <i className="handle br" />
            <span className="selection-label">
              {e.kind === "text" ? "テキスト" : "イラスト"}
            </span>
          </>
        )}
      </div>
    );
  };
  if (!book || !page)
    return (
      <div className="loading">
        <BookOpen size={40} />
        <p>{error || "アトリエの扉をひらいています…"}</p>
      </div>
    );
  const pageAction = (action: string) => {
    if (action === "add") {
      edit((b) =>
        b.pages.push({
          id: uid(),
          name: `ページ ${b.pages.length + 1}`,
          background: "#f3efdf",
          elements: [],
        }),
      );
      go(book.pages.length);
    }
    if (action === "copy") {
      edit((b) => {
        const p = structuredClone(b.pages[pageIndex]);
        p.id = uid();
        p.elements.forEach((e) => (e.id = uid()));
        b.pages.splice(pageIndex + 1, 0, p);
      });
      go(pageIndex + 1);
    }
    if (action === "delete" && book.pages.length > 1) {
      edit((b) => b.pages.splice(pageIndex, 1));
      go(Math.max(0, pageIndex - 1));
    }
  };
  return (
    <div className={preview ? "app reading" : "app"}>
      <input
        hidden
        ref={upload}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          loadImage(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        hidden
        ref={alternate}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          loadImage(e.target.files?.[0], true);
          e.target.value = "";
        }}
      />
      <input
        hidden
        ref={importFile}
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          importBook(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <header>
        <button className="brand" onClick={() => setLibrary(true)}>
          <span className="brand-icon">
            <BookOpen size={23} />
          </span>
          <span>
            えほんアトリエ<small>EHON ATELIER</small>
          </span>
        </button>
        <span className="header-divider" />
        <div className="title-area">
          <input
            aria-label="作品タイトル"
            value={book.title}
            onChange={(e) => edit((b) => (b.title = e.target.value))}
          />
          <span className="save">
            <Check size={12} />
            {saved}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="quiet library-button"
            onClick={() => setLibrary(true)}
          >
            <LayoutGrid size={17} />
            作品一覧
          </button>
          <button className="quiet export-button" onClick={exportBook}>
            <Download size={17} />
            書き出し
          </button>
          <button
            className="primary"
            onClick={() => {
              setPreview(!preview);
              setActive({});
            }}
          >
            {preview ? (
              <>
                <X size={16} />
                編集に戻る
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                プレビュー
              </>
            )}
          </button>
        </div>
      </header>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => setError("")}>閉じる</button>
        </div>
      )}
      {preview ? (
        <main className="reader">
          <div className="reader-heading">
            <span>おはなしの時間</span>
            <h1>{book.title}</h1>
            <p>絵にふれて、物語を動かしてみよう。</p>
          </div>
          <div className="canvas-wrap reader-wrap">
            <div
              key={page.id}
              ref={canvas}
              className="canvas page-enter"
              style={{ background: page.background }}
            >
              {page.elements.map((e) => renderElement(e))}
            </div>
          </div>
          <div className="reader-controls">
            <button
              aria-label="前のページ"
              disabled={!pageIndex}
              onClick={() => go(pageIndex - 1)}
            >
              <ChevronLeft />
            </button>
            <span>
              {pageIndex + 1} / {book.pages.length}
            </span>
            <button
              aria-label="次のページ"
              disabled={pageIndex === book.pages.length - 1}
              onClick={() => go(pageIndex + 1)}
            >
              <ChevronRight />
            </button>
            <button
              aria-label="全画面表示"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                else
                  document.documentElement
                    .requestFullscreen?.()
                    .catch(() =>
                      setError("このブラウザでは全画面表示を利用できません。"),
                    );
              }}
            >
              <Maximize size={18} />
            </button>
          </div>
        </main>
      ) : (
        <>
          <div className="workspace">
            <nav className="rail">
              <button
                className={tab === "pages" ? "active" : ""}
                onClick={() => setTab("pages")}
              >
                <Layers />
                <span>ページ</span>
              </button>
              <button
                className={tab === "assets" ? "active" : ""}
                onClick={() => setTab("assets")}
              >
                <Flower2 />
                <span>素材</span>
              </button>
              <button onClick={() => upload.current?.click()}>
                <ImagePlus />
                <span>画像</span>
              </button>
              <button
                onClick={() => {
                  const e = item("", 22, 35, 56, 15);
                  e.kind = "text";
                  e.text = "ここにおはなしを書こう";
                  add(e);
                }}
              >
                <Type />
                <span>文字</span>
              </button>
              <span className="rail-bottom">
                <Sparkles size={20} />
              </span>
            </nav>
            <aside className="left-panel">
              <div className="panel-title">
                <h2>{tab === "pages" ? "物語のページ" : "ちいさな素材箱"}</h2>
                <span>
                  {tab === "pages" ? `${book.pages.length} ページ` : "SVG"}
                </span>
              </div>
              {tab === "pages" ? (
                <>
                  <p className="subtle intro">一枚ずつ、物語をつむごう。</p>
                  <div className="page-list">
                    {book.pages.map((p, i) => (
                      <div
                        className={`page-card ${i === pageIndex ? "active" : ""}`}
                        key={p.id}
                      >
                        <button className="page-choice" onClick={() => go(i)}>
                          <div
                            className="thumbnail"
                            style={{ background: p.background }}
                          >
                            {p.elements.map((e) => (
                              <div
                                key={e.id}
                                style={{
                                  position: "absolute",
                                  left: e.x + "%",
                                  top: e.y + "%",
                                  width: e.width + "%",
                                  height: e.height + "%",
                                  transform: `rotate(${e.rotation}deg)`,
                                }}
                              >
                                {e.kind === "image" ? (
                                  <img src={e.src} alt="" />
                                ) : (
                                  <span style={{ fontSize: 5, color: e.color }}>
                                    {e.text}
                                  </span>
                                )}
                              </div>
                            ))}
                            {i === 0 && <span className="cover-tag">表紙</span>}
                          </div>
                          <div className="page-name">
                            <span className="page-number">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{i === 0 ? "表紙" : `ページ ${i + 1}`}</span>
                            {i === pageIndex && <span className="active-dot" />}
                          </div>
                        </button>
                        {i === pageIndex && (
                          <div className="page-tools">
                            <button
                              title="ページを上へ"
                              disabled={i === 0}
                              onClick={() => {
                                edit((b) => {
                                  [b.pages[i - 1], b.pages[i]] = [
                                    b.pages[i],
                                    b.pages[i - 1],
                                  ];
                                });
                                go(i - 1);
                              }}
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              title="ページを下へ"
                              disabled={i === book.pages.length - 1}
                              onClick={() => {
                                edit((b) => {
                                  [b.pages[i + 1], b.pages[i]] = [
                                    b.pages[i],
                                    b.pages[i + 1],
                                  ];
                                });
                                go(i + 1);
                              }}
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              title="ページを複製"
                              onClick={() => pageAction("copy")}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              title="ページを削除"
                              disabled={book.pages.length === 1}
                              onClick={() => pageAction("delete")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="add-page"
                    onClick={() => pageAction("add")}
                  >
                    <Plus size={16} />
                    ページを追加
                  </button>
                </>
              ) : (
                <>
                  <p className="subtle intro">
                    クリックして、おはなしの仲間に。
                  </p>
                  <div className="asset-grid">
                    {Object.entries(art).map(([key, src]) => (
                      <button
                        key={key}
                        title={`素材 ${key} を追加`}
                        onClick={() => add(item(src))}
                      >
                        <img src={src} alt={key} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="add-page"
                    onClick={() => upload.current?.click()}
                  >
                    <Upload size={16} />
                    画像をアップロード
                  </button>
                </>
              )}
            </aside>
            <main className="editor">
              <div className="editor-toolbar">
                <div>
                  <button
                    title="元に戻す"
                    onClick={undo}
                    disabled={!history.length}
                  >
                    <Undo2 size={18} />
                  </button>
                  <button
                    title="やり直す"
                    onClick={redo}
                    disabled={!future.length}
                  >
                    <Redo2 size={18} />
                  </button>
                  <span className="toolbar-separator" />
                  <span>
                    {pageIndex === 0 ? "表紙" : `ページ ${pageIndex + 1}`}
                  </span>
                </div>
                <span className="canvas-badge">
                  <span />
                  編集モード
                </span>
              </div>
              <div
                className="stage"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  loadImage(e.dataTransfer.files[0]);
                }}
              >
                <div className="canvas-topline">
                  <span>YOUR LITTLE WORLD</span>
                  <span>
                    {String(pageIndex + 1).padStart(2, "0")} /{" "}
                    {String(book.pages.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="canvas-wrap">
                  <div
                    ref={canvas}
                    className="canvas"
                    style={{ background: page.background }}
                    onPointerDown={() => setSelected("")}
                  >
                    {page.elements.map((e) => renderElement(e))}
                  </div>
                </div>
                <div className="canvas-caption">
                  <span>
                    <MousePointer2 size={14} />
                    絵を選んで、仕掛けをつけてみよう
                  </span>
                  <span>840 × 560 px</span>
                </div>
                <div className="tip">
                  <span className="tip-icon">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <strong>小さな仕掛けで、大きなわくわく。</strong>
                    <p>
                      イラストに動きをつけると、あなただけの物語が動き出します。
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPreview(true);
                      setActive({});
                    }}
                  >
                    ためしてみる
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <footer className="editor-footer">
                <span>
                  <span className="green-dot" />
                  すべての物語は、小さなひらめきから。
                </span>
                <span>表示 100%</span>
              </footer>
            </main>
            <aside className="right-panel">
              <div className="panel-title">
                <h2>
                  <Settings2 size={17} />{" "}
                  {element ? "オブジェクトの設定" : "ページの設定"}
                </h2>
              </div>
              {element ? (
                <>
                  <div className="object-label">
                    <span>
                      {element.kind === "text" ? (
                        <Type size={18} />
                      ) : (
                        <ImagePlus size={18} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {element.kind === "text"
                          ? "おはなしの文字"
                          : "森のイラスト"}
                      </strong>
                      <small>
                        {element.kind === "text" ? "TEXT" : "ILLUSTRATION"}
                      </small>
                    </div>
                    <button
                      title="要素の削除"
                      onClick={() => {
                        edit(
                          (b) =>
                            (b.pages[pageIndex].elements = b.pages[
                              pageIndex
                            ].elements.filter((e) => e.id !== selected)),
                        );
                        setSelected("");
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <section>
                    <h3>見た目</h3>
                    {element.kind === "text" && (
                      <>
                        <label>
                          テキスト
                          <textarea
                            aria-label="テキスト"
                            value={element.text}
                            onChange={(e) => update({ text: e.target.value })}
                          />
                        </label>
                        <div className="two-col">
                          <label>
                            文字サイズ
                            <input
                              type="number"
                              min="8"
                              max="120"
                              value={element.fontSize}
                              onChange={(e) =>
                                update({ fontSize: +e.target.value || 8 })
                              }
                            />
                          </label>
                          <label>
                            文字色
                            <input
                              type="color"
                              value={element.color}
                              onChange={(e) =>
                                update({ color: e.target.value })
                              }
                            />
                          </label>
                        </div>
                        <label>
                          フォント
                          <select
                            value={element.font}
                            onChange={(e) => update({ font: e.target.value })}
                          >
                            <option value="serif">明朝体</option>
                            <option value="sans-serif">ゴシック体</option>
                            <option value="cursive">手書き風</option>
                          </select>
                        </label>
                      </>
                    )}
                    <div className="two-col">
                      <label>
                        幅 (%)
                        <input
                          aria-label="幅"
                          type="number"
                          min="1"
                          max="150"
                          value={Math.round(element.width)}
                          onChange={(e) =>
                            update({ width: Math.max(1, +e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        高さ (%)
                        <input
                          aria-label="高さ"
                          type="number"
                          min="1"
                          max="150"
                          value={Math.round(element.height)}
                          onChange={(e) =>
                            update({ height: Math.max(1, +e.target.value) })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      回転 <span>{element.rotation}°</span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={element.rotation}
                        onChange={(e) => update({ rotation: +e.target.value })}
                      />
                    </label>
                    <div className="object-actions">
                      <button
                        onClick={() => {
                          const e = structuredClone(element);
                          e.id = uid();
                          e.x += 3;
                          e.y += 3;
                          add(e);
                        }}
                      >
                        <Copy size={14} />
                        複製
                      </button>
                      <button
                        title="前面へ"
                        onClick={() =>
                          edit((b) => {
                            const es = b.pages[pageIndex].elements;
                            const i = es.findIndex((e) => e.id === selected);
                            if (i < es.length - 1)
                              [es[i], es[i + 1]] = [es[i + 1], es[i]];
                          })
                        }
                      >
                        <ArrowUp size={14} />
                        前へ
                      </button>
                      <button
                        title="背面へ"
                        onClick={() =>
                          edit((b) => {
                            const es = b.pages[pageIndex].elements;
                            const i = es.findIndex((e) => e.id === selected);
                            if (i > 0) [es[i], es[i - 1]] = [es[i - 1], es[i]];
                          })
                        }
                      >
                        <ArrowDown size={14} />
                        後ろへ
                      </button>
                    </div>
                  </section>
                  <section className="motion-section">
                    <h3>
                      <Sparkles size={17} />
                      仕掛けをつける<span>MAGIC</span>
                    </h3>
                    <p className="subtle">クリックしたとき、どう動く？</p>
                    <div className="motion-grid">
                      {Object.entries(motions).map(([value, label]) => (
                        <button
                          className={element.motion === value ? "chosen" : ""}
                          key={value}
                          onClick={() => update({ motion: value as Motion })}
                        >
                          <span>
                            {
                              (
                                {
                                  none: "—",
                                  horizontal: "↔",
                                  vertical: "↕",
                                  rotate: "↻",
                                  scale: "⤢",
                                  fade: "◌",
                                  sway: "〰",
                                  jump: "⌁",
                                  swap: "⇄",
                                } as Record<string, string>
                              )[value]
                            }
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>
                    {element.motion !== "none" && (
                      <div className="motion-options">
                        <label>
                          動きの時間{" "}
                          <span>{(element.duration / 1000).toFixed(1)} 秒</span>
                          <input
                            type="range"
                            min="200"
                            max="3000"
                            step="100"
                            value={element.duration}
                            onChange={(e) =>
                              update({ duration: +e.target.value })
                            }
                          />
                        </label>
                        {["horizontal", "vertical", "jump"].includes(
                          element.motion,
                        ) && (
                          <label>
                            移動距離 <span>{element.distance}px</span>
                            <input
                              type="range"
                              min="10"
                              max="250"
                              value={element.distance}
                              onChange={(e) =>
                                update({ distance: +e.target.value })
                              }
                            />
                          </label>
                        )}
                        {element.motion === "rotate" && (
                          <label>
                            回転角度 <span>{element.angle}°</span>
                            <input
                              type="range"
                              min="-360"
                              max="360"
                              value={element.angle}
                              onChange={(e) =>
                                update({ angle: +e.target.value })
                              }
                            />
                          </label>
                        )}
                        {element.motion === "swap" && (
                          <button
                            className="add-page"
                            onClick={() => alternate.current?.click()}
                          >
                            <Upload size={15} />
                            {element.alternate
                              ? "切り替え画像を変更"
                              : "切り替え画像を追加"}
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                  <div className="side-note">
                    <Play size={16} />
                    <p>
                      仕掛けは「プレビュー」で
                      <br />
                      体験できます。
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <section>
                    <h3>ページの背景</h3>
                    <p className="subtle">物語にぴったりの色を選ぼう。</p>
                    <div className="swatches">
                      {[
                        "#edf0df",
                        "#f4eedc",
                        "#f4e2dd",
                        "#dfeaf1",
                        "#ccd6dc",
                        "#e9e2ef",
                      ].map((color) => (
                        <button
                          key={color}
                          title={color}
                          style={{ background: color }}
                          onClick={() =>
                            edit((b) => (b.pages[pageIndex].background = color))
                          }
                        >
                          {page.background === color && <Check size={17} />}
                        </button>
                      ))}
                    </div>
                    <label>
                      カスタムカラー
                      <input
                        aria-label="背景色"
                        type="color"
                        value={page.background}
                        onChange={(e) =>
                          edit(
                            (b) =>
                              (b.pages[pageIndex].background = e.target.value),
                          )
                        }
                      />
                    </label>
                  </section>
                  <div className="empty-selection">
                    <span>
                      <MousePointer2 size={28} />
                    </span>
                    <h3>物語に、ひとさじの魔法を。</h3>
                    <p>
                      キャンバスのイラストを選ぶと、
                      <br />
                      大きさや動きを設定できます。
                    </p>
                    <button
                      onClick={() =>
                        setSelected(
                          page.elements.find((e) => e.motion !== "none")?.id ||
                            page.elements[0]?.id ||
                            "",
                        )
                      }
                    >
                      イラストを選んでみる
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <section className="mini-guide">
                    <span>はじめてのアトリエ</span>
                    <h3>3つのステップで、絵本づくり。</h3>
                    <p>01　素材や文字をならべる</p>
                    <p>02　クリックの仕掛けをつける</p>
                    <p>03　プレビューで物語をひらく</p>
                  </section>
                </>
              )}
            </aside>
          </div>
        </>
      )}
      {library && (
        <div className="modal-backdrop">
          <div className="library-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">MY BOOKSHELF</span>
                <h2>あなたの本だな</h2>
              </div>
              <button aria-label="閉じる" onClick={() => setLibrary(false)}>
                <X />
              </button>
            </div>
            <p className="subtle">大切な物語は、このブラウザに保存されます。</p>
            <div className="library-actions">
              <button className="primary" onClick={() => chooseBook(newBook())}>
                <Plus size={16} />
                新しい絵本
              </button>
              <button onClick={() => importFile.current?.click()}>
                <Upload size={16} />
                JSONを読み込む
              </button>
              <button onClick={() => chooseBook(sample())}>
                サンプルを追加
              </button>
            </div>
            <div className="book-grid">
              {books.map((b) => (
                <div className="book-tile" key={b.id}>
                  <button className="book-open" onClick={() => chooseBook(b)}>
                    <div style={{ background: b.pages[0].background }}>
                      <BookOpen size={40} />
                      <span>{b.title}</span>
                    </div>
                    <strong>{b.title}</strong>
                    <small>{b.pages.length} ページ</small>
                  </button>
                  <button
                    className="delete-book"
                    title="作品を削除"
                    onClick={async () => {
                      if (!confirm(`「${b.title}」を削除しますか？`)) return;
                      try {
                        if (b.id === book.id) {
                          setError(
                            "開いている作品です。別の作品に切り替えてから削除してください。",
                          );
                          return;
                        }
                        await removeBook(b.id);
                        setBooks((bs) => bs.filter((v) => v.id !== b.id));
                      } catch {
                        setError("削除できませんでした");
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
