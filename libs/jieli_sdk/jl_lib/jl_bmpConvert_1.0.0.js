"use strict";
class t {
  toData() {
    const t = new Uint8Array(4),
      e = new Uint32Array(1);
    if (this.addr && this.len) {
      const t = (2097151 & this.addr) + ((2047 & this.len) << 21);
      e[0] = t
    }
    return t.set(new Uint8Array(e.buffer)), t
  }
}
class e {
  toData() {
    const t = new Uint8Array(16);
    let e = 0;
    this.magic && t.set(this.magic, e), e += 4;
    const n = new Uint16Array(4);
    this.version && (n[0] = this.version), this.bPanelType && (n[1] = this.bPanelType), this.totalpage && (n[2] = this.totalpage), this.Reserved && (n[3] = this.Reserved), t.set(new Uint8Array(n.buffer), e), e += n.buffer.byteLength;
    const r = new Uint32Array(1);
    return this.resver && (r[0] = this.resver), t.set(new Uint8Array(r.buffer), e), e += r.buffer.byteLength, t
  }
}
class n {
  toData() {
    const t = new Uint8Array(8);
    let e = 0;
    const n = new Uint32Array(2);
    return this.pagenum && (n[0] = this.pagenum), this.pageaddr && (n[1] = this.pageaddr), t.set(new Uint8Array(n.buffer), e), e += n.buffer.byteLength, t
  }
}
class r {
  toData() {
    const t = new Uint8Array(12);
    let e = 0;
    const n = new Uint32Array(1);
    this.dwOffset && (n[0] = this.dwOffset), t.set(new Uint8Array(n.buffer), e), e += n.buffer.byteLength;
    const r = new Uint16Array(1);
    this.wCount && (r[0] = this.wCount), t.set(new Uint8Array(r.buffer), e), e += r.buffer.byteLength, this.bItemType && (t[e] = this.bItemType), e++, this.langsum && (t[e] = this.langsum), e++;
    const s = new Uint32Array(1);
    return this.language && (s[0] = this.language), t.set(new Uint8Array(s.buffer), e), e += s.buffer.byteLength, t
  }
}
class s {
  toData() {
    const t = new Uint8Array(12);
    let e = 0;
    const n = new Uint32Array(3);
    return this.nNum && (n[0] = this.nNum), this.dwOffset && (n[1] = this.dwOffset), this.dwLength && (n[2] = this.dwLength), t.set(new Uint8Array(n.buffer), e), e += n.buffer.byteLength, t
  }
}
class a {
  toData() {
    const t = new Uint8Array(20);
    let e = 0;
    const n = new Uint16Array(6);
    this.head_crc && (n[0] = this.head_crc), this.data_crc && (n[1] = this.data_crc), this.res_type && (n[2] = this.res_type), this.type_id && (n[3] = this.type_id), this.wWidth && (n[4] = this.wWidth), this.wHeight && (n[5] = this.wHeight), t.set(new Uint8Array(n.buffer), e), e += n.buffer.byteLength;
    const r = new Uint32Array(2);
    return this.dwLength && (r[0] = this.dwLength), this.dwOffset && (r[1] = this.dwOffset), t.set(new Uint8Array(r.buffer), e), e += r.buffer.byteLength, t
  }
}
var o;
! function (t) {
  t[t.PIXEL_FMT_ARGB8888 = 0] = "PIXEL_FMT_ARGB8888", t[t.PIXEL_FMT_RGB888 = 1] = "PIXEL_FMT_RGB888", t[t.PIXEL_FMT_RGB565 = 2] = "PIXEL_FMT_RGB565", t[t.PIXEL_FMT_L8 = 3] = "PIXEL_FMT_L8", t[t.PIXEL_FMT_AL88 = 4] = "PIXEL_FMT_AL88", t[t.PIXEL_FMT_AL44 = 5] = "PIXEL_FMT_AL44", t[t.PIXEL_FMT_A8 = 6] = "PIXEL_FMT_A8", t[t.PIXEL_FMT_L1 = 7] = "PIXEL_FMT_L1", t[t.PIXEL_FMT_ARGB8565 = 8] = "PIXEL_FMT_ARGB8565", t[t.PIXEL_FMT_OSD16 = 9] = "PIXEL_FMT_OSD16", t[t.PIXEL_FMT_SOLID = 10] = "PIXEL_FMT_SOLID", t[t.PIXEL_FMT_JPEG = 11] = "PIXEL_FMT_JPEG", t[t.PIXEL_FMT_AUTO = 12] = "PIXEL_FMT_AUTO", t[t.PIXEL_FMT_UNKNOW = 13] = "PIXEL_FMT_UNKNOW"
}(o || (o = {}));
var f, i = 1,
  w = 3;

function l(t, e, n) {
  return 65535 & (t << 8 & 63488 | e << 3 & 2016 | n >> 3)
}
var h = 2147483647;

function c(t, e, n) {
  let r = 0,
    s = n;
  return r = 1 == e ? t[s] : 2 == e ? t[s] | t[s + 1] << 8 : 3 == e ? t[s] | t[s + 1] << 8 | t[s + 2] << 16 : t[s] | t[s + 1] << 8 | t[s + 2] << 16 | t[s + 3] << 24, r &= 4294967295, r
}

function d(t, e, n, r) {
  let s, a = 0,
    o = r;
  for (s = c(t, n, o); e--;) {
    if (c(t, n, o) == s ? a++ : a = 0, a >= w) return 1;
    if ((o - r) / n == w) break;
    o += n
  }
  return 0
}

function u(t, e, n, r) {
  let s, a = 0,
    o = r;
  for (s = c(t, n, o); e--;) {
    if (c(t, n, o) != s) return a;
    if (a++, 127 == a) return a;
    o += n
  }
  return a
}

function g(t, e, n, r) {
  let s, a = r,
    o = 0,
    f = 0;
  for (s = c(t, n, a); e--;) {
    if (c(t, n, a) == s) {
      if (o++, o == w) return a += n, Math.trunc((a - r + 1 - o * n) / n)
    } else s = c(t, n, a), o = 1;
    if (a += n, f++, 127 == f) return f
  }
  return (a - r) / n
}

function y(t, e, n, r, s, a, o) {
  let f, i, w = a,
    l = 0;
  for (i = e / s; i > 0;) {
    let e = 0;
    if (d(t, i, s, w)) {
      if (l + 1 + s > r) return -1;
      e = u(t, i, s, w), n ? (n[o + l++] = 128 | e, 1 == s ? n[o + l++] = t[w] : 2 == s ? (n[o + l++] = t[w], n[o + l++] = t[w + 1]) : 3 == s ? (n[o + l++] = t[w], n[o + l++] = t[w + 1], n[o + l++] = t[w + 2]) : (n[o + l++] = t[w], n[o + l++] = t[w + 1], n[o + l++] = t[w + 2], n[o + l++] = t[w + 3])) : (l++, l += s), w += e * s, i -= e
    } else {
      if (e = g(t, i, s, w), l + 1 + e * s > r) return -1;
      for (n ? n[o + l++] = e : l++, f = 0; f < e; f++) n ? 1 == s ? n[o + l++] = t[w] : 2 == s ? (n[o + l++] = t[w], n[o + l++] = t[w + 1]) : 3 == s ? (n[o + l++] = t[w], n[o + l++] = t[w + 1], n[o + l++] = t[w + 2]) : (n[o + l++] = t[w], n[o + l++] = t[w + 1], n[o + l++] = t[w + 2], n[o + l++] = t[w + 3]) : l += s, w += s;
      i -= e
    }
  }
  return l
}

function _(t, e, n) {
  let r, s, a = n,
    o = [0, 4129, 8258, 12387, 16516, 20645, 24774, 28903, 33032, 37161, 41290, 45419, 49548, 53677, 57806, 61935];
  for (r = 0; 0 != e--;) s = r >> 12, r <<= 4, r &= 65535, r ^= o[s ^ Math.trunc(t[a] / 16)], s = r >> 12, r <<= 4, r &= 65535, r ^= o[s ^ 15 & t[a]], a++;
  return r
}

function L(t, o, i, w, c, d) {
  let u, g, L, b = o,
    A = i,
    U = d,
    p = new Uint8Array(b * A * 2);
  for (u = (32 * b + 31) / 32 * 4, L = 0; L < A; L++) {
    let e = L * u + U,
      n = L * b * 2;
    for (g = 0; g < b; g++) {
      let r, s, a, o;
      a = t[e], s = t[e + 1], r = t[e + 2], o = l(r, s, a), p[n] = o >> 8, p[n + 1] = o, e += 4, n += 2
    }
  }
  const O = 8 * A;
  let T = O;
  for (L = 0; L < A; L++) T += y(p, 2 * b, f, h, 2, L * b * 2, 0);
  let I = new Uint8Array(4 + T),
    P = 4,
    m = T - O,
    C = 0;
  for (L = 0; L < A; L++) {
    let t = y(p, 2 * b, I, m, 2, L * b * 2, C + O + 4);
    const e = new Uint32Array(2);
    e[0] = O + C, e[1] = t, I.set(new Uint8Array(e.buffer), P), C += t, m -= t, P += 8
  }
  let D, M, E, F, X = 4 + O + C,
    R = ["R".charCodeAt(0), "U".charCodeAt(0), "2".charCodeAt(0), "1".charCodeAt(0)];
  D = new e, D.magic = new Uint8Array(R), D.version = 257, D.bPanelType = 1, D.totalpage = 1, D.Reserved = 0;
  let v = 16 + 8 * D.totalpage;
  M = new n, M.pagenum = 0, M.pageaddr = v, v += 24, F = new r, F.dwOffset = v, F.wCount = 1, F.bItemType = "T".charCodeAt(0), F.langsum = 0, F.language = 0, v += 12 * F.wCount, E = new r, E.dwOffset = v, E.wCount = 1, E.bItemType = "P".charCodeAt(0), E.langsum = 0, E.language = 0, v += 20 * E.wCount;
  let G = new s;
  G.nNum = 256, G.dwOffset = E.dwOffset + 20 * E.wCount, G.dwLength = 4 * G.nNum;
  let N = new a;
  N.type_id = 12289, N.wWidth = b, N.wHeight = A, N.dwLength = X, N.dwOffset = G.dwOffset + G.dwLength, N.res_type = 0, N.data_crc = _(I, X, 0), N.head_crc = _(N.toData(), 18, 2);
  const B = new Uint32Array(256);
  if (w && w.set(new Uint8Array(B.buffer), G.dwOffset), w) {
    const t = I.slice(0, X);
    w.set(t, N.dwOffset)
  }
  if (w) {
    let t = 0,
      e = D.toData();
    w.set(e, t), t += e.byteLength, e = M.toData(), w.set(e, t), t += e.byteLength, e = F.toData(), w.set(e, t), t += e.byteLength, e = E.toData(), w.set(e, t), t += e.byteLength, w.set(N.toData(), E.dwOffset), w.set(G.toData(), F.dwOffset)
  }
  return N.dwOffset + N.dwLength
}

function b(w, c, d, u, g, L) {
  let b, A, U, p = c,
    O = d,
    T = L,
    I = new Uint8Array(p * O * 2);
  for (b = 4 * Math.trunc((32 * p + 31) / 32), U = 0; U < O; U++) {
    let t = U * b + T,
      e = U * p * 2;
    for (A = 0; A < p; A++) {
      let n, r, s, a;
      s = w[t], r = w[t + 1], n = w[t + 2], a = l(n, r, s), I[e] = a >> 8, I[e + 1] = a, t += 4, e += 2
    }
  }
  let P = 4 * O,
    m = P;
  for (U = 0; U < O; U++) m += y(I, 2 * p, f, h, 2, U * p * 2, 0);
  let C = new Uint8Array(m),
    D = 0,
    M = m - P,
    E = 0;
  for (U = 0; U < O; U++) {
    let e = y(I, 2 * p, C, M, 2, U * p * 2, E + P + 0);
    const n = new t;
    n.addr = P + E, n.len = e, C.set(n.toData(), D), E += e, M -= e, D += 4
  }
  console.log(" headlen : " + P), console.log(" rle_offset : " + E);
  let F = P + E;
  if (1 == u) {
    let t, f, w, l, h = ["R".charCodeAt(0), "U".charCodeAt(0), "3".charCodeAt(0), "0".charCodeAt(0)];
    t = new e, t.magic = new Uint8Array(h), t.version = 768, t.bPanelType = 1, t.totalpage = 1, t.Reserved = 0;
    let c = 16 + 8 * t.totalpage;
    f = new n, f.pagenum = 0, f.pageaddr = c, c += 24, l = new r, l.dwOffset = c, l.wCount = 1, l.bItemType = "T".charCodeAt(0), l.langsum = 0, l.language = 0, c += 12 * l.wCount, w = new r, w.dwOffset = c, w.wCount = 1, w.bItemType = "P".charCodeAt(0), w.langsum = 0, w.language = 0, c += 20 * w.wCount;
    let d = new s;
    d.nNum = 256, d.dwOffset = w.dwOffset + 20 * w.wCount, d.dwLength = 4 * d.nNum;
    let u = new a;
    u.type_id = (7 & i) << 13 | (15 & o.PIXEL_FMT_RGB565) << 9 | 1, u.wWidth = p, u.wHeight = O, u.dwLength = F, u.dwOffset = d.dwOffset + d.dwLength, u.res_type = 0, u.data_crc = _(C, F, 0), u.head_crc = _(u.toData(), 18, 2);
    const y = new Uint32Array(256);
    if (g && g.set(new Uint8Array(y.buffer), d.dwOffset), g) {
      const t = C.slice(0, F);
      g.set(t, u.dwOffset)
    }
    if (g) {
      let e = 0,
        n = t.toData();
      g.set(n, e), e += n.byteLength, console.log("reshead :  " + e), n = f.toData(), g.set(n, e), e += n.byteLength, console.log("respage :  " + e), n = l.toData(), g.set(n, e), e += n.byteLength, console.log("res_pal :  " + e), n = w.toData(), g.set(n, e), e += n.byteLength, console.log("res_bmp :  " + e), g.set(u.toData(), w.dwOffset), console.log("bmp :  " + w.dwOffset), g.set(d.toData(), l.dwOffset), console.log("pal :  " + l.dwOffset), console.log("pal :  ", d.toData())
    }
    return u.dwOffset + u.dwLength
  }
  if (g) {
    const t = C.slice(0, F);
    g.set(t, 0)
  }
  return F
}

function A(w, c, d, u, g, L) {
  let b, A, U, p = c,
    O = d,
    T = L,
    I = new Uint8Array(p * O * 3);
  for (b = 4 * Math.trunc((32 * p + 31) / 32), U = 0; U < O; U++) {
    let t = U * b + T,
      e = U * p * 3;
    for (A = 0; A < p; A++) {
      let n, r, s, a, o;
      s = w[t], r = w[t + 1], n = w[t + 2], a = w[t + 3], o = l(n, r, s), I[e] = a, I[e + 1] = o >> 8, I[e + 2] = o, t += 4, e += 3
    }
  }
  const P = 4 * O;
  let m = P;
  for (console.log("nbytes : " + m), U = 0; U < O; U++) m += y(I, 3 * p, f, h, 3, U * p * 3, 0);
  let C = new Uint8Array(m),
    D = 0,
    M = m - P;
  console.log("headlen " + P);
  let E = 0;
  for (U = 0; U < O; U++) {
    let e = y(I, 3 * p, C, M, 3, U * p * 3, E + P + 0);
    const n = new t;
    n.addr = P + E, n.len = e, C.set(n.toData(), D), E += e, M -= e, D += 4
  }
  let F = P + E;
  if (1 == u) {
    let t, f, w, l, h = ["R".charCodeAt(0), "U".charCodeAt(0), "3".charCodeAt(0), "0".charCodeAt(0)];
    t = new e, t.magic = new Uint8Array(h), t.version = 768, t.bPanelType = 1, t.totalpage = 1, t.Reserved = 0;
    let c = 16 + 8 * t.totalpage;
    f = new n, f.pagenum = 0, f.pageaddr = c, c += 24, l = new r, l.dwOffset = c, l.wCount = 1, l.bItemType = "T".charCodeAt(0), l.langsum = 0, l.language = 0, c += 12 * l.wCount, w = new r, w.dwOffset = c, w.wCount = 1, w.bItemType = "P".charCodeAt(0), w.langsum = 0, w.language = 0, c += 20 * w.wCount;
    let d = new s;
    d.nNum = 256, d.dwOffset = w.dwOffset + 20 * w.wCount, d.dwLength = 4 * d.nNum;
    let u = new a;
    u.type_id = (7 & i) << 13 | (15 & o.PIXEL_FMT_RGB565) << 9 | 1, u.wWidth = p, u.wHeight = O, u.dwLength = F, u.dwOffset = d.dwOffset + d.dwLength, u.res_type = 0, u.data_crc = _(C, F, 0), u.head_crc = _(u.toData(), 18, 2);
    const y = new Uint32Array(256);
    if (g && (g.set(new Uint8Array(y.buffer), d.dwOffset), console.log(" pal.dwOffset : " + d.dwOffset)), g) {
      const t = C.slice(0, F);
      g.set(t, u.dwOffset), console.log(" bmp.dwOffset : " + u.dwOffset)
    }
    if (g) {
      let e = 0,
        n = t.toData();
      g.set(n, e), e += n.byteLength, console.log("reshead :  " + e), n = f.toData(), g.set(n, e), e += n.byteLength, console.log("respage :  " + e), n = l.toData(), g.set(n, e), e += n.byteLength, n = w.toData(), g.set(n, e), e += n.byteLength, g.set(u.toData(), w.dwOffset), g.set(d.toData(), l.dwOffset)
    }
    return u.dwOffset + u.dwLength
  }
  if (g) {
    const t = C.slice(0, F);
    g.set(t, 0)
  }
  return F
}
exports.bmpConvert = function (t, e, n, r) {
  let s;
  switch (t) {
    case 0:
      s = function (t, e, n) {
        if (t.byteLength != e * n * 4) return;
        let r = L(t, e, n, f, 0, 0);
        console.log("need_bytes = " + r);
        const s = new Uint8Array(r);
        return L(t, e, n, s, 0, 0), s
      }(e, n, r);
      break;
    case 1:
      s = function (t, e, n) {
        if (t.byteLength != e * n * 4) return;
        let r = b(t, e, n, 1, f, 0);
        console.log("br28_btm_to_res_path need_bytes = " + r);
        const s = new Uint8Array(r);
        return b(t, e, n, 1, s, 0), s
      }(e, n, r);
      break;
    case 2:
      s = function (t, e, n) {
        if (t.byteLength != e * n * 4) return;
        let r = A(t, e, n, 1, f, 0);
        console.log("need_bytes = " + r);
        const s = new Uint8Array(r);
        return A(t, e, n, 1, s, 0), s
      }(e, n, r);
      break;
    case 3:
      s = function (t, e, n) {
        if (t.byteLength != e * n * 4) return;
        let r = b(t, e, n, 0, f, 0);
        console.log("need_bytes = " + r);
        const s = new Uint8Array(r);
        return b(t, e, n, 0, s, 0), s
      }(e, n, r);
      break;
    case 4:
      s = function (t, e, n) {
        if (t.byteLength != e * n * 4) return;
        let r = A(t, e, n, 0, f, 0);
        console.log("need_bytes = " + r);
        const s = new Uint8Array(r);
        return A(t, e, n, 0, s, 0), s
      }(e, n, r)
  }
  return s
};