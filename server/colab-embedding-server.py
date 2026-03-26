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

def get_embeddings_batch(texts, prompt_type="passage"):
    """Process multiple texts in a single GPU batch for efficiency"""
    if isinstance(texts, str):
        texts = [texts]
    
    # Prepare all texts with prompts
    processed_texts = []
    for text in texts:
        if prompt_type == "passage":
            text = f"Represent this sentence for searching relevant passages: {text}"
        else:
            text = f"Represent this question for searching relevant passages: {text}"
        processed_texts.append(text)
    
    # Tokenize all texts at once (batch processing)
    inputs = tokenizer(
        processed_texts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512
    ).to(model.device)
    
    print(f"  Processing batch of {len(texts)} texts with shape: {inputs['input_ids'].shape}")
    
    with torch.no_grad():
        outputs = model(**inputs)
        cls_embeddings = outputs.last_hidden_state[:, 0, :]  # [batch_size, hidden_dim]
        normalized = torch.nn.functional.normalize(cls_embeddings, p=2, dim=1)
    
    # Convert to list of embeddings
    embeddings = normalized.cpu().numpy().tolist()
    
    # Format response
    result = []
    for i, emb in enumerate(embeddings):
        result.append({"embedding": emb, "index": i})
        print(f"  ✓ {i+1}/{len(embeddings)} - dim: {len(emb)}")
    
    return result

@app.route("/embed", methods=["POST"])
@app.route("/v1/embeddings", methods=["POST"])
def embed():
    try:
        data = request.json
        texts = data.get("input", [])
        prompt_name = data.get("prompt_name", "passage")
        model_param = data.get("model", "pplx-embed-v1")
        
        if isinstance(texts, str):
            texts = [texts]
        
        print(f"\n📐 Embedding endpoint called:")
        print(f"   Texts: {len(texts)}")
        print(f"   Prompt: {prompt_name}")
        print(f"   Model: {model_param}")
        
        # Process all texts in a single GPU batch
        embeddings = get_embeddings_batch(texts, prompt_type=prompt_name)
        
        return jsonify({
            "data": embeddings,
            "model": model_param,
            "usage": {"prompt_tokens": 0, "total_tokens": 0}
        })
        
    except Exception as e:
        print(f"❌ Error in embed endpoint:")
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
