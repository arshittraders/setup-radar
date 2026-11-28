"""Long-form episode plan (8–10 min, 16:9) built from the ballsim physics formats.
usage: python3 long/plan.py <seed> <episode_no> <next_label> > plan.json
Chapter rule text: CAPS words are shown in red on the left panel."""
import json, random, sys

FMTS = {
    'grow':     ('Every bounce GROWS the ball.', 'Will it fill the circle COMPLETELY?', 'Every bounce grows the ball'),
    'overflow': ('The blade SPLITS every ball it hits.', 'Will the arena OVERFLOW?', 'The blade splits every ball'),
    'rings':    ('Every hit breaks a RING.', 'Can the ball BREAK FREE?', 'Can it break free?'),
    'takeover': ('Two colours fight for every tile.', 'Who TAKES OVER the board?', 'Colour takeover'),
    'lastin':   ('Balls escape through the GAP.', 'Which one is the LAST inside?', 'Last ball inside wins'),
    'race':     ('Marble race. Two laps.', 'Which marble finishes FIRST?', 'Marble race'),
    'plinko':   ('Hundreds of balls drop.', 'Which colour gets the MOST?', 'Which colour gets the most?'),
    'breakout': ('One ball. One wall.', 'Can it CLEAR every brick?', 'Can one ball clear the wall?'),
    'hex':      ('Every ESCAPE spawns new balls.', 'Can it reach 100?', 'Every escape spawns more balls'),
    'floors':   ('1 ball vs 10,000.', 'Which side WINS?', '1 ball vs 10,000'),
}
N_RENDER = 14   # rendered in parallel; compose keeps 8–10 min of them


def make(seed, ep, next_label):
    r = random.Random(int(seed) * 31 + int(ep))
    pool = list(FMTS) * 2
    r.shuffle(pool)
    out = []
    while pool and len(out) < N_RENDER:   # no format twice in a row
        for i, f in enumerate(pool):
            if not out or out[-1] != f:
                out.append(pool.pop(i)); break
        else:
            out.append(pool.pop(0))
    chapters = [{'i': i, 'format': f, 'line1': FMTS[f][0], 'line2': FMTS[f][1], 'short': FMTS[f][2], 'seed': r.randrange(1, 10**6)} for i, f in enumerate(out)]
    return {'seed': int(seed), 'episode': int(ep), 'next': next_label.upper(), 'chapters': chapters}


if __name__ == '__main__':
    print(json.dumps(make(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 1, sys.argv[3] if len(sys.argv) > 3 else 'WEDNESDAY'), indent=1))
