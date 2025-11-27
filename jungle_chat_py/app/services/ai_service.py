import google.generativeai as genai
from app.services.vector_store import VectorStore
from app.config import settings
import traceback
from datetime import datetime
import asyncio
import json

class AIService:
    def __init__(self):
        try:
            self.vector_store = VectorStore()
            
            # 配置 Google AI
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            
            # 使用 gemini-1.5-pro 替代 gemini-pro
            self.model = genai.GenerativeModel('gemini-1.5-pro')
            
            # 檢查知識庫是否為空
            if self.vector_store.get_document_count() == 0:
                asyncio.create_task(self.initialize_knowledge_base())
            
        except Exception as e:
            print(f"Error initializing AI Service: {str(e)}")
            raise
    
    async def generate_response(self, message: str, chat_history: list = None):
        try:
            print(f"Searching for similar docs for message: {message}")
            docs = self.vector_store.search_similar(message)
            print(f"Found {len(docs)} similar documents")
            
            context = "\n".join([doc.page_content for doc in docs])
            
            prompt = f"""
            基於以下參考資料回答用戶的問題。如果參考資料中沒有相關信息，請誠實告知無法回答。
            請使用專業且友善的語氣回答。

            參考資料：
            {context}

            用戶問題：{message}
            """
            
            try:
                chat = self.model.start_chat(history=[])
                response = chat.send_message(prompt)
                
                if response.text:
                    return {
                        "response": response.text,
                        "confidence_score": 0.95,
                        "source_documents": [doc.page_content for doc in docs]
                    }
                else:
                    return {
                        "response": "抱歉，我無法生成回答。請稍後再試。",
                        "confidence_score": 0,
                        "source_documents": []
                    }
                    
            except Exception as e:
                print(f"Error in chat generation: {str(e)}")
                return {
                    "response": "抱歉，生成回答時出現錯誤。請稍後再試。",
                    "confidence_score": 0,
                    "source_documents": []
                }
                
        except Exception as e:
            print(f"Error generating response: {e}")
            print(f"Error type: {type(e)}")
            print(f"Error traceback: ", traceback.format_exc())
            return {
                "response": f"抱歉，系統發生錯誤：{str(e)}",
                "confidence_score": 0,
                "source_documents": []
            }
    
    async def learn_from_conversation(self, message: str, metadata: dict):
        self.vector_store.add_conversation(message, metadata)
    
    async def initialize_knowledge_base(self):
        """初始化知識庫的基本問答對"""
        basic_qa = [
            {
                "question": "辦公室最小可以租幾坪？",
                "answer": "我們的辦公室最小從10坪起租，適合小型創業團隊。每個單位都配備基本辦公設施，包含網路和空調設備。",
                "category": "辦公室租賃"
            },
            {
                "question": "租約最短期限是多久？",
                "answer": "最短租期為6個月，簽約一年以上可享有租金優惠。我們也提供靈活的租期方案，可根據您的需求進行客製化調整。",
                "category": "租約相關"
            },
            {
                "question": "每坪租金是多少？",
                "answer": "租金依據樓層、坪數和位置而定，一般而言，每坪租金約在1200-2000元之間。具體價格我們可以安排現場參觀後詳細討論。",
                "category": "租金價格"
            },
            {
                "question": "有提供哪些優惠方案？",
                "answer": "目前針對新客戶有以下優惠：1. 首年簽約享9折優惠 2. 一次性支付半年租金可享95折 3. 推薦新客戶成功簽約可獲得一個月租金折扣。",
                "category": "優惠方案"
            },
            {
                "question": "租約到期要提前多久告知是否續約？",
                "answer": "建議至少在租約到期前2個月告知是否續約，這樣我們可以提前為您安排相關事宜。如需要調整租期或更換單位，也請提前告知。",
                "category": "合約條款"
            },
            {
                "question": "公司登記需要準備哪些文件？",
                "answer": "基本需要：1. 公司名稱預查核文件 2. 負責人身份證影本 3. 公司章程 4. 股東名冊 5. 董事名冊 6. 實收資本額證明。我們可以協助您準備這些文件。",
                "category": "公司登記"
            },
            {
                "question": "報稅的期限是什麼時候？",
                "answer": "營業稅申報期限為每年1,3,5,7,9,11月的1-15日；營利事業所得稅申報期限為每年5月1-31日。我們會提前通知您準備相關資料。",
                "category": "稅務諮詢"
            },
            {
                "question": "記帳費用怎麼計算？",
                "answer": "記帳費用依據您的公司規模和每月傳票數量計算，基本起跳價格為3000元/月，包含基礎的帳務處理和申報服務。詳細報價可以根據您的需求討論。",
                "category": "帳務處理"
            },
            {
                "question": "有提供會議室租用服務嗎？",
                "answer": "是的，我們提供會議室租用服務。小型會議室(4-6人)每小時500元，大型會議室(10-12人)每小時800元。租戶享有優惠價格。",
                "category": "設施管理"
            }
        ]
        
        for qa in basic_qa:
            await self.learn_from_conversation(
                f"Q: {qa['question']}\nA: {qa['answer']}", 
                {
                    "category": qa["category"],
                    "type": "initial_training",
                    "timestamp": datetime.now().isoformat()
                }
            ) 