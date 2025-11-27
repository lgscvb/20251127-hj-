from pinecone import Pinecone, ServerlessSpec
from app.config import settings
from langchain_huggingface import HuggingFaceEmbeddings
import uuid
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class Document:
    page_content: str
    metadata: Dict[str, Any] = None

class VectorStore:
    def __init__(self):
        try:
            print("Initializing Pinecone...")
            self.pc = Pinecone(
                api_key=settings.PINECONE_API_KEY,
                environment=settings.PINECONE_ENV
            )
            print("Pinecone initialized successfully")
            
            self.index_name = "customer-service"
            
            # 使用 1024 維度的模型
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"  # 使用生成 768 維度的模型
            )
            
            # 檢查索引是否存在
            if self.index_name not in self.pc.list_indexes().names():
                print(f"Creating new index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    spec={
                        "serverless": {
                            "cloud": "aws",
                            "region": "us-east-1"
                        }
                    },
                    dimension=768,  # 修改為 768 維度以匹配模型
                    metric="cosine"
                )
            
            self.index = self.pc.Index(self.index_name)
            stats = self.index.describe_index_stats()
            print("Index stats:", stats)
            
        except Exception as e:
            print(f"Error initializing vector store: {e}")
            raise
    
    def add_conversation(self, message: str, metadata: dict):
        """添加新的對話到向量數據庫"""
        try:
            print(f"Embedding message: {message[:100]}...")  # 添加日誌
            embeddings = self.embeddings.embed_documents([message])
            print(f"Generated embedding dimension: {len(embeddings[0])}")  # 檢查維度
            
            vector_id = str(uuid.uuid4())
            vector_data = {
                "id": vector_id,
                "values": embeddings[0],
                "metadata": {**metadata, "text": message}
            }
            
            self.index.upsert(vectors=[vector_data])
            print(f"Added conversation with ID: {vector_id}")
            
        except Exception as e:
            print(f"Error adding conversation: {e}")
            print(f"Error type: {type(e)}")
            raise  # 讓錯誤傳播以便調試
    
    def search_similar(self, query: str, k: int = 3):
        """搜索相似的對話"""
        try:
            # 生成查詢嵌入向量
            query_embedding = self.embeddings.embed_query(query)
            
            # 在 Pinecone 中搜索
            results = self.index.query(
                vector=query_embedding,
                top_k=k,
                include_metadata=True
            )
            
            # 轉換為 Document 對象
            documents = []
            for match in results.matches:
                doc = Document(
                    page_content=match.metadata.get("text", ""),
                    metadata={k: v for k, v in match.metadata.items() if k != "text"}
                )
                documents.append(doc)
            
            return documents
            
        except Exception as e:
            print(f"Error searching similar: {e}")
            return []

    def get_document_count(self):
        """獲取知識庫中的文檔數量"""
        try:
            stats = self.index.describe_index_stats()
            return stats.total_vector_count
        except Exception as e:
            print(f"Error getting document count: {e}")
            return 0

    def list_recent_documents(self, limit=5):
        """列出最近添加的文檔"""
        try:
            results = self.index.query(
                vector=[0] * 768,  # 修改為 768 維度的假向量
                top_k=limit,
                include_metadata=True
            )
            return [
                {
                    "text": match.metadata.get("text", ""),
                    "category": match.metadata.get("category", ""),
                    "timestamp": match.metadata.get("timestamp", "")
                }
                for match in results.matches
            ]
        except Exception as e:
            print(f"Error listing documents: {e}")
            return [] 