from kiwipiepy import Kiwi
from flask import Flask, jsonify, request
from flask_cors import CORS

#현재 가상환경 설정이 안되어있음 : pip install flask, flask-cors, kiwipiepy 해주기

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

kiwi = Kiwi(model_type = 'sbg')

@app.route('/')
def index():
    return "NLP TEST"

@app.route('/api/nlp', methods=['POST'])
def nlp():
    response = '정상적인 발화\n'
    data = request.json
    str_receive = data.get('script', '')
    print('result ', str_receive)
    if not str_receive:
        response = "오류: 스크립트가 넘어오지 않음\n"
        return jsonify({"error": response}), 400
    
    Tokens = kiwi.tokenize(str_receive)
    print(Tokens)
    if (Tokens[-1].tag != 'EF') :
        response = "종결되지 않은 문장\n"
    else :
        if(Tokens[-1].form != '요' and Tokens[-1].form != '죠' and Tokens[-1].form != '세요' and Tokens[-1].form != '에요' 
        and Tokens[-1].form != '어요' and Tokens[-1].len != 3):
            print(Tokens[-1].form)
            response = "존댓말을 사용하지 않음\n"
    return jsonify({"message": response}), 200
        
if __name__ == '__main__':
    app.config.update(
        DEBUG = True,
    )
    app.run('0.0.0.0', port=5050, debug=True)