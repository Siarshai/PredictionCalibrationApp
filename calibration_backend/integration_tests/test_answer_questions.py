from copy import deepcopy


def test_answer_questions_happy_day(client_uq):
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 5
    response = client_uq.get('/get_questions?page=1&user_id=2')
    assert len(response.get_json()["questions"]) == 5
    response = client_uq.post('/answer_question', json={
        "user_id": 1, "ynq_id": 1, "answer": 0, "probability": 55})
    assert response.status_code == 200
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 4
    response = client_uq.get('/get_questions?page=1&user_id=2')
    assert len(response.get_json()["questions"]) == 5
    response = client_uq.post('/answer_question', json={
        "user_id": 2, "ynq_id": 2, "answer": 1, "probability": 55})
    assert response.status_code == 200
    response = client_uq.post('/answer_question', json={
        "user_id": 2, "ynq_id": 3, "answer": 2, "probability": -1})
    assert response.status_code == 200
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 4
    response = client_uq.get('/get_questions?page=1&user_id=2')
    assert len(response.get_json()["questions"]) == 3


def test_answer_questions_unknown_parameters_ignored(client_uq):
    response = client_uq.post('/answer_question', json={
        "user_id": 1, "ynq_id": 1, "answer": 0, "probability": 55, "unknown": 42})
    assert response.status_code == 200
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 4


def test_answer_questions_unknown_user_error(client_uq):
    response = client_uq.post('/answer_question', json={
        "user_id": 42, "ynq_id": 1, "answer": 0, "probability": 55})
    assert response.status_code == 503
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 5


def test_answer_questions_unknown_question_error(client_uq):
    response = client_uq.post('/answer_question', json={
        "user_id": 42, "ynq_id": 1, "answer": 0, "probability": 55})
    assert response.status_code == 503
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 5


def test_answer_questions_invalid_answer_error(client_uq):
    response = client_uq.post('/answer_question', json={
        "user_id": 1, "ynq_id": 1, "answer": 3, "probability": 55})
    assert response.status_code == 503
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 5


def test_answer_questions_invalid_probability_error(client_uq):
    response = client_uq.post('/answer_question', json={
        "user_id": 1, "ynq_id": 1, "answer": 1, "probability": 51})
    assert response.status_code == 503
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 5


def test_answer_questions_duplicate_answer_error(client_uq):
    response = client_uq.post('/answer_question', json={
        "user_id": 1, "ynq_id": 1, "answer": 1, "probability": 55})
    assert response.status_code == 200
    response = client_uq.post('/answer_question', json={
        "user_id": 1, "ynq_id": 1, "answer": 0, "probability": 65})
    assert response.status_code == 503  # still duplicate
    response = client_uq.get('/get_questions?page=1&user_id=1')
    assert len(response.get_json()["questions"]) == 4


def test_answer_questions_not_enough_parameters_error(client_uq):
    data = {"user_id": 1, "ynq_id": 1, "answer": 1, "probability": 55}
    for key in data.keys():
        data_tmp = deepcopy(data)
        del data_tmp[key]
        response = client_uq.post('/answer_question', json=data_tmp)
        assert response.status_code == 400
        response = client_uq.get('/get_questions?page=1&user_id=1')
        assert len(response.get_json()["questions"]) == 5
