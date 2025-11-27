import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vector_store import VectorStore

def main():
    vector_store = VectorStore()
    
    while True:
        query = input("\n请输入问题 (输入'exit'退出): ")
        if query.lower() == 'exit':
            break
        
        results = vector_store.search_similar(query)
        
        print("\n相关信息:")
        for i, doc in enumerate(results):
            print(f"\n--- 结果 {i+1} ---")
            print(doc.page_content)
            print(f"元数据: {doc.metadata}")

if __name__ == "__main__":
    main() 