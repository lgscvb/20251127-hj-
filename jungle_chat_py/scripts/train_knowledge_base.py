import sys
import os
import json

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.knowledge_base import KnowledgeBase

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    kb = KnowledgeBase()
    
    # 加载产品数据
    try:
        products = load_json_data('data/products.json')
        kb.add_product_info(products)
        print(f"Added {len(products)} products to knowledge base")
    except Exception as e:
        print(f"Error loading products: {e}")
    
    # 加载常见问题
    try:
        faqs = load_json_data('data/faqs.json')
        kb.add_faq(faqs)
        print(f"Added {len(faqs)} FAQs to knowledge base")
    except Exception as e:
        print(f"Error loading FAQs: {e}")
    
    # 加载政策信息
    try:
        policies = load_json_data('data/policies.json')
        kb.add_policy(policies)
        print(f"Added {len(policies)} policies to knowledge base")
    except Exception as e:
        print(f"Error loading policies: {e}")
    
    print("Knowledge base training completed!")

if __name__ == "__main__":
    main() 