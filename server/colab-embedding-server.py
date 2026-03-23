!pip install flask pyngrok transformers torch accelerate -q

import torch
from transformers import AutoModel, AutoTokenizer
from flask import Flask, request, jsonify
from pyngrok import ngrok
import traceback

from pyngrok import ngrok
ngrok.kill()

model_name = "perplexity-ai/pplx-embed-v1-0.6b"
print(f"Loading model: {model_name}...")

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModel.from_pretrained(model_name, trust_remote_code=True).to("cuda")
model.eval()
print("Model loaded successfully!")

app = Flask(__name__)

def get_embedding(text, prompt_type="passage"):
    if prompt_type == "passage":
        text = f"Represent this sentence for searching relevant passages: {text}"
    else:
        text = f"Represent this question for searching relevant passages: {text}"
    
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512).to(model.device)
    
    with torch.no_grad():
        outputs = model(**inputs)
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        normalized = torch.nn.functional.normalize(cls_embedding, p=2, dim=1)
    
    return normalized.cpu().numpy()[0].tolist()

@app.route("/v1/embeddings", methods=["POST"])
def embed():
    try:
        data = request.json
        texts = data.get("input", [])
        prompt_name = data.get("prompt_name", "passage")
        
        if isinstance(texts, str):
            texts = [texts]
        
        print(f"Embedding {len(texts)} text(s)...")
        
        embeddings = []
        for i, text in enumerate(texts):
            emb = get_embedding(text, prompt_type=prompt_name)
            embeddings.append({"embedding": emb, "index": i})
            print(f"  ✓ {i+1}/{len(texts)} - dim: {len(emb)}")
        
        return jsonify({
            "data": embeddings,
            "model": "pplx-embed-v1-0.6b",
            "usage": {"prompt_tokens": 0, "total_tokens": 0}
        })
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# NGROK_TOKEN = "3AhGKKN3R0w8aMWm4Y9T7loeD5G_B3DWigWW8ountCEtj9Wi"
NGROK_TOKEN = "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"

ngrok.set_auth_token(NGROK_TOKEN)

try:
    ngrok.kill()
except:
    pass

public_url = ngrok.connect(5000)
print("\n" + "="*50)
print(f"✅ YOUR API URL IS: {public_url}")
print(f"✅ Model: {model_name}")
print(f"✅ Dimensions: 1024")
print("="*50 + "\n")

app.run(port=5000)
