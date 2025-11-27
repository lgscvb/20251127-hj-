from fastapi import APIRouter, HTTPException
from app.models.chat import Message, ChatResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/chat/generate", response_model=ChatResponse)
async def generate_ai_response(message: Message):
    try:
        print("Received request:", message)  # 添加日志
        response = await ai_service.generate_response(message.content)
        return response
    except Exception as e:
        print("Error:", str(e))  # 添加错误日志
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/learn")
async def learn_from_message(request: dict):
    content = request.get("content", "")
    metadata = request.get("metadata", {})
    
    await ai_service.learn_from_conversation(content, metadata)
    
    return {"success": True, "message": "Added to knowledge base"}

@router.post("/chat/learn-from-chat")
async def learn_from_chat(message: Message):
    try:
        metadata = {
            "channel": message.channel,
            "customer_id": message.customer_id,
            "timestamp": message.timestamp.isoformat() if message.timestamp else None,
            "role": message.role
        }
        await ai_service.learn_from_conversation(message.content, metadata)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/feedback")
async def submit_feedback(request: dict):
    message_id = request.get("message_id")
    feedback = request.get("feedback")
    customer_id = request.get("customer_id")
    
    # 这里可以将反馈存储到数据库
    print(f"收到反馈: 消息ID={message_id}, 评价={feedback}, 客户ID={customer_id}")
    
    # 可以用这些反馈来改进模型
    
    return {"success": True, "message": "Feedback received"}

@router.get("/chat/knowledge-base-status")
async def check_knowledge_base():
    try:
        # 假設向量存儲有一個方法來獲取文檔數量
        doc_count = await ai_service.vector_store.get_document_count()
        return {
            "status": "success",
            "document_count": doc_count,
            "message": f"Knowledge base contains {doc_count} documents"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to check knowledge base status"
        }

@router.get("/chat/knowledge-base-info")
async def get_knowledge_base_info():
    try:
        count = ai_service.vector_store.get_document_count()
        recent_docs = ai_service.vector_store.list_recent_documents()
        return {
            "status": "success",
            "total_documents": count,
            "recent_documents": recent_docs
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        } 