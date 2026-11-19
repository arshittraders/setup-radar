import json, sys
d = json.load(open(sys.argv[1]))
print('title', d.get('title'), 'dur', d.get('duration'))
h = d.get('heatmap') or []
print('heatmap points', len(h))
top = sorted(h, key=lambda x: -x['value'])[:15]
for x in sorted(top, key=lambda x: x['start_time']):
    print(int(x['start_time']), int(x['end_time']), round(x['value'], 3))
print('chapters', d.get('chapters'))
