#!/usr/bin/env python3
"""
mfm_parser.py - Parser pour le Munitorum Field Manual (MFM)
https://mfm.warhammer-community.com/

Le site est une app Next.js. Chaque faction est servie en RSC (React Server
Components / Flight format) à l'URL :  /en/<faction>.rsc

Ce script :
  1. Récupère l'index de toutes les pages .rsc (toutes les factions) à partir
     du menu de navigation contenu dans n'importe quelle page.
  2. Parse une page faction et en extrait, sous forme structurée (JSON) :
       - les détachements (nom, DP, force disposition, tag unique, enhancements + coûts)
       - les unités (nom, profils de coût par taille / palier, leader targets)
  3. Résout les références "lazy" du format Flight ($L74, $76, ...) qui portent
     les valeurs de points et les deltas de la dernière mise à jour.

Dépendances : requests (uniquement pour le téléchargement réseau).
Utilisable hors-ligne sur un fichier .rsc déjà téléchargé.

Usage :
    python mfm_parser.py index                       # liste toutes les factions
    python mfm_parser.py faction adepta-sororitas    # parse une faction (réseau)
    python mfm_parser.py all -o out/                 # parse toutes les factions
    python mfm_parser.py parse fichier.rsc           # parse un .rsc local
    python mfm_parser.py --lang fr faction orks      # langue alternative
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from typing import Any

BASE_URL = "https://mfm.warhammer-community.com"
LANGS = ["en", "de", "es", "fr", "it", "ja", "ko", "zh"]


# --------------------------------------------------------------------------- #
#  Téléchargement
# --------------------------------------------------------------------------- #
def fetch_rsc(path: str, *, retries: int = 3, timeout: int = 30) -> str:
    """Télécharge une ressource .rsc. Lève une exception en cas d'échec."""
    import requests

    url = path if path.startswith("http") else f"{BASE_URL}{path}"
    headers = {
        # Le header RSC indique au serveur Next.js de renvoyer le flux Flight
        # plutôt que le HTML complet. L'URL .rsc le fait déjà, mais on le met
        # par sécurité.
        "RSC": "1",
        "User-Agent": "Mozilla/5.0 (mfm-parser)",
        "Accept": "*/*",
    }
    last_err = None
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=headers, timeout=timeout)
            r.raise_for_status()
            # le serveur ne déclare pas de charset -> requests retombe sur
            # ISO-8859-1 et corrompt les caractères UTF-8 (▲ devient 'â–²').
            r.encoding = "utf-8"
            return r.text
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Échec du téléchargement de {url}: {last_err}")


# --------------------------------------------------------------------------- #
#  Décodage du flux Flight (RSC)
# --------------------------------------------------------------------------- #
def _repair_mojibake(text: str) -> str:
    """
    Répare un flux UTF-8 double-encodé (fichier .rsc sauvegardé via une console
    mal configurée : '▲' devient 'â–²', l'apostrophe '’' devient 'â€™', etc.).
    Sans marqueur suspect, le texte est renvoyé tel quel.
    """
    if "â" not in text and "Ã" not in text:
        return text
    for enc in ("latin-1", "cp1252"):
        try:
            fixed = text.encode(enc).decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            continue
        # la réparation recombine les séquences multi-octets -> texte plus court
        if len(fixed) < len(text):
            return fixed
    return text


class FlightDocument:
    """
    Représente un flux RSC décodé en lignes 'id: payload'.

    Le flux Flight est une suite de lignes de la forme :
        <hexid>:<payload>
    où <payload> est :
        - du JSON  ->  on le parse
        - une chaîne préfixée 'T<len>,' (texte) ou '$S...' (symbole) etc.
        - un import 'I[...]' (composant client) : ignoré pour nos besoins.

    Les références entre lignes apparaissent dans le JSON sous forme de chaînes :
        "$Lxx"  -> référence "lazy" vers la ligne xx (doit être résolue)
        "$xx"   -> référence directe vers la ligne xx
        "$undefined", "$Sreact.xxx" -> valeurs spéciales
    """

    REF_RE = re.compile(r"^\$L?([0-9a-f]+)$")

    def __init__(self, raw: str):
        self.lines: dict[str, Any] = {}
        self.raw_lines: dict[str, str] = {}
        self._parse(_repair_mojibake(raw))

    def _parse(self, raw: str) -> None:
        for line in raw.split("\n"):
            if not line or ":" not in line:
                continue
            hexid, _, payload = line.partition(":")
            hexid = hexid.strip()
            # Les identifiants sont hexadécimaux ; certains débuts de ligne
            # spéciaux ("HL", etc.) commencent par ':' (id vide) -> on ignore.
            if not re.fullmatch(r"[0-9a-f]+", hexid):
                continue
            self.raw_lines[hexid] = payload
            self.lines[hexid] = self._decode_payload(payload)

    @staticmethod
    def _decode_payload(payload: str) -> Any:
        if not payload:
            return None
        tag = payload[0]
        # Chaîne texte : T<hexlen>,<contenu>
        if tag == "T":
            m = re.match(r"T([0-9a-f]+),", payload)
            if m:
                return payload[m.end():]
            return payload[1:]
        # Import client I[...] -> on ne garde pas (UI seulement)
        if tag == "I":
            return {"__import__": payload}
        # Symbole / erreur / promise : $S..., E{...}, $W...
        if tag in ("$", "E"):
            # E{...} = erreur ; on tente quand même un parse de la partie {...}
            if tag == "E":
                try:
                    return {"__error__": json.loads(payload[1:])}
                except Exception:  # noqa: BLE001
                    return {"__error__": payload[1:]}
            return {"__symbol__": payload}
        # Sinon : JSON (objet, tableau, nombre, string...)
        try:
            return json.loads(payload)
        except Exception:  # noqa: BLE001
            return payload

    # ---- résolution des références --------------------------------------- #
    def resolve(self, node: Any, _depth: int = 0, _seen: set[str] | None = None) -> Any:
        """Remplace récursivement les références $Lxx / $xx par leur contenu."""
        if _depth > 200:
            return node
        if _seen is None:
            _seen = set()

        if isinstance(node, str):
            m = self.REF_RE.match(node)
            if m:
                ref = m.group(1)
                if ref in _seen:           # cycle -> on coupe
                    return node
                if ref in self.lines:
                    return self.resolve(self.lines[ref], _depth + 1, _seen | {ref})
                return node
            return node
        if isinstance(node, list):
            return [self.resolve(x, _depth + 1, _seen) for x in node]
        if isinstance(node, dict):
            return {k: self.resolve(v, _depth + 1, _seen) for k, v in node.items()}
        return node


# --------------------------------------------------------------------------- #
#  Helpers d'extraction sur l'arbre React résolu
# --------------------------------------------------------------------------- #
def iter_elements(node: Any):
    """Itère récursivement sur tous les éléments React ['$', type, key, props]."""
    if is_element(node):
        yield node
        props = node[3] or {}
        for v in props.values():
            yield from iter_elements(v)
    elif isinstance(node, list):
        for x in node:
            yield from iter_elements(x)
    elif isinstance(node, dict):
        for v in node.values():
            yield from iter_elements(v)


def is_element(n: Any) -> bool:
    """Vrai si n est un élément React Flight : ["$", type, key, props]."""
    return (isinstance(n, list) and len(n) == 4 and n[0] == "$"
            and isinstance(n[3], (dict, type(None))))


def collect_text(node: Any) -> str:
    """Concatène tout le texte brut sous un nœud (en ignorant types/clés React)."""
    out: list[str] = []

    def rec(n: Any):
        if isinstance(n, str):
            # ignorer les marqueurs ($..., "$") et chaînes vides
            if not n.startswith("$") and n.strip():
                out.append(n.strip())
        elif is_element(n):
            # élément React : ne descendre que dans props.children
            props = n[3] or {}
            rec(props.get("children"))
        elif isinstance(n, list):
            for x in n:
                rec(x)
        elif isinstance(n, dict):
            rec(n.get("children"))

    rec(node)
    return " ".join(out).strip()


def el_type(el: Any) -> Any:
    return el[1] if is_element(el) else None


def el_props(el: Any) -> dict:
    return el[3] if is_element(el) and isinstance(el[3], dict) else {}


def el_class(el: Any) -> str:
    return el_props(el).get("className", "") or ""


# --------------------------------------------------------------------------- #
#  Parsing des coûts (la valeur d'un enhancement / unité)
# --------------------------------------------------------------------------- #
def parse_cost_node(node: Any) -> dict | None:
    """
    Les valeurs de points sont des nœuds résolus contenant typiquement le prix
    et éventuellement un delta de mise à jour (rouge/vert). On en extrait :
       { "points": int, "delta": int|None, "change": "up"|"down"|None, "raw": "texte" }

    Formats observés :
      - "85", "120 (+5)", "75pts"            (ancien format : points d'abord)
      - "▼ (-15) 360 pts"                     (nouveau : flèche + delta AVANT points)
      - "85 pts" en rouge, sans delta        (hausse signalée par la couleur seule)
    La direction du changement est déduite de la classe CSS du span
    (text-red-* = hausse, text-emerald-*/text-green-* = baisse) ou, à défaut,
    de la flèche ▲/▼ présente dans le texte.
    """
    text = collect_text(node)
    if not text:
        # tenter de récupérer un nombre brut dans la structure
        nums = re.findall(r"-?\d+", json.dumps(node, ensure_ascii=False))
        if not nums:
            return None
        text = nums[0]
    text = text.replace("\u2212", "-")  # minus unicode
    # séparateurs de milliers : "2,200 pts", "1 100 pts" -> "2200", "1100"
    text_norm = re.sub(r"(?<=\d)[,\u202f\u00a0 ](?=\d{3}\b)", "", text)
    delta_m = re.search(r"\(([+-]\s*\d+)\)", text_norm)
    # retirer le delta "(±N)" AVANT de chercher les points : dans le nouveau
    # format le delta précède la valeur ("▼ (-15) 360 pts") et la première
    # suite de chiffres n'est donc plus forcément le prix.
    pts_m = re.search(r"(\d+)", re.sub(r"\([+-]\s*\d+\)", "", text_norm))
    if not pts_m:
        return None
    out = {"points": int(pts_m.group(1)), "raw": text.strip()}
    out["delta"] = int(delta_m.group(1).replace(" ", "")) if delta_m else None

    # direction du changement : classe couleur du/des nœud(s), sinon flèche
    blob = json.dumps(node, ensure_ascii=False)
    if "text-red" in blob or "text-rose" in blob:
        out["change"] = "up"
    elif "text-emerald" in blob or "text-green" in blob:
        out["change"] = "down"
    elif "▲" in text:
        out["change"] = "up"
    elif "▼" in text:
        out["change"] = "down"
    else:
        out["change"] = None
    return out


# --------------------------------------------------------------------------- #
#  Marqueurs de changement (badges, en-têtes colorés)
# --------------------------------------------------------------------------- #
# Badges affichés en bas de carte : "UPDATED", "FORCE DISPOSITION(S) CHANGED",
# "REQUISITION THRESHOLDS REMOVED", ... (divs px-1 font-bold bg-slate-200/300)
_BADGE_RE = re.compile(r"^(NEW|UPDATED)$|CHANGED|REMOVED|ADDED")
_BADGE_EXCLUDE = {"ENHANCEMENTS", "WARGEAR OPTIONS", "LEADER"}

# Couleur d'en-tête d'une carte modifiée -> nature du changement
_HEADER_COLORS = {
    "slate": None,           # inchangé
    "emerald": "decreased",  # points à la baisse
    "green": "decreased",
    "red": "increased",      # points à la hausse
    "rose": "increased",
    "amber": "mixed",        # hausse ET baisse selon les paliers
    "orange": "mixed",
}

# Indicateur de l'en-tête (span self-end) -> nature du changement
_INDICATOR_MAP = {"▲": "increased", "▼": "decreased", "▲▼": "mixed"}


def _parse_change_tags(card: Any) -> list[str]:
    """Récupère les badges de changement d'une carte (UPDATED, ... CHANGED...)."""
    tags: list[str] = []
    for el in iter_elements(card):
        if el_type(el) != "div":
            continue
        cls = el_class(el)
        if "font-bold" not in cls or "px-1" not in cls:
            continue
        t = collect_text(el)
        if (t and t == t.upper() and len(t) <= 60 and not re.search(r"\d", t)
                and t not in _BADGE_EXCLUDE and _BADGE_RE.search(t)
                and t not in tags):
            tags.append(t)
    return tags


# --------------------------------------------------------------------------- #
#  Extraction haut-niveau d'une faction
# --------------------------------------------------------------------------- #
def extract_faction(doc: FlightDocument, faction_slug: str | None = None) -> dict:
    """
    Reconstitue les sections DETACHMENTS et UNITS à partir du flux résolu.
    On part de la ligne racine "5" (corps de page) ou on scanne toutes les
    lignes pour trouver les en-têtes 'DETACHMENTS' / 'UNITS'.
    """
    # Construire un arbre résolu global : on résout chaque ligne top-level
    resolved_lines = {hid: doc.resolve(val) for hid, val in doc.lines.items()}

    faction_name = None
    detachments: list[dict] = []
    units: list[dict] = []
    version = None

    # Nom de faction : <div ...>"ADEPTA SORORITAS"</div> en writing-mode sideways
    # Version : <h2>"v1.0"</h2>
    for val in resolved_lines.values():
        for el in iter_elements(val):
            cls = el_class(el)
            if "writing-mode" in cls and faction_name is None:
                t = collect_text(el)
                if t:
                    faction_name = t
            if el_type(el) == "h2" and version is None:
                t = collect_text(el)
                if re.match(r"v?\d+\.\d+", t):
                    version = t

    # --- Détachements : repérer le bloc dont l'enfant h3 == "DETACHMENTS"
    detach_block = _find_section_block(resolved_lines, "DETACHMENTS")
    if detach_block is not None:
        detachments = _parse_detachments(detach_block)

    # --- Unités : bloc dont h3 == "UNITS"
    units_block = _find_section_block(resolved_lines, "UNITS")
    if units_block is not None:
        units = _parse_units(units_block)

    det_changed = sum(1 for d in detachments if d.get("changed"))
    units_changed = sum(1 for u in units if u.get("changed"))
    return {
        "faction": faction_name or (faction_slug or ""),
        "slug": faction_slug,
        "version": version,
        "changed": bool(det_changed or units_changed),
        "detachments": detachments,
        "units": units,
        "counts": {
            "detachments": len(detachments),
            "units": len(units),
            "detachments_changed": det_changed,
            "units_changed": units_changed,
        },
    }


def _find_section_block(resolved_lines: dict[str, Any], header: str) -> Any:
    """Trouve le nœud conteneur dont un enfant direct h3 a le texte `header`."""
    for val in resolved_lines.values():
        for el in iter_elements(val):
            if el_type(el) == "h3":
                if collect_text(el).strip().upper() == header.upper():
                    # remonter : on renvoie la valeur racine qui contient ce h3
                    return val
    return None


def _card_blocks(block: Any):
    """
    Itère sur les 'cartes' : ce sont les <div> ayant un key (uuid) et la classe
    'flex flex-col space-y-1 m-1 ...' (cartes détachement et unité partagent ce
    motif). On filtre via la présence d'un en-tête interne.
    """
    for el in iter_elements(block):
        if el_type(el) != "div":
            continue
        cls = el_class(el)
        if "flex-col" in cls and "space-y-1" in cls and "m-1" in cls:
            yield el


def _cards_with_section(block: Any) -> list[tuple[Any, str | None]]:
    """
    Itère les cartes dans l'ordre du document en mémorisant le dernier en-tête
    <h3> rencontré. Nécessaire pour les factions dont les unités sont réparties
    en plusieurs sections (ex. Imperial Agents : "UNITS" puis "EVERY MODEL HAS
    THE IMPERIUM KEYWORD", où une même unité peut apparaître deux fois).
    """
    out: list[tuple[Any, str | None]] = []
    section: list[str | None] = [None]

    def walk(n: Any) -> None:
        if is_element(n):
            if el_type(n) == "h3":
                t = collect_text(n)
                if t:
                    section[0] = t
            cls = el_class(n)
            if "flex-col" in cls and "space-y-1" in cls and "m-1" in cls:
                out.append((n, section[0]))
                return  # les cartes ne sont pas imbriquées
            for v in (el_props(n) or {}).values():
                walk(v)
        elif isinstance(n, list):
            for x in n:
                walk(x)
        elif isinstance(n, dict):
            for v in n.values():
                walk(v)

    walk(block)
    return out


def _parse_detachments(block: Any) -> list[dict]:
    out = []
    for card in _card_blocks(block):
        children = el_props(card).get("children", [])
        name = None
        dp = None
        disposition = None
        unique = None
        enhancements = []

        for el in iter_elements(card):
            cls = el_class(el)
            # en-tête : span text-xl break-all = nom ; span self-end = DP
            if el_type(el) == "span" and "text-xl" in cls and "break-all" in cls and name is None:
                name = collect_text(el)
            if el_type(el) == "span" and "self-end" in cls and dp is None:
                t = collect_text(el)
                m = re.search(r"(\d+)\s*DP", t)
                if m:
                    dp = int(m.group(1))
            # force disposition : div avec style backgroundColor + texte
            props = el_props(el)
            if el_type(el) == "div" and isinstance(props.get("style"), dict) \
                    and "backgroundColor" in props["style"]:
                t = collect_text(el)
                if t and disposition is None:
                    disposition = t
            # tag unique : "UNIQUE: ..."
            if el_type(el) == "span":
                t = collect_text(el)
                if t.upper().startswith("UNIQUE"):
                    unique = t

        # enhancements : chaque <li> dans la liste 'leaders' : span(nom) + coût ;
        # certains octroient le mot-clé LEADER (unités cibles) -> champ "leader"
        enhancements = _parse_enhancement_list(card)

        # nouveau format (détachement modifié) : le nom n'est plus dans un span
        # break-all mais dans un en-tête coloré identique à celui des unités,
        # avec le coût en DP dans le span self-end.
        header_color = None
        if name is None:
            n, color, selfend = _parse_colored_header(card)
            if n and selfend and _DP_RE.search(selfend):
                name = n
                header_color = color
                if dp is None:
                    m = re.search(r"(\d+)\s*DP", selfend)
                    dp = int(m.group(1))

        if name:
            tags = _parse_change_tags(card)
            change = _HEADER_COLORS.get(header_color) if header_color else None
            changed = bool(
                change or tags
                or any(e.get("delta") is not None or e.get("change")
                       for e in enhancements)
            )
            out.append({
                "name": name,
                "dp": dp,
                "force_disposition": disposition,
                "force_disposition_changed": any("DISPOSITION" in t for t in tags),
                "unique": unique,
                "enhancements": enhancements,
                "changed": changed,
                "change": change,     # "increased" | "decreased" | "mixed" | None
                "change_tags": tags,  # ex. ["UPDATED", "FORCE DISPOSITION(S) CHANGED"]
            })
    return out


def _name_and_cost(li: Any) -> tuple[str | None, dict | None]:
    """
    Pour un <li> d'enhancement : li > div(flex-row justify-between) > [span(nom), coût].
    Sépare le nom (premier span) du coût (nœud suivant).
    """
    # descendre jusqu'au div flex-row justify-between s'il existe
    target = li
    for el in iter_elements(li):
        if el_type(el) == "div" and "justify-between" in el_class(el):
            target = el
            break
    children = el_props(target).get("children")
    if not isinstance(children, list):
        children = [children]
    name = None
    cost_nodes = []
    for ch in children:
        if name is None and is_element(ch) and el_type(ch) == "span":
            name = collect_text(ch)
        else:
            cost_nodes.append(ch)
    cost = parse_cost_node(cost_nodes if cost_nodes else None)
    return name, cost


def _leader_targets_from_text(text: str) -> list[str] | None:
    """
    Extrait les unités cibles d'un libellé "LEADER: UNIT A, UNIT B".
    Renvoie ["UNIT A", "UNIT B"] ou None si le texte n'est pas un tel libellé.
    """
    m = re.match(r"\s*LEADER\s*:?\s*(.+)$", text, re.I)
    if not m:
        return None
    targets = [u.strip() for u in m.group(1).split(",") if u.strip()]
    return targets or None


def _parse_enhancement_list(card: Any) -> list[dict]:
    res: list[dict] = []
    for el in iter_elements(card):
        t = el_type(el)
        if t == "li":
            name, cost = _name_and_cost(el)
            if name:
                entry = {"name": name}
                if cost:
                    entry.update(cost)
                res.append(entry)
        elif t == "div" and res and "leader" not in res[-1]:
            # Un enhancement peut octroyer le mot-clé LEADER : un <div> frère du
            # <li> porte "LEADER: UNIT A, UNIT B" (ex. "Pact of Cursed Pinions"
            # chez les Chaos Space Marines). Dans l'ordre du document ce <div>
            # suit toujours son <li> et précède le <li> suivant -> on le rattache
            # à l'enhancement courant (res[-1]).
            targets = _leader_targets_from_text(collect_text(el))
            if targets:
                res[-1]["leader"] = targets
    return res


def _parse_colored_header(card: Any) -> tuple[str | None, str | None, str | None]:
    """
    Cherche un en-tête « nouveau format » (carte modifiée) :
        <div class="flex flex-row justify-between ... bg-<couleur> font-bold ...">
          <span class="text-xl ...">NOM</span>
          <span class="... self-end ...">▲ / ▼ / ▲▼ / 1DP</span>
        </div>
    Renvoie (nom, couleur, texte_self_end) — self_end contient soit les flèches
    (unité), soit le coût en DP (détachement).
    """
    for el in iter_elements(card):
        if el_type(el) != "div":
            continue
        cls = el_class(el)
        if "font-bold" not in cls or "justify-between" not in cls:
            continue
        m = re.search(r"bg-(slate|emerald|green|red|rose|amber|orange)-\d+", cls)
        if not m:
            continue
        name = selfend = None
        for sub in iter_elements(el):
            if el_type(sub) != "span":
                continue
            scls = el_class(sub)
            if "text-xl" in scls and name is None:
                name = collect_text(sub)
            elif "self-end" in scls and selfend is None:
                selfend = collect_text(sub)
        if name:
            return name, m.group(1), selfend
    return None, None, None


_DP_RE = re.compile(r"\d+\s*DP")


def _parse_unit_header(card: Any) -> tuple[str | None, str | None, str | None]:
    """
    Extrait (nom, couleur_entête, indicateur) d'une carte d'unité.

    Deux formats coexistent :
      - unité inchangée : <div class="... bg-slate-500 ... text-xl ...">NOM</div>
      - unité modifiée  : en-tête coloré (voir _parse_colored_header) avec des
        flèches ▲/▼ en self-end.
    Les cartes détachement sont écartées : leur self-end contient "<n>DP"
    (et, à l'ancien format, leur nom est un span text-xl, pas un div).
    """
    # format div-direct : le div d'en-tête porte lui-même text-xl et le nom.
    # Il peut être bg-slate-500 (inchangé) ou coloré (ex. bg-red-500 = hausse)
    # sans span self-end. Les labels internes (bg-slate-200/300/600) n'ont pas
    # text-xl et sont donc exclus.
    for el in iter_elements(card):
        cls = el_class(el)
        if el_type(el) == "div" and "font-bold" in cls and "text-xl" in cls:
            m = re.search(r"bg-(?:(slate)-500|(emerald|green|red|rose|amber|orange)-\d+)", cls)
            if m:
                return collect_text(el), (m.group(1) or m.group(2)), None
    # nouveau format : en-tête coloré ; un self-end en DP = détachement -> skip
    name, color, selfend = _parse_colored_header(card)
    if name and not (selfend and _DP_RE.search(selfend)):
        return name, color, selfend
    return None, None, None


def _parse_units(block: Any) -> list[dict]:
    out = []
    for card, section in _cards_with_section(block):
        profiles = []
        leader_targets = None

        # nom + marqueurs de changement de l'en-tête (couleur / flèches)
        name, header_color, indicator = _parse_unit_header(card)

        # profils de coût : chaque bloc 'space-y-1' contenant un libellé
        # ("YOUR UNIT COSTS", "YOUR 1ST UNIT COSTS", "YOUR 3RD + UNIT COSTS"...)
        # suivi d'une <ul> de <li> : span(taille) + coût
        profiles = _parse_unit_profiles(card)

        # leader targets : span font-bold après l'en-tête LEADER
        lt = _parse_leader_targets(card)
        if lt:
            leader_targets = lt

        if name:
            tags = _parse_change_tags(card)
            change = (_INDICATOR_MAP.get(indicator or "")
                      or _HEADER_COLORS.get(header_color or "slate"))
            changed = bool(
                change or tags or indicator
                or any(p.get("delta") is not None or p.get("change") for p in profiles)
            )
            out.append({
                "name": name,
                "section": section,  # h3 englobant, ex. "UNITS" ou
                                     # "EVERY MODEL HAS THE IMPERIUM KEYWORD"
                "profiles": profiles,
                "leader_targets": leader_targets,
                "changed": changed,
                "change": change,             # "increased" | "decreased" | "mixed" | None
                "change_indicator": indicator,  # "▲", "▼", "▲▼" affiché à côté du nom
                "change_tags": tags,          # ex. ["UPDATED", "REQUISITION THRESHOLDS REMOVED"]
            })
    return out


def _li_size_and_cost(li: Any) -> tuple[str | None, dict | None]:
    """
    Sépare un <li> de coût en (taille, coût).
    Structure : li.children = [ span(taille), costNode ]
    La taille est dans le premier span ; le coût est le(s) nœud(s) suivant(s).
    """
    children = el_props(li).get("children")
    if not isinstance(children, list):
        children = [children]
    size = None
    cost_nodes = []
    for ch in children:
        if size is None and is_element(ch) and el_type(ch) == "span":
            size = collect_text(ch)
        else:
            cost_nodes.append(ch)
    cost = parse_cost_node(cost_nodes if cost_nodes else None)
    return size, cost


def _parse_unit_profiles(card: Any) -> list[dict]:
    profiles: list[dict] = []
    label_re = re.compile(r"YOUR.*COST", re.I)

    def walk(n: Any, label: str | None) -> str | None:
        """Retourne le label éventuellement mis à jour (propagé aux frères)."""
        if is_element(n):
            if el_type(n) == "div" and "bg-slate-200" in el_class(n):
                t = collect_text(n)
                if label_re.search(t):
                    label = t
            if el_type(n) == "li":
                size, cost = _li_size_and_cost(n)
                if size or cost:
                    entry = {"tier": label, "size": size}
                    if cost:
                        entry.update(cost)
                    profiles.append(entry)
                return label  # ne pas redescendre dans un li
            for v in (el_props(n) or {}).values():
                walk(v, label)
        elif isinstance(n, list):
            for x in n:
                # un label trouvé sur un frère se propage aux suivants
                label = walk(x, label) or label
        elif isinstance(n, dict):
            for v in n.values():
                walk(v, label)
        return label

    walk(card, None)
    # déduplication
    seen, uniq = set(), []
    for p in profiles:
        key = (p.get("tier"), p.get("size"), p.get("points"))
        if key not in seen:
            seen.add(key)
            uniq.append(p)
    return uniq


def _parse_leader_targets(card: Any) -> str | None:
    found_leader = False
    for el in iter_elements(card):
        cls = el_class(el)
        if el_type(el) == "span" and collect_text(el).strip().upper() == "LEADER":
            found_leader = True
            continue
        if found_leader and el_type(el) == "span" and "font-bold" in cls:
            t = collect_text(el)
            if t and t.upper() != "LEADER":
                return t
    return None


# --------------------------------------------------------------------------- #
#  Index des factions
# --------------------------------------------------------------------------- #
def extract_faction_index(doc: FlightDocument, lang: str = "en") -> list[dict]:
    """
    Extrait la liste des factions depuis le menu de navigation.
    Les liens portent {"href":{"pathname":"<slug>"}} et un libellé enfant.
    """
    factions: dict[str, str] = {}
    for val in doc.lines.values():
        resolved = doc.resolve(val)
        for el in iter_elements(resolved):
            props = el_props(el)
            href = props.get("href")
            if isinstance(href, dict) and "pathname" in href:
                slug = href["pathname"]
                if not slug or "/" in slug:
                    continue
                label = collect_text(el) or slug
                # éviter d'écraser un bon libellé par un vide
                if slug not in factions or len(label) > len(factions[slug]):
                    factions[slug] = label
    out = []
    for slug, label in sorted(factions.items()):
        out.append({
            "slug": slug,
            "name": label,
            "page_url": f"{BASE_URL}/{lang}/{slug}",
            "rsc_url": f"{BASE_URL}/{lang}/{slug}.rsc",
        })
    return out


# --------------------------------------------------------------------------- #
#  CLI
# --------------------------------------------------------------------------- #
def cmd_index(args) -> None:
    raw = (open(args.file, encoding="utf-8").read()
           if args.file else fetch_rsc(f"/{args.lang}/adepta-sororitas.rsc"))
    doc = FlightDocument(raw)
    idx = extract_faction_index(doc, args.lang)
    _dump(idx, args.output)
    if not args.output:
        print(f"\n{len(idx)} factions trouvées.", file=sys.stderr)


def cmd_faction(args) -> None:
    raw = fetch_rsc(f"/{args.lang}/{args.slug}.rsc")
    doc = FlightDocument(raw)
    data = extract_faction(doc, args.slug)
    _dump(data, args.output)


def cmd_parse(args) -> None:
    raw = open(args.file, encoding="utf-8").read()
    doc = FlightDocument(raw)
    data = extract_faction(doc, os.path.splitext(os.path.basename(args.file))[0])
    _dump(data, args.output)


def cmd_all(args) -> None:
    raw = fetch_rsc(f"/{args.lang}/adepta-sororitas.rsc")
    idx = extract_faction_index(FlightDocument(raw), args.lang)
    outdir = args.output or "mfm_out"
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "_index.json"), "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)
    for i, fac in enumerate(idx, 1):
        slug = fac["slug"]
        print(f"[{i}/{len(idx)}] {slug} ...", file=sys.stderr)
        try:
            r = fetch_rsc(f"/{args.lang}/{slug}.rsc")
            data = extract_faction(FlightDocument(r), slug)
            with open(os.path.join(outdir, f"{slug}.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:  # noqa: BLE001
            print(f"   ! échec {slug}: {e}", file=sys.stderr)
        time.sleep(args.delay)
    print(f"Terminé -> {outdir}/", file=sys.stderr)


def _dump(obj: Any, output: str | None) -> None:
    text = json.dumps(obj, ensure_ascii=False, indent=2)
    if output:
        with open(output, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Écrit : {output}", file=sys.stderr)
    else:
        print(text)


def main() -> None:
    p = argparse.ArgumentParser(description="Parser du Munitorum Field Manual (.rsc)")
    p.add_argument("--lang", default="en", choices=LANGS, help="langue (def: en)")
    sub = p.add_subparsers(dest="cmd", required=True)

    pi = sub.add_parser("index", help="liste toutes les factions / pages .rsc")
    pi.add_argument("-f", "--file", help="parser un .rsc local au lieu du réseau")
    pi.add_argument("-o", "--output", help="fichier de sortie JSON")
    pi.set_defaults(func=cmd_index)

    pf = sub.add_parser("faction", help="parse une faction (réseau)")
    pf.add_argument("slug", help="ex: adepta-sororitas")
    pf.add_argument("-o", "--output", help="fichier de sortie JSON")
    pf.set_defaults(func=cmd_faction)

    pp = sub.add_parser("parse", help="parse un fichier .rsc local")
    pp.add_argument("file")
    pp.add_argument("-o", "--output", help="fichier de sortie JSON")
    pp.set_defaults(func=cmd_parse)

    pa = sub.add_parser("all", help="parse toutes les factions (réseau)")
    pa.add_argument("-o", "--output", help="dossier de sortie")
    pa.add_argument("--delay", type=float, default=0.5, help="pause entre requêtes")
    pa.set_defaults(func=cmd_all)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
