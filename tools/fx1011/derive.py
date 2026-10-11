#!/usr/bin/env python3
"""2026-10-11 Chapter 1 の画像演出（ZIP MysticMonsters_Ch1_21Images_FX_Handoff_20261011）の表示用の派生を作る。
原本（JPEG・市松が焼き込み）は読むだけ（編集・上書きしない。リポジトリには置かない）。

使い方: python3 -I tools/fx1011/derive.py <原本のフォルダ> <bc05 の原本> <出力の assets/ のルート>

透過化（assets/battle/common/README.md の手順＝ユーザー承認 2026-10-03 と同じ考え方）:
 1. 明るい無彩色の画素（市松の白・灰）を候補にし、縁からつながる候補を「背景」とする
 2. 背景の画素の色をほかの画素へ広げて、画素ごとの背景色 B を作る
 3. 背景色との差から透明度を出す（color to alpha）。色は背景を引いて戻す
 4. 縁につながらない明るい無彩色（メダルの石の面・白く光る中心）は本体として不透明
 5. mode 'disc'（メダル）は外形の内側を不透明にする（石の面が透けない）
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def _trans(g, neutral, thr):
    W = g > thr
    cx = ((W[:, 1:] != W[:, :-1]) & neutral[:, 1:] & neutral[:, :-1]).sum(0).astype(float)
    cy = ((W[1:, :] != W[:-1, :]) & neutral[1:, :] & neutral[:-1, :]).sum(1).astype(float)
    return W, cx, cy

def _fit(c, k):
    """線の位置（遷移の数 c）から市松の1マスの大きさ P と位相を求める（k＝おおよその P）"""
    L = len(c); x = np.arange(L); best = None
    for P in np.arange(k - 1.0, k + 1.0, 0.005):
        ph = np.arange(0, P, 0.1)
        d = (x[None, :] - ph[:, None]) % P; d = np.minimum(d, P - d)
        sc = (c[None, :] * np.exp(-(d ** 2) / 0.5)).sum(1); i = int(np.argmax(sc))
        if best is None or sc[i] > best[0]: best = (sc[i], P, ph[i])
    return best[1], best[2]

def _grid(g, neutral):
    v = g[neutral]; thr = (np.percentile(v, 85) + np.percentile(v, 15)) / 2
    W, cx, cy = _trans(g, neutral, thr)
    cc = cx - cx.mean(); ac = np.array([(cc[:-k] * cc[k:]).sum() for k in range(1, 40)])
    k0 = int(np.argmax(ac[6:30])) + 7
    best = None
    for k in sorted({k0, k0 / 2}):           # 白と灰の1組の周期を拾ったときは半分（1マス）も試す
        if k < 6: continue
        gx, gy = _fit(cx, k), _fit(cy, k)
        par = _par(g.shape, gx, gy)
        ag = ((W == (par == 0)) & neutral).sum() / neutral.sum(); ag = max(ag, 1 - ag)
        if best is None or ag > best[0] + 0.02: best = (ag, gx, gy)
    return best

def _par(shape, gx, gy):
    X = np.arange(shape[1]) + 0.5; Y = np.arange(shape[0]) + 0.5
    ix = np.floor((X - gx[1]) / gx[0]).astype(int); iy = np.floor((Y - gy[1]) / gy[0]).astype(int)
    return (iy[:, None] + ix[None, :]) % 2

def cutout(im, mode='fx', tol=7.0):
    """市松を画素ごとに作り直して取り除く。mode 'disc'＝メダル（外形の内側は不透明）"""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    H, Wd = a.shape[:2]
    g = a.mean(2); sat = a.max(2) - a.min(2); neutral = (sat < 14) & (g > 190)
    ag, gx, gy = _grid(g, neutral)
    X = np.arange(Wd) + 0.5; Y = np.arange(H) + 0.5
    fx = (X - gx[1]) / gx[0]; fy = (Y - gy[1]) / gy[0]
    ix = np.floor(fx).astype(int); iy = np.floor(fy).astype(int)
    ux = fx - ix; uy = fy - iy
    inner = ((ux > 0.18) & (ux < 0.82))[None, :] & ((uy > 0.18) & (uy < 0.82))[:, None]
    par = (iy[:, None] + ix[None, :]) % 2
    cid = (iy - iy.min())[:, None] * (ix.max() - ix.min() + 1) + (ix - ix.min())[None, :]
    n = int(cid.max()) + 1
    # マスごとの灰色（そのマスの内側の無彩色の中央値に近い値＝平均）。見えないマスは同じ側のマスの中央値
    m = (neutral & inner).ravel(); cnt = np.bincount(cid.ravel(), weights=m, minlength=n)
    tot = np.bincount(cid.ravel(), weights=inner.ravel(), minlength=n)
    sm = np.bincount(cid.ravel(), weights=(g * (neutral & inner)).ravel(), minlength=n)
    cellv = np.where(cnt > 0.6 * np.maximum(tot, 1), sm / np.maximum(cnt, 1), np.nan)
    pc = np.zeros(n, int); pc[cid.ravel()] = par.ravel()
    med = [np.nanmedian(cellv[pc == p]) for p in (0, 1)]
    medc = np.where(pc == 0, med[0], med[1])
    cellv = np.where(np.isnan(cellv) | (np.abs(cellv - medc) > 6), medc, cellv)   # 光に覆われたマスは信じない（同じ側の中央値）
    B = cellv[cid]
    # マスの境目（にじみ・細い線）は、はっきり背景の所で実際に見える明るさ
    edge = ~inner
    hi = max(med); lo = min(med)
    def c2a(Bv):
        Bv = Bv[..., None]
        up = np.where(a >= Bv, (a - Bv) / np.maximum(255 - Bv, 1), (Bv - a) / np.maximum(Bv, 1))
        return np.clip((up.max(2) - 0.05) / 0.95, 0, 1)
    B3 = B[..., None]
    al = c2a(B)
    edgeN = edge & (sat < 14)                                      # 色の付いた光の中の境目は除く（光に縁取りの影を作らない）
    # マスの境目（JPEG のにじみ・細い明るい線）：隣のマスの色・その中間・白の線のうち、いちばん透明になるもの
    for dy_, dx_ in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        Bn = np.roll(np.roll(B, dy_ * int(round(gy[0] * 0.5)), 0), dx_ * int(round(gx[0] * 0.5)), 1)
        for cand_ in (Bn, (B + Bn) / 2):
            al = np.where(edgeN, np.minimum(al, c2a(cand_)), al)
    al = np.where(edgeN, np.minimum(al, c2a(np.full_like(B, hi))), al)
    dev = np.abs(a - B3).max(2)
    hp = 0 if med[0] >= med[1] else 1                      # 白い側のマス
    # 白いマスの上の明るい画素は白との差が小さく透明度が決まらない＝灰色のマスで見えている透明度を補間する
    sig = 0.5 * gx[0]
    sp = ((par != hp) & inner).astype(np.float32)
    w = ndi.gaussian_filter(sp, sig); A = ndi.gaussian_filter(al * sp, sig) / np.maximum(w, 1e-4)
    light = (par == hp) & (g >= lo - 2) & (sat < 60)
    al = np.where(light & (w > 0.05), A, al)
    # 純粋な背景：市松とほぼ同じ無彩色で、画像の縁からつながる所
    flat = neutral & (al < 0.14)                                 # 白いマスは補間した透明度で判断（白い光の下の白いマスを背景にしない）
    lab, k = ndi.label(flat)
    edg = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    szs = np.bincount(lab.ravel()); big = np.nonzero(szs > 1.5 * gx[0] * gy[0])[0]
    pure = np.isin(lab, np.union1d(edg[edg > 0], big[big > 0]))   # 絵に囲まれた市松の溜まり（1.5マス以上）も背景
    al[pure] = 0
    # 背景を消したあとの灰色のマスから、白いマスの透明度をもう一度補間する（光の外側で白いマスだけが残らない）
    A = ndi.gaussian_filter(al * sp, sig) / np.maximum(w, 1e-4)
    al = np.where(light & (w > 0.05), A, al)
    al[neutral & (al < 0.1)] = 0
    # 市松の名残（マスの色と一緒に交互に変わる透明度）を引く：明るく平らなマスで、四方のマスより透明度が高い分
    ny, nx = iy.max() - iy.min() + 1, ix.max() - ix.min() + 1
    cin = (cid * 1).ravel(); wi = inner.ravel().astype(float)
    cm = np.bincount(cin, weights=(al.ravel() * wi), minlength=n) / np.maximum(np.bincount(cin, weights=wi, minlength=n), 1)
    lf = np.bincount(cin, weights=((light | (neutral & (g > lo - 4))).ravel() * wi), minlength=n) / np.maximum(np.bincount(cin, weights=wi, minlength=n), 1)
    sd = np.sqrt(np.maximum(np.bincount(cin, weights=(al.ravel() ** 2 * wi), minlength=n) / np.maximum(np.bincount(cin, weights=wi, minlength=n), 1) - cm ** 2, 0))
    G = cm[:ny * nx].reshape(ny, nx); Gp = np.pad(G, 1, mode='edge')
    nm = (Gp[:-2, 1:-1] + Gp[2:, 1:-1] + Gp[1:-1, :-2] + Gp[1:-1, 2:]) / 4
    ex = np.clip(G - nm, 0, 1).ravel()
    ok = (lf[:ny * nx] > 0.7) & (sd[:ny * nx] < 0.18) & (ex > 0.04)
    exs = np.zeros(n); exs[:ny * nx] = np.where(ok, ex, 0)
    al = np.clip(al - exs[cid] * (light | neutral), 0, 1)
    if mode == 'fx':   # 薄い白い光（市松と見分けられない所）は残さない＝色の付いた光と絵は残す。白いハローが少し弱くなる（自動の除去の限界）
        Fc = np.clip(B3 + (a - B3) / np.maximum(al, 1e-3)[..., None], 0, 255); fs = Fc.max(2) - Fc.min(2)
        al = np.where((al < 0.5) & (fs < 40), np.clip((al - 0.3) / 0.2, 0, 1) * al, al)
    al = np.clip((al - 0.08) / 0.92, 0, 1)                      # ごく薄いかす（背景の推定のずれ）を切る
    # 細い線・点のかす（格子のずれ・JPEG のにじみ）を消す：薄い画素の小さな塊・幅1〜2画素の線
    weak = (al > 0) & (al < 0.35)
    keep = ndi.binary_opening(al > 0.02, iterations=2) | (al >= 0.35)
    al = np.where(weak & ~keep, 0, al)
    lab, k = ndi.label(al > 0.02)
    if k:
        mx = ndi.maximum(al, lab, index=np.arange(1, k + 1)); sz = np.bincount(lab.ravel())[1:]
        bad = np.zeros(k + 1, bool); bad[1:] = ((mx < 0.4) & (sz < 400)) | (sz < 0.5 * gx[0] * gy[0])
        al[bad[lab]] = 0
    # マスの境目の細い線のかす（格子の予測が1画素ずれた所）：境目の帯で、太さ2画素以下のもの
    al = np.where(edge & (sat < 14) & ~ndi.binary_opening(al > 0.02, iterations=2), 0, al)
    if mode == 'disc':
        body = ndi.binary_fill_holes(al > 0.35)
        body = ndi.binary_opening(body, iterations=2)
        body = ndi.binary_fill_holes(body)
        core = ndi.binary_erosion(body, iterations=3)
        al = np.where(core, 1.0, al)
        lab, k = ndi.label(body)
        if k > 1:   # いちばん大きな塊（メダル）だけ
            sz = np.bincount(lab.ravel()); sz[0] = 0
            al = np.where(lab == np.argmax(sz), al, np.where(ndi.binary_dilation(lab == np.argmax(sz), iterations=3), al, 0))
    safe = np.maximum(al, 1e-3)[..., None]
    F = np.clip(B3 + (a - B3) / safe, 0, 255)
    F = np.where(al[..., None] > 0.995, a, F)
    out = Image.fromarray(np.dstack([F, al * 255]).astype(np.uint8), 'RGBA')
    out.info['grid'] = (round(float(gx[0]), 3), round(float(gy[0]), 3), round(float(ag), 3))
    return out

def trim(im, pad=4):
    bb = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
    if not bb: return im
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))

def fit(im, longest):
    s = longest / max(im.size)
    return im if s >= 1 else im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)

# id → (原本, 出力, モード, 長辺)
JOBS = {
    'EV01_rival_title': ('file_1791017091062(1).jpeg', 'chapter/fx_1011/ev01_rival_title.webp', 'opaque', 1536),
    'EV04_rare_zone_marker': ('file_1790946468545(3).jpeg', 'chapter/fx_1011/ev04_rare_marker.webp', 'fx', 512),
    'EV05_gold_burst': ('file_1790946444201(2).jpeg', 'chapter/fx_1011/ev05_gold_burst.webp', 'fx', 640),
    'EV07_hourglass_10': ('file_1790946191861(2).jpeg', 'chapter/fx_1011/ev07_hourglass_10.webp', 'fx', 640),
    'EV08_hourglass_5': ('file_1790946199612(2).jpeg', 'chapter/fx_1011/ev08_hourglass_5.webp', 'fx', 640),
    'EV09_hourglass_1': ('file_1790946201667(2).jpeg', 'chapter/fx_1011/ev09_hourglass_1.webp', 'fx', 640),
}
TOPS = {
    'TOP01_life_yellow': 'file_1790817684777(6).jpeg', 'TOP02_power_red': 'file_1790826884875(3).jpeg',
    'TOP03_intelligence_green': 'file_1790826887730(3).jpeg', 'TOP04_accuracy_pink': 'file_1790826889415(3).jpeg',
    'TOP05_evasion_cyan': 'file_1790826891263(3).jpeg', 'TOP06_toughness_blue': 'file_1790826893187(3).jpeg',
    'TOP07_wild_claws': 'file_1790827328362(3).jpeg', 'TOP08_treasure_chest': 'file_1790827331081(3).jpeg',
    'TOP09_rest_campfire': 'file_1790827333690(3).jpeg', 'TOP10_rival_swords': 'file_1790827335965(4).jpeg',
    'TOP11_event_magic': 'file_1790827338067(3).jpeg', 'TOP12_rare_dragon': 'file_1790828044849(3).jpeg',
}

def main():
    src, bc05, out = sys.argv[1], sys.argv[2], sys.argv[3]
    only = set(sys.argv[4].split(',')) if len(sys.argv) > 4 else None
    rep = {}
    def save(im, rel, q=86):
        p = os.path.join(out, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
        im.save(p, 'WEBP', quality=q, method=6, exact=False); rep[rel] = [im.width, im.height, os.path.getsize(p)]
    for k, (f, rel, mode, L) in JOBS.items():
        if only and k not in only: continue
        im = Image.open(os.path.join(src, f))
        if mode == 'opaque': save(fit(im.convert('RGB'), L), rel, 82)
        else:
            c = cutout(im, mode); rep[rel + ' grid'] = c.info['grid']; save(fit(trim(c), L), rel)
    if not only or 'EV06' in only:   # EV06＝既存 bc05 の原本と同一（sha256）＝bc05 から派生を作る
        save(fit(trim(cutout(Image.open(bc05), 'fx')), 768), 'chapter/fx_1011/ev06_rival_clash.webp')
    for k, f in TOPS.items():         # マスの上面の元（メダル全体の透過）。上面への投影は別の段階
        if only and k not in only: continue
        save(fit(trim(cutout(Image.open(os.path.join(src, f)), 'disc')), 512), 'fields/ch1a/tiles_top_1011/src/' + k.lower() + '.webp', 88)
    print(json.dumps(rep, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
