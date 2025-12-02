import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

class RAGEngine:
    def __init__(self, index_path="faiss_index"):
        self.index_path = index_path
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = None
        self._load_index()

    def _load_index(self):
        if os.path.exists(self.index_path):
            try:
                self.vector_store = FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
                print("Loaded existing FAISS index.")
            except Exception as e:
                print(f"Failed to load index: {e}")
                self.vector_store = None
        else:
            print("No existing FAISS index found.")

    def ingest_file(self, file_path: str):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Load document
        if file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path)
        
        documents = loader.load()

        # Split text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = text_splitter.split_documents(documents)

        # Create or update vector store
        if self.vector_store is None:
            self.vector_store = FAISS.from_documents(texts, self.embeddings)
        else:
            self.vector_store.add_documents(texts)
        
        # Save index
        self.vector_store.save_local(self.index_path)
        print(f"Ingested {file_path} and updated index.")

    def search(self, query: str, k: int = 3) -> List[str]:
        if self.vector_store is None:
            return []
        
        docs = self.vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]

    def clear_index(self):
        if os.path.exists(self.index_path):
            import shutil
            shutil.rmtree(self.index_path)
        self.vector_store = None
        print("Index cleared.")
