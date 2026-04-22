// LP Swipe — Design C (Mosaic) reimagined as an iPhone-first swipe deck.
// The whole page is a horizontal pager of "leaked" screens.
// Swipe between screens. Tap to reveal censored bits. Spring physics.

const cX = {
  bg: '#09090b',
  surface: '#14141a',
  surface2: '#1c1c24',
  border: '#2a2a35',
  text: '#f0f0f3',
  dim: '#8a8a95',
  red: '#ff2d55',
  yellow: '#ffcc00',
  green: '#30d158',
};

// ─── Censored: tap to reveal ────────────────────────────────
function Censored({ children, inline = true, auto, mini }) {
  const [rev, setRev] = React.useState(false);
  React.useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setRev(true), auto);
    return () => clearTimeout(t);
  }, [auto]);
  return (
    <span
      onClick={(e) => { e.stopPropagation(); setRev((v) => !v); }}
      style={{
        display: 'inline-block', position: 'relative', cursor: 'pointer',
        background: rev ? 'transparent' : '#000',
        color: rev ? 'inherit' : 'transparent',
        padding: mini ? '0 4px' : '0 6px',
        margin: '0 2px', borderRadius: 2,
        transition: 'background .25s, color .25s',
        boxShadow: rev ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,.2)',
        userSelect: 'none',
      }}>
      {children}
    </span>
  );
}

// ─── Tape stripe block ──────────────────────────────────────
function Tape({ color = cX.red, children, style }) {
  return (
    <div style={{
      padding: '5px 12px', fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10, letterSpacing: 3, fontWeight: 700, color: '#fff',
      background: `repeating-linear-gradient(45deg, ${color} 0 10px, #111 10px 20px)`,
      display: 'inline-block', ...style,
    }}>{children}</div>
  );
}

// ─── Swipe pager ────────────────────────────────────────────
function usePager(n) {
  const [i, setI] = React.useState(0);
  const [dx, setDx] = React.useState(0);
  const [animating, setAnim] = React.useState(false);
  const ref = React.useRef(null);
  const start = React.useRef(null);

  const go = React.useCallback((d) => {
    setI((c) => Math.max(0, Math.min(n - 1, c + d)));
    setAnim(true);
    setDx(0);
  }, [n]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const handlers = {
    onPointerDown: (e) => {
      // Don't start a swipe from interactive children (Censored, buttons)
      if (e.target.closest('[data-no-swipe]')) return;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, locked: null, w: ref.current?.offsetWidth || 400 };
      setAnim(false);
    },
    onPointerMove: (e) => {
      if (!start.current || e.pointerId !== start.current.id) return;
      const dxRaw = e.clientX - start.current.x;
      const dyRaw = e.clientY - start.current.y;
      if (start.current.locked === null) {
        if (Math.abs(dxRaw) > 6 || Math.abs(dyRaw) > 6) {
          start.current.locked = Math.abs(dxRaw) > Math.abs(dyRaw) ? 'x' : 'y';
        }
      }
      if (start.current.locked === 'x') {
        // Rubber band at edges
        let effective = dxRaw;
        if ((i === 0 && dxRaw > 0) || (i === n - 1 && dxRaw < 0)) effective = dxRaw * 0.35;
        setDx(effective);
      }
    },
    onPointerUp: (e) => {
      if (!start.current) return;
      const dxRaw = e.clientX - start.current.x;
      const w = start.current.w;
      const threshold = w * 0.18;
      start.current = null;
      setAnim(true);
      if (dxRaw < -threshold) go(1);
      else if (dxRaw > threshold) go(-1);
      else setDx(0);
    },
    onPointerCancel: () => { start.current = null; setAnim(true); setDx(0); },
  };

  return { i, dx, animating, ref, go, handlers };
}

// ─── Page indicator dots ────────────────────────────────────
function Dots({ n, i, go }) {
  return (
    <div data-no-swipe style={{
      position: 'absolute', bottom: 44, left: 0, right: 0, zIndex: 30,
      display: 'flex', justifyContent: 'center', gap: 6,
      pointerEvents: 'auto',
    }}>
      {Array.from({ length: n }).map((_, k) => (
        <button key={k} onClick={() => go(k - i)}
          style={{
            width: k === i ? 22 : 6, height: 6, borderRadius: 3,
            background: k === i ? cX.red : 'rgba(255,255,255,.3)',
            border: 'none', padding: 0, cursor: 'pointer',
            transition: 'width .3s, background .2s',
          }}/>
      ))}
    </div>
  );
}

// ─── Individual screens ─────────────────────────────────────

// 1) HERO — blurred preview collage behind the title
function ScreenHero({ go, i }) {
  return (
    <div style={{
      height: '100%', padding: '70px 24px 40px', position: 'relative',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(255,45,85,.12), transparent 60%), #09090b',
      overflow: 'hidden',
    }}>
      {/* top tape */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, height: 14,
        background: `repeating-linear-gradient(45deg, ${cX.red} 0 10px, #111 10px 20px)`,
      }}/>

      {/* blurred "photos" in background */}
      <div style={{ position: 'absolute', inset: '100px 0 120px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '0 24px', opacity: .25, filter: 'blur(12px)' }}>
        {[
          '#3a2a1a','#2a1a3a','#1a3a2a','#3a1a2a','#2a3a1a','#1a2a3a',
          '#3a1a1a','#1a1a3a','#2a2a1a',
        ].map((b, k) => (
          <div key={k} style={{ background: `linear-gradient(135deg, ${b}, #0a0a10)`, aspectRatio: '1', borderRadius: 3 }}/>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 3,
          color: cX.red, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ animation: 'pulse-red 1.4s infinite', fontSize: 12 }}>●</span>
          REC — CONFIDENTIAL
        </div>
        <div style={{ color: cX.dim, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 32 }}>
          2026.04.XX · 19:00 · カメアパ
        </div>

        <h1 style={{
          fontFamily: '"Shippori Mincho", serif', fontWeight: 800,
          fontSize: 44, lineHeight: 1.28, letterSpacing: -0.5,
          color: cX.text, margin: 0,
        }}>
          画面下に<br/>
          <Censored inline>スワイプした</Censored>、<br/>
          あの<span style={{ color: cX.red }}>一枚</span>を、<br/>
          <span style={{
            background: `repeating-linear-gradient(90deg, ${cX.red} 0 6px, #111 6px 12px)`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>供養する</span>夜。
        </h1>

        <div style={{ marginTop: 26, fontSize: 12, color: cX.dim, fontFamily: '"Shippori Mincho", serif', lineHeight: 1.8 }}>
          「非公開フォルダの中身」展<br/>
          <span style={{ fontSize: 10, opacity: .8 }}>〜人に見せる気ゼロの一枚を、あえて晒す夜〜</span>
        </div>
      </div>

      {/* nudge: hint to swipe */}
      <div data-no-swipe
        onClick={() => go(1)}
        style={{
          position: 'absolute', bottom: 86, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', zIndex: 5,
        }}>
        <div style={{
          padding: '10px 18px', borderRadius: 100, border: `1px solid ${cX.border}`,
          background: 'rgba(20,20,26,.6)', backdropFilter: 'blur(10px)',
          color: cX.text, fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ display: 'inline-block', animation: 'nudge 1.4s infinite' }}>←</span>
          SWIPE TO LEAK
        </div>
      </div>
    </div>
  );
}

// 2) LEAK GALLERY — tap-to-unblur grid
function ScreenLeak() {
  const tiles = [
    { bg: 'linear-gradient(135deg, #3a2a1a, #1a1a2a)', label: 'IMG_2015.png', tag: 'cringe' },
    { bg: 'linear-gradient(135deg, #2a1a3a, #1a2a1a)', label: 'cone_04.jpg', tag: 'weird' },
    { bg: 'linear-gradient(135deg, #1a3a2a, #3a1a1a)', label: 'blurry_cat.jpg', tag: 'failed' },
    { bg: 'linear-gradient(135deg, #3a1a2a, #2a2a1a)', label: 'memo_2019.md', tag: 'cringe' },
    { bg: 'linear-gradient(135deg, #2a3a1a, #1a1a3a)', label: 'wtf_001.jpg', tag: 'wtf' },
    { bg: 'linear-gradient(135deg, #1a2a3a, #3a2a1a)', label: '???.heic', tag: '?' },
  ];
  return (
    <div style={{ height: '100%', padding: '70px 20px 120px', overflow: 'auto', background: cX.bg }} className="no-sb">
      <SectionHead num="01" jp="LEAK PREVIEW" desc="タップでモザイクが剥がれる。長押しで元に戻る。"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
        {tiles.map((t, k) => <LeakTile key={k} {...t}/>)}
      </div>
      <div style={{ marginTop: 18, padding: '12px 14px', border: `1px dashed ${cX.border}`, fontSize: 11, color: cX.dim, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7, letterSpacing: 1 }}>
        <span style={{ color: cX.red }}>※</span> 本番会場では、プロジェクターに全員ぶんこれが映ります。
      </div>
    </div>
  );
}

function LeakTile({ bg, label, tag }) {
  const [rev, setRev] = React.useState(false);
  return (
    <div data-no-swipe
      onPointerDown={() => setRev(true)}
      onPointerUp={() => setRev(false)}
      onPointerLeave={() => setRev(false)}
      style={{
        position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden',
        border: `1px solid ${cX.border}`, background: cX.surface, cursor: 'pointer',
        userSelect: 'none',
      }}>
      <div style={{
        position: 'absolute', inset: 0, background: bg,
        filter: rev ? 'blur(0)' : 'blur(14px)',
        transform: rev ? 'scale(1.02)' : 'scale(1.12)',
        transition: 'filter .35s, transform .35s',
      }}/>
      <div style={{
        position: 'absolute', bottom: 6, left: 6, fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace', color: '#fff',
        background: 'rgba(0,0,0,.6)', padding: '2px 6px', borderRadius: 2,
      }}>#{tag}</div>
      {!rev && (
        <div style={{
          position: 'absolute', top: 6, right: 6, fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace', color: cX.red,
          background: 'rgba(0,0,0,.7)', padding: '2px 5px', borderRadius: 2,
          letterSpacing: 1, border: `1px solid ${cX.red}`,
        }}>TAP</div>
      )}
    </div>
  );
}

// 3) NARRATIVE TIMELINE
function ScreenNight() {
  const beats = [
    { t: '19:00', l: 'ぽつぽつと人が集まり始める。みんな、なんとなくスマホを握りしめている。' },
    { t: '19:03', l: <>「これ、<Censored>ほんとに</Censored>見せるんすか？」という顔の人あり。</> },
    { t: '19:42', l: <>プロジェクターに、誰かの<Censored>2015年のSNS投稿スクショ</Censored>が映る。会場、爆笑。本人は頭を抱えてる。</>, hi: true },
    { t: '20:18', l: <>次は「<Censored>駐車場のコーン10種類コレクション</Censored>」。「わかる」「いや、わからんわ」。</> },
    { t: '21:30', l: 'みんな自分の黒歴史を笑いながら語ってる。距離が、ちょっと近くなってる。' },
    { t: '22:00', l: <>帰り道、<mark style={{ background: cX.yellow, color: '#111', padding: '0 4px', fontWeight: 700 }}>「あれ、人生そんなに悪くないかもな」</mark>って思える。</>, hi: true },
  ];
  return (
    <div style={{ height: '100%', padding: '70px 24px 120px', overflow: 'auto', background: cX.bg }} className="no-sb">
      <SectionHead num="02" jp="THAT NIGHT" desc="何が起きているか"/>
      <div style={{ marginTop: 22 }}>
        {beats.map((b, k) => (
          <div key={k} style={{
            display: 'flex', gap: 14, padding: '10px 0',
            borderBottom: k === beats.length - 1 ? 'none' : `1px dashed ${cX.border}`,
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1,
              color: b.hi ? cX.red : cX.dim, minWidth: 42, paddingTop: 3, fontWeight: b.hi ? 700 : 400,
            }}>{b.t}</div>
            <div style={{
              fontFamily: '"Shippori Mincho", serif', fontSize: 15, lineHeight: 1.85,
              color: b.hi ? cX.text : 'rgba(240,240,243,.85)',
              fontWeight: b.hi ? 600 : 400,
            }}>{b.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4) CATEGORIES — horizontally swipeable card row (within the screen)
function ScreenCats() {
  const cats = [
    { no: 'EX.01', jp: '失敗写真部門', en: 'FAILED_PHOTOS', d: 'ブレた、変な角度、謎の瞬間', c: cX.red, ex: 'IMG_4821.HEIC' },
    { no: 'EX.02', jp: '黒歴史スクショ部門', en: 'CRINGE_SCREENS', d: '昔のSNS・痛いLINE・恥ずかしいメモ', c: cX.yellow, ex: 'twitter_2015.png' },
    { no: 'EX.03', jp: '謎コレクション部門', en: 'WEIRD_COLLECTION', d: '他人にはどうでもいい収集癖', c: '#2dd4bf', ex: 'cones/ (x37)' },
    { no: 'EX.04', jp: '意味不明メモ・検索履歴', en: 'WTF_HISTORY', d: 'なんでこれ書いた／検索した？', c: '#a78bfa', ex: '"人間 爪 伸びる 速度"' },
  ];
  return (
    <div style={{ height: '100%', padding: '70px 0 120px', overflow: 'auto', background: cX.bg }} className="no-sb">
      <div style={{ padding: '0 24px' }}>
        <SectionHead num="03" jp="CATEGORIES" desc="プレゼン部門・各1〜3分"/>
      </div>
      <div data-no-swipe className="no-sb" style={{
        display: 'flex', gap: 12, padding: '22px 24px 14px',
        overflowX: 'auto', scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>
        {cats.map((c) => (
          <div key={c.no} style={{
            flexShrink: 0, width: 230, scrollSnapAlign: 'start',
            background: cX.surface, border: `1px solid ${cX.border}`,
            borderLeft: `3px solid ${c.c}`, padding: 16, borderRadius: 4,
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: c.c,
              letterSpacing: 2, fontWeight: 700, marginBottom: 8,
            }}>{c.no}</div>
            <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 20, fontWeight: 800, color: cX.text, lineHeight: 1.3 }}>
              {c.jp}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: cX.dim, letterSpacing: 2, margin: '6px 0 12px' }}>
              {c.en}
            </div>
            <div style={{ fontSize: 12, color: cX.text, opacity: .85, lineHeight: 1.6 }}>
              └ {c.d}
            </div>
            <div style={{
              marginTop: 14, padding: '8px 10px', background: '#000',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: cX.dim,
              borderRadius: 2, letterSpacing: 1,
            }}>
              example: <span style={{ color: c.c }}>{c.ex}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 24px', fontSize: 10, color: cX.dim, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
        ← カテゴリを横にスワイプ →
      </div>
      <div style={{
        margin: '18px 24px 0', padding: '12px 14px',
        borderTop: `1px solid ${cX.border}`,
        fontFamily: '"Shippori Mincho", serif', fontSize: 13, color: cX.text, lineHeight: 1.7,
      }}>
        優勝者には <mark style={{ background: cX.yellow, color: '#111', padding: '0 4px', fontWeight: 700 }}>「非公開フォルダ大賞」</mark><br/>
        <span style={{ fontSize: 11, color: cX.dim }}>（仮・ささやかな景品）</span>
      </div>
    </div>
  );
}

// 5) MANIFESTO + FAQ
function ScreenWhy() {
  return (
    <div style={{ height: '100%', padding: '70px 24px 120px', overflow: 'auto', background: cX.bg }} className="no-sb">
      <SectionHead num="04" jp="WHY" desc="なぜこのイベントが生まれたか"/>
      <div style={{ marginTop: 20, fontFamily: '"Shippori Mincho", serif', fontSize: 16, lineHeight: 2, color: cX.text }}>
        SNSでは、みんな<Censored>キラキラした一面</Censored>ばっかり出してる。<br/>
        でも本当は、誰のスマホにも、<br/>人に見せたくない「どうでもいい一枚」が眠ってる。<br/><br/>
        それを<span style={{ color: cX.red, fontWeight: 700 }}>隠したままにしておくのは、もったいない。</span><br/>
        笑い飛ばせば、それは
        <span style={{ background: cX.yellow, color: '#111', padding: '0 4px', fontWeight: 700 }}>財産</span>になる。<br/><br/>
        <span style={{ fontSize: 14, color: cX.dim }}>——</span><br/>
        カメアパの夜に、そういう<br/>
        <span style={{ textDecoration: 'underline', textDecorationColor: cX.red, textUnderlineOffset: 4 }}>「情けなさの共有」</span>ができる場があってもいい。<br/>
        ちょっと肩の力を抜ける場所を、亀山に作りたかった。
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 3,
          color: cX.red, marginBottom: 12, borderTop: `1px solid ${cX.border}`, paddingTop: 16,
        }}>
          FAQ — 迷ってる人へ
        </div>
        <FaqBlock q="「晒せるほどのネタがない」" a="大丈夫。みんなそう言いながら、当日ちゃんと出してくる。むしろ「どうでもいい一枚」ほどウケる。"/>
        <FaqBlock q="「知り合いがいない」" a="初対面の人の黒歴史を見た瞬間から、もう仲間です。"/>
        <div style={{
          marginTop: 12, padding: '10px 12px', background: 'rgba(255,45,85,.08)',
          border: `1px dashed ${cX.red}`, fontSize: 11, color: cX.dim, lineHeight: 1.7,
        }}>
          <span style={{ color: cX.red, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>[ WARN ] </span>
          成人向け・性的なコンテンツはNG。「笑える恥ずかしさ」の範囲で。
        </div>
      </div>
    </div>
  );
}

function FaqBlock({ q, a }) {
  return (
    <div style={{ marginBottom: 10, padding: '12px 14px', background: cX.surface, border: `1px solid ${cX.border}`, borderRadius: 3 }}>
      <div style={{ color: cX.yellow, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
        Q.
      </div>
      <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 14, color: cX.text, marginBottom: 8 }}>{q}</div>
      <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 13, color: cX.dim, lineHeight: 1.75 }}>{a}</div>
    </div>
  );
}

// 6) APPLY — dossier + CTA
function ScreenApply() {
  return (
    <div style={{ height: '100%', padding: '70px 24px 120px', overflow: 'auto', background: cX.bg }} className="no-sb">
      <SectionHead num="05" jp="DOSSIER" desc="開催概要・申込"/>

      <div style={{ marginTop: 20, background: cX.surface, border: `1px solid ${cX.border}`, padding: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 2 }}>
        {[
          ['DATE', '2026.04.XX (TUE)'],
          ['TIME', '19:00 — 22:00'],
          ['VENUE', 'カメアパ 中庭 / 共用スペース'],
          ['CAPACITY', '10 – 15 人'],
          ['FEE', '¥1,500（軽食・ドリンク込）'],
          ['TARGET', <span key="t">非公開フォルダに何か入ってる人<br/><span style={{ color: cX.dim, fontSize: 10 }}>= 全人類</span></span>],
          ['HOST', '豊田元洋 / カメアパ企画チーム'],
          ['APPLY', <Censored key="a">https://forms.google/xxxx</Censored>],
          ['CONTACT', <Censored key="c">mail@kameapa.jp</Censored>],
          ['DEADLINE', '開催 XX 日前'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, borderBottom: `1px dashed ${cX.border}`, padding: '3px 0' }}>
            <span style={{ color: cX.dim, letterSpacing: 2 }}>{k}</span>
            <span style={{ color: cX.text }}>{v}</span>
          </div>
        ))}
      </div>

      <button data-no-swipe style={{
        marginTop: 20, width: '100%', padding: '18px', background: cX.red,
        color: '#fff', border: 'none', fontFamily: '"Shippori Mincho", serif',
        fontSize: 18, fontWeight: 700, cursor: 'pointer', letterSpacing: 3,
        boxShadow: `0 0 30px ${cX.red}60`, borderRadius: 3,
      }}>
        情けなさを、晒しにいく →
      </button>

      <div style={{ marginTop: 24, padding: '14px 0', borderTop: `1px dashed ${cX.border}`, textAlign: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: cX.dim, letterSpacing: 2 }}>
          KAMEAPA · 2026 · THIS PAGE IS NOT PRIVATE ANYMORE
        </div>
      </div>
    </div>
  );
}

function SectionHead({ num, jp, desc }) {
  return (
    <div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 3,
        color: cX.red, marginBottom: 6,
      }}>
        § {num} · {jp}
      </div>
      <div style={{ fontSize: 13, color: cX.dim, fontFamily: '"Shippori Mincho", serif' }}>
        {desc}
      </div>
    </div>
  );
}

// ─── Top chrome: page indicator / progress ──────────────────
function TopChrome({ i, total, titles }) {
  return (
    <div data-no-swipe style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
      padding: '46px 20px 10px', pointerEvents: 'none',
      background: 'linear-gradient(#09090b 40%, rgba(9,9,11,.9) 80%, transparent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2,
          color: cX.red, fontWeight: 700,
        }}>
          0{i + 1}<span style={{ color: cX.dim }}>/0{total}</span>
        </div>
        <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,.08)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((i + 1) / total) * 100}%`,
            background: cX.red, transition: 'width .35s cubic-bezier(.2,.8,.2,1)',
          }}/>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: cX.dim, letterSpacing: 2,
        }}>{titles[i]}</div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────
function LPSwipe() {
  const screens = [
    { key: 'hero', title: 'HERO', Comp: ScreenHero },
    { key: 'leak', title: 'LEAK', Comp: ScreenLeak },
    { key: 'night', title: 'NIGHT', Comp: ScreenNight },
    { key: 'cats', title: 'PARTS', Comp: ScreenCats },
    { key: 'why', title: 'WHY', Comp: ScreenWhy },
    { key: 'apply', title: 'APPLY', Comp: ScreenApply },
  ];
  const N = screens.length;
  const { i, dx, animating, ref, go, handlers } = usePager(N);

  return (
    <div ref={ref} {...handlers}
      style={{
        width: '100%', height: '100%', overflow: 'hidden', position: 'relative',
        background: cX.bg, touchAction: 'pan-y', userSelect: 'none',
      }}>
      <TopChrome i={i} total={N} titles={screens.map((s) => s.title)}/>

      {/* track */}
      <div style={{
        display: 'flex', width: `${N * 100}%`, height: '100%',
        transform: `translate3d(calc(${-i * (100 / N)}% + ${dx}px), 0, 0)`,
        transition: animating ? 'transform .42s cubic-bezier(.2,.85,.25,1)' : 'none',
      }}>
        {screens.map(({ key, Comp }, idx) => (
          <div key={key} style={{ width: `${100 / N}%`, height: '100%', flexShrink: 0, position: 'relative' }}>
            <Comp go={go} i={idx}/>
          </div>
        ))}
      </div>

      <Dots n={N} i={i} go={(d) => go(d)}/>
    </div>
  );
}

window.LPSwipe = LPSwipe;
