import os
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import time
import re
import json

# --- CONFIGURATIE ---
BASE_URL = "https://www.examenblad.nl"
# Output relatief aan waar het script draait (in /scripts). 
# We willen naar /public/exams
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "exams")

YEARS = range(2012, 2026) 

SUBJECTS = [
    {"name": "Wiskunde B", "category": "exacte-vakken", "slug": "wiskunde-b-vwo", "id": "wb"},
    {"name": "Wiskunde A", "category": "exacte-vakken", "slug": "wiskunde-a-vwo", "id": "wa"},
    {"name": "Natuurkunde", "category": "exacte-vakken", "slug": "natuurkunde-vwo", "id": "nat"},
    {"name": "Scheikunde", "category": "exacte-vakken", "slug": "scheikunde-vwo", "id": "sch"},
    {"name": "Biologie", "category": "exacte-vakken", "slug": "biologie-vwo", "id": "bio"},
    {"name": "Informatica", "category": "exacte-vakken", "slug": "informatica-vwo", "id": "info"},
    {"name": "Nederlands", "category": "talen", "slug": "nederlands-vwo", "id": "nl"},
    {"name": "Engels", "category": "talen", "slug": "engels-vwo", "id": "en"},
    {"name": "Frans", "category": "talen", "slug": "frans-vwo", "id": "fa"},
    {"name": "Duits", "category": "talen", "slug": "duits-vwo", "id": "du"},
    {"name": "Filosofie", "category": "maatschappijvakken", "slug": "filosofie-vwo", "id": "fi"},
    {"name": "Geschiedenis", "category": "maatschappijvakken", "slug": "geschiedenis-vwo", "id": "gs"},
    {"name": "Aardrijkskunde", "category": "maatschappijvakken", "slug": "aardrijkskunde-vwo", "id": "ak"},
    {"name": "Economie", "category": "maatschappijvakken", "slug": "economie-vwo", "id": "econ"},
    {"name": "M&O", "category": "maatschappijvakken", "slug": "management-organisatie-vwo", "id": "mo"},
]

ua = UserAgent()
exam_index = []

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_file(url, filepath):
    """Download een bestand in chunks om geheugen te sparen."""
    try:
        headers = {'User-Agent': ua.random}
        with requests.get(url, headers=headers, stream=True) as r:
            r.raise_for_status()
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        return True
    except Exception as e:
        print(f"❌ Fout bij downloaden {url}: {e}")
        return False

def parse_exam_page(year, subject):
    """Scrapt de pagina van een specifiek vak in een specifiek jaar."""
    
    url = f"{BASE_URL}/{year}/vwo/vakken/{subject['category']}/{subject['slug']}"
    print(f"\n🔍 Scannen: {subject['name']} ({year})...")
    
    try:
        headers = {'User-Agent': ua.random}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 404:
            print(f"⚠️  Geen examenpagina gevonden voor {year}.")
            return
            
        if response.status_code == 404:
            print(f"⚠️  Geen examenpagina gevonden voor {year}.")
            return
            
        soup = BeautifulSoup(response.content, 'html.parser')

        # --- Helper for subpages ---
        def find_pdf_on_subpage(sub_url):
            try:
                print(f"      🔎 Inspecting subpage: {sub_url}")
                r = requests.get(sub_url, headers={'User-Agent': ua.random})
                if r.status_code != 200: return None
                sub_soup = BeautifulSoup(r.content, 'html.parser')
                # Look for "printbare versie" or just any PDF link
                pdf_link = sub_soup.find('a', href=True, string=re.compile(r'printbare|pdf', re.I))
                if not pdf_link:
                    # Fallback: look for href ending in .pdf
                    pdf_link = sub_soup.find('a', href=re.compile(r'\.pdf$', re.I))
                
                if pdf_link:
                    href = pdf_link['href']
                    return BASE_URL + href if href.startswith('/') else href
            except Exception as e:
                print(f"      ❌ Error on subpage: {e}")
            return None
        # PDF links on Examenblad don't end in .pdf, but text contains "PDF"
        all_links = soup.find_all('a', href=True)
        
        found_exam_pairs = {} # key: timevak ("I", "II"), value: {question_url, answer_url}
        
        for link in all_links:
            href = link['href']
            text = link.get_text(" ", strip=True).lower()
            
            # Filter: Must be likely a document link
            # Relax filter for omzettingstabel as it might not say "pdf"
            if "pdf" not in text and "omzettingstabel" not in text:
                continue
            
            print(f"   found link: '{text}' -> {href}")

            if href.startswith('/'): full_url = BASE_URL + href
            else: full_url = href
            
            # --- Tijdvak ---
            # Try to find parent header or section
            tijdvak = "I"
            # Simple heuristic: check if "2" appears in nearby headers or previous siblings
            # But scanning the whole soup by section is better.
            # Let's retry simple text scan on the link itself or its container
            
            # Look up slightly for a header
            # (In the markdown chunk, it was under ### cse 2e tijdvak)
            # Find preceding h3
            
            parent_h3 = link.find_previous(['h3', 'h2', 'h4'])
            if parent_h3:
                header_text = parent_h3.get_text().lower()
                if "2e tij" in header_text or "tijdvak 2" in header_text:
                    tijdvak = "II"
                elif "1e tij" in header_text or "tijdvak 1" in header_text:
                    tijdvak = "I"
            
            if "opgaven" in text:
                if tijdvak not in found_exam_pairs: found_exam_pairs[tijdvak] = {}
                found_exam_pairs[tijdvak]['question'] = full_url
            elif "correctievoorschrift" in text and "aanvulling" not in text:
                if tijdvak not in found_exam_pairs: found_exam_pairs[tijdvak] = {}
                found_exam_pairs[tijdvak]['answer'] = full_url
            elif "omzettingstabel" in text:
                if tijdvak not in found_exam_pairs: found_exam_pairs[tijdvak] = {}
                
                # Check if direct PDF or subpage
                if "pdf" in text:
                    found_exam_pairs[tijdvak]['conversion'] = full_url
                else:
                    # It's a subpage, try to find PDF inside
                    # If PDF not found, fallback to saving the HTML page itself if it has content
                    real_pdf_url = find_pdf_on_subpage(full_url)
                    if real_pdf_url:
                        found_exam_pairs[tijdvak]['conversion'] = real_pdf_url
                    else:
                        print(f"      ⚠️ No PDF found on conversion page, using HTML fallback")
                        found_exam_pairs[tijdvak]['conversion_html'] = full_url

            elif "aanvulling" in text:
                if tijdvak not in found_exam_pairs: found_exam_pairs[tijdvak] = {}
                found_exam_pairs[tijdvak]['addendum'] = full_url
            elif "uitwerkbijlage" in text:
                if tijdvak not in found_exam_pairs: found_exam_pairs[tijdvak] = {}
                found_exam_pairs[tijdvak]['worksheet'] = full_url

        # --- Downloaden en Indexeren ---
        for tv, links in found_exam_pairs.items():
            if 'question' in links and 'answer' in links:
                # Folder structuur: public/exams/{vak_id}/{year}/{tijdvak}/
                rel_path = f"{subject['id']}/{year}/{tv}"
                save_dir = os.path.join(OUTPUT_DIR, subject['id'], str(year), tv)
                ensure_dir(save_dir)
                
                q_filename = f"opgaven.pdf"
                a_filename = f"correctievoorschrift.pdf"
                
                print(f"   📥 Downloaden {year} Tijdvak {tv}...")
                
                download_file(links['question'], os.path.join(save_dir, q_filename))
                download_file(links['answer'], os.path.join(save_dir, a_filename))
                
                entry = {
                    "id": f"{subject['id']}_{year}_{tv}",
                    "subject": subject['name'],
                    "year": year,
                    "period": tv,
                    "questionFile": f"/exams/{rel_path}/{q_filename}",
                    "answerFile": f"/exams/{rel_path}/{a_filename}",
                }

                # Optional files
                if 'conversion' in links:
                    c_filename = "omzettingstabel.pdf"
                    if download_file(links['conversion'], os.path.join(save_dir, c_filename)):
                        entry["conversionFile"] = f"/exams/{rel_path}/{c_filename}"
                elif 'conversion_html' in links:
                    c_filename = "omzettingstabel.html"
                    # Download HTML content
                    try:
                        headers = {'User-Agent': ua.random}
                        r = requests.get(links['conversion_html'], headers=headers)
                        if r.status_code == 200:
                            with open(os.path.join(save_dir, c_filename), 'w', encoding='utf-8') as f:
                                f.write(r.text)
                            entry["conversionFile"] = f"/exams/{rel_path}/{c_filename}"
                    except Exception as e:
                        print(f"Error saving HTML table: {e}")
                
                if 'addendum' in links:
                    ad_filename = "aanvulling.pdf"
                    if download_file(links['addendum'], os.path.join(save_dir, ad_filename)):
                        entry["addendumFile"] = f"/exams/{rel_path}/{ad_filename}"

                if 'worksheet' in links:
                    w_filename = "uitwerkbijlage.pdf"
                    if download_file(links['worksheet'], os.path.join(save_dir, w_filename)):
                        entry["worksheetFile"] = f"/exams/{rel_path}/{w_filename}"

                exam_index.append(entry)
                time.sleep(0.5)
                time.sleep(0.5)

    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")

# --- MAIN LOOP ---
if __name__ == "__main__":
    print(f"🚀 Start VWO-Elite Ingestion Engine...")
    print(f"📂 Output Dir: {OUTPUT_DIR}")
    ensure_dir(OUTPUT_DIR)
    
    for year in YEARS:
        for subject in SUBJECTS:
            parse_exam_page(year, subject)
            time.sleep(1) 
            
    # Save Index
    index_path = os.path.join(OUTPUT_DIR, "index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(exam_index, f, indent=2)
        
    print(f"\n✅ Klaar! Index gegenereerd op: {index_path}")
