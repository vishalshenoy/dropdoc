import os
import sys
from dotenv import load_dotenv
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.text_splitter import CharacterTextSplitter
from fastapi.middleware.cors import CORSMiddleware
import openai

from fastapi import FastAPI, HTTPException, Query, UploadFile
from typing import List
import os
import shutil

env_var_name = "OPENAI_API_KEY"
env_var_value = "placeholder"

load_dotenv('.env')

key = ""

app = FastAPI()

origins = [
    "http://localhost:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pdf_qa = None

def addKey():
    if is_api_key_valid(key):
        print("valid")
        os.environ[env_var_name] = key
        return True
    else:
        print("not valid")
        return False

def is_api_key_valid(key):
    openai.api_key = key
    try:
        response = openai.Completion.create(
            engine="davinci",
            prompt="This is a test.",
            max_tokens=5
        )
    except:
        return False
    else:
        return True

def work():
    global pdf_qa 
    documents = []
    for file in os.listdir("docs"):
        if file.endswith(".pdf"):
            pdf_path = "./docs/" + file
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
        elif file.endswith('.docx') or file.endswith('.doc'):
            doc_path = "./docs/" + file
            loader = Docx2txtLoader(doc_path)
            documents.extend(loader.load())
        elif file.endswith('.txt'):
            text_path = "./docs/" + file
            loader = TextLoader(text_path)
            documents.extend(loader.load())

    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=10)
    documents = text_splitter.split_documents(documents)

    vectordb = Chroma.from_documents(documents, embedding=OpenAIEmbeddings(), persist_directory="./data")
    vectordb.persist()

    pdf_qa = ConversationalRetrievalChain.from_llm(
        ChatOpenAI(temperature=0.7, model_name='gpt-3.5-turbo'),
        retriever=vectordb.as_retriever(search_kwargs={'k': 1}),
        return_source_documents=True,
        verbose=False
    )

chat_history = []

@app.post("/ask")
async def process_string(data: dict):
    global pdf_qa
    question = data.get('question')
    if question == '':
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if pdf_qa is None:
        raise HTTPException(status_code=500, detail="pdf_qa is not initialized")
    result = pdf_qa(
        {"question": question, "chat_history": chat_history})
    print(f"A: " + result["answer"])
    chat_history.append((question, result["answer"]))
    return {"answer": result["answer"]}

UPLOAD_FOLDER = "docs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/uploadfiles/")
async def upload_files(files: List[UploadFile]):
    uploaded_files = []
    
    current_files = os.listdir(UPLOAD_FOLDER)
    
    for current_file in current_files:
        if current_file not in [file.filename for file in files]:
            file_path = os.path.join(UPLOAD_FOLDER, current_file)
            os.remove(file_path)
    
    for file in files:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        if file.filename not in current_files:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            uploaded_files.append(file.filename)

    work()

    return {"message": "Files managed successfully", "uploaded_files": uploaded_files}

folder_path_1 = "./docs"
folder_path_2 = "./data"

@app.post("/clear-folder")
async def clear_folder():
    global chat_history
    global key
    chat_history = []
    try:
        shutil.rmtree(folder_path_1)
        os.makedirs(folder_path_1)
        shutil.rmtree(folder_path_2)
        os.makedirs(folder_path_2)
        os.environ[env_var_name] = ""
        key = ""

        return {"message": f"Files have been cleared."}
    except Exception as e:
        return {"error": str(e)}
    
@app.post("/api")
async def receive_key(data: dict):
    global key
    apiKey = data.get('apiKey')
    key = data.get('apiKey')
    print(key)
    pl = addKey()
    if (pl == True):
        apiKey = "fail"
    else:
        apiKey = "pass"
    return {"status": apiKey}