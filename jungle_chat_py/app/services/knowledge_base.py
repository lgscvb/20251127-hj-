from app.services.vector_store import VectorStore

class KnowledgeBase:
    def __init__(self):
        self.vector_store = VectorStore()
    
    def add_product_info(self, products):
        """添加产品信息到知识库"""
        for product in products:
            content = f"""
            产品名称: {product['name']}
            价格: {product['price']}
            描述: {product['description']}
            库存: {product['stock']}
            规格: {product['specifications']}
            """
            
            self.vector_store.add_conversation(
                message=content,
                metadata={
                    "type": "product",
                    "product_id": product["id"],
                    "category": product["category"]
                }
            )
            print(f"Added product: {product['name']}")
    
    def add_faq(self, faqs):
        """添加常见问题到知识库"""
        for faq in faqs:
            content = f"""
            问题: {faq['question']}
            答案: {faq['answer']}
            """
            
            self.vector_store.add_conversation(
                message=content,
                metadata={
                    "type": "faq",
                    "category": faq["category"]
                }
            )
            print(f"Added FAQ: {faq['question']}")
    
    def add_policy(self, policies):
        """添加政策信息到知识库"""
        for policy in policies:
            content = f"""
            政策名称: {policy['name']}
            内容: {policy['content']}
            """
            
            self.vector_store.add_conversation(
                message=content,
                metadata={
                    "type": "policy",
                    "category": policy["category"]
                }
            )
            print(f"Added policy: {policy['name']}") 