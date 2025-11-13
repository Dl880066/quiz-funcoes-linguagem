from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import csv
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# ===========================================
# CONFIGURAÇÕES INICIAIS
# ===========================================
load_dotenv()

app = Flask(__name__)
CORS(app)

RESULT_FILE = 'results.csv'
STUDENTS_FILE = 'students.json'
TOKEN = os.environ.get('ADMIN_TOKEN', 'professor123')
TOTAL_SCORE = 3.0          # Pontuação máxima total
QUESTOES_TOTAIS = 15       # Número total de questões no quiz

# ===========================================
# FUNÇÕES AUXILIARES
# ===========================================
def ensure_files():
    """Garante que os arquivos necessários existam"""
    if not os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'timestamp', 'student_id', 'student_email', 'question_id',
                'answer', 'correct', 'score', 'start_ts', 'submit_ts', 'time_spent'
            ])
    if not os.path.exists(STUDENTS_FILE):
        with open(STUDENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump({'completed_students': []}, f, indent=2)


def has_student_completed(student_email):
    """Verifica se o aluno já completou o quiz"""
    try:
        with open(STUDENTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return student_email.lower().strip() in data['completed_students']
    except:
        return False


def mark_student_completed(student_email):
    """Marca o aluno como tendo completado o quiz"""
    try:
        with open(STUDENTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if student_email.lower().strip() not in data['completed_students']:
            data['completed_students'].append(student_email.lower().strip())
        with open(STUDENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Erro ao marcar aluno como completado: {e}")
        return False

# ===========================================
# ROTAS PÚBLICAS
# ===========================================
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'version': '3.2'
    })


@app.route('/api/check-student', methods=['POST'])
def check_student():
    """Verifica se o aluno pode fazer o quiz"""
    try:
        data = request.get_json()
        student_email = data.get('email', '').lower().strip()
        if has_student_completed(student_email):
            return jsonify({
                'can_proceed': False,
                'message': 'Aluno já completou o quiz'
            }), 403
        return jsonify({
            'can_proceed': True,
            'message': 'Aluno pode realizar o quiz'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/results', methods=['POST'])
def save_result():
    """Salva um resultado de questão no CSV"""
    try:
        ensure_files()
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Dados JSON inválidos'}), 400

        required_fields = ['student_id', 'question_id', 'answer', 'start_ts', 'submit_ts', 'time_spent']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo obrigatório faltando: {field}'}), 400

        # Extrair e normalizar e-mail
        student_id = data.get('student_id', '').strip()
        if ' - ' in student_id:
            student_email = student_id.split(' - ')[-1].strip().lower()
        else:
            student_email = student_id.lower().strip() or "desconhecido"

        # Bloqueia apenas se o aluno realmente já completou o quiz
        if has_student_completed(student_email):
            return jsonify({'error': 'Tentativa duplicada: este aluno já completou o quiz.'}), 403

        server_timestamp = datetime.now().isoformat()

        # Grava resultado no CSV
        with open(RESULT_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                server_timestamp,
                data['student_id'],
                student_email,
                data['question_id'],
                data.get('answer', ''),
                data.get('correct', ''),
                data.get('score', 0),
                data['start_ts'],
                data['submit_ts'],
                data['time_spent']
            ])

        # Contagem de respostas do aluno (corrigida)
        with open(RESULT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            respostas_aluno = [
                r for r in reader
                if r.get('student_email', '').strip().lower() == student_email
            ]

        # Marca como concluído somente se atingir todas as questões
        if len(respostas_aluno) >= QUESTOES_TOTAIS and not has_student_completed(student_email):
            mark_student_completed(student_email)
            print(f"✅ Aluno {student_email} concluiu o quiz ({len(respostas_aluno)}/{QUESTOES_TOTAIS})")

        return jsonify({
            'status': 'success',
            'message': f'Resultado salvo ({len(respostas_aluno)}/{QUESTOES_TOTAIS})',
            'timestamp': server_timestamp
        }), 201

    except Exception as e:
        print(f"Erro ao salvar resultado: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500


@app.route('/api/finish', methods=['POST'])
def finish_quiz():
    """Confirma manualmente que o aluno terminou o quiz"""
    try:
        data = request.get_json()
        student_email = data.get('email', '').lower().strip()
        if not student_email:
            return jsonify({'error': 'E-mail não fornecido'}), 400
        if not has_student_completed(student_email):
            mark_student_completed(student_email)
        return jsonify({'status': 'success', 'message': 'Quiz finalizado com sucesso!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===========================================
# ROTAS ADMINISTRATIVAS (PAINEL DO PROFESSOR)
# ===========================================
@app.route('/admin/results', methods=['GET'])
def get_results():
    """Retorna todos os resultados e notas (protegido por token)"""
    try:
        token = request.args.get('token')
        if token != TOKEN:
            return jsonify({'error': 'Token inválido ou não fornecido'}), 401

        format_type = request.args.get('format', 'json')

        if not os.path.exists(RESULT_FILE):
            return jsonify({'error': 'Nenhum resultado encontrado'}), 404

        results = []
        with open(RESULT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            for row in reader:
                clean_row = row[:len(headers)]
                results.append(dict(zip(headers, clean_row)))

        # Calcula notas finais
        notas = {}
        for r in results:
            email = r.get('student_email', '').lower().strip()
            try:
                score = float(r.get('score', 0))
            except:
                score = 0.0
            if email:
                notas[email] = notas.get(email, 0) + score

        if format_type == 'csv':
            return send_file(RESULT_FILE, as_attachment=True, download_name='resultados_quiz.csv')

        return jsonify({
            'count': len(results),
            'students_total': len(notas),
            'grades': notas,
            'results': results,
            'max_score': TOTAL_SCORE,
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Erro em /admin/results: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500


@app.route('/admin/students', methods=['GET'])
def get_completed_students():
    """Retorna lista de alunos que completaram (protegido por token)"""
    try:
        token = request.args.get('token')
        if token != TOKEN:
            return jsonify({'error': 'Token inválido ou não fornecido'}), 401

        with open(STUDENTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify({
            'completed_count': len(data['completed_students']),
            'completed_students': data['completed_students'],
            'generated_at': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Erro em /admin/students: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500


@app.route('/admin/reset-student/<email>', methods=['DELETE'])
def reset_student(email):
    """Reseta um aluno específico (protegido por token)"""
    try:
        token = request.args.get('token')
        if token != TOKEN:
            return jsonify({'error': 'Token inválido ou não fornecido'}), 401

        with open(STUDENTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if email.lower().strip() in data['completed_students']:
            data['completed_students'].remove(email.lower().strip())
            with open(STUDENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            return jsonify({
                'status': 'success',
                'message': f'Aluno {email} resetado com sucesso'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Aluno não encontrado na lista de completados'
            }), 404

    except Exception as e:
        print(f"Erro em /admin/reset-student: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ===========================================
# ROTAS PARA SERVIR O FRONTEND
# ===========================================
@app.route('/')
def serve_index():
    """Serve o arquivo index.html"""
    return send_from_directory('../frontend', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve arquivos estáticos (JS, CSS, JSON, imagens, etc)"""
    return send_from_directory('../frontend', path)

# ===========================================
# EXECUÇÃO
# ===========================================
if __name__ == '__main__':
    ensure_files()
    print("=== Quiz Backend Avaliativo Iniciado ===")
    print(f"Token do professor: {TOKEN}")
    print("Endpoints disponíveis:")
    print("  GET  /api/health")
    print("  POST /api/check-student")
    print("  POST /api/results")
    print("  POST /api/finish")
    print("  GET  /admin/results?token=SEU_TOKEN")
    print("  GET  /admin/students?token=SEU_TOKEN")
    print("  DELETE /admin/reset-student/email?token=SEU_TOKEN")
    print("========================================")
    app.run(debug=True, host='0.0.0.0', port=5000)
