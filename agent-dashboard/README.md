# Agent Command Center

Standalone local dashboard for the pleasefindmethis.com marketing sprint agents.

Run locally:

```bash
python3 -m http.server 5179 --bind 127.0.0.1
```

Then open:

```txt
http://127.0.0.1:5179
```

The dashboard refreshes `data/agents.json` every 5 seconds. Update that file to change what the dashboard shows without rebuilding.
