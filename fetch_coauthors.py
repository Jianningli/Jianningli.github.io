"""
fetch_coauthors.py
Fetches the top-15 most-cited + 5 most-recent publications from Google Scholar
for Jianning Li (qPPTM_AAAAAJ) and builds network_data.json for the co-author
force-directed graph.

Usage:
    python fetch_coauthors.py
"""

import json
import time
import re
from collections import defaultdict
from datetime import date

SCHOLAR_ID = "qPPTM_AAAAAJ"
OUTPUT_PATH = "network_data.json"

# ── Affiliation heuristics (keyword → group label + group index)
AFFILIATION_GROUPS = [
    (["zib", "zuse"], "ZIB Berlin", 1),
    (["charité", "charite", "charite-universitätsmedizin"], "Charité", 2),
    (["fu berlin", "freie universit"], "FU Berlin", 1),
    (["graz", "joanneum"], "Graz/Joanneum", 3),
    (["essen", "uk essen", "university hospital essen"], "Univ. Hospital Essen", 5),
    (["dkfz", "german cancer"], "DKFZ", 6),
    (["minho", "braga"], "Univ. Minho", 5),
    (["delft", "tud"], "TU Delft", 4),
    (["kth", "stockholm"], "KTH Stockholm", 7),
    (["karlsruhe", "kit"], "KIT", 8),
    (["brno"], "Brno Univ. Tech.", 9),
    (["ntnu", "trondheim"], "NTNU", 7),
    (["amsterdam", "uva"], "Univ. Amsterdam", 4),
]

def guess_group(affiliation: str):
    aff_lower = (affiliation or "").lower()
    for keywords, label, idx in AFFILIATION_GROUPS:
        if any(k in aff_lower for k in keywords):
            return label, idx
    return "Other", 11


def clean_name(name: str) -> str:
    """Normalise author name for deduplication."""
    return re.sub(r"\s+", " ", name.strip())


def parse_authors(author_string: str) -> list:
    """Split author string into individual names.

    scholarly's fill() joins co-authors BibTeX-style with the literal
    word " and " (e.g. "Jianning Li and Jan Egger and Jens Kleesiek"),
    not commas/semicolons. Split on " and " first; fall back to
    comma/semicolon splitting for any string that doesn't contain it
    (e.g. unfilled/partial bib entries).
    """
    if not author_string:
        return []
    if re.search(r"\s+and\s+", author_string, flags=re.IGNORECASE):
        parts = re.split(r"\s+and\s+", author_string, flags=re.IGNORECASE)
    else:
        parts = re.split(r"[,;]", author_string)
    return [clean_name(p) for p in parts if clean_name(p)]


def is_self(name: str) -> bool:
    name_l = name.lower()
    return any(k in name_l for k in ["jianning", "j. li", "li, j", "li j"])


def main():
    try:
        from scholarly import scholarly, ProxyGenerator
    except ImportError:
        print("scholarly not installed. Running: pip install scholarly")
        import subprocess, sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "scholarly"])
        from scholarly import scholarly, ProxyGenerator

    # --- ADDED: ScraperAPI Setup via SingleProxy ---
    SCRAPER_API_KEY = "xxxxxxxxxxxx"
    
    print("Connecting to ScraperAPI...")
    proxy_url = f"http://scraperapi:{SCRAPER_API_KEY}@proxy-server.scraperapi.com:8001"
    
    try:
        pg = ProxyGenerator()
        pg.SingleProxy(http=proxy_url, https=proxy_url)
        scholarly.use_proxy(pg)
        print("✅ Proxy setup complete.")
    except Exception as e:
        print(f"⚠ Proxy setup failed: {e}")
    # -------------------------------

    
    print(f"Fetching author profile: {SCHOLAR_ID} ...")
    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["basics", "publications"])

    all_pubs = author.get("publications", [])
    print(f"Total publications found: {len(all_pubs)}")

    # ── Sort by citations (descending) → top 15
    cited_sorted = sorted(all_pubs, key=lambda p: p.get("num_citations", 0), reverse=True)
    top_cited = cited_sorted[:15]

    # ── Sort by year (descending) → 5 most recent (not already in top_cited)
    top_cited_ids = {p.get("author_pub_id") for p in top_cited}
    year_sorted = sorted(
        [p for p in all_pubs if p.get("author_pub_id") not in top_cited_ids],
        key=lambda p: p.get("bib", {}).get("pub_year", "0"),
        reverse=True,
    )
    recent = year_sorted[:5]

    selected = top_cited + recent
    print(f"Selected {len(top_cited)} most-cited + {len(recent)} most-recent = {len(selected)} papers")

    # ── Fill each publication to get full author list
    coauthor_papers = defaultdict(list)   # name → [paper titles]
    coauthor_citations = defaultdict(int) # name → total shared citations
    coauthor_affil = {}                   # name → affiliation string

    self_papers = []

    for i, pub in enumerate(selected):
        print(f"  [{i+1}/{len(selected)}] Filling: {pub.get('bib', {}).get('title', '?')[:60]}...")
        try:
            pub_filled = scholarly.fill(pub)
            time.sleep(1.5)  # be polite to Scholar
        except Exception as e:
            print(f"    ⚠ Could not fill: {e}")
            pub_filled = pub

        bib = pub_filled.get("bib", {})
        title  = bib.get("title", "Unknown title")
        year   = bib.get("pub_year", "")
        venue  = bib.get("venue", "") or bib.get("journal", "") or bib.get("conference", "")
        citations = pub_filled.get("num_citations", 0)
        author_str = bib.get("author", "")

        paper_label = f"{title[:55]}{'...' if len(title)>55 else ''} ({venue} {year})".strip()
        self_papers.append(paper_label)

        authors = parse_authors(author_str)
        for a in authors:
            if is_self(a):
                continue
            coauthor_papers[a].append(paper_label)
            coauthor_citations[a] += citations

    # ── Build node list
    # Self node
    nodes = [{
        "id": "Jianning Li",
        "name": "Jianning Li",
        "group": -1,
        "groupLabel": "Self",
        "affiliation": "ZIB Berlin / FU Berlin / Charité",
        "papers": self_papers,
        "paperCount": len(self_papers),
        "scholar_id": SCHOLAR_ID,
        "scholar_url": f"https://scholar.google.com/citations?user={SCHOLAR_ID}",
        "isCenter": True,
    }]

    # Try to get affiliation for co-authors from their Scholar profiles (best-effort)
    # We skip individual profile fetches to avoid rate-limiting; use heuristics instead.

    # Assign groups based on name heuristics + known collaborators
    KNOWN_AFFILIATIONS = {
        "egger":        ("Graz/Univ. Hospital Essen", 3),
        "gsaxner":      ("Graz Univ. Tech.", 3),
        "pepe":         ("Graz Univ. Tech.", 3),
        "zachow":       ("ZIB Berlin", 1),
        "sengupta":     ("ZIB Berlin", 1),
        "lamecker":     ("ZIB Berlin", 1),
        "ehlke":        ("ZIB Berlin", 1),
        "szengel":      ("Charité", 2),
        "bitter":       ("Charité", 2),
        "von campe":    ("Med. Univ. Graz", 3),
        "kleesiek":     ("Univ. Hospital Essen", 5),
        "dammann":      ("Univ. Hospital Essen", 5),
        "fragemann":    ("Univ. Hospital Essen", 5),
        "solak":        ("Univ. Hospital Essen", 5),
        "ferreira":     ("Univ. Minho", 5),
        "alves":        ("Univ. Minho", 5),
        "eisenmann":    ("DKFZ", 6),
        "reinke":       ("DKFZ", 6),
        "luijten":      ("TU Delft", 4),
        "holzapfel":    ("Graz Univ. Tech.", 3),
        "erdt":         ("Fraunhofer/NTU", 11),
        "pimentel":     ("KIT", 8),
        "kodym":        ("Brno Univ. Tech.", 9),
        "ellis":        ("AutoImplant Participant", 9),
        "rauschenbach": ("Univ. Hospital Essen", 5),
        "zhou":         ("MedShapeNet Consortium", 4),
        "yang":         ("MedShapeNet Consortium", 4),
    }

    group_counter = defaultdict(int)

    for name, papers in coauthor_papers.items():
        name_l = name.lower()
        group_label, group_idx = "Other", 11
        for key, (lbl, idx) in KNOWN_AFFILIATIONS.items():
            if key in name_l:
                group_label, group_idx = lbl, idx
                break

        group_counter[group_label] += 1
        nodes.append({
            "id": name,
            "name": name,
            "group": group_idx,
            "groupLabel": group_label,
            "affiliation": group_label,
            "papers": papers,
            "paperCount": len(papers),
            "scholar_id": "",
            "scholar_url": "",
            "isCenter": False,
        })

    # ── Build link list
    links = []
    for name, papers in coauthor_papers.items():
        links.append({
            "source": "Jianning Li",
            "target": name,
            "value": len(papers),
            "papers": papers,
        })

    # ── Assemble final JSON
    output = {
        "metadata": {
            "author": "Jianning Li",
            "scholar_id": SCHOLAR_ID,
            "total_publications": len(selected),
            "total_coauthors": len(coauthor_papers),
            "generated_at": str(date.today()),
            "note": f"Top {len(top_cited)} most-cited + {len(recent)} most-recent papers from Google Scholar",
        },
        "nodes": nodes,
        "links": links,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! Written to {OUTPUT_PATH}")
    print(f"   Nodes: {len(nodes)}  |  Links: {len(links)}")
    print(f"   Top co-authors by paper count:")
    top_ca = sorted(coauthor_papers.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    for n, ps in top_ca:
        print(f"     {n}: {len(ps)} papers")


if __name__ == "__main__":
    main()
