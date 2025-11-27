import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # 从.env文件加载配置
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_ENV = os.getenv("PINECONE_ENV")
    PINECONE_HOST = os.getenv("PINECONE_HOST")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    
    # 向量维度设置
    VECTOR_DIMENSION = 768  # all-mpnet-base-v2 模型的维度
    
settings = Settings() 