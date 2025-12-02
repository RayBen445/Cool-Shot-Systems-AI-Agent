import requests
from typing import List, Dict

def web_search(query: str, num_results: int = 5) -> List[Dict[str, str]]:
    """
    Perform a web search using DuckDuckGo API.
    Returns a list of search results with title, snippet, and link.
    """
    try:
        url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": 1,
            "skip_disambig": 1
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        results = []
        for item in data.get("RelatedTopics", [])[:num_results]:
            if "Text" in item:
                results.append({
                    "title": item.get("Text", "").split(" - ")[0] if " - " in item.get("Text", "") else "Result",
                    "snippet": item.get("Text", ""),
                    "link": item.get("FirstURL", "")
                })
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []
