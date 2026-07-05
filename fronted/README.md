# HH-auto

## OLX vozila

Aktivna vozila se prikazuju iz fajla `fronted/data/vozila.json`.

Za ručno osvježavanje pokreni iz glavnog foldera projekta:

```bash
python3 scripts/sync_olx.py
```

Na GitHubu postoji workflow `Update OLX vehicles` koji jednom dnevno osvježava JSON i commita promjenu ako se OLX ponuda promijenila.
