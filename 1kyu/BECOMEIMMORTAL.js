function modpow(base, exp, mod) {
  let res = 1;
  base %= mod;
  if (base < 0) base += mod;
  while (exp > 0) {
    if (exp % 2 === 1) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return res;
}

function mulmod(a, b, mod) {
  let res = 0;
  a %= mod;
  if (a < 0) a += mod;
  while (b > 0) {
    if (b % 2 === 1) res = (res + a) % mod;
    a = (a * 2) % mod;
    b = Math.floor(b / 2);
  }
  return res;
}

function sum1to(z, t) {
  if (z <= 0) return 0;
  const mod = 2 * t;
  let a = z % mod;
  let b = (z + 1) % mod;
  let p = mulmod(a, b, mod);
  let half = Math.floor(p / 2);
  return half % t;
}

function get_bits(x, BITS) {
  const bits = [];
  for (let p = BITS - 1; p >= 0; p--) {
    const pow = Math.pow(2, p);
    bits.push(Math.floor(x / pow) % 2);
  }
  return bits;
}

function get_count_set_mod(k, lim, t, BITS) {
  if (lim <= 0) return 0;
  const exp = k + 1;
  const half_mod = modpow(2, k, t);
  const bits = get_bits(lim, BITS);
  let floor_mod = 0;
  for (let q = 0; q < BITS; q++) {
    if (bits[q] === 0) continue;
    const orig_p = BITS - 1 - q;
    if (orig_p < exp) continue;
    const power = orig_p - exp;
    const pow_mod = modpow(2, power, t);
    floor_mod = (floor_mod + pow_mod) % t;
  }
  const full_mod = (floor_mod * half_mod) % t;
  let add = 0;
  if (exp > 53) {
    add = Math.max(0, lim - Math.pow(2, k));
  } else {
    const p_pow = Math.pow(2, exp);
    const rem = lim % p_pow;
    add = Math.max(0, rem - Math.pow(2, k));
  }
  const add_mod = add % t;
  return (full_mod + add_mod) % t;
}

function get_total_xor_mod(m, n, t, BITS) {
  const sum_i_mod = mulmod(m % t, sum1to(n - 1, t), t);
  const sum_j_mod = mulmod(n % t, sum1to(m - 1, t), t);
  let sum_and_mod = 0;
  for (let k = 0; k < BITS; k++) {
    const c_n_mod = get_count_set_mod(k, n, t, BITS);
    const c_m_mod = get_count_set_mod(k, m, t, BITS);
    const pow2k_mod = modpow(2, k, t);
    const contrib = mulmod(pow2k_mod, mulmod(c_n_mod, c_m_mod, t), t);
    sum_and_mod = (sum_and_mod + contrib) % t;
  }
  const two_and = (2 * sum_and_mod) % t;
  return (sum_i_mod + sum_j_mod - two_and + 2 * t) % t;
}

function elderAge(m, n, l, t) {
  if (t === 0) return 0;
  const BITS = 53;

  const mbits = get_bits(m - 1, BITS);
  const nbits = get_bits(n - 1, BITS);
  const lbits = get_bits(l, BITS);

  const memo = Array(BITS + 1)
    .fill(null)
    .map(() =>
      Array(2)
        .fill(null)
        .map(() =>
          Array(2)
            .fill(null)
            .map(() => Array(2).fill(null))
        )
    );

  function dp(pos, ti, tj, tv) {
    const cached = memo[pos][ti][tj][tv];
    if (cached !== null) return cached;
    if (pos === BITS) {
      const base = { countMod: 1 % t, sumMod: 0 % t };
      memo[pos][ti][tj][tv] = base;
      return base;
    }

    let res_c = 0;
    let res_s = 0;
    const pow2_mod = modpow(2, BITS - 1 - pos, t);

    const upi = ti ? mbits[pos] : 1;
    const upj = tj ? nbits[pos] : 1;
    const upv = tv ? lbits[pos] : 1;

    for (let bi = 0; bi <= upi; bi++) {
      for (let bj = 0; bj <= upj; bj++) {
        const bv = bi ^ bj;
        if (tv && bv > upv) continue;
        const nti = ti && (bi === mbits[pos]) ? 1 : 0;
        const ntj = tj && (bj === nbits[pos]) ? 1 : 0;
        const ntv = tv && (bv === lbits[pos]) ? 1 : 0;
        const sub = dp(pos + 1, nti, ntj, ntv);
        res_c = (res_c + sub.countMod) % t;
        const add = ( (bv * pow2_mod) % t * sub.countMod ) % t;
        res_s = (res_s + sub.sumMod + add) % t;
      }
    }

    const out = { countMod: res_c, sumMod: res_s };
    memo[pos][ti][tj][tv] = out;
    return out;
  }

  const le = dp(0, 1, 1, 1);
  const count_le_mod = le.countMod;
  const sum_le_mod = le.sumMod;
  const total_pairs_mod = mulmod(m, n, t);
  const count_gt_mod = (total_pairs_mod - count_le_mod + t) % t;
  const total_xor_mod = get_total_xor_mod(m, n, t, BITS);
  const sum_gt_mod = (total_xor_mod - sum_le_mod + t) % t;
  const s_mod = (sum_gt_mod - mulmod(l % t, count_gt_mod, t) + t) % t;
  return s_mod;
}