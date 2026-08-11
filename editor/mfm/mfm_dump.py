#!/usr/bin/env python3
"""
mfm_dump.py - Extrait l'intégralité du Munitorum Field Manual et produit un ZIP.

Pour chaque langue demandée (def: en), le script :
  1. récupère l'index des factions depuis le menu de navigation ;
  2. télécharge le flux .rsc brut de chaque faction ;
  3. le parse en JSON structuré (via mfm_parser) ;
  4. écrit le tout dans une archive ZIP.

Contenu de l'archive :
    <lang>/_index.json            index des factions
    <lang>/raw/<slug>.rsc        flux RSC brut (sauvegarde / re-parse hors-ligne)
    <lang>/json/<slug>.json      faction parsée
    <lang>/all.json             toutes les factions de la langue regroupées
    manifest.json               métadonnées du dump (date, langues, comptes, erreurs)

Le module mfm_parser.py doit se trouver à côté de ce script.

Usage :
    python mfm_dump.py                          # toutes les factions, en, -> mfm_<date>.zip
    python mfm_dump.py -o mfm.zip               # nom d'archive explicite
    python mfm_dump.py --lang en fr de          # plusieurs langues
    python mfm_dump.py --lang all               # toutes les langues du site
    python mfm_dump.py --no-raw                 # ne pas inclure les .rsc bruts
    python mfm_dump.py --delay 1.0              # pause entre requêtes (politesse)
"""

from __future__ import annotations

import argparse
import io
import json
import sys
import time
import zipfile
from datetime import datetime, timezone

import mfm_parser as mfm


def _eprint(*a):
    print(*a, file=sys.stderr, flush=True)


def dump(
    langs: list[str],
    *,
    include_raw: bool = True,
    delay: float = 0.5,
    retries: int = 3,
) -> tuple[bytes, dict]:
    """Construit l'archive en mémoire. Renvoie (octets_zip, manifest)."""
    buf = io.BytesIO()
    manifest: dict = {
        "source": mfm.BASE_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "langs": {},
        "errors": [],
    }

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for lang in langs:
            _eprint(f"\n=== Langue : {lang} ===")
            # 1) index : on récupère une page de référence pour lire le menu
            try:
                ref_raw = mfm.fetch_rsc(f"/{lang}/adepta-sororitas.rsc", retries=retries)
            except Exception as e:  # noqa: BLE001
                _eprint(f"  ! impossible de récupérer l'index ({lang}): {e}")
                manifest["errors"].append({"lang": lang, "stage": "index", "error": str(e)})
                continue

            index = mfm.extract_faction_index(mfm.FlightDocument(ref_raw), lang)
            zf.writestr(f"{lang}/_index.json",
                        json.dumps(index, ensure_ascii=False, indent=2))
            _eprint(f"  {len(index)} factions à extraire")

            lang_all = []
            ok, ko = 0, 0
            for i, fac in enumerate(index, 1):
                slug = fac["slug"]
                _eprint(f"  [{i}/{len(index)}] {slug} ...")
                # réutiliser le flux déjà téléchargé pour la 1re faction
                if i == 1 and slug == "adepta-sororitas":
                    raw = ref_raw
                else:
                    try:
                        raw = mfm.fetch_rsc(f"/{lang}/{slug}.rsc", retries=retries)
                    except Exception as e:  # noqa: BLE001
                        _eprint(f"      ! téléchargement échoué : {e}")
                        manifest["errors"].append(
                            {"lang": lang, "slug": slug, "stage": "fetch", "error": str(e)})
                        ko += 1
                        time.sleep(delay)
                        continue

                if include_raw:
                    zf.writestr(f"{lang}/raw/{slug}.rsc", raw)

                try:
                    data = mfm.extract_faction(mfm.FlightDocument(raw), slug)
                except Exception as e:  # noqa: BLE001
                    _eprint(f"      ! parsing échoué : {e}")
                    manifest["errors"].append(
                        {"lang": lang, "slug": slug, "stage": "parse", "error": str(e)})
                    ko += 1
                    time.sleep(delay)
                    continue

                data["source_url"] = fac["rsc_url"]
                zf.writestr(f"{lang}/json/{slug}.json",
                            json.dumps(data, ensure_ascii=False, indent=2))
                lang_all.append(data)
                ok += 1
                time.sleep(delay)

            zf.writestr(f"{lang}/all.json",
                        json.dumps(lang_all, ensure_ascii=False, indent=2))
            manifest["langs"][lang] = {
                "factions_total": len(index),
                "factions_ok": ok,
                "factions_failed": ko,
                "detachments": sum(d["counts"]["detachments"] for d in lang_all),
                "units": sum(d["counts"]["units"] for d in lang_all),
                "factions_changed": sum(1 for d in lang_all if d.get("changed")),
                "detachments_changed": sum(
                    d["counts"].get("detachments_changed", 0) for d in lang_all),
                "units_changed": sum(
                    d["counts"].get("units_changed", 0) for d in lang_all),
            }
            _eprint(f"  -> {ok} ok, {ko} échec(s)")

        zf.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))

    return buf.getvalue(), manifest


def main() -> None:
    p = argparse.ArgumentParser(
        description="Extrait tout le Munitorum Field Manual dans un ZIP.")
    p.add_argument("--lang", nargs="+", default=["en"],
                   help="langues à extraire, ou 'all' (def: en)")
    p.add_argument("-o", "--output", help="nom de l'archive ZIP")
    p.add_argument("--no-raw", action="store_true",
                   help="ne pas inclure les flux .rsc bruts")
    p.add_argument("--delay", type=float, default=0.5,
                   help="pause en secondes entre requêtes (def: 0.5)")
    p.add_argument("--retries", type=int, default=3,
                   help="nombre de tentatives par requête (def: 3)")
    args = p.parse_args()

    langs = mfm.LANGS if args.lang == ["all"] else args.lang
    bad = [l for l in langs if l not in mfm.LANGS]
    if bad:
        p.error(f"langue(s) inconnue(s): {bad} — valides: {mfm.LANGS}")

    out = args.output or f"mfm_{datetime.now():%Y%m%d}.zip"
    data, manifest = dump(langs, include_raw=not args.no_raw,
                          delay=args.delay, retries=args.retries)
    with open(out, "wb") as f:
        f.write(data)

    _eprint(f"\nArchive écrite : {out} ({len(data)/1024:.0f} Ko)")
    _eprint("Résumé :")
    _eprint(json.dumps(manifest["langs"], ensure_ascii=False, indent=2))
    if manifest["errors"]:
        _eprint(f"{len(manifest['errors'])} erreur(s) — voir manifest.json dans l'archive.")


if __name__ == "__main__":
    main()
