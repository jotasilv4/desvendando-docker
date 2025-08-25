from fastapi import FastAPI

# cria a aplicação
app = FastAPI()

# rota inicial
@app.get("/")
def read_root():
    return {"message": "Olá, mundo! 🚀"}

# rota com parâmetro
@app.get("/saudacao/{nome}")
def saudacao(nome: str):
    return {"mensagem": f"Olá, {nome}!"}

# rota com query parameter
@app.get("/soma")
def soma(a: int, b: int):
    return {"resultado": a + b}