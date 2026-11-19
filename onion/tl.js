// shared timeline (browser + node)
(function (G) {
  const R = 1.0, H = 1.75, FILL = 0.52;
  const SPEC = [[10, 3.0, 1.9], [50, 4.0, 2.4], [100, 4.4, 2.6], [250, 5.0, 3.0], [500, 5.6, 3.4], [1050, 7.2, 4.6]];
  const ENTER = 0.9, HOLD = 0.9, FCARD = 1.8, ENDCARD = 4.2;
  const rounds = []; let t = 0;
  SPEC.forEach(([N, Tc, Tcol], i) => {
    const follower = i === SPEC.length - 1;
    const nx = Math.round(N / 3), ny = Math.round((N - nx) / 2), nz = N - nx - ny;
    const r = { i, N, Tc, Tcol, nx, ny, nz, follower, t0: t };
    r.tCard = follower ? FCARD : 0; r.tEnter = t + r.tCard; r.tCut = r.tEnter + ENTER; r.tCol = r.tCut + Tc; r.tHold = r.tCol + Tcol; r.t1 = r.tHold + (follower ? ENDCARD : HOLD);
    r.real = Math.round((nx + 1) * (ny + 1) * (nz + 1) * FILL);
    rounds.push(r); t = r.t1;
  });
  const TOTAL = t;
  // cut k (1..N) happens at time: accelerating
  const cutTime = (r, k) => r.tCut + r.Tc * Math.pow(k / r.N, 1 / 1.7) * 0.97;
  const cutsAt = (r, tt) => tt < r.tCut ? 0 : tt >= r.tCut + r.Tc * 0.97 ? r.N : Math.min(r.N, Math.floor(r.N * Math.pow((tt - r.tCut) / (r.Tc * 0.97), 1.7)));
  // axis order: x cuts first, then y, then z
  const split = (r, n) => ({ x: Math.min(n, r.nx), y: Math.max(0, Math.min(n - r.nx, r.ny)), z: Math.max(0, n - r.nx - r.ny) });
  const roundAt = (tt) => rounds.find((r) => tt < r.t1) || rounds[rounds.length - 1];
  G.TL = { R, H, rounds, TOTAL, cutTime, cutsAt, split, roundAt, ENTER };
})(typeof window !== 'undefined' ? window : global);
