#!/bin/bash
# usage: rd.sh supabase/diag-x.sql  → dispatch + print notices
F=$1; R=leadswalakiwtech/leadswala; A=https://api.github.com/repos/$R
before=$(env -u GH_TOKEN curl -s "$A/actions/runs?per_page=1" | python3 -c "import json,sys;print(json.load(sys.stdin)['workflow_runs'][0]['id'])")
code=$(env -u GH_TOKEN curl -s -o /tmp/disp.out -w "%{http_code}" -X POST -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" $A/actions/workflows/supabase-deploy.yml/dispatches -d "{\"ref\":\"main\",\"inputs\":{\"sql\":\"$F\"}}")
echo "dispatch $code"; [ "$code" != "204" ] && cat /tmp/disp.out && exit 1
for i in $(seq 1 40); do sleep 6
  read id st <<<$(env -u GH_TOKEN curl -s "$A/actions/runs?per_page=1&event=workflow_dispatch" | python3 -c "import json,sys;r=json.load(sys.stdin)['workflow_runs'][0];print(r['id'],r['status'])")
  [ "$id" != "$before" ] && [ "$st" = "completed" ] && break
done
job=$(env -u GH_TOKEN curl -s "$A/actions/runs/$id/jobs" | python3 -c "import json,sys;print(json.load(sys.stdin)['jobs'][0]['id'])")
env -u GH_TOKEN curl -s "$A/check-runs/$job/annotations?per_page=50" | python3 -c "
import json,sys
a=json.load(sys.stdin)
for x in sorted(a,key=lambda x:x['title'] or ''): print('['+(x['title'] or '')+']', x['message'])"
