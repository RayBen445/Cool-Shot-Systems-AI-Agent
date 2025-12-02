from duckduckgo_search import DDGS

class SearchEngine:
    def __init__(self):
        self.ddgs = DDGS()

    def search(self, query, max_results=3):
        print(f"Searching web for: '{query}'")
        try:
            results = list(self.ddgs.text(query, max_results=max_results))
            formatted_results = ""
            for i, result in enumerate(results):
                formatted_results += f"Source {i+1}: {result['title']}\nURL: {result['href']}\nContent: {result['body']}\n\n"
            return formatted_results
        except Exception as e:
            print(f"Search failed: {e}")
            return "Error: Could not perform search."

if __name__ == "__main__":
    se = SearchEngine()
    print(se.search("What is the price of Bitcoin today?"))
